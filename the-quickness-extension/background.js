// THE QUICKNESS - Background Service Worker (Enhanced)

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'downloadPDF') {
    downloadPDFToFolder(request.pdfData, request.filename, sender.tab.id);
    sendResponse({success: true}); // Immediate response to prevent context invalidation
  }
  return true; // Keep message channel open for async response
});

function downloadPDFToFolder(pdfDataArray, filename, tabId) {
  try {
    console.log('Background: Starting PDF download process');
    
    // Convert array back to Uint8Array
    const uint8Array = new Uint8Array(pdfDataArray);
    
    // Convert to base64 data URL
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);
    const dataUrl = `data:application/pdf;base64,${base64}`;
    
    console.log('Background: PDF data prepared, checking for custom save path');
    
    // Get custom save path from storage
    chrome.storage.local.get(['customSavePath'], (result) => {
      let downloadPath = filename; // Default to Downloads folder
      
      if (result.customSavePath) {
        // Use custom path
        const customPath = result.customSavePath.replace(/\\/g, '/'); // Normalize path separators
        downloadPath = `${customPath}/${filename}`;
        console.log('Background: Using custom path:', downloadPath);
      } else {
        console.log('Background: Using default Downloads folder');
      }
      
      // Start download
      chrome.downloads.download({
        url: dataUrl,
        filename: downloadPath,
        saveAs: false,
        conflictAction: 'uniquify'
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('Background: Download failed:', chrome.runtime.lastError);
          
          // Fallback: try just filename (Downloads folder)
          chrome.downloads.download({
            url: dataUrl,
            filename: filename,
            saveAs: false,
            conflictAction: 'uniquify'
          }, (fallbackDownloadId) => {
            if (chrome.runtime.lastError) {
              console.error('Background: Fallback download also failed:', chrome.runtime.lastError);
              notifyContentScript(tabId, filename, false);
            } else {
              console.log('Background: Fallback download succeeded:', fallbackDownloadId);
              notifyContentScript(tabId, filename, true);
            }
          });
        } else {
          console.log('Background: PDF saved successfully:', downloadId);
          notifyContentScript(tabId, filename, true);
        }
      });
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
  console.log('THE QUICKNESS extension installed');
});
