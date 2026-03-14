// content.js — Injected into every page
// Listens for a message from background.js and returns selected text or page content.

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== 'CAPTURE_CONTENT') return;

  try {
    const selectedText = window.getSelection().toString().trim();
    const pageText = document.body.innerText || '';
    const title = document.title || '';
    const url = location.href;

    sendResponse({
      selectedText: selectedText || null,
      pageText: pageText,
      title: title,
      url: url,
      usedSelection: selectedText.length > 0,
    });
  } catch (error) {
    sendResponse({ error: 'Failed to extract content.' });
  }

  return true; // keep channel open for async
});
