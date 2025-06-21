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
    
    // Download to THE QUICKNESS folder (auto-creates if doesn't exist)
    chrome.downloads.download({
      url: dataUrl,
      filename: `THE QUICKNESS/${filename}`,
      saveAs: false  // Don't prompt user - auto-save
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('Download failed:', chrome.runtime.lastError);
      } else {
        console.log('PDF saved to Downloads/THE QUICKNESS/');
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
