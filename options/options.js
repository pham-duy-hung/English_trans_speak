import { getAzureConfig, translateWithAzure } from '../lib/azure.js';

const keyEl = document.getElementById('azureKey');
const regionEl = document.getElementById('azureRegion');
const statusEl = document.getElementById('status');
const btnSave = document.getElementById('btnSave');
const btnTest = document.getElementById('btnTest');

function setStatus(message, type = '') {
  statusEl.textContent = message || '';
  statusEl.className = `status ${type}`.trim();
}

async function load() {
  const { key, region } = await getAzureConfig();
  keyEl.value = key;
  regionEl.value = region || 'eastasia';
}

btnSave.addEventListener('click', async () => {
  await chrome.storage.sync.set({
    azureKey: keyEl.value.trim(),
    azureRegion: regionEl.value.trim(),
  });
  setStatus('Đã lưu cấu hình.', 'ok');
});

btnTest.addEventListener('click', async () => {
  try {
    setStatus('Đang test Azure...');
    const translated = await translateWithAzure('Hello, how are you?', {
      key: keyEl.value,
      region: regionEl.value,
      from: 'en',
      to: 'vi',
    });
    setStatus(`OK — "${translated}"`, 'ok');
  } catch (error) {
    setStatus(error.message || String(error), 'error');
  }
});

load();
