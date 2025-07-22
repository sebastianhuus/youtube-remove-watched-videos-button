# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome extension that adds a convenient "Remove from Watch Later" button directly to YouTube's Watch Later playlist videos. The extension injects custom UI elements to make removing videos from the Watch Later playlist easier by avoiding the multi-click process.

## Architecture

### Core Components

- **manifest.json** (`src/manifest.json`): Chrome extension manifest (v3) that defines content scripts, permissions, and web accessible resources
- **watch_later.js** (`src/watch_later.js`): Content script that handles the main functionality - runs on YouTube pages and injects the module script
- **injected.js** (`src/injected.js`): Main module script containing the button injection logic, DOM manipulation, and YouTube UI interaction
- **storage_utilities.js** (`src/storage_utilities.js`): Cross-context storage utilities that bridge between injected script and Chrome extension storage APIs using message passing
- **options.html/js** (`src/options.html`, `src/options.js`): Extension settings page for enabling/disabling debug mode

### Extension Architecture Pattern

The extension uses a multi-layered approach:
1. **Content Script** (`watch_later.js`): Acts as a bridge between the extension context and the page context
2. **Injected Module** (`injected.js`): Runs in the page context to interact with YouTube's DOM and APIs
3. **Message Passing**: Communication between contexts via `window.postMessage()` for storage operations

### Key Technical Details

- Uses ES6 modules (`type="module"`) for the injected script
- Implements custom SVG buttons that match YouTube's design system
- Uses MutationObserver to hide YouTube's original "Remove from Watch later" button
- Employs polling (2-second intervals) to handle dynamically loaded content
- Complex DOM traversal to find and interact with YouTube's menu system

## Development

### Installation/Testing
Load the extension in developer mode by selecting the `src` folder in `edge://extensions/` (or equivalent for other browsers).

### No Build Process
This extension has no build step - all files are served directly. Changes to files in `src/` take effect immediately after extension reload.

### Debugging
Enable debug mode through the extension's options page to see console logs with prefix "watch_later -".