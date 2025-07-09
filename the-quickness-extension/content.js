/* global chrome */
// THE QUICKNESS - Icon Click Screenshot with Notes

(function() {
  'use strict';
  
  if (window.theQuicknessExtension) {
    return;
  }

  class TheQuicknessExtension {
    constructor() {
      this.capturedData = null;
      this.modal = null;
      this.librariesLoaded = false;
      
      this.init();
    }

    init() {
      console.log('THE QUICKNESS - Icon Click Screenshot Mode');
      this.waitForLibraries();
      this.setupMessageListener();
    }
    
    setupMessageListener() {
      // Listen for messages from background script
      try {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
          if (request.action === 'takeScreenshot') {
            this.takeScreenshot();
          } else if (request.action === 'showNoteModal') {
            // New approach: receive screenshot data directly from background script
            this.capturedData = {
              screenshot: request.screenshot,
              url: request.url,
              links: this.extractViewportLinks()
            };
            this.hideLoadingIndicator();
            this.showNoteModal();
          } else if (request.action === 'downloadSuccess') {
            this.showSuccessNotification(`PDF saved to Downloads: ${request.filename}`);
          } else if (request.action === 'downloadFailed') {
            this.showFailureNotification(`PDF save failed: ${request.filename}`);
          }
        });
      } catch (error) {
        console.log('Background script messaging unavailable:', error);
      }
    }

    async waitForLibraries() {
      let attempts = 0;
      console.log('Waiting for libraries to load...');
      
      while ((!window.jspdf || !window.html2canvas) && attempts < 100) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        
        if (attempts % 10 === 0) {
          console.log(`Library loading attempt ${attempts}/100...`);
          console.log('jsPDF available:', !!window.jspdf);
          console.log('html2canvas available:', !!window.html2canvas);
        }
      }
      
      if (window.jspdf && window.html2canvas) {
        this.librariesLoaded = true;
        console.log('✅ Libraries loaded successfully');
        console.log('jsPDF version:', window.jspdf?.version || 'unknown');
      } else {
        console.error('❌ Libraries failed to load after 10 seconds');
        console.log('jsPDF available:', !!window.jspdf);
        console.log('html2canvas available:', !!window.html2canvas);
      }
    }

    async takeScreenshot() {
      if (!this.librariesLoaded) {
        console.error('Libraries not loaded yet');
        return;
      }

      console.log('Taking viewport screenshot...');
      
      // Show loading indicator
      this.showLoadingIndicator();

      try {
        // Wait for fonts to load for better quality
        if (document.fonts) {
          await document.fonts.ready;
        }

        // Clean approach: Remove all cross-origin content before capture
        const canvas = await window.html2canvas(document.body, {
          height: window.innerHeight,
          width: window.innerWidth,
          x: 0,
          y: window.scrollY,
          scale: window.devicePixelRatio || 1, // High DPI for better quality
          useCORS: true,
          allowTaint: false, // Must be false to allow export
          foreignObjectRendering: false, // Disable to avoid tainted canvas
          logging: false,
          backgroundColor: '#ffffff',
          removeContainer: true,
          imageTimeout: 5000,
          letterRendering: true, // Better text rendering
          ignoreElements: (element) => {
            // Ignore extension elements and problematic content
            return element.classList.contains('tq-modal-backdrop') || 
                   element.classList.contains('tq-note-modal') ||
                   element.classList.contains('tq-success-notification') ||
                   element.classList.contains('tq-failure-notification') ||
                   element.classList.contains('tq-loading-indicator') ||
                   element.tagName === 'IFRAME' ||
                   element.tagName === 'VIDEO' ||
                   element.tagName === 'EMBED' ||
                   element.tagName === 'OBJECT';
          },
          onclone: (clonedDoc) => {
            console.log('Cleaning cloned document for screenshot...');
            
            // Ensure fonts are loaded in cloned document
            if (clonedDoc.fonts) {
              clonedDoc.fonts.load('400 16px Arial');
              clonedDoc.fonts.load('700 16px Arial');
            }
            
            // Remove all cross-origin images to prevent tainted canvas
            clonedDoc.querySelectorAll('img').forEach(img => {
              if (img.src && !img.src.startsWith('data:') && !img.src.startsWith('blob:')) {
                // Check if image is same-origin
                try {
                  const imgUrl = new URL(img.src);
                  const currentUrl = new URL(window.location.href);
                  
                  if (imgUrl.origin !== currentUrl.origin) {
                    // Cross-origin image - replace with styled placeholder
                    const placeholder = clonedDoc.createElement('div');
                    placeholder.style.width = img.style.width || img.offsetWidth + 'px';
                    placeholder.style.height = img.style.height || img.offsetHeight + 'px';
                    placeholder.style.backgroundColor = '#f8f9fa';
                    placeholder.style.border = '2px dashed #dee2e6';
                    placeholder.style.display = 'flex';
                    placeholder.style.alignItems = 'center';
                    placeholder.style.justifyContent = 'center';
                    placeholder.style.fontSize = '12px';
                    placeholder.style.color = '#6c757d';
                    placeholder.style.fontFamily = 'Arial, sans-serif';
                    placeholder.style.fontWeight = '500';
                    placeholder.textContent = '🖼️ External Image';
                    placeholder.style.borderRadius = getComputedStyle(img).borderRadius;
                    placeholder.style.minWidth = '60px';
                    placeholder.style.minHeight = '40px';
                    
                    if (img.parentNode) {
                      img.parentNode.replaceChild(placeholder, img);
                    }
                  }
                } catch (e) {
                  // If URL parsing fails, remove the image
                  if (img.parentNode) {
                    img.parentNode.removeChild(img);
                  }
                }
              }
            });
            
            // Remove problematic scripts and iframes
            clonedDoc.querySelectorAll('script, iframe, embed, object').forEach(el => {
              el.remove();
            });
            
            // Remove any elements with background images from other origins
            clonedDoc.querySelectorAll('*').forEach(el => {
              const bgImage = getComputedStyle(el).backgroundImage;
              if (bgImage && bgImage !== 'none' && bgImage.includes('url(')) {
                try {
                  const urlMatch = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
                  if (urlMatch) {
                    const bgUrl = new URL(urlMatch[1], window.location.href);
                    const currentUrl = new URL(window.location.href);
                    
                    if (bgUrl.origin !== currentUrl.origin) {
                      el.style.backgroundImage = 'none';
                      el.style.backgroundColor = '#f8f9fa';
                    }
                  }
                } catch (e) {
                  el.style.backgroundImage = 'none';
                }
              }
            });
            
            // Optimize text rendering
            clonedDoc.body.style.webkitFontSmoothing = 'antialiased';
            clonedDoc.body.style.mozOsxFontSmoothing = 'grayscale';
          }
        });

        // Hide loading indicator
        this.hideLoadingIndicator();

        // Convert to high-quality data URL
        const screenshotDataUrl = canvas.toDataURL('image/png', 1.0);
        console.log('Screenshot captured successfully, data URL length:', screenshotDataUrl.length);

        // Extract visible links for PDF overlay
        const links = this.extractViewportLinks();

        this.capturedData = {
          type: 'viewport_screenshot',
          url: window.location.href,
          title: document.title,
          screenshot: screenshotDataUrl,
          links: links  // Add links back for PDF overlay
        };

        console.log('Screenshot data stored, showing note modal');
        this.showNoteModal();

      } catch (error) {
        this.hideLoadingIndicator();
        console.error('Screenshot failed:', error);
        alert('Screenshot capture failed due to browser security restrictions. This can happen on websites with external content.');
      }
    }

    showLoadingIndicator() {
      // Remove any existing indicator
      this.hideLoadingIndicator();
      
      const indicator = document.createElement('div');
      indicator.className = 'tq-loading-indicator';
      indicator.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(184, 133, 216, 0.95);
        color: white;
        padding: 20px 30px;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 16px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 12px;
        border: 2px solid #333;
      `;
      
      indicator.innerHTML = `
        <div style="
          width: 20px;
          height: 20px;
          border: 3px solid transparent;
          border-top: 3px solid white;
          border-radius: 50%;
          animation: tq-spin 1s linear infinite;
        "></div>
        <span>Taking screenshot...</span>
      `;
      
      // Add CSS animation
      if (!document.querySelector('#tq-spinner-style')) {
        const style = document.createElement('style');
        style.id = 'tq-spinner-style';
        style.textContent = `
          @keyframes tq-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `;
        document.head.appendChild(style);
      }
      
      document.body.appendChild(indicator);
    }

    hideLoadingIndicator() {
      const existing = document.querySelector('.tq-loading-indicator');
      if (existing) {
        existing.remove();
      }
    }

    extractViewportLinks() {
      const links = [];
      const viewportHeight = window.innerHeight;
      const scrollTop = window.scrollY;
      
      // Get all links that are visible in the current viewport
      document.querySelectorAll('a[href]').forEach(link => {
        const rect = link.getBoundingClientRect();
        
        // Check if link is visible in viewport
        if (rect.top >= 0 && rect.top <= viewportHeight && 
            rect.left >= 0 && rect.left <= window.innerWidth &&
            rect.width > 0 && rect.height > 0) {
          
          const linkData = {
            text: link.textContent.trim(),
            href: link.href,
            x: Math.round(rect.left),
            y: Math.round(rect.top),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          };
          
          if (linkData.text && linkData.href && linkData.text.length > 0) {
            links.push(linkData);
          }
        }
      });
      
      console.log(`Extracted ${links.length} links from viewport for PDF overlay`);
      return links;
    }

    showNoteModal() {
      const backdrop = document.createElement('div');
      backdrop.className = 'tq-modal-backdrop';
      backdrop.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.5); z-index: 2147483647;
      `;
      
      this.modal = document.createElement('div');
      this.modal.className = 'tq-note-modal';
      this.modal.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: #BF77F6; border-radius: 8px; padding: 17px; 
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        z-index: 2147483647; min-width: 350px; max-width: 490px;
        border: 2px solid #333;
      `;
      
      // Create logo using the actual logo image - with white background to neutralize logo's purple
      const logoHtml = `
        <div style="background: white; padding: 5px; border-radius: 6px; display: inline-block;">
          <img src="${window.LOGO_BASE64 || ''}" alt="THE QUICKNESS" style="height: 60px; width: auto; border-radius: 6px; display: block;">
        </div>
      `;
      
      this.modal.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; background: transparent;">
          ${logoHtml}
          <div style="display: flex; gap: 8px;">
            <button id="tq-cancel-btn" style="padding: 8px 17px; border: none; border-radius: 4px; background: #6c757d; color: white; cursor: pointer; font-weight: 500; font-size: 12px;">Cancel</button>
            <button id="tq-save-btn" style="padding: 8px 17px; border: none; border-radius: 4px; background: #007cff; color: white; cursor: pointer; font-weight: 500; font-size: 12px;">Save PDF</button>
          </div>
        </div>
        
        <div style="background: white; border-radius: 6px; padding: 11px; margin-bottom: 11px;">
          <div style="font-size: 10px; color: #666; word-break: break-all; margin-bottom: 8px;">
            <strong>Source:</strong> ${this.capturedData.url}
          </div>
          
          <div style="margin-bottom: 11px;">
            <div style="font-weight: 500; margin-bottom: 6px; color: #333; font-size: 12px;">Screenshot Preview:</div>
            <div id="screenshot-container" style="min-height: 140px; border: 1px solid #ddd; border-radius: 4px; background: #f8f9fa; display: flex; align-items: center; justify-content: center;">
              <img id="screenshot-img" style="max-width: 100%; max-height: 140px; border-radius: 4px; display: none;" />
              <div id="screenshot-loading" style="color: #666; font-size: 12px;">Loading screenshot...</div>
            </div>
          </div>
          
          <div>
            <label style="display: block; font-weight: 500; margin-bottom: 4px; color: #333; font-size: 12px;">Your Note:</label>
            <textarea id="tq-note-input" style="width: 100%; min-height: 70px; padding: 8px; border: 2px solid #e0e0e0; border-radius: 4px; resize: vertical; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px;" placeholder="Add your note here..." maxlength="300"></textarea>
          </div>
        </div>
      `;
      
      document.body.appendChild(backdrop);
      document.body.appendChild(this.modal);
      
      // Load screenshot after modal is added to DOM
      this.loadScreenshotInModal();
      
      this.bindModalEvents(backdrop);
      
      const textarea = this.modal.querySelector('#tq-note-input');
      setTimeout(() => textarea.focus(), 100);
    }

    loadScreenshotInModal() {
      const img = this.modal.querySelector('#screenshot-img');
      const loading = this.modal.querySelector('#screenshot-loading');
      
      if (!this.capturedData.screenshot) {
        loading.textContent = 'No screenshot available';
        return;
      }
      
      console.log('Loading screenshot in modal, data URL length:', this.capturedData.screenshot.length);
      
      img.onload = () => {
        console.log('Screenshot loaded successfully in modal');
        img.style.display = 'block';
        loading.style.display = 'none';
      };
      
      img.onerror = () => {
        console.error('Screenshot failed to load in modal');
        loading.textContent = 'Screenshot failed to load';
        loading.style.color = '#dc3545';
      };
      
      // Set the screenshot source
      img.src = this.capturedData.screenshot;
    }

    bindModalEvents(backdrop) {
      const cancelBtn = this.modal.querySelector('#tq-cancel-btn');
      const saveBtn = this.modal.querySelector('#tq-save-btn');
      const textarea = this.modal.querySelector('#tq-note-input');
      
      cancelBtn.addEventListener('click', () => {
        this.closeModal();
      });
      
      saveBtn.addEventListener('click', () => {
        const note = textarea.value.trim();
        this.savePDF(note);
      });
      
      backdrop.addEventListener('click', () => {
        this.closeModal();
      });
      
      // ESC key to close
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.modal) {
          this.closeModal();
        }
      });
    }

    async savePDF(note) {
      console.log('Save PDF started with note:', note);
      
      if (!window.jspdf) {
        console.error('jsPDF library not loaded');
        alert('PDF library not loaded. Please refresh the page and try again.');
        return;
      }
      
      try {
        const data = this.capturedData;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        
        // Create filename with timestamp and first five words of note
        let noteWords = '';
        if (note && note.trim()) {
          const words = note.trim().split(/\s+/);
          console.log('Total words in note:', words.length, 'Words:', words);
          
          noteWords = words
            .slice(0, 5)  // First 5 words
            .join(' ')
            .replace(/[^a-zA-Z0-9\s]/g, '')  // Remove special characters
            .replace(/\s+/g, ' ')  // Normalize spaces
            .trim();
            
          console.log('Using 5 words for filename:', noteWords);
        }
        
        // Format: MMDDYY HHMM + first 5 words
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const year = String(now.getFullYear()).slice(-2);
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const timePrefix = `${month}${day}${year} ${hours}${minutes}`;
        
        // Ensure filename is valid and not empty
        let filename;
        if (noteWords && noteWords.length > 0) {
          filename = `${timePrefix} ${noteWords}.pdf`;
        } else {
          filename = `${timePrefix} screenshot.pdf`;
        }
        
        // Sanitize filename for cross-platform compatibility
        filename = filename.replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, ' ').trim();
        
        console.log('Creating landscape PDF with filename:', filename);
        
        const { jsPDF } = window.jspdf;
        // Create PDF in landscape mode
        const pdf = new jsPDF('landscape', 'mm', 'a4');
        
        // A4 landscape dimensions: 297mm x 210mm
        const pageWidth = 297;
        const pageHeight = 210;
        const margin = 15;
        
        // Logo top-left - Make it larger
        try {
          if (window.loadLogoAsBase64) {
            // Load the actual logo image as base64
            const logoBase64 = await window.loadLogoAsBase64();
            if (logoBase64) {
              pdf.addImage(logoBase64, 'PNG', margin, margin, 50, 20); // Increased size
            } else {
              // Fallback to text if logo loading failed
              pdf.setFontSize(18);
              pdf.setFont(undefined, 'bold');
              pdf.setTextColor(245, 158, 11); // Orange color similar to logo
              pdf.text('THE QUICKNESS', margin, margin + 15);
              pdf.setTextColor(0, 0, 0); // Reset to black
            }
          } else {
            // Fallback to text if logo function not available
            pdf.setFontSize(18);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(245, 158, 11); // Orange color similar to logo
            pdf.text('THE QUICKNESS', margin, margin + 15);
            pdf.setTextColor(0, 0, 0); // Reset to black
          }
        } catch (logoError) {
          console.warn('Could not add logo image, using text fallback:', logoError);
          // Fallback to text
          pdf.setFontSize(18);
          pdf.setFont(undefined, 'bold');
          pdf.setTextColor(245, 158, 11);
          pdf.text('THE QUICKNESS', margin, margin + 15);
          pdf.setTextColor(0, 0, 0);
        }
        
        // Source URL top-right with proper wrapping
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(0, 0, 255);
        const urlText = data.url;
        const maxUrlWidth = 120; // Leave space for logo
        const urlLines = pdf.splitTextToSize(urlText, maxUrlWidth);
        const urlStartY = margin + 5;
        const urlStartX = pageWidth - margin - maxUrlWidth;
        
        // Draw URL lines
        for (let i = 0; i < urlLines.length; i++) {
          pdf.textWithLink(urlLines[i], urlStartX, urlStartY + (i * 4), { url: data.url });
        }
        pdf.setTextColor(0, 0, 0);
        
        // Move screenshot and notes further down to make room for larger logo
        let yPos = margin + 35; // Increased from 20 to 35
        let screenshotX = 0;
        let screenshotY = 0;
        let screenshotWidth = 0;
        let screenshotHeight = 0;
        
        try {
          console.log('Adding screenshot to PDF...');
          
          if (!data.screenshot) {
            throw new Error('No screenshot data available');
          }
          
          // Create image element and load screenshot data
          const screenshotImg = new Image();
          
          await new Promise((resolve, reject) => {
            screenshotImg.onload = () => {
              try {
                console.log('Screenshot image loaded for PDF, dimensions:', screenshotImg.width, 'x', screenshotImg.height);
                
                // Calculate screenshot dimensions to maximize size while fitting on one page
                const availableWidth = pageWidth - (margin * 2);
                // Leave minimal space for notes (25mm should be enough for a few lines)
                const availableHeight = (pageHeight - yPos - margin - 25);
                
                const aspectRatio = screenshotImg.width / screenshotImg.height;
                let imgWidth = availableWidth;
                let imgHeight = imgWidth / aspectRatio;
                
                // If height is too much, scale down proportionally
                if (imgHeight > availableHeight) {
                  imgHeight = availableHeight;
                  imgWidth = imgHeight * aspectRatio;
                }
                
                // Center the screenshot horizontally on the page
                const imgX = (pageWidth - imgWidth) / 2;
                
                // Store screenshot coordinates for link overlay
                screenshotX = imgX;
                screenshotY = yPos;
                screenshotWidth = imgWidth;
                screenshotHeight = imgHeight;
                
                // Add the image to PDF
                pdf.addImage(data.screenshot, 'PNG', imgX, yPos, imgWidth, imgHeight);
                yPos += imgHeight + 10;
                console.log('Screenshot added to PDF successfully');
                resolve();
              } catch (error) {
                console.error('Error adding screenshot to PDF:', error);
                pdf.setFontSize(12);
                pdf.text('Screenshot could not be processed', margin, yPos);
                yPos += 15;
                resolve(); // Continue even if screenshot fails
              }
            };
            
            screenshotImg.onerror = (error) => {
              console.error('Error loading screenshot image for PDF:', error);
              pdf.setFontSize(12);
              pdf.text('Screenshot could not be loaded', margin, yPos);
              yPos += 15;
              resolve(); // Continue even if screenshot fails
            };
            
            // Set the screenshot source
            screenshotImg.src = data.screenshot;
          });
          
        } catch (error) {
          console.error('Screenshot processing failed:', error);
          pdf.setFontSize(12);
          pdf.text('Screenshot processing failed', margin, yPos);
          yPos += 15;
        }
        
        // Add clickable link overlays on screenshot
        if (data.links && data.links.length > 0 && screenshotWidth > 0) {
          console.log(`Adding ${data.links.length} clickable link overlays to PDF`);
          
          // Calculate scale factors between screenshot and viewport
          const scaleX = screenshotWidth / window.innerWidth;
          const scaleY = screenshotHeight / window.innerHeight;
          
          data.links.forEach(link => {
            try {
              // Convert viewport coordinates to PDF coordinates
              const linkX = screenshotX + (link.x * scaleX);
              const linkY = screenshotY + (link.y * scaleY);
              const linkWidth = link.width * scaleX;
              const linkHeight = link.height * scaleY;
              
              // Add invisible clickable area overlay
              pdf.link(linkX, linkY, linkWidth, linkHeight, { url: link.href });
              
              console.log(`Added clickable overlay for: ${link.text} at (${linkX.toFixed(1)}, ${linkY.toFixed(1)})`);
            } catch (error) {
              console.error('Error adding link overlay:', error);
            }
          });
        }
        
        // User notes below screenshot
        if (note) {
          pdf.setFontSize(10);
          pdf.setFont(undefined, 'bold');
          pdf.text('Notes:', margin, yPos);
          yPos += 8;
          
          pdf.setFont(undefined, 'normal');
          const noteLines = pdf.splitTextToSize(note, pageWidth - (margin * 2));
          pdf.text(noteLines, margin, yPos);
          yPos += noteLines.length * 4;
        }
        
        console.log('PDF generation complete, starting download');
        
        // Use background script for download
        try {
          const pdfData = pdf.output('arraybuffer');
          
          console.log('Sending PDF to background script for download');
          
          chrome.runtime.sendMessage({
            action: 'downloadPDF',
            pdfData: Array.from(new Uint8Array(pdfData)),
            filename: filename
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('Failed to send to background script:', chrome.runtime.lastError);
              this.fallbackDownload(pdf.output('blob'), filename);
            } else {
              console.log('PDF sent to background script successfully');
            }
          });
          
        } catch (downloadError) {
          console.error('Background script communication failed:', downloadError);
          this.fallbackDownload(pdf.output('blob'), filename);
        }
        
        // Close modal
        this.closeModal();
        
        // Create Chrome bookmark after successful PDF save
        this.createBookmark(filename, note, data.url);
        
      } catch (error) {
        console.error('PDF generation failed:', error);
        alert('PDF generation failed: ' + error.message);
      }
    }

    async createBookmark(filename, note, url) {
      try {
        console.log('Creating bookmark for:', url);
        
        // Use the standard bookmarks bar ID (ID '1' is the bookmarks bar in Chrome)
        const bookmarkBarId = '1';
        
        // Search for existing "THE QUICKNESS" folder
        const bookmarkBarChildren = await new Promise((resolve, reject) => {
          chrome.bookmarks.getChildren(bookmarkBarId, (results) => {
            if (chrome.runtime.lastError) {
              console.error('Error getting bookmark children:', chrome.runtime.lastError);
              reject(chrome.runtime.lastError);
            } else {
              resolve(results);
            }
          });
        });
        
        // Look for existing folder
        let quicknessFolder = bookmarkBarChildren.find(item => 
          item.title === 'THE QUICKNESS' && !item.url
        );
        
        // Create folder if it doesn't exist
        if (!quicknessFolder) {
          console.log('Creating THE QUICKNESS bookmark folder');
          quicknessFolder = await new Promise((resolve, reject) => {
            chrome.bookmarks.create({
              parentId: bookmarkBarId,
              title: 'THE QUICKNESS'
            }, (result) => {
              if (chrome.runtime.lastError) {
                console.error('Error creating bookmark folder:', chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
              } else {
                resolve(result);
              }
            });
          });
        }
        
        // Create bookmark title from filename (remove .pdf extension)
        const bookmarkTitle = filename.replace('.pdf', '');
        
        // Create the bookmark
        await new Promise((resolve, reject) => {
          chrome.bookmarks.create({
            parentId: quicknessFolder.id,
            title: bookmarkTitle,
            url: url
          }, (result) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(result);
            }
          });
        });
        
        console.log('Bookmark created successfully:', bookmarkTitle);
        this.showSuccessNotification(`Bookmark saved: ${bookmarkTitle}`);
        
      } catch (error) {
        console.error('Failed to create bookmark:', error);
        this.showFailureNotification('Failed to create bookmark');
      }
    }

    fallbackDownload(pdfBlob, filename) {
      console.log('Using fallback download method');
      try {
        const url = URL.createObjectURL(pdfBlob);
        
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = filename;
        downloadLink.style.display = 'none';
        
        // Ensure no auto-opening by not setting target
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        console.log('Fallback download triggered to Downloads folder (no auto-open)');
        this.showSuccessNotification(`PDF saved: ${filename}`);
        
      } catch (error) {
        console.error('Fallback download also failed:', error);
        alert('PDF download failed. Please try again.');
      }
    }

    showSuccessNotification(message) {
      try {
        const existing = document.querySelector('.tq-success-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = 'tq-success-notification';
        notification.style.cssText = `
          position: fixed !important;
          top: 20px !important;
          right: 20px !important;
          background: #10b981 !important;
          color: white !important;
          padding: 12px 20px !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
          z-index: 2147483647 !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          opacity: 0 !important;
          transform: translateX(100%) !important;
          transition: all 0.3s ease !important;
          pointer-events: none !important;
        `;
        
        notification.textContent = `✓ ${message}`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          if (notification.parentNode) {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
          }
        }, 10);
        
        setTimeout(() => {
          if (notification.parentNode) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
              if (notification.parentNode) {
                notification.remove();
              }
            }, 300);
          }
        }, 3000);
        
      } catch (error) {
        console.error('Notification failed:', error);
        console.log('✓', message);
      }
    }

    showFailureNotification(message) {
      try {
        const existing = document.querySelector('.tq-failure-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = 'tq-failure-notification';
        notification.style.cssText = `
          position: fixed !important;
          top: 20px !important;
          right: 20px !important;
          background: #ef4444 !important;
          color: white !important;
          padding: 12px 20px !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
          z-index: 2147483647 !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          opacity: 0 !important;
          transform: translateX(100%) !important;
          transition: all 0.3s ease !important;
          pointer-events: none !important;
        `;
        
        notification.textContent = `❌ ${message}`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          if (notification.parentNode) {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
          }
        }, 10);
        
        setTimeout(() => {
          if (notification.parentNode) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
              if (notification.parentNode) {
                notification.remove();
              }
            }, 300);
          }
        }, 5000);
        
      } catch (error) {
        console.error('Error notification failed:', error);
        console.log('❌', message);
      }
    }

    closeModal() {
      if (this.modal) {
        const backdrop = document.querySelector('.tq-modal-backdrop');
        if (backdrop) backdrop.remove();
        this.modal.remove();
        this.modal = null;
      }
    }
  }

  window.theQuicknessExtension = new TheQuicknessExtension();

})();