// background.js — Service Worker
// Registers context menu and routes messages between content script and dashboard.

const MENU_ITEMS = [
  { id: 'create-resume', title: 'Create Resume' },
  { id: 'create-cover-letter', title: 'Create Cover Letter' },
  { id: 'create-both', title: 'Create Both' },
];

// ── Setup ──────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  // Allow users to open the side panel by clicking on the action toolbar icon
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => console.error(error));

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

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const menuIds = MENU_ITEMS.map(m => m.id);
  if (!menuIds.includes(info.menuItemId)) return;

  // 1. OPEN SIDE PANEL IMMEDIATELY (Must be synchronous for user gesture)
  chrome.sidePanel.setOptions({ tabId: tab.id, path: 'dashboard/dashboard.html', enabled: true });
  chrome.sidePanel.open({ tabId: tab.id }).catch(err => console.error('Failed to open side panel:', err));

  // 2. RUN ASYNC LOGIC IN BACKGROUND
  (async () => {
    // Map menu id to mode
    const modeMap = {
      'create-resume': 'resume',
      'create-cover-letter': 'cover-letter',
      'create-both': 'both',
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
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id, allFrames: true },
          files: ['content.js']
        });
        response = await chrome.tabs.sendMessage(tab.id, { type: 'CAPTURE_CONTENT' });
      } catch (err) {
        console.error('Failed to capture content:', err);
        response = { error: 'Could not read page content.', pageText: '' };
      }
    }

    // Store captured data in session storage for dashboard to read
    await chrome.storage.session.set({
      extractedData: response,
      sourceUrl: tab.url,
      sourceTitle: tab.title,
    });

    // Tell any already open dashboard to reload session
    chrome.runtime.sendMessage({ type: 'SESSION_UPDATED' }).catch(() => { });
  })();
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
