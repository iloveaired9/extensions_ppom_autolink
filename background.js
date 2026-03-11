chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// Notify side panel about page navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        chrome.runtime.sendMessage({ 
            action: 'tab_updated', 
            tabId: tabId 
        }).catch(() => {
            // Error is expected if side panel is closed
        });
    }
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('HTTP Link Scanner Extension Installed');
});
