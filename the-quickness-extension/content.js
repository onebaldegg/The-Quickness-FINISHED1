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
      console.log('THE QUICKNESS - Fabric Clone');
      this.waitForLibraries();
      this.bindKeyEvents();
    }

    async waitForLibraries() {
      let attempts = 0;
      while ((!window.jspdf || !window.html2canvas) && attempts < 100) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (window.jspdf && window.html2canvas) {
        this.librariesLoaded = true;
        console.log('Libraries ready');
      }
    }

    bindKeyEvents() {
      let ctrlAltPressed = false;
      
      document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.altKey) {
          ctrlAltPressed = true;
          
          if (e.key.toLowerCase() === 'd') {
            e.preventDefault();
            this.startScreenshotMode();
          } else if (e.key.toLowerCase() === 'h') {
            e.preventDefault();
            this.startHoverMode();
          } else if (e.key.toLowerCase() === 'n') {
            e.preventDefault();
            this.startQuickNoteMode();
          }
        }
        
        if (e.key === 'Escape' && this.isActive) {
          e.preventDefault();
          this.cancelMode();
        }
      });

      document.addEventListener('keyup', (e) => {
        if (!e.ctrlKey || !e.altKey) {
          ctrlAltPressed = false;
          if (this.mode === 'hover' && this.isActive) {
            this.cancelMode();
          }
        }
      });

      // Enable drag-to-screenshot when Ctrl+Alt held
      document.addEventListener('mousedown', (e) => {
        if (ctrlAltPressed && !this.isActive) {
          e.preventDefault();
          this.startScreenshotMode();
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
      
      // Fabric's exact overlay approach
      this.overlay = document.createElement('div');
      this.overlay.className = 'tq_overlay';
      this.overlay.style.display = 'block';
      this.overlay.style.cursor = 'crosshair';
      this.overlay.style.pointerEvents = 'all';
      this.overlay.style.position = 'fixed';
      this.overlay.style.top = '0';
      this.overlay.style.left = '0';
      this.overlay.style.width = '100vw';
      this.overlay.style.height = '100vh';
      this.overlay.style.zIndex = '2147483647';
      this.overlay.style.background = 'rgba(0, 0, 0, 0.1)';
      
      // Selection box
      this.selectionBox = document.createElement('div');
      this.selectionBox.style.position = 'absolute';
      this.selectionBox.style.border = '2px dashed #007cff';
      this.selectionBox.style.background = 'rgba(0, 124, 255, 0.1)';
      this.selectionBox.style.pointerEvents = 'none';
      this.selectionBox.style.display = 'none';
      
      this.overlay.appendChild(this.selectionBox);
      document.body.appendChild(this.overlay);
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
        
        const canvas = await window.html2canvas(document.body, {
          x: left,
          y: top,
          width: width,
          height: height,
          useCORS: true,
          allowTaint: true
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
        this.cancelMode();
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
      
      // Fabric's exact highlighting - applied directly to element
      element.style.outline = '2px solid #ff6b35';
      element.style.outlineOffset = '2px';
      element.style.backgroundColor = 'rgba(255, 107, 53, 0.1)';
    }

    clearHoverHighlight() {
      if (this.hoveredElement) {
        this.hoveredElement.style.outline = '';
        this.hoveredElement.style.outlineOffset = '';
        this.hoveredElement.style.backgroundColor = '';
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
      if (!window.jspdf) return;
      
      const data = this.capturedData;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const noteWords = note.split(' ').slice(0, 2).join('-').replace(/[^a-zA-Z0-9-]/g, '') || 'note';
      const filename = `${timestamp}_${noteWords}.pdf`;
      
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
      
      // Content
      if (data.type === 'screenshot') {
        const img = new Image();
        img.src = data.content;
        
        await new Promise(resolve => {
          img.onload = () => {
            const ratio = Math.min(170 / img.width, 200 / img.height);
            pdf.addImage(data.content, 'PNG', 20, yPos, img.width * ratio, img.height * ratio);
            yPos += img.height * ratio + 15;
            resolve();
          };
          img.onerror = resolve;
        });
      } else if (data.type === 'text') {
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
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text('Image Source:', 20, yPos);
        yPos += 10;
        
        pdf.setTextColor(0, 0, 255);
        pdf.textWithLink(data.content.src, 20, yPos, { url: data.content.src });
        pdf.setTextColor(0, 0, 0);
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
      
      // Download to THE QUICKNESS folder automatically
      const pdfData = pdf.output('arraybuffer');
      
      // Send to background script for automatic folder saving
      chrome.runtime.sendMessage({
        action: 'downloadPDF',
        pdfData: Array.from(new Uint8Array(pdfData)),
        filename: filename
      });
      
      this.closeModal();
      this.cancelMode();
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