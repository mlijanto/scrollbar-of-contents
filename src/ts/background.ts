chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.query === "checkIncognito") {
    sendResponse({ incognito: sender.tab.incognito });
  } else {
    sendResponse({});
  }
});

chrome.tabs.onSelectionChanged.addListener((tabId, selectInfo) => {
  chrome.tabs.sendMessage(tabId, { tabEvent: "selectionChanged" });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  chrome.tabs.sendMessage(tabId, { tabEvent: "updated" });
});

chrome.browserAction.onClicked.addListener(tab => {
  chrome.tabs.sendMessage(tab.id, { tabEvent: "browserActionClicked" });
});
