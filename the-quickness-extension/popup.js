/* global chrome */
// THE QUICKNESS - Popup Script for Folder Selection

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup loaded');
  
  // Load and display current save location
  await loadSaveLocation();
  
  // Setup folder selection button
  const chooseFolderBtn = document.getElementById('choose-folder-btn');
  chooseFolderBtn.addEventListener('click', handleFolderSelection);
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

async function handleFolderSelection() {
  try {
    console.log('Opening folder selection dialog');
    
    // Use a simple prompt for path input (more reliable across Chrome versions)
    const currentPath = document.getElementById('save-location').textContent;
    const defaultText = currentPath === 'DOWNLOADS folder' ? '' : currentPath;
    
    const customPath = prompt(
      'Enter your preferred download folder path:\n\n' +
      'Examples:\n' +
      '• C:\\Users\\YourName\\Downloads\\The Quickness Images\n' +
      '• /Users/YourName/Downloads/The Quickness Images\n' +
      '• Leave empty to use default Downloads folder',
      defaultText
    );
    
    if (customPath === null) {
      // User cancelled
      return;
    }
    
    if (customPath && customPath.trim()) {
      // User entered a custom path
      const trimmedPath = customPath.trim();
      await chrome.storage.local.set({ customSavePath: trimmedPath });
      document.getElementById('save-location').textContent = trimmedPath;
      console.log('Custom path set:', trimmedPath);
    } else {
      // User wants to use default (empty input)
      await chrome.storage.local.remove(['customSavePath']);
      document.getElementById('save-location').textContent = 'DOWNLOADS folder';
      console.log('Reset to default Downloads folder');
    }
    
  } catch (error) {
    console.error('Error selecting folder:', error);
    alert('Could not set folder path. Please try again.');
  }
}