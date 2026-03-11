document.getElementById('settings-toggle').addEventListener('click', () => {
    const panel = document.getElementById('settings-panel');
    panel.classList.toggle('hidden');
});

const autoScanCheckbox = document.getElementById('auto-scan');
const scanBtn = document.getElementById('scan-btn');

function toggleScanBtn(isAuto) {
    if (isAuto) {
        scanBtn.classList.add('hidden');
    } else {
        scanBtn.classList.remove('hidden');
    }
}

// Load setting
chrome.storage.local.get(['autoScan'], (result) => {
    const isAuto = result.autoScan || false;
    autoScanCheckbox.checked = isAuto;
    toggleScanBtn(isAuto);
});

// Save setting
autoScanCheckbox.addEventListener('change', () => {
    const isAuto = autoScanCheckbox.checked;
    chrome.storage.local.set({ autoScan: isAuto });
    toggleScanBtn(isAuto);
});

// Listen for events
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'auto_scan_results') {
        updateUI(request.links || []);
    } else if (request.action === 'tab_updated') {
        // Clear UI on navigation and show scanning if auto
        chrome.storage.local.get(['autoScan'], (result) => {
            if (result.autoScan) {
                showScanningState();
            } else {
                updateUI([]);
            }
        });
    }
});

// Refresh UI when switching tabs
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    showScanningState();
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url && !tab.url.startsWith('chrome://')) {
        chrome.tabs.sendMessage(tab.id, { action: 'scan_links' }, (response) => {
            if (chrome.runtime.lastError) {
                updateUI([]);
                return;
            }
            if (response) updateUI(response.links || []);
        });
    } else {
        updateUI([]);
    }
});

document.getElementById('scan-btn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    
    if (tab) {
        showScanningState();
        chrome.tabs.sendMessage(tab.id, { action: 'scan_links' }, (response) => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
                updateUI([]);
                return;
            }
            if (response) updateUI(response.links || []);
        });
    }
});

function showScanningState() {
    const list = document.getElementById('link-list');
    const emptyState = document.getElementById('empty-state');
    const loadingState = document.getElementById('loading-state');
    const stats = document.getElementById('stats');
    
    list.innerHTML = '';
    stats.classList.add('hidden');
    emptyState.classList.add('hidden');
    loadingState.classList.remove('hidden');
}

function updateUI(links) {
    const list = document.getElementById('link-list');
    const emptyState = document.getElementById('empty-state');
    const loadingState = document.getElementById('loading-state');
    const stats = document.getElementById('stats');
    const countLabel = document.getElementById('link-count');
    
    list.innerHTML = '';
    loadingState.classList.add('hidden');
    
    if (links.length === 0) {
        emptyState.innerHTML = '<p>비정상 링크가 없습니다.</p>';
        emptyState.classList.remove('hidden');
        stats.classList.add('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    stats.classList.remove('hidden');
    countLabel.textContent = links.length;
    
    links.forEach((link, index) => {
        const li = document.createElement('li');
        li.className = 'link-item';
        li.innerHTML = `
            <span class="link-text">${link.text || '(텍스트 없음)'}</span>
            <span class="link-url">${link.href}</span>
        `;
        li.addEventListener('click', () => {
            chrome.tabs.query({ active: true, lastFocusedWindow: true }, ([tab]) => {
                chrome.tabs.sendMessage(tab.id, { 
                    action: 'scroll_to_link', 
                    index: link.index 
                });
            });
        });
        list.appendChild(li);
    });
}
