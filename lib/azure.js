const AZURE_ENDPOINT = 'https://api.cognitive.microsofttranslator.com';

/**
 * @param {string} text
 * @param {{ key: string, region: string, from?: string, to?: string }} config
 * @returns {Promise<string>}
 */
export async function translateWithAzure(text, config) {
  const { key, region, from = 'en', to = 'vi' } = config;

  if (!key?.trim() || !region?.trim()) {
    throw new Error('Chưa cấu hình Azure key/region. Mở Options để nhập.');
  }

  const trimmed = text?.trim();
  if (!trimmed) {
    throw new Error('Không có nội dung để dịch.');
  }

  const url = new URL(`${AZURE_ENDPOINT}/translate`);
  url.searchParams.set('api-version', '3.0');
  url.searchParams.set('from', from);
  url.searchParams.set('to', to);

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key.trim(),
      'Ocp-Apim-Subscription-Region': region.trim(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([{ Text: trimmed }]),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Azure Translate lỗi ${response.status}: ${detail || response.statusText}`);
  }

  const data = await response.json();
  const translated = data?.[0]?.translations?.[0]?.text;
  if (!translated) {
    throw new Error('Azure không trả về bản dịch.');
  }

  return translated;
}

export async function getAzureConfig() {
  const { azureKey = '', azureRegion = '' } = await chrome.storage.sync.get([
    'azureKey',
    'azureRegion',
  ]);
  return { key: azureKey, region: azureRegion };
}
