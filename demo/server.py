"""N2 demo server (standard library + numpy + cryptography). Run: python server.py  -> http://127.0.0.1:8765
The bundle signature is checked BEFORE any model file is opened."""
import json, os, sys, shutil, tempfile, webbrowser, threading, random
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
import numpy as np
import engine as E

HERE = os.path.dirname(os.path.abspath(__file__)); BUNDLE = os.path.join(HERE, 'bundle')
PUB = open(os.path.join(HERE, 'pinned_public_key.hex')).read().strip(); MIN_VERSION = 4
STATIC = os.path.join(HERE, 'static')
VERIFIED = ['WeMoSwitch', 'TPLinkPlug', 'NetatmoCamera', 'LIFX']

ok, why = E.verify_bundle(BUNDLE, PUB, MIN_VERSION)
print('bundle:', 'VERIFIED' if ok else 'REFUSED', '-', why)
if not ok: sys.exit('Bundle refused. No model was loaded.')
S = E.System(BUNDLE)
SELF = json.load(open(os.path.join(BUNDLE, 'results.json')))   # signed with the models
NAMES = list(S.dev)

def mac(n): return S.dev[n]['mac']
def tier(n):
    if n in VERIFIED: return 'VERIFIED'
    if n in ('SamsungCamera', 'Chromecast'): return 'NOT IN IDENTITY MODEL'
    if n == 'Echo': return 'UNREGISTERED (downgraded)'
    return 'MONITOR-ONLY (identified, not validated)'
ATT = {}
for r in S.att_index: ATT.setdefault(r['device'], []).append(r)

_cache = {}
def clean_of(n):
    if n not in _cache:
        F, ts = S.clean[mac(n) + '_F'], S.clean[mac(n) + '_ts']; P, sp = S.identity(F, ts); _cache[n] = (F, ts, P, sp)
    return _cache[n]
def attack_of(n, j):
    m = mac(n); return S.att[f'{m}_{j}_F'], S.att[f'{m}_{j}_ts'], S.att[f'{m}_{j}_in'].astype(bool)
def caps_of(n):
    X = np.expm1(S.clean[mac(n) + '_F'][:, :40].astype(np.float64)); return np.quantile(X, 0.99, axis=0)
def delta_for(n_cap, b, ncells):
    d = np.zeros(40)
    if b <= 0 or ncells <= 0: return d
    perm = np.random.RandomState(7).permutation(40)[:int(ncells)]; d[perm] = b * caps_of(n_cap)[perm]; return d

def run(p):
    src, claim = p['src'], p['claim']; scale = float(p.get('scale', 1)); b = float(p.get('extra_b', 0)); nc = int(p.get('extra_cells', 0))
    idsc = float(p.get('id_scale', 1)); af = float(p.get('alarm_factor', S.meta['alarm_factor'])); mina = int(p.get('min_alarm', 2))
    hi, lo = float(p.get('hi', .6)), float(p.get('lo', .35)); registered = claim in S.dev
    if p.get('mode') == 'attack':
        F, ts, inatt = attack_of(src, int(p['att_j'])); info = next(r for r in ATT[src] if r['j'] == int(p['att_j']))['name']
    else:
        F0, ts0, P0, sp0 = clean_of(src); nb = len(sp0); k = int(round(float(p.get('seg', .3)) * max(0, nb - 17)))
        a, e = sp0[k][0], sp0[min(k + 16, nb - 1)][1]; F, ts = F0[a:e], ts0[a:e]; inatt = np.zeros(len(F), bool); info = 'recorded benign traffic'
    if scale != 1: F = E.scale_traffic(F, scale)
    cap_dev = claim if registered else src
    d = delta_for(cap_dev, b, nc)
    if d.any(): F = E.perturb(F, d)
    P, spans = S.identity(F, ts)
    det_claim = claim if registered else None
    if det_claim: sc, thr, al = S.detect(F, det_claim, af)
    else: sc, thr, al = np.zeros(len(F)), 0.0, np.zeros(len(F), bool)
    wins = []
    for i, (pp, (a, e)) in enumerate(zip(P, spans)):
        st = S.state(pp, claim, idsc, hi, lo) if registered else 'UNREGISTERED_CLAIM'
        pc = float(pp[S.order.index(claim)]) if claim in S.order else None
        wins.append(dict(a=int(a), b=int(e), p=pc, maxp=float(pp.max()), top=S.order[int(pp.argmax())], state=st, alarms=int(al[a:e].sum())))
    t0 = ts[0]
    in_model = claim in S.order
    for w in wins:   # display label only; the pre-registered state rule is unchanged
        if not registered or not in_model: w['show'] = 'NO IDENTITY CHECK'
        elif w['state'] == 'MATCH': w['show'] = 'CONFIRMED'
        elif w['state'] == 'MISMATCH' and w['top'] == claim: w['show'] = 'NOT CONFIDENT'
        elif w['state'] == 'MISMATCH': w['show'] = 'OTHER DEVICE'
        else: w['show'] = w['state']
    out = dict(info=info, attack=(info if p.get('mode') == 'attack' else None), n=len(F), wall_minutes=round((ts[-1] - t0) / 60000, 1), score=np.round(sc, 5).tolist(), thr=float(thr),
               alarm=al.astype(int).tolist(), inatt=inatt.astype(int).tolist(), wins=wins,
               thr_id=min(1.0, S.meta['thr_id'][claim] * idsc) if in_model else None, tier=tier(claim) if registered else 'NOT REGISTERED')
    n_in = int(inatt.sum()); a_in = int(al[inatt].sum()) if n_in else 0; n_out = int((~inatt).sum()); a_out = int(al[~inatt].sum())
    # alert = run of alarm minutes (gaps <= 5 min) with >= mina alarm minutes (same rule as the post hoc alert count)
    at = ts[al]; groups = np.split(at, np.where(np.diff(at) > 5 * 60000)[0] + 1) if len(at) else []
    alert_groups = [g for g in groups if len(g) >= mina]; n_alerts = len(alert_groups)
    first_alert = int(np.searchsorted(ts, alert_groups[0][mina - 1])) + 1 if n_alerts else None
    detected = (a_in >= mina) if n_in else None
    att_latency = None
    if n_in and detected:
        rows_in = np.where(inatt)[0]; hit = rows_in[al[rows_in]]; att_latency = int(hit[mina - 1] - rows_in[0] + 1)
    alerted = detected if n_in else n_alerts >= 1
    shows = [w['show'] for w in wins]; share = {k: shows.count(k) / len(shows) for k in set(shows)} if shows else {}
    conf = share.get('CONFIRMED', 0.0); worst = max((k for k in share if k != 'CONFIRMED'), key=lambda k: share[k], default=None)
    why = []
    if not registered:
        verdict, tone = 'Refused: identity not registered', 'warn'
        why.append('No device is registered under this identity, so the claim is refused before any model runs.')
    elif not in_model:
        verdict, tone = 'Cannot verify: no identity model', 'warn'
        why.append(f'{claim} is watched for attacks but has no identity model, so its claim cannot be verified.')
    elif conf >= 0.5:
        verdict, tone = ('Accepted' if not alerted else 'Accepted, but attack alert'), ('ok' if not alerted else 'bad')
        why.append(f'Traffic matches {claim} in {conf:.0%} of identity checks.')
    else:
        first_bad = next((w for w in wins if w['show'] != 'CONFIRMED'), None)
        if worst == 'NOT CONFIDENT':
            verdict, tone = ('Asked to re-verify' if not alerted else 'Re-verify, and attack alert'), ('warn' if not alerted else 'bad')
            why.append(f'It looks like {claim}, but not confidently enough (probability below its threshold {out["thr_id"]:.2f}).')
        else:
            verdict, tone = ('Rejected' if not alerted else 'Rejected, and attack alert'), ('warn' if not alerted else 'bad')
            tops = [w['top'] for w in wins if w['show'] == 'OTHER DEVICE']
            if worst == 'OTHER DEVICE' and tops: why.append(f'This traffic looks like {max(set(tops), key=tops.count)}, not {claim}.')
            elif worst == 'UNKNOWN': why.append('This traffic does not look like any registered device.')
            else: why.append(f'The verifier cannot place this traffic confidently ({worst.lower() if worst else "no data"}).')
    if registered and in_model and n_in:   # an attack replay: lead with the attack
        att_txt = 'The attack was flagged.' if detected else 'The detector did NOT flag this attack.'
        if claim == src:
            verdict, tone = ('Attack detected' if detected else 'Attack missed'), 'bad'
            why = [att_txt, 'The identity check also stops confirming the device while it attacks.' if conf < 0.5 else 'Identity still matches, so the detector is what catches it.']
        else:
            verdict = ('Rejected, and attack detected' if detected else 'Rejected, attack missed') if conf < 0.5 else ('Accepted, but attack detected' if detected else 'Accepted, attack missed')
            tone = 'bad'; why = why[:1] + [att_txt]
    elif registered and not in_model and n_in:
        verdict, tone = ('Cannot verify identity; attack detected' if detected else 'Cannot verify identity; attack missed'), 'bad'
        why.append('The attack was flagged.' if detected else 'The detector did NOT flag this attack.')
    elif registered and not n_in:
        if n_alerts: why.append(f'The detector raised {n_alerts} alert{"s" if n_alerts > 1 else ""}.')
        elif not (conf >= 0.5): why.append('The detector stayed quiet.')
        else: why.append('The detector stayed quiet.')
    if n_in: ttd = (f'{att_latency} min', 'attack flagged after') if detected else ('missed', 'attack')
    elif registered and in_model:
        if conf >= 0.5:
            fc = next((w for w in wins if w['show'] == 'CONFIRMED'), None); ttd = (f'{fc["b"]} min' if fc else '-', 'confirmed after')
        else:
            fb = next((w for w in wins if w['show'] != 'CONFIRMED'), None); ttd = (f'{fb["b"]} min' if fb else '-', 'flagged after')
    else: ttd = ('0 min', 'refused at once')
    out['summary'] = dict(verdict=verdict, tone=tone, why=' '.join(why), share=share, confirmed=conf, alarms=int(al.sum()), alarm_rate_benign=a_out / max(1, n_out),
                          attack_minutes=n_in, attack_alarmed=a_in, detected=detected, min_alarm=mina, alerts=int(n_alerts), ttd=ttd, first_alert=first_alert)
    return out

def sweep(src, claim, idsc, af, mina):
    res = {}
    if claim in S.order:
        c = S.order.index(claim); thr0 = S.meta['thr_id'][claim]; grid = [round(x, 3) for x in np.arange(0.5, 1.0001, 0.025)]
        own = clean_of(claim)[2][:, c]; oth = clean_of(src)[2][:, c] if src != claim else None
        res['id'] = dict(x=grid, honest=[float(np.mean(own >= min(1, thr0 * s))) for s in grid],
                         wrong=[float(np.mean(oth >= min(1, thr0 * s))) for s in grid] if oth is not None else None, at=idsc)
    F, ts, _, _ = clean_of(claim); sc = S.det_scores(F, claim); thr0 = S.meta['thr_det'][claim]
    att_sc = []
    for r in ATT.get(claim, []):
        Fa, _, ina = attack_of(claim, r['j']); att_sc.append((S.det_scores(Fa, claim), ina))
    g = [round(x, 2) for x in np.arange(1.0, 3.01, 0.1)]
    res['det'] = dict(x=g, alarm=[float(np.mean(sc > thr0 * a)) for a in g],
                      detect=[float(np.mean([(s > thr0 * a)[i].sum() >= mina for s, i in att_sc])) if att_sc else None for a in g], at=af, n_att=len(att_sc))
    return res

def sweep_all(p):
    """Results tab: honest vs all other known devices (pooled), and alarm vs detection, for one claimed device."""
    claim = p['claim']; c = S.order.index(claim); thr0 = S.meta['thr_id'][claim]; grid = [round(x, 3) for x in np.arange(0.5, 1.0001, 0.025)]
    own = clean_of(claim)[2][:, c]; oth = np.concatenate([clean_of(m)[2][:, c] for m in S.order if m != claim])
    res = dict(id=dict(x=grid, honest=[float(np.mean(own >= min(1, thr0 * g))) for g in grid], wrong=[float(np.mean(oth >= min(1, thr0 * g))) for g in grid]))
    res['det'] = sweep(claim, claim, 1.0, 1.01, 2)['det']; return res

# ------------------------------------------------ impersonation attacker (C1 protocol, naive black box)
def attacker(p):
    A, B, b, Q, seed = p['target'], p['attacker'], float(p['b']), int(min(p['Q'], 800)), int(p.get('seed', 1))
    cap = caps_of(A); bound = b * cap; c = S.order.index(A); thrA = S.meta['thr_id'][A]
    FB, tsB, PB, spB = clean_of(B)
    rng = np.random.RandomState(seed); starts = rng.choice(max(1, len(spB) - 4), 8, replace=False)
    blocks = [[spB[s + k] for k in range(4)] for s in starts]
    def agg(Fx, spans, delta):
        X = Fx[:, :40].astype(np.float64)
        if delta is not None and delta.any(): X = np.where(delta > 0, np.log1p(np.expm1(X) + delta), X)
        o = []
        for a, e in spans:
            W = X[a:e]; o.append(np.stack([W.mean(0), W.std(0, ddof=1), W.max(0)], 1).reshape(-1))
        return np.array(o, np.float32)
    flat = [s for bl in blocks for s in bl]
    def obj(delta):
        P = S.rf.predict_proba(agg(FB, flat, delta)).reshape(8, 4, -1)[:, :, :]
        v = np.stack([E.vote(P[i]) for i in range(8)]); return float(v[:, :, c].mean())
    cur = np.zeros(40); best = obj(cur); base = best; trace = [best]; allowed = np.where(bound > 0)[0]
    for q in range(Q):
        cand = cur.copy()
        if len(allowed):
            k = rng.randint(1, min(8, len(allowed)) + 1); idx = rng.choice(allowed, k, replace=False)
            cand[idx] = np.clip(cand[idx] + rng.randn(k) * 0.15 * bound[idx], 0, bound[idx])
        v = obj(cand)
        if v >= best: best, cur = v, cand
        trace.append(best)
    def accept(delta):
        P = S.rf.predict_proba(agg(FB, spB, delta)); V = E.vote(P); return float(np.mean(V[:, c] >= thrA))
    # layered check (D1): also needs < 2 alarm minutes under the claim
    Fp = E.perturb(FB, cur); al = S.detect(Fp, A)[2]
    Vp = E.vote(S.rf.predict_proba(agg(FB, spB, cur))); okw = [(Vp[i, c] >= thrA) and al[a:e].sum() < 2 for i, (a, e) in enumerate(spB)]
    ownP = clean_of(A)[2][:, c]
    return dict(trace=trace, start=base, best=best, thr=float(thrA), accept_ref=accept(None), accept_att=accept(cur), accept_layered=float(np.mean(okw)),
                honest=float(np.mean(ownP >= thrA)), n_nonzero=int((cur > 0).sum()), Q=Q, alarm_rate_after=float(al.mean()))

# ------------------------------------------------ tamper lab
def verify_steps(folder, floor):
    """The same checks as engine.verify_bundle, reported step by step. Stops at the first failure."""
    import hashlib
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    from cryptography.exceptions import InvalidSignature
    steps = []; fail = lambda name, d: steps.append(dict(name=name, status='fail', detail=d))
    names = ['Signature', 'Version', 'File list', 'File hashes']
    def done():
        for n in names[len(steps):]: steps.append(dict(name=n, status='skipped', detail='not reached'))
        ok_ = all(x['status'] == 'pass' for x in steps)
        steps.append(dict(name='Models loaded', status='pass' if ok_ else 'fail', detail='models loaded' if ok_ else 'nothing loaded'))
        return ok_, steps
    try:
        mb = open(os.path.join(folder, 'manifest.json'), 'rb').read(); sg = bytes.fromhex(open(os.path.join(folder, 'manifest.sig')).read().strip())
        Ed25519PublicKey.from_public_bytes(bytes.fromhex(PUB)).verify(sg, mb); steps.append(dict(name='Signature', status='pass', detail='signed by the pinned key'))
    except OSError: fail('Signature', 'manifest or signature file missing'); return done()
    except (ValueError, InvalidSignature): fail('Signature', 'signature does not match the pinned key'); return done()
    man = json.loads(mb)
    if man.get('version', 0) < floor: fail('Version', f"version {man.get('version')}, but version {floor} is required"); return done()
    steps.append(dict(name='Version', status='pass', detail=f"version {man['version']}"))
    present = set(os.listdir(folder)) - {'manifest.json', 'manifest.sig'}
    if present != set(man['files']):
        fail('File list', f"added {sorted(present - set(man['files'])) or 'none'}, missing {sorted(set(man['files']) - present) or 'none'}"); return done()
    steps.append(dict(name='File list', status='pass', detail=f"{len(present)} files, as signed"))
    for f, h in man['files'].items():
        if hashlib.sha256(open(os.path.join(folder, f), 'rb').read()).hexdigest() != h: fail('File hashes', f'{f} was changed'); return done()
    steps.append(dict(name='File hashes', status='pass', detail='every file matches'))
    return done()

def tamper(p):
    op = p['op']; tmp = tempfile.mkdtemp(); d = os.path.join(tmp, 'b'); shutil.copytree(BUNDLE, d); rs = random.Random(int(p.get('seed', 0)) or None)
    files = sorted(f for f in os.listdir(d) if f not in ('manifest.json', 'manifest.sig')); target = p.get('file') or rs.choice(files); desc = ''
    try:
        if op == 'none': desc = 'The bundle exactly as shipped.'
        elif op == 'flip':
            b = bytearray(open(os.path.join(d, target), 'rb').read()); i = rs.randrange(len(b)); b[i] ^= 1 << rs.randrange(8)
            open(os.path.join(d, target), 'wb').write(bytes(b)); desc = f'One bit flipped at byte {i:,} of {target}.'
        elif op == 'replace':
            other = 'detector_weights.npz' if target != 'detector_weights.npz' else 'identity_forest.npz'
            shutil.copy(os.path.join(d, other), os.path.join(d, target)); desc = f'{target} replaced by another valid file from the bundle ({other}).'
        elif op == 'delete': os.remove(os.path.join(d, target)); desc = f'{target} deleted.'
        elif op == 'add': open(os.path.join(d, 'extra_model.npz'), 'wb').write(b'x'); desc = 'An extra file (extra_model.npz) added.'
        elif op == 'manifest':
            m = json.load(open(os.path.join(d, 'manifest.json'))); m['version'] = 99; open(os.path.join(d, 'manifest.json'), 'w').write(json.dumps(m, indent=1, sort_keys=True)); desc = 'Manifest edited (version raised to 99); old signature kept.'
        elif op == 'wrongkey':
            from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
            if p.get('file'):
                b = bytearray(open(os.path.join(d, target), 'rb').read()); b[rs.randrange(len(b))] ^= 1; open(os.path.join(d, target), 'wb').write(bytes(b))
                import hashlib; m = json.load(open(os.path.join(d, 'manifest.json'))); m['files'][target] = hashlib.sha256(bytes(b)).hexdigest()
                open(os.path.join(d, 'manifest.json'), 'w').write(json.dumps(m, indent=1, sort_keys=True)); desc = f'{target} changed, its hash updated in the manifest, and the manifest re-signed with the attacker\'s own key.'
            else: desc = 'Manifest re-signed with the attacker\'s own key.'
            k = Ed25519PrivateKey.generate(); mb = open(os.path.join(d, 'manifest.json'), 'rb').read(); open(os.path.join(d, 'manifest.sig'), 'w').write(k.sign(mb).hex())
        elif op == 'sigflip':
            s_ = bytearray(bytes.fromhex(open(os.path.join(d, 'manifest.sig')).read())); s_[rs.randrange(len(s_))] ^= 1; open(os.path.join(d, 'manifest.sig'), 'w').write(bytes(s_).hex()); desc = 'One bit of the signature changed.'
        elif op == 'rollback':
            shutil.rmtree(d); shutil.copytree(os.path.join(HERE, 'bundle_previous'), d)
            v = json.load(open(os.path.join(d, 'manifest.json')))['version']; desc = f'The previous, genuinely signed bundle (version {v}) put back in place of the current one.'
        ok_, steps = verify_steps(d, MIN_VERSION)
        why_ = next((x['detail'] for x in steps if x['status'] == 'fail'), 'all checks passed')
        return dict(desc=desc, ok=ok_, why=why_, steps=steps, loaded=ok_, target=target if op in ('flip', 'replace', 'delete', 'wrongkey') else None)
    finally: shutil.rmtree(tmp, ignore_errors=True)

def meta():
    return dict(devices=[dict(name=n, tier=tier(n), in_identity=n in S.order, n_att=len(ATT.get(n, [])), att=[dict(j=r['j'], name=r['name']) for r in ATT.get(n, [])]) for n in NAMES],
                order=S.order, thr_id=S.meta['thr_id'], thr_det=S.meta['thr_det'], alarm_factor=S.meta['alarm_factor'], static=SELF,
                bundle=dict(ok=ok, why=why, pub=PUB[:16] + '…', files=sorted(os.listdir(BUNDLE)), version=json.load(open(os.path.join(BUNDLE, 'manifest.json')))['version'], floor=MIN_VERSION))

class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _send(self, code, body, ct='application/json'):
        b = body if isinstance(body, bytes) else json.dumps(body).encode(); self.send_response(code); self.send_header('Content-Type', ct); self.send_header('Content-Length', str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        path = self.path.split('?')[0]
        if path == '/api/meta': return self._send(200, meta())
        f = 'index.html' if path == '/' else path.lstrip('/')
        fp = os.path.normpath(os.path.join(STATIC, f))
        if not fp.startswith(STATIC) or not os.path.isfile(fp): return self._send(404, {'error': 'not found'})
        ct = {'html': 'text/html', 'js': 'text/javascript', 'css': 'text/css', 'woff': 'font/woff'}.get(fp.rsplit('.', 1)[-1], 'application/octet-stream'); self._send(200, open(fp, 'rb').read(), ct + '; charset=utf-8')
    def do_POST(self):
        try:
            p = json.loads(self.rfile.read(int(self.headers.get('Content-Length', 0))) or b'{}')
            fn = {'/api/run': run, '/api/attacker': attacker, '/api/tamper': tamper, '/api/sweep': sweep_all}[self.path]; self._send(200, fn(p))
        except Exception as e:
            import traceback; traceback.print_exc(); self._send(500, {'error': f'{type(e).__name__}: {e}'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8765)); srv = ThreadingHTTPServer(('127.0.0.1', port), H)
    print(f'N2 demo: http://127.0.0.1:{port}  (Ctrl-C to stop)')
    if not os.environ.get('NO_BROWSER'): threading.Timer(1, lambda: webbrowser.open(f'http://127.0.0.1:{port}')).start()
    srv.serve_forever()
