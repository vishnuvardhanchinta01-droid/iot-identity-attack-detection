# Experiment rules

Every rule below was written down before the experiment that used it, and could not be changed after the results were seen. Each rule document was hashed and signed (Ed25519) before its run. Each notebook checks that signature when it starts and stops if the text has changed.

## Data split

- **Clean days:** a day with at least 600 minutes of data and at least one day away from any attack.
- **Day split:** each device's clean days are split in time order into 70% training, 15% validation (used only to set thresholds) and 15% test, with a one-day gap between blocks.
- **Excluded minutes:** minutes within 2 hours of an attack are never used as normal traffic.
- **Attack split:** each device's attacks are sorted by start time. Odd-numbered attacks (120) are used for development; even-numbered attacks (114) are held out for the final test.
- **Unseen devices:** two devices (Samsung camera, Chromecast) are left out of the identity model entirely, to test whether devices it has never seen are rejected.
- **Test data opened once:** test days and held-out attacks were used once, in the confirmation run (notebook 06).

## Identity verification

- **Threshold:** each device has its own threshold, the 10th percentile of P(claimed device) on its honest windows. About 90% of honest windows pass by design.
- **Windows used for the threshold:** from notebook 04 onwards, the threshold uses validation windows plus out-of-fold predictions on training windows, grouped by day.
- **Decision mode:** single window, or a vote over 3 consecutive windows.
- **Model choice:** the model with the highest validation macro-F1 is carried forward. The MLP is admitted only if its honest acceptance beats the best tree model by at least 5 points in every seed, without accepting more wrong claims.

Identity criteria:

| Criterion | Target |
|---|---|
| Macro-F1 over known devices | ≥ 0.80 |
| Honest acceptance (a device claiming itself is accepted) | ≥ 0.80 |
| Random mismatch rejected | ≥ 0.95 |
| Hard mismatch rejected (the most-confused device claiming A) | ≥ 0.90 |
| Unknown device rejected | ≥ 0.60 |
| False verification (share of impersonation attempts accepted) | ≤ 0.10 |

## Attack detection

- **Alarm:** a minute raises an alarm when its score is above the 99th percentile of validation scores × 1.01. The × 1.01 "tie guard" was added in notebook 05, because many idle minutes had identical scores.
- **Detection:** an attack counts as detected if at least 2 alarm minutes fall inside it.
- **Admissible set-up:** false alarms on normal development minutes must be at most 2%.
- **Replacing a detector:** a new detector replaces the current one only if it detects at least 5 points more attacks in every seed (11, 22, 33), with false alarms rising by at most 0.5 points.
- **Per-device detectors:** these replace one shared detector only if they detect at least 5 points more attacks, with a bootstrap confidence interval above zero.

## Confirmation run (held-out test days)

- **Identity:** the six identity criteria above.
- **Detection:** per device, at least 80% of attacks detected with at most 2% false alarms. Confirmed if at least 4 of the 5 devices predicted from development pass.
- **Claimed device as detector input:** it must add at least 5 points of detection in every seed.
- **Verified device:** a device is verified only if both its identity and its detection hold up. Devices can be downgraded at this stage, never promoted.

## Decision rules

| Outcome | Rule |
|---|---|
| MATCH | P(claimed) ≥ that device's threshold: accepted |
| MISMATCH | Below threshold and top probability ≥ 0.60: not accepted, real device named |
| UNKNOWN | Top probability < 0.35: rejected as an unknown device |
| UNREGISTERED | No profile for the claimed device: refused |

The attack detector checks every minute whatever the identity result.

## Attacks on the models

| Attack | Settings | Declared defence |
|---|---|---|
| Impersonation | Attacker adds traffic only (budget 0.1, 0.25 or 0.5 × the target's normal volume), sees the score for each guess, 1,000 or 5,000 guesses, 8 attacker-target pairs | Accept only if identity passes and the detector stays quiet |
| Identity poisoning | Partner windows labelled as the target added to training data at 1%, 5%, 10% | Label filtering: drop training windows whose own label scores below 0.5 out-of-fold |
| Detector poisoning | Attack minutes labelled "normal" added to training data at 1%, 5%, 10% | Trimmed refit: drop the 5% of training minutes with the highest error, retrain |
| Tampering | Byte, manifest and signature flips, swapped model, malicious pickle, wrong key, added/removed files, older bundle | Signed bundle: signature, then version, then file list, then SHA-256 of each file |

A defence counts as effective if it keeps at least 90% of clean detection with at most 2% false alarms.

## Stability over time (exploratory)

The system is refitted on a growing window of days and tested on the next block. A device would be withdrawn if its false alarms exceeded 5% in any block.

## Names used inside the notebooks and result files

| Name in code | Meaning |
|---|---|
| Phase A | Development (Phase 1 and Phase 2 in the report), notebooks 03-05 |
| Phase B | Confirmation on held-out test days, notebook 06 |
| Phase C | Attacks on the models, notebooks 07-08 |
| Track F | Stability over time, notebook 09 |
| G0 / G1 / E | Detector set-ups: one shared model / shared model + claimed device as input / one model per device |
| G1-G6 (identity) | The six identity criteria, in the order of the table above |
| H1, H3/H4, H5, H6 | Confirmation criteria: identity, detection, claimed-device input, per-device detectors |
| C1, C2a, C2b, C3 | Impersonation, detector poisoning, identity poisoning, tampering |
| D1, D3, D4, D5 | The defences for C1, C2a, C2b and C3 |
| T1 | The identity threshold rule from notebook 04 (validation + out-of-fold training windows) |
| RF-vote3 | Random Forest with a vote over 3 windows |
| AE / TAE / IF | Autoencoder / temporal autoencoder / Isolation Forest |
