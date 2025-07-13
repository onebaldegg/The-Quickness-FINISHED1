// Logo data using new THE QUICKNESS logo with caching
const LOGO_URL = 'https://i.imgur.com/kA9ixy8.png';

// Cache for logo base64 data
let logoCache = null;

// Function to convert image to base64 with caching
async function loadLogoAsBase64() {
  // Return cached version if available
  if (logoCache) {
    console.log('Using cached logo data');
    return logoCache;
  }
  
  try {
    console.log('Fetching logo from external URL...');
    const response = await fetch(LOGO_URL, {
      cache: 'force-cache', // Use browser cache when possible
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch logo: ${response.status}`);
    }
    
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        logoCache = reader.result; // Cache the result
        console.log('Logo cached successfully');
        resolve(reader.result);
      };
      reader.onerror = () => {
        console.warn('Failed to convert logo to base64');
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Failed to load logo as base64:', error);
    return null;
  }
}

// Preload logo on script initialization
async function preloadLogo() {
  try {
    await loadLogoAsBase64();
    console.log('Logo preloaded successfully');
  } catch (error) {
    console.warn('Logo preload failed:', error);
  }
}

// Set up logo references
window.LOGO_BASE64 = LOGO_URL; // For HTML usage (fallback to URL)
window.loadLogoAsBase64 = loadLogoAsBase64; // For PDF usage

// Preload logo when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', preloadLogo);
} else {
  preloadLogo();
}
