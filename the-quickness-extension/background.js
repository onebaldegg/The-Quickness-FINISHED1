/* global chrome */
// THE QUICKNESS - Background Service Worker (Downloads Folder Only)

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'downloadPDF') {
    downloadPDFToDownloads(request.pdfData, request.filename, sender.tab.id);
    sendResponse({success: true});
  }
  return true;
});

function downloadPDFToDownloads(pdfDataArray, filename, tabId) {
  try {
    console.log('Background: Starting PDF download to Downloads folder');
    
    // Convert array back to Uint8Array
    const uint8Array = new Uint8Array(pdfDataArray);
    
    // Convert to base64 data URL
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);
    const dataUrl = `data:application/pdf;base64,${base64}`;
    
    console.log('Background: Saving PDF to Downloads folder:', filename);
    
    // Save directly to Downloads folder (Chrome's default)
    chrome.downloads.download({
      url: dataUrl,
      filename: filename,
      saveAs: false,
      conflictAction: 'uniquify'
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('Background: Download failed:', chrome.runtime.lastError);
        notifyContentScript(tabId, filename, false);
      } else {
        console.log('Background: PDF saved successfully to Downloads:', downloadId);
        notifyContentScript(tabId, filename, true);
      }
    });
    
  } catch (error) {
    console.error('Background: Error in download process:', error);
    notifyContentScript(tabId, filename, false);
  }
}

function notifyContentScript(tabId, filename, success) {
  try {
    chrome.tabs.sendMessage(tabId, {
      action: success ? 'downloadSuccess' : 'downloadFailed',
      filename: filename
    }).catch((error) => {
      console.log('Background: Content script notification failed (this is normal):', error);
    });
  } catch (error) {
    console.log('Background: Could not send notification to content script:', error);
  }
}

// Extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('THE QUICKNESS extension installed - Downloads folder only');
});
