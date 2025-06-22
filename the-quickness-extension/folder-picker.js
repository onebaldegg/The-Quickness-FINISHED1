/* global chrome */
// THE QUICKNESS - Folder Selection Content Script

(function() {
  'use strict';
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'selectFolder') {
      handleFolderSelection(sendResponse);
      return true; // Keep message channel open for async response
    }
  });
  
  async function handleFolderSelection(sendResponse) {
    try {
      console.log('Content Script: Starting folder selection...');
      
      // Check if File System Access API is available
      if (!('showDirectoryPicker' in window)) {
        sendResponse({
          success: false,
          error: 'File System Access API not supported'
        });
        return;
      }
      
      // Open native OS folder picker
      const directoryHandle = await window.showDirectoryPicker({
        mode: 'readwrite' // Need write access to save PDFs
      });
      
      console.log('Content Script: Directory selected:', directoryHandle.name);
      
      // Store the directory handle globally for later use
      window.theQuicknessDirectoryHandle = directoryHandle;
      
      // Send success response with folder info
      sendResponse({
        success: true,
        folderName: directoryHandle.name,
        folderPath: directoryHandle.name // For now, just use name (will show in popup)
      });
      
    } catch (error) {
      console.error('Content Script: Folder selection failed:', error);
      
      let errorMessage = 'Folder selection failed';
      if (error.name === 'AbortError') {
        errorMessage = 'User cancelled folder selection';
      }
      
      sendResponse({
        success: false,
        error: errorMessage
      });
    }
  }
  
  // Make directory handle available for PDF saving
  window.getTheQuicknessDirectory = function() {
    return window.theQuicknessDirectoryHandle;
  };
  
  console.log('THE QUICKNESS: Folder selection content script loaded');
  
})();