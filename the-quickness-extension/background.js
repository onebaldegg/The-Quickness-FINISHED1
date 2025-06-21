// THE QUICKNESS - Background Service Worker

chrome.commands.onCommand.addListener(async (command) => {
  console.log('Command received:', command);
  
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab || tab.url.startsWith('chrome://')) {
    return;
  }
  
  let functionName = '';
  switch (command) {
    case 'screenshot-region':
      functionName = 'startScreenshotMode';
      break;
    case 'capture-hover':
      functionName = 'startHoverMode';
      break;
    case 'quick-note':
      functionName = 'startQuickNoteMode';
      break;
  }
  
  if (functionName) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (fname) => {
          if (window.theQuicknessExtension) {
            window.theQuicknessExtension[fname]();
          }
        },
        args: [functionName]
      });
    } catch (error) {
      console.error('Error:', error);
    }
  }
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('THE QUICKNESS extension installed');
});
