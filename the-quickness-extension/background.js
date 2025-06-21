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
    
    // Convert to base64 data URL (works in service workers)
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);
    const dataUrl = `data:application/pdf;base64,${base64}`;
    
    console.log('Background: PDF data prepared, starting download');
    
    // FIXED: Enhanced auto-saving with better error handling
    chrome.downloads.download({
      url: dataUrl,
      filename: `THE QUICKNESS/${filename}`,
      saveAs: false,  // Critical: No user prompt
      conflictAction: 'uniquify'  // Auto-rename if file exists
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('Background: Primary download failed:', chrome.runtime.lastError);
        
        // Try multiple fallback approaches
        const fallbackMethods = [
          // Method 1: Try without folder path
          () => chrome.downloads.download({
            url: dataUrl,
            filename: filename,
            saveAs: false,
            conflictAction: 'uniquify'
          }),
          
          // Method 2: Try with different folder syntax  
          () => chrome.downloads.download({
            url: dataUrl,
            filename: `Downloads/THE QUICKNESS/${filename}`,
            saveAs: false,
            conflictAction: 'uniquify'
          }),
          
          // Method 3: Last resort - allow user prompt
          () => chrome.downloads.download({
            url: dataUrl,
            filename: `THE QUICKNESS/${filename}`,
            saveAs: true,
            conflictAction: 'uniquify'
          })
        ];
        
        let methodIndex = 0;
        function tryNextMethod() {
          if (methodIndex < fallbackMethods.length) {
            console.log(`Background: Trying fallback method ${methodIndex + 1}`);
            fallbackMethods[methodIndex]((fallbackDownloadId) => {
              if (chrome.runtime.lastError) {
                console.error(`Background: Fallback ${methodIndex + 1} failed:`, chrome.runtime.lastError);
                methodIndex++;
                tryNextMethod();
              } else {
                console.log(`Background: Success with fallback method ${methodIndex + 1}:`, fallbackDownloadId);
                notifyContentScript(tabId, filename, true);
              }
            });
          } else {
            console.error('Background: All download methods failed');
            notifyContentScript(tabId, filename, false);
          }
        }
        
        tryNextMethod();
        
      } else {
        console.log('Background: PDF successfully auto-saved to THE QUICKNESS folder:', downloadId);
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
  console.log('THE QUICKNESS extension installed');
});
