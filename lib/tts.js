let currentUtterance = null;

/** Higher = better for learning English pronunciation. */
function scoreVoice(voice) {
  const name = voice.name || '';
  const lang = (voice.lang || '').toLowerCase();
  let score = 0;

  if (lang === 'en-us') score += 40;
  else if (lang.startsWith('en-gb')) score += 30;
  else if (lang.startsWith('en')) score += 20;
  else return -1;

  // Prefer neural / online Google voices over old local SAPI voices
  if (/google/i.test(name)) score += 50;
  if (/natural|neural|online/i.test(name)) score += 35;
  if (/microsoft.*(aria|jenny|guy|sara|davis|tony|nancy)/i.test(name)) score += 45;
  if (/microsoft/i.test(name)) score += 15;

  // Older robotic Windows voices — deprioritize
  if (/david|zira|mark|hazel|susan|sam\b/i.test(name)) score -= 25;

  if (voice.localService === false) score += 10; // often cloud/neural
  return score;
}

/**
 * @returns {SpeechSynthesisVoice[]}
 */
export function listEnglishVoices() {
  if (!('speechSynthesis' in window)) return [];
  return speechSynthesis
    .getVoices()
    .filter((v) => (v.lang || '').toLowerCase().startsWith('en'))
    .sort((a, b) => scoreVoice(b) - scoreVoice(a));
}

/**
 * @param {string} [preferredName]
 * @returns {SpeechSynthesisVoice | null}
 */
export function pickBestVoice(preferredName) {
  const voices = listEnglishVoices();
  if (!voices.length) return null;
  if (preferredName) {
    const exact = voices.find((v) => v.name === preferredName);
    if (exact) return exact;
  }
  return voices[0];
}

/**
 * @param {string} text
 * @param {{ lang?: string, rate?: number, pitch?: number, voiceName?: string }} [options]
 * @returns {Promise<void>}
 */
export function speakText(text, options = {}) {
  const { lang = 'en-US', rate = 0.95, pitch = 1, voiceName } = options;
  const trimmed = text?.trim();
  if (!trimmed) {
    return Promise.reject(new Error('Không có nội dung để đọc.'));
  }

  if (!('speechSynthesis' in window)) {
    return Promise.reject(new Error('Trình duyệt không hỗ trợ Web Speech API.'));
  }

  stopSpeaking();

  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(trimmed);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;

    const voice = pickBestVoice(voiceName);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang || lang;
    }

    utterance.onend = () => {
      currentUtterance = null;
      resolve();
    };
    utterance.onerror = (event) => {
      currentUtterance = null;
      if (event.error === 'interrupted' || event.error === 'canceled') {
        resolve();
        return;
      }
      reject(new Error(`TTS lỗi: ${event.error || 'unknown'}`));
    };

    currentUtterance = utterance;
    speechSynthesis.speak(utterance);
  });
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
  }
  currentUtterance = null;
}

export function isSpeaking() {
  return 'speechSynthesis' in window && speechSynthesis.speaking;
}

/** Chrome sometimes loads voices asynchronously. */
export function warmUpVoices() {
  if (!('speechSynthesis' in window)) return Promise.resolve([]);

  const existing = speechSynthesis.getVoices();
  if (existing.length) return Promise.resolve(listEnglishVoices());

  return new Promise((resolve) => {
    const done = () => resolve(listEnglishVoices());
    speechSynthesis.onvoiceschanged = done;
    // Fallback if event never fires
    setTimeout(done, 500);
  });
}
