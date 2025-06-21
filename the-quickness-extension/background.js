// THE QUICKNESS - Background Service Worker

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'downloadPDF') {
    downloadPDFToFolder(request.pdfData, request.filename);
  }
  return true;
});

function downloadPDFToFolder(pdfDataArray, filename) {
  try {
    // Convert array back to Uint8Array
    const uint8Array = new Uint8Array(pdfDataArray);
    
    // Convert to base64 data URL (works in service workers)
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);
    const dataUrl = `data:application/pdf;base64,${base64}`;
    
    // FIXED AUTO-SAVING: Force download to THE QUICKNESS folder without prompts
    chrome.downloads.download({
      url: dataUrl,
      filename: `THE QUICKNESS/${filename}`,
      saveAs: false,  // Critical: No user prompt
      conflictAction: 'uniquify'  // Auto-rename if file exists
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('Download failed:', chrome.runtime.lastError);
        
        // Enhanced fallback: Try different approaches
        const fallbackOptions = [
          // Try without folder path
          { filename: filename, saveAs: false },
          // Try with different folder syntax
          { filename: `Downloads/THE QUICKNESS/${filename}`, saveAs: false },
          // Last resort with user prompt
          { filename: `THE QUICKNESS/${filename}`, saveAs: true }
        ];
        
        let fallbackIndex = 0;
        function tryFallback() {
          if (fallbackIndex < fallbackOptions.length) {
            const options = { ...fallbackOptions[fallbackIndex], url: dataUrl };
            chrome.downloads.download(options, (fallbackDownloadId) => {
              if (chrome.runtime.lastError) {
                console.error(`Fallback ${fallbackIndex + 1} failed:`, chrome.runtime.lastError);
                fallbackIndex++;
                tryFallback();
              } else {
                console.log(`PDF saved via fallback ${fallbackIndex + 1}:`, fallbackDownloadId);
              }
            });
          } else {
            console.error('All download methods failed');
          }
        }
        
        tryFallback();
      } else {
        console.log('PDF successfully auto-saved to Downloads/THE QUICKNESS/:', downloadId);
        
        // Send success message back to content script
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: 'downloadSuccess',
              filename: filename
            }).catch(() => {
              // Ignore if content script not available
            });
          }
        });
      }
    });
  } catch (error) {
    console.error('Error saving PDF:', error);
  }
}

// Extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('THE QUICKNESS extension installed');
});
