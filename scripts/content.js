let foundLinks = [];

// Auto-scan on load if setting is enabled
chrome.storage.local.get(['autoScan'], (result) => {
    if (result.autoScan) {
        // Wait a bit for the page to finish rendering
        setTimeout(() => {
            scanForHttpLinks();
            chrome.runtime.sendMessage({ 
                action: 'auto_scan_results', 
                links: foundLinks 
            }).catch(err => console.log('Side panel not open yet or error:', err));
        }, 1500);
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scan_links') {
        scanForHttpLinks();
        sendResponse({ links: foundLinks });
    } else if (request.action === 'scroll_to_link') {
        const linkObj = foundLinks[request.index];
        if (linkObj && linkObj.element) {
            scrollToAndHighlight(linkObj.element);
        }
    }
});

function scanForHttpLinks() {
    foundLinks = [];
    // Select all anchors and filter manually for more control over "abnormal" patterns
    const anchors = document.querySelectorAll('a[href]');
    
    let logicalIndex = 0;
    anchors.forEach((a) => {
        const href = a.getAttribute('href') || '';
        const trimmedHref = href.trim();
        
        // Match: 
        // 1. Starts with http:// (standard insecure)
        // 2. Starts with http: (missing slashes, like the user's example)
        // 3. Has leading spaces then http: (like the user's example)
        const isAbnormal = /^http:\/\//.test(trimmedHref) || 
                           (/^http:[^\/]/.test(trimmedHref) && !/^https:/.test(trimmedHref));

        // Exclude trusted internal redirection domain
        const isTrusted = trimmedHref.includes('s.ppomppu.co.kr');

        if (isAbnormal && !isTrusted) {
            foundLinks.push({
                index: logicalIndex++,
                href: href,
                text: a.innerText.trim() || a.textContent.trim() || '(텍스트 없음)',
                element: a
            });
        }
    });
    
    console.log(`[HTTP Scanner] Found ${foundLinks.length} abnormal links.`);
}

function scrollToAndHighlight(element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Add highlight class
    element.classList.add('http-link-highlight');
    
    // Remove after animation
    setTimeout(() => {
        element.classList.remove('http-link-highlight');
    }, 3000);
}
