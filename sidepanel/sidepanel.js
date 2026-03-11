document.getElementById('settings-toggle').addEventListener('click', () => {
    const panel = document.getElementById('settings-panel');
    panel.classList.toggle('hidden');
});

const autoScanCheckbox = document.getElementById('auto-scan');

// Load setting
chrome.storage.local.get(['autoScan'], (result) => {
    autoScanCheckbox.checked = result.autoScan || false;
});

// Save setting
autoScanCheckbox.addEventListener('change', () => {
    chrome.storage.local.set({ autoScan: autoScanCheckbox.checked });
});

// Listen for auto-scan results from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'auto_scan_results') {
        updateUI(request.links || []);
    }
});

document.getElementById('scan-btn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    
    if (tab) {
        chrome.tabs.sendMessage(tab.id, { action: 'scan_links' }, (response) => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
                return;
            }
            if (response) updateUI(response.links || []);
        });
    }
});

function updateUI(links) {
    const list = document.getElementById('link-list');
    const emptyState = document.getElementById('empty-state');
    const stats = document.getElementById('stats');
    const countLabel = document.getElementById('link-count');
    
    list.innerHTML = '';
    
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
