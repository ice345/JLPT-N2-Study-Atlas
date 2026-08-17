# Sarashina2.2-TTS evaluation note

Sarashina2.2-TTS is not a production provider in this phase.

Reasons:

- it requires a heavier inference stack and is much less turnkey for a content-maintenance workflow;
- practical inference is GPU-oriented, while AivisSpeech has a maintained CPU/ARM64 Docker path;
- the workflow relies on reference-audio prompting, adding another provenance and consistency decision;
- the model license is NonCommercial, which is unnecessarily restrictive for a public learning site;
- AivisSpeech exposes stable VOICEVOX-compatible query/synthesis APIs, AIVMX model metadata, styles and user dictionaries that fit this repository's offline batch pipeline.

Sarashina may be evaluated later as a controlled research benchmark. It must not become a browser runtime dependency, and no Sarashina weights or reference audio should be committed without a separate license/provenance review.
