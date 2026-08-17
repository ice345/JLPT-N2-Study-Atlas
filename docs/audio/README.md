# JLPT Study Garden audio pipeline

## Decision and boundary

AivisSpeech is a **development/content-generation tool**, not a production dependency. The public site plays committed static WebM/Opus assets. It never calls port 10101, never ships model weights, and needs no TTS token or paid API.

```text
reviewed Japanese source
  -> normalize ruby / apply ttsText override
  -> local AivisSpeech Engine
  -> temporary WAV
  -> ffmpeg loudness normalization + Opus
  -> public/audio + manifest.json
  -> static website playback
```

The current benchmark-first phase intentionally generates only 18 comparison files: the same three lines for three female and three male candidates. Full Problem 4 and site-wide generation remain disabled until a voice is selected.

## Prerequisites

- Node.js 22.13 or newer
- Docker Desktop, OrbStack, or Docker Engine with Compose
- ffmpeg (`brew install ffmpeg` on macOS; install the distribution package on Linux)
- roughly 5 GB free for the engine image, BERT cache, default model, and six candidate models

The official image is multi-architecture and supports `linux/amd64` and `linux/arm64/v8`.

## Start and stop the engine

CPU (macOS, Windows Docker, or Linux):

```bash
npm run audio:engine:up
npm run audio:engine:wait
npm run audio:engine:status
```

Linux with NVIDIA Container Toolkit and a compatible GPU:

```bash
npm run audio:engine:up:nvidia
npm run audio:engine:wait
```

Inspect or stop it:

```bash
npm run audio:engine:logs
npm run audio:engine:down
```

The host binding is always `127.0.0.1:10101:10101`. Do not change it to `0.0.0.0`. Override the local port or cache directory only when necessary:

```bash
AIVIS_PORT=10102 AIVIS_DATA_DIR=/absolute/cache/path npm run audio:engine:up
```

If `huggingface.co` is unavailable in the current network region, the Hugging Face client endpoint can be overridden without changing application code:

```bash
AIVIS_HF_ENDPOINT=https://hf-mirror.com npm run audio:engine:up
```

Some mirrors serve the large file correctly but omit metadata required by `huggingface_hub`. In that case, stop the engine, prefill and verify the engine's pinned BERT snapshot, then start its Hugging Face client offline:

```bash
npm run audio:engine:down
npm run audio:engine:bootstrap-bert -- --endpoint https://hf-mirror.com
AIVIS_HF_HUB_OFFLINE=1 npm run audio:engine:up
npm run audio:engine:wait
```

The bootstrap helper downloads only the exact revision pinned by AivisSpeech Engine and verifies the 653 MB FP16 ONNX model against its published SHA-256 value.

The default persistent directory is `~/.local/share/AivisSpeech-Engine`, mounted at `/home/user/.local/share/AivisSpeech-Engine-Dev`. On native Linux the container uses UID 1000; follow the [official engine ownership instructions](https://github.com/aivis-project/AivisSpeech-Engine#linux--docker) if the bind mount is not writable.

First boot downloads the default AIVMX model (about 250 MB) and BERT files (about 650 MB), so readiness can take several minutes.

## Install the six reviewed benchmark models

Review [VOICE_CANDIDATES.md](./VOICE_CANDIDATES.md) first. The installer reads `config/audio-voices.json`; only candidates with `enabledForBenchmark: true` are installed.

```bash
npm run audio:voices:install -- --dry-run
npm run audio:voices:install
npm run audio:voices:list
```

Install one candidate only:

```bash
npm run audio:voices:install -- --voice female-morioki
```

Model files remain in the external Aivis data directory. `.aivm`, `.aivmx`, cache, temporary and raw WAV paths are ignored by Git.

## User dictionary and pronunciation overrides

Display strings may contain Study Garden ruby markup:

```text
display: ｜準備《じゅんび》は済んでいます。
TTS:     準備は済んでいます。
```

`normalizeJapaneseForTts()` removes presentation markup. Use a reviewed `ttsText` field for ambiguous readings, names, symbols, or phrasing that must differ from the display string. Do not mutate visible text with pronunciation hacks.

Project-owned dictionary entries live in `config/tts-dictionary.json`. Each entry needs `surface`, katakana `pronunciation`, `accentType`, an optional `priority`, and a reason. Synchronization is additive and never deletes a developer's local dictionary entries:

```bash
npm run audio:dictionary:sync -- --dry-run
npm run audio:dictionary:sync
```

The benchmark currently needs no custom dictionary entries; its one ruby example uses a reviewed `ttsText` override.

## Generate benchmark audio

Preview the work without contacting the engine:

```bash
npm run audio:benchmark -- --dry-run
```

Generate all 18 comparison files:

```bash
npm run audio:benchmark
```

Generate one voice or one canonical sentence:

```bash
npm run audio:benchmark -- --voice male-fumifumi
npm run audio:benchmark -- --id formal
npm run audio:benchmark -- --voice female-morioki --id question --force
```

`audio:generate` currently accepts only `--scope benchmark`. This guard is intentional: the user asked to choose the voice before generating Problem 4 or the rest of the website.

## Incremental manifest behavior

Each output's SHA-256 key includes:

- normalized TTS text
- voice key
- model UUID and version
- speed, intonation, tempo dynamics, output and normalization settings

An unchanged hash plus an existing output file is skipped. `--force` regenerates it. The manifest at `public/audio/manifest.json` stores the static URL, duration, provider, model, style, settings, format and license.

Raw WAV exists only under `.audio-work/raw-wav` during conversion and is removed after a successful WebM/Opus encode. Current output uses 48 kbps variable-bitrate Opus and a conservative −18 LUFS / −1.5 dBTP normalization target.

## Website playback

Open `/n2/audio-lab` after running the site. `JapaneseAudioPlayer` supports:

- loading, playing, paused and error states
- play/pause and replay
- 0.8× and 1.0× speed
- keyboard-accessible buttons and descriptive labels
- static Aivis asset first, browser `speechSynthesis` only as a labeled fallback

No audio auto-plays. Rating, notes and shortlist decisions on the benchmark page stay in the current browser's local storage.

## Troubleshooting

`Cannot connect to the Docker daemon`
: Start Docker Desktop or OrbStack, confirm `docker info`, then retry.

Engine status stays unavailable
: Run `npm run audio:engine:logs`. First boot is usually downloading BERT or the default model. If logs repeatedly show Hugging Face SSL/timeout errors, restart with the region-appropriate `AIVIS_HF_ENDPOINT` override.

Port 10101 is occupied
: Set the same alternate `AIVIS_PORT`/`AIVIS_ENGINE_URL` for engine and generation commands.

Model installer returns an HTTP error
: Confirm the AivisHub page still exists and the engine is current. The config intentionally stores public model-page URLs and license metadata.

ffmpeg is missing
: Install ffmpeg or set `AUDIO_FFMPEG_BIN=/absolute/path/to/ffmpeg`.

A kanji reading is wrong
: Add a reviewed `ttsText` override or dictionary entry, regenerate only that ID with `--force`, and listen again. Do not change display text solely to manipulate TTS.

Audio still plays after `audio:engine:down`
: This is expected and verifies the production architecture: the browser is loading static files, not the engine.
