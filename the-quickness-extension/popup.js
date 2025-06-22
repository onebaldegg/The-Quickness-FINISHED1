/* global chrome */
// THE QUICKNESS - Popup Script for Folder Selection

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup loaded');
  
  // Load and display current save location
  await loadSaveLocation();
  
  // Setup folder selection button and input
  const chooseFolderBtn = document.getElementById('choose-folder-btn');
  const folderInput = document.getElementById('folder-input');
  
  chooseFolderBtn.addEventListener('click', () => {
    // Trigger the hidden file input with webkitdirectory
    folderInput.click();
  });
  
  folderInput.addEventListener('change', handleFolderSelection);
});

async function loadSaveLocation() {
  try {
    const result = await chrome.storage.local.get(['customSavePath']);
    const saveLocationElement = document.getElementById('save-location');
    
    if (result.customSavePath) {
      saveLocationElement.textContent = result.customSavePath;
      console.log('Loaded custom save path:', result.customSavePath);
    } else {
      saveLocationElement.textContent = 'DOWNLOADS folder';
      console.log('Using default Downloads folder');
    }
  } catch (error) {
    console.error('Error loading save location:', error);
    document.getElementById('save-location').textContent = 'DOWNLOADS folder';
  }
}

async function handleFolderSelection(event) {
  try {
    console.log('Processing folder selection from visual picker');
    
    const files = event.target.files;
    if (files.length === 0) {
      console.log('No folder selected');
      return;
    }
    
    // Get the path from the first file in the selected directory
    const firstFile = files[0];
    let folderPath = firstFile.webkitRelativePath;
    
    // Extract just the folder path (remove the filename)
    const pathParts = folderPath.split('/');
    pathParts.pop(); // Remove the filename
    folderPath = pathParts.join('/');
    
    // For Windows, we need to construct the full path
    // The webkitRelativePath only gives us relative path, so we'll use a smart approach
    if (folderPath) {
      console.log('Raw folder path from picker:', folderPath);
      
      // Store the selected path
      await chrome.storage.local.set({ customSavePath: folderPath });
      
      // Update the display
      document.getElementById('save-location').textContent = folderPath;
      
      console.log('Visual folder selection complete:', folderPath);
      
      // Show success feedback
      const button = document.getElementById('choose-folder-btn');
      const originalText = button.textContent;
      button.textContent = '✅ Folder Set!';
      button.style.background = '#10b981';
      
      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '#007cff';
      }, 2000);
      
    } else {
      console.log('Could not determine folder path');
      alert('Could not determine folder path. Please try again.');
    }
    
  } catch (error) {
    console.error('Error processing folder selection:', error);
    alert('Could not set folder path. Please try again.');
  }
}