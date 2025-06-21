// THE QUICKNESS - Exact Fabric Implementation with PDF Saving
// Copying Fabric's exact hover highlighting approach

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
      this.keyState = { ctrl: false, alt: false };
      
      this.init();
    }

    init() {
      console.log('THE QUICKNESS initialized - Fabric approach');
      this.loadLibraries();
      this.createOverlay();
      this.bindEvents();
    }

    async loadLibraries() {
      try {
        let attempts = 0;
        const maxAttempts = 50;
        
        while ((!window.jspdf || !window.html2canvas) && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (window.jspdf && window.html2canvas) {
          this.librariesLoaded = true;
          console.log('✅ PDF libraries loaded');
        }
      } catch (error) {
        console.error('❌ Library loading failed:', error);
      }
    }

    // EXACT FABRIC OVERLAY APPROACH
    createOverlay() {
      this.overlay = document.createElement('div');
      this.overlay.className = 'tq_overlay';
      this.overlay.style.cssText = `
        display: none;
        cursor: crosshair;
        pointer-events: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 2147483647;
        background: rgba(0, 0, 0, 0.1);
      `;
      
      // Selection box for screenshot mode
      this.selectionBox = document.createElement('div');
      this.selectionBox.style.cssText = `
        position: absolute;
        border: 2px dashed #007cff;
        background: rgba(0, 124, 255, 0.1);
        pointer-events: none;
        display: none;
      `;
      
      this.overlay.appendChild(this.selectionBox);
      document.body.appendChild(this.overlay);
    }

    bindEvents() {
      document.addEventListener('keydown', (e) => {
        this.keyState.ctrl = e.ctrlKey;
        this.keyState.alt = e.altKey;
        
        if (e.ctrlKey && e.altKey) {
          const key = e.key.toLowerCase();
          
          if (key === 'd') {
            e.preventDefault();
            this.startScreenshotMode();
          } else if (key === 'h') {
            e.preventDefault();
            this.startHoverMode();
          } else if (key === 'n') {
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
        this.keyState.ctrl = e.ctrlKey;
        this.keyState.alt = e.altKey;
        
        // Exit hover mode when keys are released (like Fabric)
        if (!e.ctrlKey || !e.altKey) {
          if (this.mode === 'hover' && this.isActive) {
            this.cancelMode();
          }
        }
      });

      document.addEventListener('mousedown', (e) => {
        if (this.keyState.ctrl && this.keyState.alt && !this.isActive) {
          e.preventDefault();
          this.startScreenshotMode();
        }
      });
    }

    startScreenshotMode() {
      console.log('Starting screenshot mode - Fabric style');
      this.mode = 'screenshot';
      this.isActive = true;
      this.showOverlay();
      this.enableScreenshotSelection();
      document.body.classList.add('tq-capturing');
    }

    startHoverMode() {
      console.log('Starting hover mode - Fabric style');
      this.mode = 'hover';
      this.isActive = true;
      this.showOverlay();
      this.enableHoverCapture();
      document.body.classList.add('tq-capturing', 'tq-hovering');
    }

    startQuickNoteMode() {
      console.log('Starting quick note mode');
      this.mode = 'note';
      this.isActive = true;
      this.capturedData = {
        type: 'note',
        url: window.location.href,
        title: document.title,
        content: null
      };
      this.showNoteModal();
    }

    showOverlay() {
      this.overlay.style.display = 'block';
    }

    hideOverlay() {
      this.overlay.style.display = 'none';
      this.selectionBox.style.display = 'none';
      document.body.classList.remove('tq-capturing', 'tq-hovering');
      this.clearSelection();
      this.clearHoverHighlight();
    }

    // SCREENSHOT SELECTION (Fabric style)
    enableScreenshotSelection() {
      this.overlay.style.pointerEvents = 'all';
      
      this.overlay.addEventListener('mousedown', this.handleMouseDown.bind(this));
      this.overlay.addEventListener('mousemove', this.handleMouseMove.bind(this));
      this.overlay.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }

    handleMouseDown(e) {
      if (this.mode !== 'screenshot') return;
      
      this.isSelecting = true;
      this.selectionStart = { x: e.clientX, y: e.clientY };
      this.selectionBox.style.display = 'block';
      e.preventDefault();
    }

    handleMouseMove(e) {
      if (!this.isSelecting || this.mode !== 'screenshot') return;
      
      this.selectionEnd = { x: e.clientX, y: e.clientY };
      this.updateSelectionBox();
      e.preventDefault();
    }

    handleMouseUp(e) {
      if (!this.isSelecting || this.mode !== 'screenshot') return;
      
      this.isSelecting = false;
      this.selectionEnd = { x: e.clientX, y: e.clientY };
      this.captureScreenshotArea();
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

    clearSelection() {
      this.selectionStart = null;
      this.selectionEnd = null;
      this.isSelecting = false;
    }

    // HOVER CAPTURE (Fabric's exact approach)
    enableHoverCapture() {
      this.overlay.style.pointerEvents = 'none';
      
      // Fabric's approach: direct event listeners for hover highlighting
      document.addEventListener('mouseover', this.handleHover.bind(this));
      document.addEventListener('mouseout', this.handleHoverOut.bind(this));
      document.addEventListener('click', this.handleHoverClick.bind(this));
    }

    handleHover(e) {
      if (this.mode !== 'hover') return;
      
      const element = e.target;
      
      // Skip our own UI
      if (element.closest('.tq_overlay') || element === this.overlay) {
        return;
      }
      
      // Clear previous highlight
      this.clearHoverHighlight();
      
      // Check if element is worth capturing
      if (this.isCapturableElement(element)) {
        this.highlightElement(element);
      }
    }

    handleHoverOut(e) {
      if (this.mode !== 'hover') return;
      
      const element = e.target;
      if (element === this.hoveredElement) {
        // Don't clear immediately - let mouseover of new element handle it
      }
    }

    handleHoverClick(e) {
      if (this.mode !== 'hover' || !this.hoveredElement) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      this.captureHoveredElement();
    }

    isCapturableElement(element) {
      // Fabric's element selection logic
      const tagName = element.tagName;
      const hasText = element.textContent && element.textContent.trim().length > 0;
      
      // Images and media
      if (['IMG', 'SVG', 'VIDEO', 'CANVAS'].includes(tagName)) {
        return true;
      }
      
      // Text content
      if (hasText && ['P', 'DIV', 'SPAN', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'ARTICLE', 'SECTION', 'BLOCKQUOTE', 'LI'].includes(tagName)) {
        return true;
      }
      
      return false;
    }

    // FABRIC'S EXACT HIGHLIGHTING (applied directly to elements)
    highlightElement(element) {
      this.hoveredElement = element;
      
      // Apply Fabric's highlighting style directly to the element
      // This is why it doesn't show in dev tools - it's applied and removed dynamically
      element.style.outline = '2px solid #ff6b35';
      element.style.outlineOffset = '2px';
      element.style.backgroundColor = 'rgba(255, 107, 53, 0.1)';
      element.style.cursor = 'pointer';
    }

    clearHoverHighlight() {
      if (this.hoveredElement) {
        // Remove Fabric's highlighting
        this.hoveredElement.style.outline = '';
        this.hoveredElement.style.outlineOffset = '';
        this.hoveredElement.style.backgroundColor = '';
        this.hoveredElement.style.cursor = '';
        this.hoveredElement = null;
      }
    }

    // SCREENSHOT CAPTURE
    async captureScreenshotArea() {
      if (!this.selectionStart || !this.selectionEnd) return;
      
      if (!this.librariesLoaded || !window.html2canvas) {
        this.showToast('Libraries loading... Please try again.', 'error');
        this.cancelMode();
        return;
      }
      
      const left = Math.min(this.selectionStart.x, this.selectionEnd.x);
      const top = Math.min(this.selectionStart.y, this.selectionEnd.y) + window.scrollY;
      const width = Math.abs(this.selectionEnd.x - this.selectionStart.x);
      const height = Math.abs(this.selectionEnd.y - this.selectionStart.y);
      
      if (width < 10 || height < 10) {
        this.showToast('Selection too small. Please select a larger area.', 'error');
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
          allowTaint: true,
          scale: 1
        });
        
        const imageData = canvas.toDataURL('image/png');
        
        this.capturedData = {
          type: 'screenshot',
          url: window.location.href,
          title: document.title,
          content: imageData,
          dimensions: { width, height }
        };
        
        this.showNoteModal();
        
      } catch (error) {
        console.error('Screenshot failed:', error);
        this.showToast('Screenshot failed. Please try again.', 'error');
        this.cancelMode();
      }
    }

    // HOVER ELEMENT CAPTURE
    async captureHoveredElement() {
      if (!this.hoveredElement) return;
      
      const element = this.hoveredElement;
      const isImage = element.tagName === 'IMG';
      
      try {
        let capturedContent;
        let contentType;
        
        if (isImage) {
          capturedContent = await this.captureImageElement(element);
          contentType = 'image';
        } else {
          capturedContent = await this.captureTextElement(element);
          contentType = 'text';
        }
        
        this.capturedData = {
          type: contentType,
          url: window.location.href,
          title: document.title,
          content: capturedContent
        };
        
        this.hideOverlay();
        this.showNoteModal();
        
      } catch (error) {
        console.error('Element capture failed:', error);
        this.showToast('Capture failed. Please try again.', 'error');
        this.cancelMode();
      }
    }

    async captureImageElement(imgElement) {
      return new Promise((resolve) => {
        if (imgElement.complete && imgElement.naturalWidth > 0) {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = imgElement.naturalWidth;
          canvas.height = imgElement.naturalHeight;
          
          try {
            ctx.drawImage(imgElement, 0, 0);
            const dataURL = canvas.toDataURL('image/png');
            resolve({
              dataURL: dataURL,
              src: imgElement.src,
              alt: imgElement.alt || '',
              width: imgElement.naturalWidth,
              height: imgElement.naturalHeight
            });
          } catch (error) {
            resolve({
              dataURL: null,
              src: imgElement.src,
              alt: imgElement.alt || '',
              width: imgElement.naturalWidth,
              height: imgElement.naturalHeight
            });
          }
        } else {
          resolve({
            dataURL: null,
            src: imgElement.src,
            alt: imgElement.alt || '',
            width: imgElement.offsetWidth,
            height: imgElement.offsetHeight
          });
        }
      });
    }

    async captureTextElement(textElement) {
      const computedStyle = window.getComputedStyle(textElement);
      const rect = textElement.getBoundingClientRect();
      
      const textContent = textElement.textContent || textElement.innerText;
      const innerHTML = textElement.innerHTML;
      
      // Extract all links with full styling preservation
      const links = Array.from(textElement.querySelectorAll('a')).map(link => ({
        text: link.textContent,
        href: link.href,
        title: link.title || ''
      }));
      
      return {
        text: textContent,
        html: innerHTML,
        links: links,
        styles: {
          fontSize: computedStyle.fontSize,
          fontFamily: computedStyle.fontFamily,
          color: computedStyle.color,
          backgroundColor: computedStyle.backgroundColor,
          fontWeight: computedStyle.fontWeight,
          fontStyle: computedStyle.fontStyle,
          textAlign: computedStyle.textAlign,
          lineHeight: computedStyle.lineHeight,
          textDecoration: computedStyle.textDecoration
        },
        dimensions: {
          width: rect.width,
          height: rect.height
        }
      };
    }

    // NOTE MODAL
    showNoteModal() {
      this.createNoteModal();
    }

    createNoteModal() {
      if (this.modal) {
        this.modal.remove();
      }
      
      const backdrop = document.createElement('div');
      backdrop.className = 'tq-modal-backdrop';
      
      this.modal = document.createElement('div');
      this.modal.className = 'tq-note-modal';
      
      const modalContent = this.generateModalContent();
      this.modal.innerHTML = modalContent;
      
      document.body.appendChild(backdrop);
      document.body.appendChild(this.modal);
      
      this.bindModalEvents(backdrop);
      
      const textarea = this.modal.querySelector('.tq-textarea');
      if (textarea) {
        setTimeout(() => textarea.focus(), 100);
      }
    }

    generateModalContent() {
      const data = this.capturedData;
      let previewSection = '';
      
      if (data.type === 'screenshot') {
        previewSection = `
          <div class="tq-preview-section">
            <div class="tq-preview-title">Screenshot Preview:</div>
            <div class="tq-preview-content">
              <img src="${data.content}" alt="Screenshot" class="tq-preview-image">
            </div>
          </div>
        `;
      } else if (data.type === 'image' && data.content.dataURL) {
        previewSection = `
          <div class="tq-preview-section">
            <div class="tq-preview-title">Captured Image:</div>
            <div class="tq-preview-content">
              <img src="${data.content.dataURL}" alt="${data.content.alt}" class="tq-preview-image">
            </div>
          </div>
        `;
      } else if (data.type === 'image' && !data.content.dataURL) {
        previewSection = `
          <div class="tq-preview-section">
            <div class="tq-preview-title">Image Source:</div>
            <div class="tq-preview-content">
              <div class="tq-preview-text">${data.content.src}</div>
            </div>
          </div>
        `;
      } else if (data.type === 'text') {
        previewSection = `
          <div class="tq-preview-section">
            <div class="tq-preview-title">Captured Text:</div>
            <div class="tq-preview-content">
              <div class="tq-preview-text">${data.content.text.substring(0, 200)}${data.content.text.length > 200 ? '...' : ''}</div>
            </div>
          </div>
        `;
      }
      
      return `
        <div class="tq-modal-header">
          <h3 class="tq-modal-title">THE QUICKNESS - Add Note</h3>
          <p class="tq-modal-url">${data.url}</p>
        </div>
        
        ${previewSection}
        
        <div class="tq-form-group">
          <label class="tq-label" for="tq-note-input">Your Note:</label>
          <textarea class="tq-textarea" id="tq-note-input" placeholder="Add your note here..."></textarea>
        </div>
        
        <div class="tq-button-group">
          <button class="tq-button tq-button-secondary" id="tq-cancel-btn">Cancel</button>
          <button class="tq-button tq-button-primary" id="tq-save-btn">
            <span class="tq-save-text">Save PDF</span>
          </button>
        </div>
      `;
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
      
      textarea.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
          const note = textarea.value.trim();
          this.savePDF(note);
        }
      });
    }

    closeModal() {
      if (this.modal) {
        const backdrop = document.querySelector('.tq-modal-backdrop');
        if (backdrop) {
          backdrop.remove();
        }
        this.modal.remove();
        this.modal = null;
      }
    }

    // PDF GENERATION (Your exact specifications)
    async savePDF(note) {
      const saveBtn = this.modal.querySelector('#tq-save-btn');
      const saveText = saveBtn.querySelector('.tq-save-text');
      
      saveBtn.disabled = true;
      saveText.innerHTML = '<div class="tq-loading"><div class="tq-spinner"></div> Saving PDF...</div>';
      
      try {
        await this.generateAndSavePDF(note);
        this.showToast('PDF saved successfully!');
        this.closeModal();
        this.cancelMode();
      } catch (error) {
        console.error('PDF save failed:', error);
        this.showToast('Failed to save PDF. Please try again.', 'error');
        
        saveBtn.disabled = false;
        saveText.textContent = 'Save PDF';
      }
    }

    async generateAndSavePDF(note) {
      if (!window.jspdf) {
        throw new Error('jsPDF library not loaded');
      }
      
      const data = this.capturedData;
      
      // Create filename: timestamp + first 2 words of note
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const noteWords = note.split(' ').slice(0, 2).join('-').replace(/[^a-zA-Z0-9-]/g, '') || 'note';
      const filename = `${timestamp}_${noteWords}.pdf`;
      
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF();
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let yPosition = margin;
      
      // Title
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text('THE QUICKNESS Capture', margin, yPosition);
      yPosition += 15;
      
      // Source URL (clickable link as specified)
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(0, 0, 255);
      pdf.textWithLink('Source: ' + data.url, margin, yPosition, { url: data.url });
      pdf.setTextColor(0, 0, 0);
      yPosition += 15;
      
      // Captured content
      if (data.type === 'screenshot' || (data.type === 'image' && data.content.dataURL)) {
        const imgData = data.type === 'screenshot' ? data.content : data.content.dataURL;
        
        const img = new Image();
        img.src = imgData;
        
        await new Promise((resolve) => {
          img.onload = () => {
            const imgWidth = img.width;
            const imgHeight = img.height;
            const ratio = Math.min(contentWidth / imgWidth, (pageHeight - yPosition - 60) / imgHeight);
            
            const displayWidth = imgWidth * ratio;
            const displayHeight = imgHeight * ratio;
            
            pdf.addImage(imgData, 'PNG', margin, yPosition, displayWidth, displayHeight);
            yPosition += displayHeight + 10;
            resolve();
          };
          
          img.onerror = () => {
            pdf.text('Image could not be embedded', margin, yPosition);
            yPosition += 10;
            resolve();
          };
        });
        
      } else if (data.type === 'text') {
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text('Captured Text:', margin, yPosition);
        yPosition += 10;
        
        pdf.setFont(undefined, 'normal');
        
        // Add text with preserved formatting
        const textLines = pdf.splitTextToSize(data.content.text, contentWidth);
        pdf.text(textLines, margin, yPosition);
        yPosition += textLines.length * 5 + 10;
        
        // Add clickable links (preserving links as specified)
        if (data.content.links && data.content.links.length > 0) {
          pdf.setFont(undefined, 'bold');
          pdf.text('Links:', margin, yPosition);
          yPosition += 10;
          
          pdf.setFont(undefined, 'normal');
          pdf.setTextColor(0, 0, 255);
          
          data.content.links.forEach(link => {
            pdf.textWithLink(link.text, margin, yPosition, { url: link.href });
            yPosition += 8;
          });
          
          pdf.setTextColor(0, 0, 0);
          yPosition += 5;
        }
        
      } else if (data.type === 'image' && !data.content.dataURL) {
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text('Image Source:', margin, yPosition);
        yPosition += 10;
        
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(0, 0, 255);
        pdf.textWithLink(data.content.src, margin, yPosition, { url: data.content.src });
        pdf.setTextColor(0, 0, 0);
        yPosition += 15;
      }
      
      // Notes section
      if (note) {
        if (yPosition > pageHeight - 60) {
          pdf.addPage();
          yPosition = margin;
        }
        
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text('Notes:', margin, yPosition);
        yPosition += 10;
        
        pdf.setFont(undefined, 'normal');
        const noteLines = pdf.splitTextToSize(note, contentWidth);
        pdf.text(noteLines, margin, yPosition);
      }
      
      // Save PDF to local hard drive
      const pdfData = pdf.output('arraybuffer');
      this.downloadPDF(pdfData, filename);
    }

    downloadPDF(pdfData, filename) {
      const blob = new Blob([pdfData], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    cancelMode() {
      console.log('Cancelling mode');
      this.isActive = false;
      this.mode = null;
      this.capturedData = null;
      this.hideOverlay();
      this.closeModal();
      this.clearEventListeners();
    }

    clearEventListeners() {
      document.removeEventListener('mouseover', this.handleHover);
      document.removeEventListener('mouseout', this.handleHoverOut);
      document.removeEventListener('click', this.handleHoverClick);
      
      if (this.overlay) {
        this.overlay.removeEventListener('mousedown', this.handleMouseDown);
        this.overlay.removeEventListener('mousemove', this.handleMouseMove);
        this.overlay.removeEventListener('mouseup', this.handleMouseUp);
        this.overlay.style.pointerEvents = 'none';
      }
    }

    showToast(message, type = 'success') {
      const toast = document.createElement('div');
      toast.className = `tq-toast ${type}`;
      toast.textContent = message;
      
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 2147483647;
        font-size: 14px;
        font-weight: 500;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
      `;
      
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
      }, 100);
      
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }
  }

  window.theQuicknessExtension = new TheQuicknessExtension();

})();