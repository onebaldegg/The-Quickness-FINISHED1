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

      try {
        // Take screenshot of visible viewport
        const canvas = await window.html2canvas(document.body, {
          height: window.innerHeight,
          width: window.innerWidth,
          x: 0,
          y: window.scrollY,
          useCORS: true,
          allowTaint: false,
          foreignObjectRendering: true,
          scale: 1,
          logging: false,
          backgroundColor: '#ffffff',
          removeContainer: true,
          imageTimeout: 15000,
          onclone: (clonedDoc) => {
            // Remove problematic elements that might cause CORS issues
            clonedDoc.querySelectorAll('iframe:not([src^="data:"]):not([src^="blob:"])').forEach(el => {
              if (!el.src.startsWith(window.location.origin)) {
                el.remove();
              }
            });
            
            // Handle external images - replace with placeholders if needed
            clonedDoc.querySelectorAll('img').forEach(img => {
              if (img.src && !img.src.startsWith('data:') && !img.src.startsWith('blob:') && !img.src.startsWith(window.location.origin)) {
                // For external images, try to preserve them but have fallback
                img.crossOrigin = 'anonymous';
              }
            });
          }
        });

        // Convert canvas to high-quality data URL
        const screenshotDataUrl = canvas.toDataURL('image/png', 1.0);
        
        console.log('Screenshot captured successfully, data URL length:', screenshotDataUrl.length);

        this.capturedData = {
          type: 'viewport_screenshot',
          url: window.location.href,
          title: document.title,
          screenshot: screenshotDataUrl
        };

        console.log('Screenshot data stored, showing note modal');
        this.showNoteModal();

      } catch (error) {
        console.error('Screenshot failed:', error);
        alert('Screenshot capture failed. This may be due to website security restrictions.');
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
            rect.left >= 0 && rect.left <= window.innerWidth) {
          
          const linkData = {
            text: link.textContent.trim(),
            href: link.href,
            x: Math.round(rect.left),
            y: Math.round(rect.top),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          };
          
          if (linkData.text && linkData.href) {
            links.push(linkData);
          }
        }
      });
      
      console.log(`Extracted ${links.length} links from viewport`);
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
        background: #b885d8; border-radius: 12px; padding: 24px; 
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        z-index: 2147483647; min-width: 500px; max-width: 700px;
        border: 3px solid #333;
      `;
      
      // Logo from external source (The Quickness logo)
      const logoBase64 = 'https://github.com/onebaldegg/logo/raw/main/LOGO%202.png';
      
      this.modal.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 20px;">
          <img src="${logoBase64}" alt="THE QUICKNESS" style="height: 60px; width: auto; margin-right: 20px;">
          <div style="color: white; font-size: 24px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
            THE QUICKNESS
          </div>
        </div>
        
        <div style="background: white; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <div style="font-size: 12px; color: #666; word-break: break-all; margin-bottom: 12px;">
            <strong>Source:</strong> ${this.capturedData.url}
          </div>
          
          <div style="margin-bottom: 16px;">
            <div style="font-weight: 500; margin-bottom: 8px; color: #333;">Screenshot Preview:</div>
            <img src="${this.capturedData.screenshot}" style="max-width: 100%; max-height: 200px; border-radius: 4px; border: 1px solid #ddd;" onload="console.log('Screenshot image loaded successfully')" onerror="console.error('Screenshot image failed to load')">
          </div>
          
          <div>
            <label style="display: block; font-weight: 500; margin-bottom: 6px; color: #333;">Your Note:</label>
            <textarea id="tq-note-input" style="width: 100%; min-height: 100px; padding: 12px; border: 2px solid #e0e0e0; border-radius: 6px; resize: vertical; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;" placeholder="Add your note here..."></textarea>
          </div>
        </div>
        
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button id="tq-cancel-btn" style="padding: 12px 24px; border: none; border-radius: 6px; background: #6c757d; color: white; cursor: pointer; font-weight: 500;">Cancel</button>
          <button id="tq-save-btn" style="padding: 12px 24px; border: none; border-radius: 6px; background: #007cff; color: white; cursor: pointer; font-weight: 500;">Save PDF</button>
        </div>
      `;
      
      document.body.appendChild(backdrop);
      document.body.appendChild(this.modal);
      
      this.bindModalEvents(backdrop);
      
      const textarea = this.modal.querySelector('#tq-note-input');
      setTimeout(() => textarea.focus(), 100);
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
        
        // Create filename with timestamp and first two words of note
        let noteWords = '';
        if (note && note.trim()) {
          noteWords = note.trim()
            .split(/\s+/)
            .slice(0, 2)
            .join('-')
            .replace(/[^a-zA-Z0-9-]/g, '')
            .toLowerCase();
        }
        
        const filename = noteWords 
          ? `${timestamp}_${noteWords}.pdf`
          : `${timestamp}_screenshot.pdf`;
        
        console.log('Creating landscape PDF with filename:', filename);
        
        const { jsPDF } = window.jspdf;
        // Create PDF in landscape mode
        const pdf = new jsPDF('landscape', 'mm', 'a4');
        
        // A4 landscape dimensions: 297mm x 210mm
        const pageWidth = 297;
        const pageHeight = 210;
        const margin = 15;
        
        // Logo top-left 
        try {
          // Try to load and add the actual logo
          const logoImg = new Image();
          logoImg.crossOrigin = 'anonymous';
          
          await new Promise((resolve, reject) => {
            logoImg.onload = () => {
              try {
                // Small logo size
                const logoWidth = 30;
                const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
                pdf.addImage(logoImg, 'PNG', margin, margin, logoWidth, logoHeight);
                console.log('Logo added to PDF successfully');
                resolve();
              } catch (error) {
                console.error('Error adding logo to PDF:', error);
                // Fallback: just text
                pdf.setFontSize(12);
                pdf.setFont(undefined, 'bold');
                pdf.text('THE QUICKNESS', margin, margin + 8);
                resolve();
              }
            };
            logoImg.onerror = (error) => {
              console.error('Error loading logo:', error);
              // Fallback: just text
              pdf.setFontSize(12);
              pdf.setFont(undefined, 'bold');
              pdf.text('THE QUICKNESS', margin, margin + 8);
              resolve();
            };
            logoImg.src = 'https://github.com/onebaldegg/logo/raw/main/LOGO%202.png';
          });
        } catch (error) {
          console.error('Logo processing failed:', error);
          // Fallback: just text
          pdf.setFontSize(12);
          pdf.setFont(undefined, 'bold');
          pdf.text('THE QUICKNESS', margin, margin + 8);
        }
        
        // Source URL top-right
        pdf.setFontSize(8);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(0, 0, 255);
        const urlText = `Source: ${data.url}`;
        const urlWidth = pdf.getTextWidth(urlText);
        pdf.textWithLink(urlText, pageWidth - margin - urlWidth, margin + 8, { url: data.url });
        pdf.setTextColor(0, 0, 0);
        
        // Screenshot below logo and URL
        let yPos = margin + 20;
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          await new Promise((resolve, reject) => {
            img.onload = () => {
              try {
                // Calculate screenshot dimensions to fit in available space
                const availableWidth = pageWidth - (margin * 2);
                const availableHeight = (pageHeight - yPos - margin - 40); // Leave space for notes
                
                const aspectRatio = img.width / img.height;
                let imgWidth = availableWidth;
                let imgHeight = imgWidth / aspectRatio;
                
                if (imgHeight > availableHeight) {
                  imgHeight = availableHeight;
                  imgWidth = imgHeight * aspectRatio;
                }
                
                // Center the image horizontally
                const imgX = (pageWidth - imgWidth) / 2;
                
                pdf.addImage(data.screenshot, 'PNG', imgX, yPos, imgWidth, imgHeight);
                yPos += imgHeight + 10;
                resolve();
              } catch (error) {
                console.error('Error adding image to PDF:', error);
                reject(error);
              }
            };
            img.onerror = (error) => {
              console.error('Error loading image:', error);
              reject(error);
            };
            img.src = data.screenshot;
          });
        } catch (error) {
          console.error('Screenshot processing failed:', error);
          pdf.setFontSize(12);
          pdf.text('Screenshot processing failed', margin, yPos);
          yPos += 15;
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
        
        // Add extracted links if any
        if (data.links && data.links.length > 0) {
          // Add new page if needed
          if (yPos > pageHeight - 40) {
            pdf.addPage();
            yPos = margin;
          }
          
          yPos += 10;
          pdf.setFont(undefined, 'bold');
          pdf.text('Links found in screenshot:', margin, yPos);
          yPos += 8;
          
          pdf.setFont(undefined, 'normal');
          pdf.setFontSize(8);
          data.links.forEach(link => {
            if (yPos > pageHeight - 20) {
              pdf.addPage();
              yPos = margin;
            }
            
            pdf.setTextColor(0, 0, 255);
            const linkText = `• ${link.text} (${link.href})`;
            const linkLines = pdf.splitTextToSize(linkText, pageWidth - (margin * 2));
            pdf.text(linkLines, margin, yPos);
            yPos += linkLines.length * 4 + 2;
          });
          pdf.setTextColor(0, 0, 0);
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
        
      } catch (error) {
        console.error('PDF generation failed:', error);
        alert('PDF generation failed: ' + error.message);
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
        
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        console.log('Fallback download triggered to Downloads folder');
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