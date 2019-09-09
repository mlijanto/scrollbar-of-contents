chrome.tabs.onActivated.addListener((activeInfo: any) => {
  chrome.tabs.sendMessage(activeInfo.tabId, { tabEvent: "activated" });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  chrome.tabs.sendMessage(tabId, { tabEvent: "updated" });
});

chrome.browserAction.onClicked.addListener(tab => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { tabEvent: "browserActionClicked" });
  }
});
