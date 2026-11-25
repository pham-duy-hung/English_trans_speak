chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'ets-translate-speak',
    title: 'English Trans Speak: lấy đoạn này',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== 'ets-translate-speak') return;
  const text = info.selectionText?.trim();
  if (!text) return;

  await chrome.storage.session.set({ pendingSelection: text });
  await chrome.action.openPopup().catch(() => {
    // openPopup can fail if not triggered by user gesture in some Chrome builds;
    // selection is still stored for the next popup open.
  });
});
