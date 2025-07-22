// Storage utilities

// Create unique IDs for message tracking
let requestId = 0;
const pendingRequests = new Map();

export async function getFromStorage(key, defaultValue = false) {
    return new Promise((resolve) => {
        const id = ++requestId;
        
        // Set up a listener for this specific request
        pendingRequests.set(id, resolve);
        
        // Post message to content script
        window.postMessage({
            type: 'getFromStorage',
            id,
            key,
            defaultValue
        }, '*');
    });
}

export function setInStorage(key, value) {
    return new Promise((resolve) => {
        const id = ++requestId;
        
        // Set up a listener for this specific request
        pendingRequests.set(id, resolve);
        
        // Post message to content script
        window.postMessage({
            type: 'setInStorage',
            id,
            key,
            value
        }, '*');
    });
}

// Listen for responses from content script
window.addEventListener('message', (event) => {
    if (event.source != window || !event.data.type) return;
    
    if (event.data.type === 'storageResponse' && event.data.id && pendingRequests.has(event.data.id)) {
        const resolver = pendingRequests.get(event.data.id);
        
        if (event.data.error) {
            console.error("Storage error:", event.data.error);
        }
        
        // Resolve with the value or success state
        if ('value' in event.data) {
            resolver(event.data.value);
        } else {
            resolver(event.data.success);
        }
        
        // Clean up
        pendingRequests.delete(event.data.id);
    }
});

// Initialize storage with default values
export async function initializeStorage() {
    const isDebuggingEnabled = await getFromStorage("isDebuggingEnabled");
    if (isDebuggingEnabled === undefined) {
        await setInStorage("isDebuggingEnabled", false);
        console.log("Initialized debugging mode");
    }
}