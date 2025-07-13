// Logo data using new THE QUICKNESS logo with lazy caching
const LOGO_URL = 'https://i.imgur.com/kA9ixy8.png';

// Cache for logo base64 data - only load when needed
let logoCache = null;

// Function to convert image to base64 with caching (lazy loading)
async function loadLogoAsBase64() {
  // Return cached version if available
  if (logoCache) {
    console.log('Using cached logo data');
    return logoCache;
  }
  
  try {
    console.log('Loading logo for PDF generation...');
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

// Set up logo references
window.LOGO_BASE64 = LOGO_URL; // For HTML usage (fallback to URL)
window.loadLogoAsBase64 = loadLogoAsBase64; // For PDF usage

// NO automatic preloading - logo will be loaded only when needed for PDF generation
