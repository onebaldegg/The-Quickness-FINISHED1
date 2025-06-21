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
    // Convert array back to Uint8Array then to blob
    const uint8Array = new Uint8Array(pdfDataArray);
    const blob = new Blob([uint8Array], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    // Download to THE QUICKNESS folder (auto-creates if doesn't exist)
    chrome.downloads.download({
      url: url,
      filename: `THE QUICKNESS/${filename}`,
      saveAs: false  // Don't prompt user - auto-save
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('Download failed:', chrome.runtime.lastError);
      } else {
        console.log('PDF saved to Downloads/THE QUICKNESS/');
      }
      URL.revokeObjectURL(url);
    });
  } catch (error) {
    console.error('Error saving PDF:', error);
  }
}

// Extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('THE QUICKNESS extension installed');
});
