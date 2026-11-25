let currentUtterance = null;

/**
 * @param {string} text
 * @param {{ lang?: string, rate?: number, pitch?: number }} [options]
 * @returns {Promise<void>}
 */
export function speakText(text, options = {}) {
  const { lang = 'en-US', rate = 0.95, pitch = 1 } = options;
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

    const voices = speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => v.lang === lang && /google|microsoft|natural/i.test(v.name)) ||
      voices.find((v) => v.lang.startsWith('en'));
    if (preferred) {
      utterance.voice = preferred;
    }

    utterance.onend = () => {
      currentUtterance = null;
      resolve();
    };
    utterance.onerror = (event) => {
      currentUtterance = null;
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
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.getVoices();
  speechSynthesis.onvoiceschanged = () => {
    speechSynthesis.getVoices();
  };
}
