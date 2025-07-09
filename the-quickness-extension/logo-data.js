// Logo data using new THE QUICKNESS logo
const LOGO_URL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMjAwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjQkY3N0Y2Ii8+CjxwYXRoIGQ9Ik0xMCAyMEg0MFYzMEgxMFYyMFoiIGZpbGw9IiNGRkQ3MDAiLz4KPHN2ZyB4PSI1MCIgeT0iMTAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0yMCAyTDMwIDEwTDI1IDE4TDE1IDE4TDIwIDJaIiBmaWxsPSIjRkY2QjM1Ii8+CjxwYXRoIGQ9Ik0yMCAyTDMwIDEwTDI1IDE4TDE1IDE4TDIwIDJaIiBmaWxsPSIjRkY2QjM1Ii8+CjwvZz4KPHRleHQgeD0iMTAwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iI0ZGRDcwMCI+VEhFPC90ZXh0Pgo8dGV4dCB4PSIxMDAiIHk9IjcwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjRkY2QjM1Ij5RVUlDS05FU1M8L3RleHQ+Cjwvc3ZnPgo=';

// Function to convert image to base64
async function loadLogoAsBase64() {
  try {
    return LOGO_URL;
  } catch (error) {
    console.warn('Failed to load logo as base64:', error);
    return null;
  }
}

// Set up logo references
window.LOGO_BASE64 = LOGO_URL; // For HTML usage
window.loadLogoAsBase64 = loadLogoAsBase64; // For PDF usage
