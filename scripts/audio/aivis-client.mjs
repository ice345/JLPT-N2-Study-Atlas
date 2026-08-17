const DEFAULT_TIMEOUT_MS = 120_000;

export class AivisClient {
  constructor(baseUrl = "http://127.0.0.1:10101") {
    this.baseUrl = baseUrl.replace(/\/$/u, "");
  }

  async request(path, init = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      signal: init.signal ?? AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`AivisSpeech ${response.status} ${response.statusText}: ${detail.slice(0, 800)}`);
    }
    return response;
  }

  async version() {
    const response = await this.request("/version", {}, 5_000);
    return response.json();
  }

  async speakers() {
    const response = await this.request("/speakers");
    return response.json();
  }

  async models() {
    const response = await this.request("/aivm_models");
    return response.json();
  }

  async installModel(url) {
    const form = new FormData();
    form.append("url", url);
    await this.request("/aivm_models/install", { method: "POST", body: form }, 900_000);
  }

  resolveStyleId(voice, speakers) {
    const speaker = speakers.find((item) => item.speaker_uuid === voice.speakerUuid);
    if (!speaker) {
      throw new Error(`Installed speaker ${voice.speakerUuid} (${voice.label}) was not returned by /speakers.`);
    }
    const style = speaker.styles.find((item) => item.name === voice.styleName)
      ?? speaker.styles.find((item) => item.id === voice.styleId)
      ?? speaker.styles[0];
    if (!style) throw new Error(`No styles were returned for ${voice.label}.`);
    return { styleId: style.id, speakerName: speaker.name, styleName: style.name };
  }

  async audioQuery(text, speakerId) {
    const params = new URLSearchParams({ text, speaker: String(speakerId) });
    const response = await this.request(`/audio_query?${params}`, { method: "POST" });
    return response.json();
  }

  async synthesis(query, speakerId) {
    const params = new URLSearchParams({ speaker: String(speakerId) });
    const response = await this.request(`/synthesis?${params}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(query),
    }, 300_000);
    return Buffer.from(await response.arrayBuffer());
  }

  async synthesize(text, speakerId, settings) {
    const query = await this.audioQuery(text, speakerId);
    Object.assign(query, {
      speedScale: settings.speedScale,
      intonationScale: settings.intonationScale,
      tempoDynamicsScale: settings.tempoDynamicsScale,
      volumeScale: settings.volumeScale,
      outputSamplingRate: settings.outputSamplingRate,
      outputStereo: settings.outputStereo,
    });
    return this.synthesis(query, speakerId);
  }
}
