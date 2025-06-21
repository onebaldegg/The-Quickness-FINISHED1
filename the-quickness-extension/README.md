# THE QUICKNESS - Chrome Extension

A powerful Chrome extension for quick capture of screenshots, images, text, and notes with local PDF saving capability.

## Features

- **Screenshot Region Capture** (Ctrl+Alt+D): Click and drag to select any area of the page for screenshot
- **Hover Capture** (Ctrl+Alt+H): Hover over images or text elements to capture them with preserved formatting
- **Quick Notes** (Ctrl+Alt+N): Create quick text notes associated with the current page
- **Local PDF Saving**: All captures are automatically saved as PDFs to your Downloads/THE QUICKNESS folder
- **Preserved Links**: All captured content maintains clickable links in the generated PDFs
- **Formatted Text**: Text captures preserve styling and formatting

## Installation

### Method 1: Load Unpacked Extension (Developer Mode)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" by toggling the switch in the top right corner
3. Click "Load unpacked" button
4. Select the `the-quickness-extension` folder containing this extension
5. The extension should now appear in your extensions list and be ready to use

### Method 2: Chrome Web Store (Future)
*This extension will be submitted to the Chrome Web Store in the future*

## Usage

### Screenshot Region Capture
1. Press `Ctrl+Alt+D` on any webpage
2. Click and drag to select the area you want to capture
3. Add a note in the popup that appears
4. Click "Save PDF" to save the capture locally

### Hover Capture
1. Press `Ctrl+Alt+H` on any webpage
2. Hover over images or text elements you want to capture
3. Click on the highlighted element to capture it
4. Add a note in the popup that appears
5. Click "Save PDF" to save the capture locally

### Quick Notes
1. Press `Ctrl+Alt+N` on any webpage
2. Type your note in the popup that appears
3. Click "Save PDF" to save the note with the current page URL

## File Organization

All captures are saved as PDFs in your browser's Downloads folder under a "THE QUICKNESS" subfolder. Files are named using the format:
`YYYY-MM-DDTHH-MM-SS_first-two-words-of-note.pdf`

## PDF Layout

Each PDF contains:
1. **Header**: "THE QUICKNESS Capture"
2. **Source URL**: Clickable link to the original webpage
3. **Captured Content**: Screenshot, image, or formatted text
4. **Links Section**: Any clickable links found in captured text
5. **Notes**: Your personal notes

## Keyboard Shortcuts

- `Ctrl+Alt+D` - Screenshot region selection
- `Ctrl+Alt+H` - Hover capture mode
- `Ctrl+Alt+N` - Quick note
- `Escape` - Cancel current operation
- `Ctrl+Enter` - Save (when in note input)

## Permissions

This extension requires the following permissions:
- **activeTab**: To interact with the current webpage
- **scripting**: To inject content scripts for capture functionality
- **downloads**: To save PDFs to your local Downloads folder
- **storage**: To store extension settings
- **tabs**: To access tab information for URLs and titles
- **host_permissions**: To work on all websites

## Technical Details

- **Manifest Version**: 3 (Latest Chrome extension standard)
- **Screenshot Technology**: HTML2Canvas for high-quality captures
- **PDF Generation**: jsPDF for creating formatted PDFs
- **File Saving**: Chrome Downloads API for local file management

## Troubleshooting

### Extension Not Working
- Ensure Developer Mode is enabled in Chrome Extensions
- Check that the extension is enabled in your extensions list
- Refresh the webpage and try again

### Captures Not Saving
- Check your Downloads folder for a "THE QUICKNESS" subfolder
- Ensure Chrome has permission to download files
- Check Chrome's download settings

### Screenshots Appear Blank
- Some websites may block screenshot capture due to security policies
- Try refreshing the page and capturing again
- Check browser console for any error messages

### Keyboard Shortcuts Not Working
- Ensure no other extension is using the same shortcuts
- Try clicking on the webpage first to ensure it has focus
- Check Chrome's keyboard shortcuts settings

## Privacy

THE QUICKNESS operates entirely locally:
- No data is sent to external servers
- All captures are saved locally on your computer
- No personal information is collected or transmitted
- URLs and content are only processed locally for PDF generation

## Version History

### v1.0
- Initial release
- Screenshot region capture
- Hover capture for images and text
- Quick notes functionality
- Local PDF saving
- Keyboard shortcuts
- Formatted PDF output with clickable links

## Support

For issues, bugs, or feature requests, please refer to the extension's support documentation or contact the developer.

## License

This extension is provided as-is for personal use. Please refer to the license file for detailed terms and conditions.