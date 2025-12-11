document.getElementById("save").addEventListener("click", async () => {
    const isDebuggingEnabled = document.getElementById("debug-mode").checked;
    
    await chrome.storage.sync.set({ isDebuggingEnabled });
    document.getElementById("status").innerHTML = "Settings saved!";
    setTimeout(() => {
        document.getElementById("status").innerHTML = "";
    }, 5000);
});

document.addEventListener("DOMContentLoaded", async () => {
    const result = await chrome.storage.sync.get({ isDebuggingEnabled: false });
    document.getElementById("debug-mode").checked = result.isDebuggingEnabled;
});