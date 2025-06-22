/* global chrome */
// THE QUICKNESS - Popup Script for Folder Selection

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup loaded');
  
  // Load and display current save location
  await loadSaveLocation();
  
  // Setup folder selection button
  const chooseFolderBtn = document.getElementById('choose-folder-btn');
  const resetLink = document.getElementById('reset-folder');
  
  chooseFolderBtn.addEventListener('click', handleFolderSelection);
  
  resetLink.addEventListener('click', async () => {
    await chrome.storage.local.remove(['customSavePath', 'directoryHandle']);
    document.getElementById('save-location').textContent = 'DOWNLOADS folder';
    resetLink.style.display = 'none';
    console.log('Reset to default Downloads folder');
  });
});

async function loadSaveLocation() {
  try {
    const result = await chrome.storage.local.get(['customSavePath']);
    const saveLocationElement = document.getElementById('save-location');
    const resetLink = document.getElementById('reset-folder');
    
    if (result.customSavePath) {
      saveLocationElement.textContent = result.customSavePath;
      resetLink.style.display = 'block'; // Show reset link
      console.log('Loaded custom save path:', result.customSavePath);
    } else {
      saveLocationElement.textContent = 'DOWNLOADS folder';
      resetLink.style.display = 'none'; // Hide reset link
      console.log('Using default Downloads folder');
    }
  } catch (error) {
    console.error('Error loading save location:', error);
    document.getElementById('save-location').textContent = 'DOWNLOADS folder';
    document.getElementById('reset-folder').style.display = 'none';
  }
}

async function handleFolderSelection() {
  try {
    console.log('Popup: Starting folder selection process...');
    
    // Get current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      alert('No active tab found. Please open a webpage first.');
      return;
    }
    
    // Show loading state
    const button = document.getElementById('choose-folder-btn');
    const originalText = button.textContent;
    button.textContent = '⏳ Opening...';
    button.disabled = true;
    
    try {
      // Inject the folder picker content script
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['folder-picker.js']
      });
      
      console.log('Popup: Content script injected, requesting folder selection...');
      
      // Send message to content script to show folder picker
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'selectFolder'
      });
      
      if (response.success) {
        console.log('Popup: Folder selected successfully:', response.folderPath);
        
        // Store the folder path
        await chrome.storage.local.set({ 
          customSavePath: response.folderPath,
          selectedTabId: tab.id // Store tab ID for later PDF saving
        });
        
        // Update display
        document.getElementById('save-location').textContent = response.folderPath;
        document.getElementById('reset-folder').style.display = 'block';
        
        // Show success feedback
        button.textContent = '✅ Folder Set!';
        button.style.background = '#10b981';
        
        setTimeout(() => {
          button.textContent = originalText;
          button.style.background = '#007cff';
          button.disabled = false;
        }, 2000);
        
      } else {
        console.error('Popup: Folder selection failed:', response.error);
        alert('Folder selection failed: ' + response.error);
        
        // Reset button
        button.textContent = originalText;
        button.disabled = false;
      }
      
    } catch (error) {
      console.error('Popup: Error with content script:', error);
      alert('Could not access the page. Please try on a regular webpage (not chrome:// or extension pages).');
      
      // Reset button
      button.textContent = originalText;
      button.disabled = false;
    }
    
  } catch (error) {
    console.error('Popup: Error in folder selection:', error);
    alert('Folder selection failed. Please try again.');
  }
}