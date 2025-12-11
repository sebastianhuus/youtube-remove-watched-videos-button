// Storage utilities inlined
let requestId = 0;
const pendingRequests = new Map();

async function getFromStorage(key, defaultValue = false) {
    return new Promise((resolve) => {
        const id = ++requestId;
        pendingRequests.set(id, resolve);
        window.postMessage({
            type: 'getFromStorage',
            id,
            key,
            defaultValue
        }, '*');
    });
}

function setInStorage(key, value) {
    return new Promise((resolve) => {
        const id = ++requestId;
        pendingRequests.set(id, resolve);
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
        
        if ('value' in event.data) {
            resolver(event.data.value);
        } else {
            resolver(event.data.success);
        }
        
        pendingRequests.delete(event.data.id);
    }
});

function initializeStorage() {
    // Set default values if not already set
    getFromStorage("isDebuggingEnabled").then(value => {
        if (value === undefined) {
            setInStorage("isDebuggingEnabled", true); // Enable by default
        }
    });
}

// Initialize storage
initializeStorage();

// keep running so when new videos appear, ie. on page scroll, we add button to them as well
setInterval(() => {
    addButtons("ytd-playlist-video-renderer");
}, 2000);

// Create styles using DOM methods instead of insertAdjacentHTML
const styleEl = document.createElement('style');
styleEl.textContent = `
    .watched-button {
        position: absolute;
        right: 35px;
        background: none;
        border: none;
        cursor: pointer;
        opacity: 0.5;
        z-index: 1000;  /* Ensure buttons appear above other elements */
        font-size: 20px;  /* Make buttons more visible */
        padding: 5px;
        color: var(--yt-spec-text-primary, #fff);  /* Use YouTube's text color variables */
    }
    .watched-button:hover {
        opacity: 1;
    }
    
    .watched-button svg {
        fill: currentColor;  /* Inherit color from parent */
        width: 100%;
        height: 100%;
        display: block;
    }

    .btn-top {
        top: 47px;
    }

    .hide-popup {
        opacity: 0;
        display: none;
    }
`;
document.head.appendChild(styleEl);

// Function to hide the original "Remove from Watch later" button
function hideOriginalWatchLaterButton() {
    logger("Setting up observer to hide the original Watch Later button");
    
    // Use a mutation observer to detect when the menu appears
    const observer = new MutationObserver((mutations) => {
        const popupWrapper = document.querySelector("ytd-popup-container");
        if (!popupWrapper) return;
        
        const menuItems = popupWrapper.querySelectorAll('ytd-menu-service-item-renderer');
        
        menuItems.forEach(item => {
            const formattedString = item.querySelector('yt-formatted-string');
            
            if (formattedString && 
                formattedString.textContent.includes('Remove from') && 
                formattedString.textContent.includes('Watch later')) {
                // Hide the button
                logger("Found and hid original Watch Later button");
                item.style.display = 'none';
            }
        });
    });
    
    // Start observing the document with the configured parameters
    observer.observe(document.body, { 
        childList: true, 
        subtree: true 
    });
}

// Call the function to hide the original button
hideOriginalWatchLaterButton();

// Helper function to create SVG element with given path
function createSvgElement(pathD) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "24");
    svg.setAttribute("height", "24");
    
    // Don't set inline style, use CSS classes instead
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", pathD);
    svg.appendChild(path);
    
    return svg;
}

async function logger(...data) {
    const isDebuggingEnabled = await getFromStorage("isDebuggingEnabled");
    if (isDebuggingEnabled) {
        console.log("watch_later -", ...data);
    }
}

logger("YouTube Watched Extension Loaded");

async function addButtons(videoBoxSelector) {
    logger("Adding buttons. . .")
    const watchedButton = {
        onClick: actionWatched(
            "M19 3h-4V2a1 1 0 00-1-1h-4a1 1 0 00-1 1v1H5a2 2 0 00-2 2h18a2 2 0 00-2-2ZM6 19V7H4v12a4 4 0 004 4h8a4 4 0 004-4V7h-2v12a2 2 0 01-2 2H8a2 2 0 01-2-2Zm4-11a1 1 0 00-1 1v8a1 1 0 102 0V9a1 1 0 00-1-1Zm4 0a1 1 0 00-1 1v8a1 1 0 002 0V9a1 1 0 00-1-1Z",
            videoBoxSelector
        ),
        cssClass: "btn-top",
        svgPath: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8 9h8v10H8V9zm7.5-5l-1-1h-5l-1 1H5v2h14V4z",
    };
    const buttonsToAdd = [watchedButton];

    try {
        const elements = document.querySelectorAll(videoBoxSelector);
        logger(`Found ${elements.length} ${videoBoxSelector} elements`);

        for (const videoBox of elements) {
            // Skip if this video already has our button
            if (videoBox.querySelector('.watched-button')) continue;

            // Ensure the container has relative positioning
            videoBox.style.position = "relative";

            // Create and append the button
            const button = document.createElement("button");
            button.classList.add("watched-button");
            button.classList.add(watchedButton.cssClass);
            
            // Create YouTube-style icon container
            const iconSpan = document.createElement("span");
            iconSpan.className = "yt-icon-shape style-scope yt-icon yt-spec-icon-shape";
            
            // Create div container with specified styles
            const iconDiv = document.createElement("div");
            iconDiv.style.width = "100%";
            iconDiv.style.height = "100%";
            iconDiv.style.display = "block";
            iconDiv.style.fill = "currentcolor";
            
            // Append SVG to the div
            const svg = createSvgElement(watchedButton.svgPath);
            iconDiv.appendChild(svg);
            
            // Add the div to the span
            iconSpan.appendChild(iconDiv);
            
            // Add the icon span to the button
            button.appendChild(iconSpan);
            
            button.onclick = watchedButton.onClick;
            
            // Add the button to the container
            videoBox.appendChild(button);
            
            // Log successful addition
            logger(`Added button to ${videoBoxSelector} element`);
        }
    } catch (err) {
        console.error(err);
    }
}

function actionWatched(svgPath, videoSelector) {
    return (event) => {
        event.preventDefault();
        // Don't stop propagation - it breaks YouTube's event handling
        
        // Find the actual button element regardless of where inside it was clicked
        const buttonElement = event.target.closest('.watched-button');
        if (!buttonElement) return false;

        // prevent popup from appearing when custom button is pressed
        const popupWrapper = document.querySelector("ytd-popup-container");
        popupWrapper.classList.add("hide-popup");
        
        // Find the video container and then the menu button
        const videoContainer = buttonElement.closest(videoSelector);
        if (!videoContainer) {
            logger("Could not find video container");
            return false;
        }
        
        const menuButton = videoContainer.querySelector("#menu #button yt-icon");
        if (!menuButton) {
            logger("Could not find menu button");
            return false;
        }
        
        menuButton.click();

        // ..wait for popup to render using artificial delay
        setTimeout(async () => {
            const popupNode = popupWrapper.querySelector(
                `ytd-menu-popup-renderer #items`
            );
            if (!popupNode) {
                logger("Could not find popup menu in DOM");
                return;
            }
            let buttonChildIndex;
            const popupMenuChildren = Array.from(popupNode.children);
            for (let i = 0; i < popupMenuChildren.length; i++) {
                const childNode = popupMenuChildren[i];
                const svgCandidate = childNode.querySelector(
                    "ytd-menu-service-item-renderer tp-yt-paper-item yt-icon span div svg"
                );
                logger(childNode);
                logger(childNode.textContent.trim());
                logger(svgCandidate);
                if (!svgCandidate) continue;
                logger(svgCandidate.innerHTML);
                const isCandidateCorrectButton = svgCandidate.innerHTML
                    .trim()
                    .indexOf(svgPath);
                if (isCandidateCorrectButton >= 0) {
                    logger(`found button at index ${i}`);
                    buttonChildIndex = i;
                    break;
                }
            }

            if (buttonChildIndex === undefined) {
                logger("Could not find button in DOM");
                return;
            }
            // nth-child css selector index is 1-based
            buttonChildIndex += 1;

            const watchedButton = popupWrapper.querySelector(
                `ytd-menu-popup-renderer #items > ytd-menu-service-item-renderer:nth-child(${buttonChildIndex})`
            );

            if (watchedButton) {
                logger("clicking", watchedButton.textContent.trim());
                watchedButton.click();
            }
            popupWrapper.classList.remove("hide-popup");
        }, 100);

        return false;
    };
}
