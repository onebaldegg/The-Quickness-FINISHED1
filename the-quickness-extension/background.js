// Background service worker for THE QUICKNESS extension

let isCapturing = false;
let captureMode = null; // 'screenshot', 'hover', 'note'

// Handle keyboard commands
chrome.commands.onCommand.addListener(async (command) => {
  console.log(`Command received: ${command}`);
  
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab || tab.url.startsWith('chrome://') || tab.url.startsWith('moz-extension://')) {
    console.log('Cannot execute on chrome:// or extension pages');
    return;
  }
  
  try {
    switch (command) {
      case 'screenshot-region':
        await initializeScreenshotMode(tab.id);
        break;
      case 'capture-hover':
        await initializeHoverMode(tab.id);
        break;
      case 'quick-note':
        await initializeQuickNote(tab.id);
        break;
    }
  } catch (error) {
    console.error('Error executing command:', error);
  }
});

async function initializeScreenshotMode(tabId) {
  console.log('Initializing screenshot mode');
  captureMode = 'screenshot';
  isCapturing = true;
  
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: activateScreenshotMode
    });
  } catch (error) {
    console.error('Error initializing screenshot mode:', error);
  }
}

async function initializeHoverMode(tabId) {
  console.log('Initializing hover mode');
  captureMode = 'hover';
  isCapturing = true;
  
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: activateHoverMode
    });
  } catch (error) {
    console.error('Error initializing hover mode:', error);
  }
}

async function initializeQuickNote(tabId) {
  console.log('Initializing quick note mode');
  captureMode = 'note';
  
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: activateQuickNoteMode
    });
  } catch (error) {
    console.error('Error initializing quick note mode:', error);
  }
}

// Functions to be injected into content script context
function activateScreenshotMode() {
  if (window.theQuicknessExtension) {
    window.theQuicknessExtension.startScreenshotMode();
  }
}

function activateHoverMode() {
  if (window.theQuicknessExtension) {
    window.theQuicknessExtension.startHoverMode();
  }
}

function activateQuickNoteMode() {
  if (window.theQuicknessExtension) {
    window.theQuicknessExtension.startQuickNoteMode();
  }
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  if (request.action === 'captureComplete') {
    isCapturing = false;
    captureMode = null;
  }
  
  if (request.action === 'downloadPDF') {
    downloadPDF(request.pdfData, request.filename);
  }
  
  return true;
});

function downloadPDF(pdfData, filename) {
  try {
    const blob = new Blob([pdfData], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    chrome.downloads.download({
      url: url,
      filename: `THE QUICKNESS/${filename}`,
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('Download failed:', chrome.runtime.lastError);
      } else {
        console.log('PDF downloaded successfully:', downloadId);
      }
      URL.revokeObjectURL(url);
    });
  } catch (error) {
    console.error('Error downloading PDF:', error);
  }
}

// Extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('THE QUICKNESS extension installed');
});</absolute_file_name>
    </file>