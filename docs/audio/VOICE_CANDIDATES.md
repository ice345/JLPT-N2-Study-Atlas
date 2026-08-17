# AivisHub voice candidate review

Reviewed on 2026-08-17. The benchmark shortlist is preserved below. The production selection is now `female-morioki` + `male-fumifumi`.

## Production decision

| Alias | Config key | Decision | Evidence |
| --- | --- | --- | --- |
| `female-neutral` | `female-morioki` | Primary | Learner explicitly marked it **优先** after listening to the question, formal sentence, and kanji/pause samples; visible scores include clarity 5/5 and neutrality 4/5. |
| `male-neutral` | `male-fumifumi` | Secondary | Neutral, soft conversational counterpart from the reviewed ACML set; used for required male/female listening diversity without introducing a character-heavy style. |

Both choices use ACML 1.0, remain configurable, and are assigned deterministically. An unreviewed candidate is not silently substituted during generation because production scopes require `productionApproved: true`.

## License gate

All six generated candidates are published under [Aivis Common Model License (ACML) 1.0](https://github.com/Aivis-Project/ACML/blob/master/ACML-1.0.md). ACML 1.0 permits personal, corporate, non-commercial and commercial use; credit is optional. It prohibits impersonation/deception, harming a speaker's dignity, attacks or harassment, misinformation, unethical marketing, political/religious advocacy and criminal/antisocial use. The JLPT educational benchmark is within the permitted use case, but every final publication must continue to respect those restrictions.

No model with an unclear license was downloaded or committed. Model weights are never part of this repository.

## Female benchmark set

| Config key | Model | Impression to verify | Style | License | Size | Version | AivisHub |
| --- | --- | --- | --- | --- | ---: | --- | --- |
| `female-morioki` | morioki | Mature, warm, closest to an ordinary narration voice | ノーマル | ACML 1.0 | 251.13 MB | 1.0.0 | [model page](https://hub.aivis-project.com/aivm-models/baaae3c0-7b22-4605-8ba5-80c959b41a48) |
| `female-chu2` | 中2 | Young and steady; source sample handles a longer narrative sentence | ノーマル | ACML 1.0 | 251.40 MB | 1.0.0 | [model page](https://hub.aivis-project.com/aivm-models/9107b8b6-1ed1-43f5-bebe-0de4df4d229d) |
| `female-kanon` | 花音 | Young and bright with a clear pronunciation contour; check whether it feels too character-like | ノーマル | ACML 1.0 | 252.67 MB | 1.0.0 | [model page](https://hub.aivis-project.com/aivm-models/a670e6b8-0852-45b2-8704-1bc9862f2fe6) |

Why these three: the set spans adult-neutral, young-narrative and young-bright voices while keeping one license family and avoiding styles labeled cute, sleepy, exaggerated, whisper, or highly emotional.

## Male benchmark set

| Config key | Model | Impression to verify | Style | License | Size | Version | AivisHub |
| --- | --- | --- | --- | --- | ---: | --- | --- |
| `male-fumifumi` | fumifumi | Calm young adult; soft and conversational | ノーマル | ACML 1.0 | 270.17 MB | 1.0.0 | [model page](https://hub.aivis-project.com/aivm-models/71e72188-2726-4739-9aa9-39567396fb2a) |
| `male-aida` | 阿井田 茂 | Middle-aged baritone for formal narration; Calm style may reduce character exaggeration | Calm | ACML 1.0 | 251.14 MB | 1.0.0 | [model page](https://hub.aivis-project.com/aivm-models/47e53151-a378-46f3-abee-ce13aa07feb1) |
| `male-nise` | にせ | Younger and lighter, with stronger everyday-conversation energy | ノーマル | ACML 1.0 | 250.24 MB | 1.0.0 | [model page](https://hub.aivis-project.com/aivm-models/6d11c6c2-f4a4-4435-887e-23dd60f8b8dd) |

Why these three: they cover calm youth, low formal middle-age and younger conversation without using non-commercial or custom-license models.

## Models reviewed but not generated

| Model | Reason not included in this pass |
| --- | --- |
| Lida / リダ | Naturalness description was promising, but the page uses a custom license with explicit attribution conditions. A clean ACML-only comparison is easier to evaluate and publish safely. |
| M1 / M2 | The pages describe CC BY-SA 4.0 provenance but label the package as a custom license. Excluded until the exact generated-audio obligations are documented. |
| Shinjou Tomoharu | ACML-NC 1.0 is non-commercial only. That is too restrictive for a public project whose future use may change. |
| まい | ACML 1.0, but the published samples emphasize dialect and strong character emotion rather than neutral standard-Japanese narration. |
| るな | ACML 1.0, but the source sample is sleepy/cute and less suited to a neutral JLPT baseline. |
| 桜音 | ACML 1.0 and usable as a backup, but the sample copy is more character-oriented; 花音 provides the clearer bright-voice contrast for this first set. |
| 観測症 / 澤原 玄二郎 | Creators or samples flag diction/noise limitations that weaken a pronunciation benchmark. |

## Listening decision rubric

Use `/n2/audio-lab` and compare the same three lines at 1.0× first, then 0.8× only for diagnosis.

1. Naturalness: does the pitch movement sound like modern standard Japanese rather than a read-aloud robot or anime character?
2. Clarity: are `何とかなりそう`, `出次第`, `ご連絡`, `準備`, and `済んで` intelligible without seeing the text?
3. Neutrality: can the voice sustain hundreds of study examples without becoming tiring or imposing a strong persona?
4. Phrasing: are commas, question intonation, compound boundaries and sentence endings plausible?
5. Stability: does the same voice remain consistent across informal, formal and kanji-heavy lines?

The final aliases are recorded in `config/audio-voices.json` under `productionSelection`. Only those two candidates have `productionApproved: true`.
