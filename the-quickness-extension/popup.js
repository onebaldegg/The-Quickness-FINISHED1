/* global chrome */
// THE QUICKNESS - Popup Script (Text Input Method)

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup loaded');
  
  // Load and display current save location
  await loadSaveLocation();
  
  // Setup folder selection button
  const chooseFolderBtn = document.getElementById('choose-folder-btn');
  const resetLink = document.getElementById('reset-folder');
  
  chooseFolderBtn.addEventListener('click', handleFolderSelection);
  
  resetLink.addEventListener('click', async () => {
    await chrome.storage.local.remove(['customSavePath']);
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
      resetLink.style.display = 'block';
      console.log('Loaded custom save path:', result.customSavePath);
    } else {
      saveLocationElement.textContent = 'DOWNLOADS folder';
      resetLink.style.display = 'none';
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
    console.log('Opening folder path input dialog');
    
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
      document.getElementById('reset-folder').style.display = 'block';
      console.log('Custom path set:', trimmedPath);
    } else {
      // User wants to use default (empty input)
      await chrome.storage.local.remove(['customSavePath']);
      document.getElementById('save-location').textContent = 'DOWNLOADS folder';
      document.getElementById('reset-folder').style.display = 'none';
      console.log('Reset to default Downloads folder');
    }
    
  } catch (error) {
    console.error('Error setting folder path:', error);
    alert('Could not set folder path. Please try again.');
  }
}