# AivisSpeech Engine (development only)

This Compose stack is the offline content-generation engine for JLPT Study Garden. It is not a production service. Both profiles publish port `10101` only on `127.0.0.1`.

Use the repository commands so the persistent data directory is resolved safely:

```bash
npm run audio:engine:up
npm run audio:engine:wait
npm run audio:engine:status
npm run audio:engine:down
```

For Linux with a compatible NVIDIA runtime:

```bash
npm run audio:engine:up:nvidia
```

Models and BERT caches live under `${AIVIS_DATA_DIR}` or, by default, `~/.local/share/AivisSpeech-Engine`. They are mounted at `/home/user/.local/share/AivisSpeech-Engine-Dev` inside the container and are never committed.

On native Linux, the official image runs as UID 1000. If the container reports permission errors, prepare the directory once with the ownership described in the official engine documentation before starting it.
