// Logo data using imgur URL
const LOGO_URL = 'https://i.imgur.com/uVeuvVC.png';

// Function to convert image to base64
async function loadLogoAsBase64() {
  try {
    const response = await fetch(LOGO_URL);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Failed to load logo as base64:', error);
    return null;
  }
}

// Set up logo references
window.LOGO_BASE64 = LOGO_URL; // For HTML usage
window.loadLogoAsBase64 = loadLogoAsBase64; // For PDF usage
