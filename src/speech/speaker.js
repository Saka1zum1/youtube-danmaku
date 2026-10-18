const SPEECH_GAP_MS = 250;

let speechSpeaker = null;

class DanmakuSpeaker {
  constructor(getSettings) {
    this.getSettings = getSettings;
    this.queue = [];
    this.token = 0;
    this.busy = false;
    this.timer = null;
    this.supported = typeof window.speechSynthesis !== 'undefined';
    this.keepAlive = null;
    if (!this.supported) return;
    this.keepAlive = setInterval(() => {
      const synth = window.speechSynthesis;
      if (!synth?.speaking || synth.paused) return;
      synth.pause();
      synth.resume();
    }, 10000);
  }

  destroy() {
    clearInterval(this.keepAlive);
    this.keepAlive = null;
    this.cancel();
  }

  canAutoSpeak() {
    const settings = this.getSettings();
    return !!settings.speechEnabled && Number(settings.speechVolume) > 0;
  }

  rateFor(text, paced) {
    const settings = this.getSettings();
    const base = clamp(Number(settings.speechRate) || 100, 50, 200) / 100;
    const usePace = paced ?? !!settings.speechPace;
    if (!usePace) return base;
    const maxSeconds = clamp(Number(settings.speechMaxSeconds) || 4, 1, 15);
    const estimate = estimateSpeechSeconds(text, base);
    if (estimate <= maxSeconds) return base;
    return clamp(base * (estimate / maxSeconds), base, 10);
  }

  listVoices() {
    if (!this.supported) return [];
    return window.speechSynthesis.getVoices();
  }

  findVoice() {
    const voices = this.listVoices();
    if (!voices.length) return null;
    const settings = this.getSettings();
    if (settings.speechVoice) {
      const picked = voices.find((voice) => voice.voiceURI === settings.speechVoice || voice.name === settings.speechVoice);
      if (picked) return picked;
    }
    const lang = String(settings.speechLang || navigator.language || '').toLowerCase();
    const prefix = lang.slice(0, 2);
    return voices.find((voice) => voice.default && voice.lang.toLowerCase().startsWith(prefix))
      || voices.find((voice) => prefix && voice.lang.toLowerCase().startsWith(prefix))
      || voices.find((voice) => voice.default)
      || voices[0];
  }

  request(text) {
    if (!this.supported || document.hidden || !this.canAutoSpeak()) return;
    const spoken = prepareSpeechText(text);
    if (!spoken) return;
    this.queue.push(spoken);
    if (!this.busy) this.pump();
  }

  speakNow(text) {
    const spoken = prepareSpeechText(text);
    if (!spoken || !this.supported) return;
    if (this.busy && this.queue.length) this.queue.shift();
    this.token += 1;
    const token = this.token;
    clearTimeout(this.timer);
    this.busy = true;
    window.speechSynthesis.cancel();
    this.timer = setTimeout(() => {
      if (token !== this.token) return;
      this.play(spoken, this.rateFor(spoken), token, () => this.pump());
    }, 60);
  }

  preview(text, paced) {
    const spoken = limitSpeechRepeats(normalizeSpeechText(text));
    if (!spoken || !this.supported) return;
    this.token += 1;
    const token = this.token;
    clearTimeout(this.timer);
    this.busy = true;
    window.speechSynthesis.cancel();
    this.timer = setTimeout(() => {
      if (token !== this.token) return;
      this.play(spoken, this.rateFor(spoken, paced), token, () => this.pump());
    }, 60);
  }

  pump() {
    if (!this.supported || !this.canAutoSpeak()) {
      this.queue = [];
      this.busy = false;
      return;
    }
    const buffer = clamp(Number(this.getSettings().speechBuffer) || 5, 1, 25);
    if (this.queue.length > buffer) this.queue = this.queue.slice(-buffer);
    if (!this.queue.length) {
      this.busy = false;
      return;
    }
    const text = this.queue[0];
    const rate = this.rateFor(text);
    this.busy = true;
    this.token += 1;
    const token = this.token;
    this.play(text, rate, token, () => {
      if (this.queue[0] === text) this.queue.shift();
      this.timer = setTimeout(() => this.pump(), SPEECH_GAP_MS);
    });
  }

  play(text, rate, token, onDone) {
    if (token !== this.token || !this.supported) return;
    const settings = this.getSettings();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = clamp(Number(settings.speechVolume), 0, 100) / 100;
    utterance.pitch = clamp(Number(settings.speechPitch), 0, 200) / 100;
    utterance.rate = clamp(rate, 0.1, 10);
    const voice = this.findVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }
    let settled = false;
    const finish = (event) => {
      if (settled || token !== this.token) return;
      if (event?.type === 'error' && (event.error === 'interrupted' || event.error === 'canceled')) return;
      settled = true;
      onDone?.();
    };
    utterance.addEventListener('end', finish);
    utterance.addEventListener('error', finish);
    window.speechSynthesis.resume();
    window.speechSynthesis.speak(utterance);
  }

  cancel() {
    this.token += 1;
    this.queue = [];
    this.busy = false;
    clearTimeout(this.timer);
    this.timer = null;
    if (this.supported) window.speechSynthesis.cancel();
  }
}

function normalizeSpeechText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function speechSourceText(message, parts) {
  if (Array.isArray(parts) && parts.length) {
    return parts
      .filter((part) => part?.type === 'text' && part.text)
      .map((part) => part.text)
      .join(' ');
  }
  return message || '';
}

function limitSpeechRepeats(text, maxRepeats = 3) {
  let out = String(text || '');
  const maxUnit = Math.floor(out.length / (maxRepeats + 1));
  for (let len = maxUnit; len >= 1; len -= 1) {
    const pattern = new RegExp(`([\\s\\S]{${len}})\\1{${maxRepeats},}`, 'g');
    out = out.replace(pattern, (_match, unit) => unit.repeat(maxRepeats));
  }
  return out.replace(/(\S+)(?:\s+\1){3,}/g, (_match, token) => Array(maxRepeats).fill(token).join(' '));
}

function hasReadableSpeech(text) {
  const stripped = String(text || '')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/\p{N}/gu, '')
    .replace(/\p{P}/gu, '')
    .replace(/\p{S}/gu, '')
    .replace(/\s+/g, '');
  return stripped.length > 0;
}

function prepareSpeechText(text) {
  const spoken = limitSpeechRepeats(normalizeSpeechText(text));
  return hasReadableSpeech(spoken) ? spoken : '';
}

function estimateSpeechSeconds(text, rate) {
  let units = 0;
  for (const ch of String(text || '')) {
    if (/\s/.test(ch)) continue;
    units += /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uac00-\ud7af]/.test(ch) ? 1 : 0.45;
  }
  return (units * 0.24) / (rate || 1);
}

function ensureSpeechSpeaker(getSettings) {
  if (!speechSpeaker) speechSpeaker = new DanmakuSpeaker(getSettings);
  return speechSpeaker;
}

function requestSpeech(text) {
  speechSpeaker?.request(text);
}

function speakTextNow(text) {
  speechSpeaker?.speakNow(text);
}

function previewSpeech(text, fast) {
  speechSpeaker?.preview(text, fast);
}

function cancelSpeech() {
  speechSpeaker?.cancel();
}

function listSpeechVoices() {
  return speechSpeaker?.listVoices() || [];
}

function speechSupported() {
  return !!speechSpeaker?.supported;
}
