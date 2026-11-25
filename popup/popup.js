import { getAzureConfig, translateWithAzure } from '../lib/azure.js';
import { listEnglishVoices, speakText, stopSpeaking, warmUpVoices } from '../lib/tts.js';

const sourceEl = document.getElementById('source');
const resultEl = document.getElementById('result');
const statusEl = document.getElementById('status');
const rateEl = document.getElementById('rate');
const voiceEl = document.getElementById('voice');

const btnGrab = document.getElementById('btnGrab');
const btnTranslate = document.getElementById('btnTranslate');
const btnSpeak = document.getElementById('btnSpeak');
const btnBoth = document.getElementById('btnBoth');
const btnStop = document.getElementById('btnStop');

function setStatus(message, type = '') {
  statusEl.textContent = message || '';
  statusEl.className = `status ${type}`.trim();
}

function setBusy(busy) {
  [btnGrab, btnTranslate, btnSpeak, btnBoth].forEach((btn) => {
    btn.disabled = busy;
  });
}

async function fillVoices() {
  await warmUpVoices();
  const voices = listEnglishVoices();
  const { voiceName = '' } = await chrome.storage.sync.get(['voiceName']);

  voiceEl.innerHTML = '';
  if (!voices.length) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'Không tìm thấy giọng EN';
    voiceEl.appendChild(opt);
    return;
  }

  for (const voice of voices) {
    const opt = document.createElement('option');
    opt.value = voice.name;
    const tag = /google/i.test(voice.name)
      ? '★ Google'
      : /natural|neural/i.test(voice.name)
        ? '★ Neural'
        : voice.localService
          ? 'Local'
          : 'Online';
    opt.textContent = `${voice.name} (${voice.lang}) · ${tag}`;
    voiceEl.appendChild(opt);
  }

  if (voiceName && voices.some((v) => v.name === voiceName)) {
    voiceEl.value = voiceName;
  } else {
    voiceEl.value = voices[0].name;
    await chrome.storage.sync.set({ voiceName: voices[0].name });
  }
}

voiceEl.addEventListener('change', async () => {
  await chrome.storage.sync.set({ voiceName: voiceEl.value });
  setStatus(`Đã chọn: ${voiceEl.value}`, 'ok');
});

async function getPageSelection() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return '';

  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => window.getSelection()?.toString() || '',
  });

  return result || '';
}

async function translateSource() {
  const text = sourceEl.value.trim();
  if (!text) {
    throw new Error('Hãy nhập hoặc lấy đoạn tiếng Anh trước.');
  }

  const config = await getAzureConfig();
  setStatus('Đang dịch bằng Azure...');
  const translated = await translateWithAzure(text, config);
  resultEl.value = translated;
  setStatus('Đã dịch xong.', 'ok');
  return translated;
}

async function speakSource() {
  const text = sourceEl.value.trim();
  if (!text) {
    throw new Error('Hãy nhập hoặc lấy đoạn tiếng Anh trước.');
  }

  setStatus(`Đang đọc (${voiceEl.value || 'default'})...`);
  await speakText(text, {
    lang: 'en-US',
    rate: Number(rateEl.value) || 0.95,
    voiceName: voiceEl.value,
  });
  setStatus('Đã đọc xong.', 'ok');
}

btnGrab.addEventListener('click', async () => {
  try {
    setBusy(true);
    const selected = await getPageSelection();
    if (!selected.trim()) {
      setStatus('Không tìm thấy text đang chọn trên trang.', 'error');
      return;
    }
    sourceEl.value = selected;
    setStatus('Đã lấy text đang chọn.', 'ok');
  } catch (error) {
    setStatus(error.message || String(error), 'error');
  } finally {
    setBusy(false);
  }
});

btnTranslate.addEventListener('click', async () => {
  try {
    setBusy(true);
    await translateSource();
  } catch (error) {
    setStatus(error.message || String(error), 'error');
  } finally {
    setBusy(false);
  }
});

btnSpeak.addEventListener('click', async () => {
  try {
    setBusy(true);
    await speakSource();
  } catch (error) {
    setStatus(error.message || String(error), 'error');
  } finally {
    setBusy(false);
  }
});

btnBoth.addEventListener('click', async () => {
  try {
    setBusy(true);
    await translateSource();
    await speakSource();
  } catch (error) {
    setStatus(error.message || String(error), 'error');
  } finally {
    setBusy(false);
  }
});

btnStop.addEventListener('click', () => {
  stopSpeaking();
  setStatus('Đã dừng đọc.');
});

chrome.storage.session.get(['pendingSelection']).then(({ pendingSelection }) => {
  if (pendingSelection) {
    sourceEl.value = pendingSelection;
    chrome.storage.session.remove('pendingSelection');
  }
});

fillVoices();
