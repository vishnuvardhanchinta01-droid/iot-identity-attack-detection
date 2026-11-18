"""N2 demo engine: numpy-only scoring (no pickle). Every function mirrors Phase B (Track C)."""
import json, hashlib, os
import numpy as np

# ---------------- signed bundle ----------------
def sha256_file(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''): h.update(b)
    return h.hexdigest()

def verify_bundle(folder, pub_hex, min_version=1):
    """Returns (ok, reason). Checks signature, version floor, every hash, no extra files, BEFORE any model is loaded."""
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    from cryptography.exceptions import InvalidSignature
    try:
        mb = open(os.path.join(folder, 'manifest.json'), 'rb').read(); sg_txt = open(os.path.join(folder, 'manifest.sig'), 'r').read().strip()
    except OSError:
        return False, 'manifest or signature file missing'
    try: sg = bytes.fromhex(sg_txt)
    except ValueError: return False, 'signature file is corrupted'
    try: Ed25519PublicKey.from_public_bytes(bytes.fromhex(pub_hex)).verify(sg, mb)
    except (InvalidSignature, ValueError): return False, 'signature does not match the pinned public key'
    man = json.loads(mb)
    if man.get('version', 0) < min_version: return False, f"version {man.get('version')}, but version {min_version} is required"
    present = set(os.listdir(folder)) - {'manifest.json', 'manifest.sig'}
    if present != set(man['files']): return False, f'file set differs: extra {sorted(present - set(man["files"]))}, missing {sorted(set(man["files"]) - present)}'
    for f, h in man['files'].items():
        if sha256_file(os.path.join(folder, f)) != h: return False, f'hash mismatch in {f}'
    return True, f"signature valid, version {man['version']}, {len(man['files'])} files match"

# ---------------- identity forest (numpy) ----------------
class Forest:
    def __init__(s, p):
        z = np.load(p, allow_pickle=False)
        s.L, s.R, s.F, s.T, s.V, s.roots, s.classes = z['left'], z['right'], z['feature'], z['threshold'], z['value'], z['roots'], z['classes']
    def predict_proba(s, X):
        X = np.asarray(X, np.float32); n = len(X); out = np.zeros((n, s.V.shape[1]))
        for r in s.roots:
            node = np.full(n, r, np.int64)
            while True:
                leaf = s.L[node] < 0
                if leaf.all(): break
                f = np.where(leaf, 0, s.F[node])
                go_left = X[np.arange(n), f].astype(np.float32) <= s.T[node].astype(np.float32)
                nxt = np.where(go_left, s.L[node], s.R[node]); node = np.where(leaf, node, nxt)
            out += s.V[node]
        return out / len(s.roots)

# ---------------- detector ----------------
def ae_score(A, X):
    n = len([k for k in A if k.startswith('W')]); z = np.clip((X - A['mean']) / A['scale'], -float(A['clip']), float(A['clip'])); h = z
    for i in range(n):
        h = h @ A[f'W{i}'] + A[f'b{i}']
        if i < n - 1: h = np.maximum(h, 0)
    return ((h - z) ** 2).mean(1)

# ---------------- features ----------------
def trailing_mean(X, k=5):
    """mean of the current and previous k-1 minutes (fewer at the start)."""
    cs = np.cumsum(np.vstack([np.zeros((1, X.shape[1])), X.astype(np.float64)]), 0); n = len(X); i = np.arange(n)
    lo = np.maximum(0, i - k + 1); return ((cs[i + 1] - cs[lo]) / (i + 1 - lo)[:, None]).astype(np.float32)

def _retrail(F, Xn):
    """new trailing mean = stored trailing mean + (recomputed new - recomputed old): keeps the recorded day-boundary handling."""
    return (F[:, 40:80] + trailing_mean(Xn) - trailing_mean(F[:, :40])).clip(min=0).astype(np.float32)

def perturb(F, delta):
    """Add-only constant traffic in the RAW domain on the 40 cells (delta in raw units)."""
    if delta is None or not np.any(delta > 0): return F
    Xn = np.where(delta > 0, np.log1p(np.expm1(F[:, :40].astype(np.float64)) + delta), F[:, :40]).astype(np.float32)
    return np.hstack([Xn, _retrail(F, Xn)])

def scale_traffic(F, factor):
    """Multiply raw traffic (a stand-in for a busier or quieter device)."""
    Xn = np.log1p(np.expm1(F[:, :40].astype(np.float64)) * factor).astype(np.float32)
    return np.hstack([Xn, _retrail(F, Xn)])

def windows(F, ts, win_ms=15 * 60000, min_rows=10):
    w = ts // win_ms; u, st, cnt = np.unique(w, return_index=True, return_counts=True)
    keep = np.where(cnt >= min_rows)[0]; feats, spans = [], []
    for k in keep:
        a, b = st[k], st[k] + cnt[k]; X = F[a:b, :40].astype(np.float64)
        feats.append(np.stack([X.mean(0), X.std(0, ddof=1), X.max(0)], 1).reshape(-1)); spans.append((a, b))
    return np.array(feats, np.float32).reshape(-1, 120), spans

def vote(P, k=3):
    cs = np.cumsum(P, 0); out = np.empty_like(P)
    for j in range(len(P)):
        lo = cs[j - k] if j >= k else 0.0; out[j] = (cs[j] - lo) / min(j + 1, k)
    return out

# ---------------- the system ----------------
class System:
    def __init__(s, folder):
        s.meta = json.load(open(f'{folder}/thresholds_and_meta.json'))
        s.rf = Forest(f'{folder}/identity_forest.npz'); s.ae = dict(np.load(f'{folder}/detector_weights.npz'))
        s.clean = np.load(f'{folder}/replay_clean.npz'); s.att = np.load(f'{folder}/replay_attacks.npz')
        s.att_index = json.load(open(f'{folder}/replay_attack_index.json'))
        s.order = s.meta['identity_class_order']; s.dev = s.meta['devices']
        s.mac2name = {v['mac']: k for k, v in s.dev.items()}; s.eye = np.eye(len(s.dev), dtype=np.float32)
    def det_scores(s, F, claim):
        X = np.hstack([F, np.tile(s.eye[s.dev[claim]['onehot_index']], (len(F), 1))]); return ae_score(s.ae, X)
    def detect(s, F, claim, alarm_factor=None, min_alarm=None):
        af = s.meta['alarm_factor'] if alarm_factor is None else alarm_factor
        sc = s.det_scores(F, claim); thr = s.meta['thr_det'][claim] * af
        return sc, thr, sc > thr
    def identity(s, F, ts):
        W, spans = windows(F, ts)
        if len(W) == 0: return np.zeros((0, len(s.order))), spans
        return vote(s.rf.predict_proba(W)), spans
    def state(s, p, claim, thr_scale=1.0, hi=0.60, lo=0.35):
        """p: voted probability vector over s.order."""
        if claim not in s.dev: return 'UNREGISTERED_CLAIM'
        if claim not in s.order: return 'UNREGISTERED_CLAIM'
        c = s.order.index(claim); thr = min(1.0, s.meta['thr_id'][claim] * thr_scale)
        if p[c] >= thr: return 'MATCH'
        m = p.max()
        return 'MISMATCH' if m >= hi else ('UNKNOWN' if m < lo else 'UNCERTAIN')
