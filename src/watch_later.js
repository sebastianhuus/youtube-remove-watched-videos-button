// This is a content script that injects our module script
(function() {
    // Only run on main YouTube pages, not in iframes or sandboxed contexts
    if (window !== window.top || 
        window.location.href === 'about:blank' || 
        !window.location.hostname.includes('youtube.com') ||
        document.documentElement.hasAttribute('sandbox')) {
        return;
    }

    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected.js');
    // Remove module type - causes loading issues
    document.head.appendChild(script);

    console.log("YouTube Watched Extension Content Script loaded");
})();

// Add message listener for storage operations
window.addEventListener('message', async (event) => {
    // Make sure the message is from our injected script
    if (event.source != window || !event.data.type) return;
    
    // Check if chrome extension context is still valid
    if (!chrome || !chrome.runtime || !chrome.runtime.id) {
        window.postMessage({
            type: 'storageResponse',
            id: event.data.id,
            value: event.data.defaultValue || false,
            error: 'Extension context invalidated - please refresh page'
        }, '*');
        return;
    }
    
    if (event.data.type === 'getFromStorage') {
        try {
            chrome.storage.sync.get(event.data.key, (result) => {
                if (chrome.runtime.lastError) {
                    window.postMessage({
                        type: 'storageResponse',
                        id: event.data.id,
                        value: event.data.defaultValue,
                        error: chrome.runtime.lastError.message
                    }, '*');
                } else {
                    window.postMessage({
                        type: 'storageResponse',
                        id: event.data.id,
                        value: result[event.data.key] !== undefined ? result[event.data.key] : event.data.defaultValue
                    }, '*');
                }
            });
        } catch (err) {
            window.postMessage({
                type: 'storageResponse',
                id: event.data.id,
                value: event.data.defaultValue,
                error: err.message
            }, '*');
        }
    } else if (event.data.type === 'setInStorage') {
        try {
            chrome.storage.sync.set({ [event.data.key]: event.data.value }, () => {
                if (chrome.runtime.lastError) {
                    window.postMessage({
                        type: 'storageResponse',
                        id: event.data.id,
                        success: false,
                        error: chrome.runtime.lastError.message
                    }, '*');
                } else {
                    window.postMessage({
                        type: 'storageResponse',
                        id: event.data.id,
                        success: true
                    }, '*');
                }
            });
        } catch (err) {
            window.postMessage({
                type: 'storageResponse',
                id: event.data.id,
                success: false,
                error: err.message
            }, '*');
        }
    }
});
