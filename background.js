// background.js — Service Worker
// Registers context menu and routes messages between content script and dashboard.

// No sub-menu items needed now. Extraction is triggered by clicking the main menu item.

// ── Setup ──────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  // Disable side panel globally so it only shows on specific tabs when requested
  chrome.sidePanel.setOptions({ enabled: false }).catch((error) => console.error(error));

  // Clear any existing menu items first
  chrome.contextMenus.removeAll(() => {
    // Create main menu item
    chrome.contextMenus.create({
      id: 'jpda-main',
      title: 'Job Page Draft Assistant',
      contexts: ['page', 'selection'],
    });
  });
});

// ── Action Icon Click ───────────────────────────────────────────────────────

// If the user clicks the toolbar icon, enable and open for current tab
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.setOptions({
    tabId: tab.id,
    path: 'dashboard/dashboard.html',
    enabled: true
  });
  chrome.sidePanel.open({ tabId: tab.id }).catch(err => console.error('Failed to open side panel via action:', err));
});

// ── Context Menu Click ─────────────────────────────────────────────────────

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'jpda-main') return;

  // 1. OPEN SIDE PANEL IMMEDIATELY (Must be synchronous for user gesture)
  chrome.sidePanel.setOptions({ tabId: tab.id, path: 'dashboard/dashboard.html', enabled: true });
  chrome.sidePanel.open({ tabId: tab.id }).catch(err => console.error('Failed to open side panel via context menu:', err));

  // 2. RUN ASYNC LOGIC IN BACKGROUND
  (async () => {
    // Default mode is 'both' since sub-menus are removed.
    const mode = 'both';

    // Store mode so dashboard can read it on open
    await chrome.storage.session.set({ pendingMode: mode });

    // Ask content script to capture content
    let response;
    try {
      response = await chrome.tabs.sendMessage(tab.id, { type: 'CAPTURE_CONTENT' });
    } catch (e) {
      // Content script may not be injected yet
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
