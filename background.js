// background.js — Service Worker
// Registers context menu and routes messages between content script and dashboard.

const MENU_ITEMS = [
  { id: 'create-resume',       title: 'Create Resume' },
  { id: 'create-cover-letter', title: 'Create Cover Letter' },
  { id: 'create-both',         title: 'Create Both' },
];

// ── Setup ──────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  // Create parent menu item
  chrome.contextMenus.create({
    id: 'jpda-parent',
    title: 'Job Page Draft Assistant',
    contexts: ['page', 'selection'],
  });

  MENU_ITEMS.forEach(item => {
    chrome.contextMenus.create({
      id: item.id,
      parentId: 'jpda-parent',
      title: item.title,
      contexts: ['page', 'selection'],
    });
  });
});

// ── Context Menu Click ─────────────────────────────────────────────────────

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const menuIds = MENU_ITEMS.map(m => m.id);
  if (!menuIds.includes(info.menuItemId)) return;

  // Map menu id to mode
  const modeMap = {
    'create-resume':       'resume',
    'create-cover-letter': 'cover-letter',
    'create-both':         'both',
  };
  const mode = modeMap[info.menuItemId];

  // Store mode so dashboard can read it on open
  await chrome.storage.session.set({ pendingMode: mode });

  // Ask content script to capture content
  let response;
  try {
    response = await chrome.tabs.sendMessage(tab.id, { type: 'CAPTURE_CONTENT' });
  } catch (e) {
    // Content script may not be injected yet — inject and retry
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
    try {
      response = await chrome.tabs.sendMessage(tab.id, { type: 'CAPTURE_CONTENT' });
    } catch (err) {
      response = { error: 'Could not read page content.' };
    }
  }

  // Store captured data in session storage for dashboard to read
  await chrome.storage.session.set({
    extractedData: response,
    sourceUrl: tab.url,
    sourceTitle: tab.title,
  });

  // Open side panel
  await chrome.sidePanel.open({ tabId: tab.id });
  await chrome.sidePanel.setOptions({ tabId: tab.id, path: 'dashboard/dashboard.html', enabled: true });
});

// ── Message Router ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_SETTINGS') {
    chrome.runtime.openOptionsPage();
    sendResponse({ ok: true });
    return true;
  }

  if (message.type === 'GET_SESSION') {
    chrome.storage.session.get(null).then(data => sendResponse(data));
    return true; // async
  }

  if (message.type === 'CLEAR_SESSION') {
    chrome.storage.session.clear().then(() => sendResponse({ ok: true }));
    return true;
  }
});
