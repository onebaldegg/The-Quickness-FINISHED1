/* global chrome */
// THE QUICKNESS - Exact Fabric Clone (Clean Implementation)

(function() {
  'use strict';
  
  if (window.theQuicknessExtension) {
    return;
  }

  class TheQuicknessExtension {
    constructor() {
      this.isActive = false;
      this.mode = null;
      this.isSelecting = false;
      this.selectionStart = null;
      this.selectionEnd = null;
      this.overlay = null;
      this.selectionBox = null;
      this.hoveredElement = null;
      this.capturedData = null;
      this.modal = null;
      this.librariesLoaded = false;
      
      this.init();
    }

    init() {
      console.log('THE QUICKNESS - Exact Fabric Clone');
      this.waitForLibraries();
      this.bindKeyEvents();
      this.setupMessageListener();
    }
    
    setupMessageListener() {
      // Listen for download success/failure messages from background script
      try {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
          if (request.action === 'downloadSuccess') {
            this.showSuccessNotification(`PDF saved: ${request.filename}`);
          } else if (request.action === 'downloadFailed') {
            this.showFailureNotification(`PDF save failed: ${request.filename}`);
          }
        });
      } catch (error) {
        console.log('Background script messaging unavailable:', error);
        // Extension will work without background script messaging
      }
    }
    
    showSuccessNotification(message) {
      try {
        // Remove any existing notifications
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
        
        // Animate in
        setTimeout(() => {
          if (notification.parentNode) {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
          }
        }, 10);
        
        // Animate out and remove
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
        // Fallback: simple console message
        console.log('✓', message);
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

    bindKeyEvents() {
      let ctrlAltPressed = false;
      
      document.addEventListener('keydown', (e) => {
        // EXACT FABRIC BEHAVIOR: Ctrl+Alt enables capture modes
        if (e.ctrlKey && e.altKey) {
          ctrlAltPressed = true;
          
          // Ctrl+Alt+N for quick notes (immediate activation)
          if (e.key.toLowerCase() === 'n') {
            e.preventDefault();
            this.startQuickNoteMode();
            return;
          }
          
          // Ctrl+Alt held enables drag/hover modes (no specific key needed)
          if (!this.isActive) {
            // Show crosshair cursor to indicate ready for drag/hover
            document.body.style.cursor = 'crosshair';
          }
        }
        
        if (e.key === 'Escape' && this.isActive) {
          e.preventDefault();
          this.cancelMode();
        }
      });

      document.addEventListener('keyup', (e) => {
        // EXACT FABRIC BEHAVIOR: Release Ctrl+Alt cancels modes
        if (!e.ctrlKey || !e.altKey) {
          ctrlAltPressed = false;
          document.body.style.cursor = '';
          
          // Cancel hover mode when keys released (Fabric behavior)
          if (this.mode === 'hover' && this.isActive) {
            this.cancelMode();
          }
        }
      });

      // EXACT FABRIC BEHAVIOR: Ctrl+Alt+Drag for screenshot
      document.addEventListener('mousedown', (e) => {
        if (ctrlAltPressed && !this.isActive) {
          e.preventDefault();
          this.startScreenshotMode();
        }
      });
      
      // EXACT FABRIC BEHAVIOR: Ctrl+Alt+Hover for element capture
      document.addEventListener('mousemove', (e) => {
        if (ctrlAltPressed && !this.isActive && !this.isSelecting) {
          // Start hover mode when moving mouse with Ctrl+Alt held
          if (this.mode !== 'hover') {
            this.startHoverMode();
          }
        }
      });
    }

    // SCREENSHOT MODE - Copy Fabric's exact behavior
    startScreenshotMode() {
      this.mode = 'screenshot';
      this.isActive = true;
      this.createOverlay();
      this.enableScreenshotSelection();
      document.body.classList.add('tq-capturing');
    }

    createOverlay() {
      if (this.overlay) {
        this.overlay.remove();
      }
      
      // EXACT FABRIC OVERLAY - Copy Fabric's precise styling
      this.overlay = document.createElement('div');
      this.overlay.className = 'tq_overlay';
      this.overlay.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 2147483647 !important;
        pointer-events: all !important;
        cursor: crosshair !important;
        background: rgba(24, 24, 27, 0.4) !important;
        backdrop-filter: blur(2px) !important;
        -webkit-backdrop-filter: blur(2px) !important;
      `;
      
      // EXACT FABRIC SELECTION BOX - Match Fabric's selection styling
      this.selectionBox = document.createElement('div');
      this.selectionBox.style.cssText = `
        position: absolute !important;
        border: 2px solid #3b82f6 !important;
        background: rgba(59, 130, 246, 0.1) !important;
        border-radius: 4px !important;
        pointer-events: none !important;
        display: none !important;
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.5) !important;
      `;
      
      this.overlay.appendChild(this.selectionBox);
      document.body.appendChild(this.overlay);
      
      // EXACT FABRIC BEHAVIOR - Add subtle fade-in animation
      this.overlay.style.opacity = '0';
      this.overlay.style.transition = 'opacity 0.2s ease';
      setTimeout(() => {
        if (this.overlay) {
          this.overlay.style.opacity = '1';
        }
      }, 10);
    }

    enableScreenshotSelection() {
      this.overlay.addEventListener('mousedown', this.onMouseDown.bind(this));
      this.overlay.addEventListener('mousemove', this.onMouseMove.bind(this));
      this.overlay.addEventListener('mouseup', this.onMouseUp.bind(this));
    }

    onMouseDown(e) {
      if (this.mode !== 'screenshot') return;
      
      this.isSelecting = true;
      this.selectionStart = { x: e.clientX, y: e.clientY };
      this.selectionBox.style.display = 'block';
      e.preventDefault();
    }

    onMouseMove(e) {
      if (!this.isSelecting || this.mode !== 'screenshot') return;
      
      this.selectionEnd = { x: e.clientX, y: e.clientY };
      this.updateSelectionBox();
      e.preventDefault();
    }

    onMouseUp(e) {
      if (!this.isSelecting || this.mode !== 'screenshot') return;
      
      this.isSelecting = false;
      this.selectionEnd = { x: e.clientX, y: e.clientY };
      this.captureScreenshot();
      e.preventDefault();
    }

    updateSelectionBox() {
      if (!this.selectionStart || !this.selectionEnd) return;
      
      const left = Math.min(this.selectionStart.x, this.selectionEnd.x);
      const top = Math.min(this.selectionStart.y, this.selectionEnd.y);
      const width = Math.abs(this.selectionEnd.x - this.selectionStart.x);
      const height = Math.abs(this.selectionEnd.y - this.selectionStart.y);
      
      this.selectionBox.style.left = left + 'px';
      this.selectionBox.style.top = top + 'px';
      this.selectionBox.style.width = width + 'px';
      this.selectionBox.style.height = height + 'px';
    }

    async captureScreenshot() {
      if (!this.selectionStart || !this.selectionEnd || !this.librariesLoaded) {
        this.cancelMode();
        return;
      }
      
      const left = Math.min(this.selectionStart.x, this.selectionEnd.x);
      const top = Math.min(this.selectionStart.y, this.selectionEnd.y) + window.scrollY;
      const width = Math.abs(this.selectionEnd.x - this.selectionStart.x);
      const height = Math.abs(this.selectionEnd.y - this.selectionStart.y);
      
      if (width < 10 || height < 10) {
        this.cancelMode();
        return;
      }
      
      try {
        this.hideOverlay();
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // FIXED CORS ISSUES: Enhanced html2canvas configuration
        const canvas = await window.html2canvas(document.body, {
          x: left,
          y: top,
          width: width,
          height: height,
          useCORS: true,
          allowTaint: false,  // Prevent canvas tainting
          foreignObjectRendering: true,  // Better cross-origin handling
          scale: 1,  // Consistent scaling
          logging: false,  // Disable debug logging
          backgroundColor: null,  // Transparent background
          removeContainer: true,  // Clean up temporary containers
          imageTimeout: 15000,  // Longer timeout for slow images
          onclone: (clonedDoc) => {
            // CORS FIX: Remove problematic elements before capture
            const problematicSelectors = [
              'iframe',
              'object',
              'embed',
              'video[src*="youtube"]',
              'video[src*="vimeo"]',
              'img[src^="data:"]',  // Keep data URLs
              'canvas'
            ];
            
            // Remove external iframes and media that might cause CORS
            clonedDoc.querySelectorAll('iframe:not([src^="data:"]):not([src^="blob:"])').forEach(el => {
              if (!el.src.startsWith(window.location.origin)) {
                el.remove();
              }
            });
            
            // Replace external images with placeholders if they fail
            clonedDoc.querySelectorAll('img').forEach(img => {
              if (img.src && !img.src.startsWith('data:') && !img.src.startsWith('blob:')) {
                // Test if image is accessible
                const testImg = new Image();
                testImg.crossOrigin = 'anonymous';
                testImg.onerror = () => {
                  // Replace with placeholder
                  img.style.background = '#f3f4f6';
                  img.style.border = '2px dashed #d1d5db';
                  img.style.display = 'flex';
                  img.style.alignItems = 'center';
                  img.style.justifyContent = 'center';
                  img.style.color = '#6b7280';
                  img.style.fontSize = '12px';
                  img.alt = 'Image blocked by CORS';
                  img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDlWN0M21IDUuOSAxOS4xIDUgMTggNUg2QzQuOSA1IDQgNS45IDQgN1Y5SDIxWiIgZmlsbD0iIzZCNzI4MCIvPgo8cGF0aCBkPSJNMjEgMTBIMFYxN0MwIDE4LjEgMC45IDE5IDIgMTlIMjJDMjMuMSAxOSAyNCAxOC4xIDI0IDE3VjEwSDIxWiIgZmlsbD0iIzZCNzI4MCIvPgo8L3N2Zz4K';
                };
                testImg.src = img.src;
              }
            });
          }
        });
        
        this.capturedData = {
          type: 'screenshot',
          url: window.location.href,
          title: document.title,
          content: canvas.toDataURL('image/png')
        };
        
        this.showNoteModal();
        
      } catch (error) {
        console.error('Screenshot failed:', error);
        
        // CORS FALLBACK: Try alternative capture method
        try {
          console.log('Trying fallback capture method...');
          
          // Simple fallback - capture visible area only
          const simpleCanvas = await window.html2canvas(document.body, {
            height: window.innerHeight,
            width: window.innerWidth,
            x: 0,
            y: window.scrollY,
            useCORS: false,
            allowTaint: true,
            scale: 1
          });
          
          // Crop to selection area
          const cropCanvas = document.createElement('canvas');
          const ctx = cropCanvas.getContext('2d');
          cropCanvas.width = width;
          cropCanvas.height = height;
          
          ctx.drawImage(
            simpleCanvas,
            left, top - window.scrollY,
            width, height,
            0, 0,
            width, height
          );
          
          this.capturedData = {
            type: 'screenshot',
            url: window.location.href,
            title: document.title,
            content: cropCanvas.toDataURL('image/png')
          };
          
          this.showNoteModal();
          
        } catch (fallbackError) {
          console.error('Fallback capture also failed:', fallbackError);
          alert('Screenshot capture failed. This may be due to website security restrictions.');
          this.cancelMode();
        }
      }
    }

    // HOVER MODE - Copy Fabric's exact behavior
    startHoverMode() {
      this.mode = 'hover';
      this.isActive = true;
      this.createOverlay();
      this.enableHoverCapture();
      document.body.classList.add('tq-capturing', 'tq-hovering');
    }

    enableHoverCapture() {
      this.overlay.style.pointerEvents = 'none';
      
      document.addEventListener('mouseover', this.onHover.bind(this));
      document.addEventListener('click', this.onHoverClick.bind(this));
    }

    onHover(e) {
      if (this.mode !== 'hover') return;
      
      const element = e.target;
      
      // Skip our overlay
      if (element === this.overlay || element.closest('.tq_overlay')) {
        return;
      }
      
      // Clear previous highlight
      this.clearHoverHighlight();
      
      // Check if element is worth capturing (Fabric's logic)
      if (this.isGoodElement(element)) {
        this.highlightElement(element);
      }
    }

    isGoodElement(element) {
      const tag = element.tagName;
      const hasText = element.textContent && element.textContent.trim().length > 0;
      
      // Images
      if (tag === 'IMG' || tag === 'SVG' || tag === 'VIDEO') {
        return true;
      }
      
      // Text elements
      if (hasText && ['P', 'DIV', 'SPAN', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'ARTICLE', 'SECTION'].includes(tag)) {
        return true;
      }
      
      return false;
    }

    highlightElement(element) {
      this.hoveredElement = element;
      
      // EXACT FABRIC HIGHLIGHTING - Match Fabric's precise hover styling
      element.style.cssText += `
        outline: 2px solid #f59e0b !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.2) !important;
        background-color: rgba(245, 158, 11, 0.05) !important;
        transition: all 0.15s ease !important;
      `;
      
      // Store original styles for restoration
      if (!element._tqOriginalStyles) {
        element._tqOriginalStyles = {
          outline: element.style.outline,
          outlineOffset: element.style.outlineOffset,
          boxShadow: element.style.boxShadow,
          backgroundColor: element.style.backgroundColor,
          transition: element.style.transition
        };
      }
    }

    clearHoverHighlight() {
      if (this.hoveredElement) {
        // EXACT FABRIC BEHAVIOR - Restore original styles properly
        if (this.hoveredElement._tqOriginalStyles) {
          const styles = this.hoveredElement._tqOriginalStyles;
          this.hoveredElement.style.outline = styles.outline || '';
          this.hoveredElement.style.outlineOffset = styles.outlineOffset || '';
          this.hoveredElement.style.boxShadow = styles.boxShadow || '';
          this.hoveredElement.style.backgroundColor = styles.backgroundColor || '';
          this.hoveredElement.style.transition = styles.transition || '';
          
          // Clean up stored styles
          delete this.hoveredElement._tqOriginalStyles;
        } else {
          // Fallback cleanup
          this.hoveredElement.style.outline = '';
          this.hoveredElement.style.outlineOffset = '';
          this.hoveredElement.style.boxShadow = '';
          this.hoveredElement.style.backgroundColor = '';
          this.hoveredElement.style.transition = '';
        }
        
        this.hoveredElement = null;
      }
    }

    onHoverClick(e) {
      if (this.mode !== 'hover' || !this.hoveredElement) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      this.captureElement();
    }

    async captureElement() {
      if (!this.hoveredElement) return;
      
      const element = this.hoveredElement;
      const isImage = element.tagName === 'IMG';
      
      try {
        let content;
        
        if (isImage) {
          content = {
            src: element.src,
            alt: element.alt || '',
            width: element.naturalWidth || element.offsetWidth,
            height: element.naturalHeight || element.offsetHeight
          };
        } else {
          const links = Array.from(element.querySelectorAll('a')).map(link => ({
            text: link.textContent,
            href: link.href
          }));
          
          content = {
            text: element.textContent || element.innerText,
            html: element.innerHTML,
            links: links
          };
        }
        
        this.capturedData = {
          type: isImage ? 'image' : 'text',
          url: window.location.href,
          title: document.title,
          content: content
        };
        
        this.hideOverlay();
        this.showNoteModal();
        
      } catch (error) {
        console.error('Element capture failed:', error);
        this.cancelMode();
      }
    }

    // QUICK NOTE MODE
    startQuickNoteMode() {
      this.mode = 'note';
      this.isActive = true;
      this.capturedData = {
        type: 'note',
        url: window.location.href,
        title: document.title
      };
      this.showNoteModal();
    }

    // NOTE MODAL
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
        background: white; border-radius: 8px; padding: 24px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        z-index: 2147483647; min-width: 400px; max-width: 600px;
      `;
      
      this.modal.innerHTML = `
        <h3 style="margin: 0 0 16px 0; color: #333;">THE QUICKNESS - Add Note</h3>
        <p style="margin: 0 0 16px 0; font-size: 12px; color: #666; word-break: break-all;">${this.capturedData.url}</p>
        
        ${this.generatePreview()}
        
        <label style="display: block; font-weight: 500; margin-bottom: 6px;">Your Note:</label>
        <textarea id="tq-note-input" style="width: 100%; min-height: 100px; padding: 12px; border: 2px solid #e0e0e0; border-radius: 6px; resize: vertical;" placeholder="Add your note here..."></textarea>
        
        <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px;">
          <button id="tq-cancel-btn" style="padding: 10px 20px; border: none; border-radius: 6px; background: #6c757d; color: white; cursor: pointer;">Cancel</button>
          <button id="tq-save-btn" style="padding: 10px 20px; border: none; border-radius: 6px; background: #007cff; color: white; cursor: pointer;">Save PDF</button>
        </div>
      `;
      
      document.body.appendChild(backdrop);
      document.body.appendChild(this.modal);
      
      this.bindModalEvents(backdrop);
      
      const textarea = this.modal.querySelector('#tq-note-input');
      setTimeout(() => textarea.focus(), 100);
    }

    generatePreview() {
      const data = this.capturedData;
      
      if (data.type === 'screenshot') {
        return `<div style="margin-bottom: 16px; padding: 12px; background: #f8f9fa; border-radius: 8px;">
          <div style="font-weight: 500; margin-bottom: 8px;">Screenshot Preview:</div>
          <img src="${data.content}" style="max-width: 100%; max-height: 150px; border-radius: 4px;">
        </div>`;
      } else if (data.type === 'image') {
        return `<div style="margin-bottom: 16px; padding: 12px; background: #f8f9fa; border-radius: 8px;">
          <div style="font-weight: 500; margin-bottom: 8px;">Image Source:</div>
          <div style="font-size: 13px;">${data.content.src}</div>
        </div>`;
      } else if (data.type === 'text') {
        const preview = data.content.text.substring(0, 200);
        return `<div style="margin-bottom: 16px; padding: 12px; background: #f8f9fa; border-radius: 8px;">
          <div style="font-weight: 500; margin-bottom: 8px;">Captured Text:</div>
          <div style="font-size: 13px;">${preview}${data.content.text.length > 200 ? '...' : ''}</div>
        </div>`;
      }
      
      return '';
    }

    bindModalEvents(backdrop) {
      const cancelBtn = this.modal.querySelector('#tq-cancel-btn');
      const saveBtn = this.modal.querySelector('#tq-save-btn');
      const textarea = this.modal.querySelector('#tq-note-input');
      
      cancelBtn.addEventListener('click', () => {
        this.closeModal();
        this.cancelMode();
      });
      
      saveBtn.addEventListener('click', () => {
        const note = textarea.value.trim();
        this.savePDF(note);
      });
      
      backdrop.addEventListener('click', () => {
        this.closeModal();
        this.cancelMode();
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
        
        // FIXED: Proper filename following your rules - timestamp_first-two-words-of-note.pdf
        let noteWords = '';
        if (note && note.trim()) {
          noteWords = note.trim()
            .split(/\s+/)  // Split by any whitespace
            .slice(0, 2)   // Take first two words
            .join('-')     // Join with hyphen
            .replace(/[^a-zA-Z0-9-]/g, '')  // Remove special characters except hyphens
            .toLowerCase(); // Make lowercase for consistency
        }
        
        const filename = noteWords 
          ? `${timestamp}_${noteWords}.pdf`
          : `${timestamp}_note.pdf`;
        
        console.log('Creating PDF with filename:', filename);
        
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        
        let yPos = 20;
        
        // Title
        pdf.setFontSize(16);
        pdf.setFont(undefined, 'bold');
        pdf.text('THE QUICKNESS Capture', 20, yPos);
        yPos += 15;
        
        // URL (clickable)
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 255);
        pdf.textWithLink('Source: ' + data.url, 20, yPos, { url: data.url });
        pdf.setTextColor(0, 0, 0);
        yPos += 15;
        
        // Content based on type
        if (data.type === 'screenshot') {
          console.log('Processing screenshot content');
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
              img.onload = () => {
                try {
                  const ratio = Math.min(170 / img.width, 200 / img.height);
                  pdf.addImage(data.content, 'PNG', 20, yPos, img.width * ratio, img.height * ratio);
                  yPos += img.height * ratio + 15;
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
              img.src = data.content;
            });
          } catch (error) {
            console.error('Screenshot processing failed:', error);
            // Continue without image
            pdf.setFontSize(12);
            pdf.text('Screenshot capture failed', 20, yPos);
            yPos += 15;
          }
        } else if (data.type === 'text') {
          console.log('Processing text content');
          pdf.setFontSize(12);
          pdf.setFont(undefined, 'bold');
          pdf.text('Captured Text:', 20, yPos);
          yPos += 10;
          
          pdf.setFont(undefined, 'normal');
          const textLines = pdf.splitTextToSize(data.content.text, 170);
          pdf.text(textLines, 20, yPos);
          yPos += textLines.length * 5 + 10;
          
          // Links
          if (data.content.links && data.content.links.length > 0) {
            pdf.setFont(undefined, 'bold');
            pdf.text('Links:', 20, yPos);
            yPos += 10;
            
            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(0, 0, 255);
            data.content.links.forEach(link => {
              pdf.textWithLink(link.text, 20, yPos, { url: link.href });
              yPos += 8;
            });
            pdf.setTextColor(0, 0, 0);
            yPos += 10;
          }
        } else if (data.type === 'image') {
          console.log('Processing image content');
          pdf.setFontSize(12);
          pdf.setFont(undefined, 'bold');
          pdf.text('Image Source:', 20, yPos);
          yPos += 10;
          
          pdf.setTextColor(0, 0, 255);
          pdf.textWithLink(data.content.src, 20, yPos, { url: data.content.src });
          pdf.setTextColor(0, 0, 0);
          yPos += 15;
        } else if (data.type === 'note') {
          console.log('Processing note content');
          pdf.setFontSize(12);
          pdf.setFont(undefined, 'bold');
          pdf.text('Quick Note:', 20, yPos);
          yPos += 15;
        }
        
        // Notes
        if (note) {
          pdf.setFontSize(12);
          pdf.setFont(undefined, 'bold');
          pdf.text('Notes:', 20, yPos);
          yPos += 10;
          
          pdf.setFont(undefined, 'normal');
          const noteLines = pdf.splitTextToSize(note, 170);
          pdf.text(noteLines, 20, yPos);
        }
        
        console.log('PDF generation complete, starting download');
        
        // FIXED: Use File System Access API for direct folder saving
        try {
          const result = await chrome.storage.local.get(['customSavePath', 'selectedTabId']);
          
          if (result.customSavePath && result.selectedTabId) {
            console.log('Using File System Access API for custom folder:', result.customSavePath);
            
            // Try to save using File System Access API
            const saved = await this.saveToCustomFolder(pdf, filename, result.selectedTabId);
            
            if (saved) {
              console.log('PDF saved successfully using File System Access API');
              this.showSuccessNotification(`PDF saved to ${result.customSavePath}: ${filename}`);
            } else {
              console.log('File System Access API failed, falling back to Downloads');
              this.fallbackToDownloads(pdf, filename);
            }
            
          } else {
            console.log('No custom folder set, using Downloads folder');
            this.fallbackToDownloads(pdf, filename);
          }
          
        } catch (error) {
          console.error('Error determining save location:', error);
          this.fallbackToDownloads(pdf, filename);
        }
        
        // Close modal and cancel mode
        this.closeModal();
        this.cancelMode();
        
      } catch (error) {
        console.error('PDF generation failed:', error);
        alert('PDF generation failed: ' + error.message);
        // Don't close modal on error so user can try again
      }
    }

    showFailureNotification(message) {
      try {
        // Remove any existing notifications
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
        
        // Animate in
        setTimeout(() => {
          if (notification.parentNode) {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
          }
        }, 10);
        
        // Animate out and remove
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
        }, 5000); // Show error longer than success
        
      } catch (error) {
        console.error('Error notification failed:', error);
        console.log('❌', message);
      }
    }

    fallbackDownload(pdfBlob, filename) {
      console.log('Using fallback download method');
      try {
        const url = URL.createObjectURL(pdfBlob);
        
        // Create hidden download link
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = filename;  // Just filename - browser handles Downloads folder
        downloadLink.style.display = 'none';
        
        // Trigger download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Clean up blob URL
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        console.log('Fallback download triggered to Downloads folder');
        this.showSuccessNotification(`PDF saved: ${filename}`);
        
      } catch (error) {
        console.error('Fallback download also failed:', error);
        alert('PDF download failed. Please try again.');
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

    hideOverlay() {
      if (this.overlay) {
        this.overlay.remove();
        this.overlay = null;
      }
    }

    cancelMode() {
      this.isActive = false;
      this.mode = null;
      this.capturedData = null;
      this.hideOverlay();
      this.closeModal();
      this.clearHoverHighlight();
      document.body.classList.remove('tq-capturing', 'tq-hovering');
      
      // Clean up event listeners
      document.removeEventListener('mouseover', this.onHover);
      document.removeEventListener('click', this.onHoverClick);
    }
  }

  window.theQuicknessExtension = new TheQuicknessExtension();

})();