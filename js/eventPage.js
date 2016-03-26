chrome.extension.onMessage.addListener( function( request, sender, sendResponse ) {
    if( request.query === "checkIncognito" ) {
        sendResponse( { incognito: sender.tab.incognito } );
    } else {
        sendResponse({});
    }
});

chrome.tabs.onSelectionChanged.addListener( function( tabId, selectInfo ) {
    chrome.tabs.sendMessage( tabId, { tabEvent: "selectionChanged" } );
});

chrome.tabs.onUpdated.addListener( function( tabId, changeInfo, tab ) {
    chrome.tabs.sendMessage( tabId, { tabEvent: "updated" } );
});

chrome.browserAction.onClicked.addListener( function( tab ) {
    chrome.tabs.sendMessage( tab.id, { tabEvent: "browserActionClicked" } );
});