# Demo

An offline web app that replays recorded test traffic through the trained models, which score it live.

```bash
pip install numpy cryptography
python server.py            # opens http://127.0.0.1:8765
```

## What it checks at start-up

The server loads no model unless all of these pass:

1. `bundle/manifest.sig` verifies against the public key in `pinned_public_key.hex`.
2. The bundle version is 4.
3. No file was added or removed.
4. Every file's SHA-256 matches the manifest.

## Tabs

- **Device traffic:** choose the device that sends the traffic, the identity it claims, and normal traffic or a recorded attack. The result shows the identity check, the attack detector and the final decision.
- **Attacks on the ML:** run the impersonation attacker live, or see the recorded poisoning results.
- **Tampering:** change a copy of the bundle (flip a bit, edit the manifest, swap a model, roll back to an older version) and see which check stops it.

## Files

| File | Purpose |
|---|---|
| `server.py` | The web server and the start-up checks |
| `engine.py` | Scoring code: the Random Forest and the autoencoder as plain NumPy, no pickle |
| `bundle/` | Version 4: models, thresholds, recorded replay data and recorded results, all signed |
| `bundle_previous/` | An older signed version, used by the Tampering tab to show that a rollback is refused |
| `pinned_public_key.hex` | The public key the bundle signature is checked against |
| `static/` | The web page (HTML, CSS, JavaScript and fonts) |
