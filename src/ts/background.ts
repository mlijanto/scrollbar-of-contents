chrome.tabs.onSelectionChanged.addListener((tabId, selectInfo) => {
  chrome.tabs.sendMessage(tabId, { tabEvent: "selectionChanged" });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  chrome.tabs.sendMessage(tabId, { tabEvent: "updated" });
});

chrome.browserAction.onClicked.addListener(tab => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { tabEvent: "browserActionClicked" });
  }
});
