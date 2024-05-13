chrome.tabs.onActivated.addListener(async (activeInfo: any) => {
  try {
    await chrome.tabs.sendMessage(activeInfo.tabId, { tabEvent: "activated" });
  } catch (error) {
    console.log("Rejected: tabs.onActivated.", error);
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    try {
      await chrome.tabs.sendMessage(tabId, { tabEvent: "updated" });
    } catch (error) {
      console.log("Rejected: tabs.onUpdated.", error);
    }
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    try {
      await chrome.tabs.sendMessage(tab.id, { tabEvent: "actionClicked" });
    } catch (error) {
      console.log("Rejected: action.onClicked.", error);
    }
  }
});
