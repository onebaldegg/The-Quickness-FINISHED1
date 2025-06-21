// THE QUICKNESS - Content Script (Full PDF Functionality)
// Complete functionality: screenshot, hover capture with formatting, PDF generation

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
      this.selectionArea = null;
      this.hoveredElement = null;
      this.capturedData = null;
      this.modal = null;
      this.librariesLoaded = false;
      
      this.init();
    }

    init() {
      console.log('THE QUICKNESS extension initialized - Full PDF version');
      this.createOverlay();
      this.bindEvents();
      this.loadLibraries();
    }

    async loadLibraries() {
      try {
        // Wait for libraries to be available
        let attempts = 0;
        const maxAttempts = 50;
        
        while ((!window.jspdf || !window.html2canvas) && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (window.jspdf && window.html2canvas) {
          this.librariesLoaded = true;
          console.log('✅ PDF libraries loaded successfully');
        } else {
          console.error('❌ Failed to load PDF libraries');
        }
      } catch (error) {
        console.error('❌ Error loading libraries:', error);
      }
    }

    createOverlay() {
      this.overlay = document.createElement('div');
      this.overlay.className = 'tq-overlay';
      this.overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.3);
        z-index: 2147483647;
        cursor: crosshair;
        display: none;
        pointer-events: none;
      `;
      document.body.appendChild(this.overlay);
    }

    bindEvents() {
      let isCtrlAltPressed = false;
      
      // Track Ctrl+Alt key states more precisely like Fabric
      document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.altKey) {
          isCtrlAltPressed = true;
          
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
          isCtrlAltPressed = false;
          if (this.mode === 'hover' && this.isActive) {
            this.cancelMode();
          }
        }
      });

      // Better mouse handling like Fabric
      document.addEventListener('mousedown', (e) => {
        if (isCtrlAltPressed && !this.isActive) {
          e.preventDefault();
          this.startScreenshotMode();
        }
      });
    }

    startScreenshotMode() {
      console.log('Starting screenshot region capture mode');
      this.mode = 'screenshot';
      this.isActive = true;
      this.showOverlay();
      this.enableScreenshotSelection();
      this.showToast('Click and drag to select screenshot area (ESC to cancel)');
    }

    startHoverMode() {
      console.log('Starting hover capture mode with formatting preservation');
      this.mode = 'hover';
      this.isActive = true;
      this.showOverlay();
      this.enableHoverCapture();
      this.showToast('Hover over images or text to capture with formatting (ESC to cancel)');
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
      document.body.classList.add('tq-capturing');
    }

    hideOverlay() {
      this.overlay.style.display = 'none';
      document.body.classList.remove('tq-capturing', 'tq-hovering');
      this.clearSelection();
      this.clearHoverHighlight();
    }

    enableScreenshotSelection() {
      this.overlay.style.cursor = 'crosshair';
      this.overlay.style.pointerEvents = 'all';
      
      this.overlay.addEventListener('mousedown', this.handleScreenshotMouseDown.bind(this));
      this.overlay.addEventListener('mousemove', this.handleScreenshotMouseMove.bind(this));
      this.overlay.addEventListener('mouseup', this.handleScreenshotMouseUp.bind(this));
    }

    handleScreenshotMouseDown(e) {
      if (this.mode !== 'screenshot') return;
      
      this.isSelecting = true;
      this.selectionStart = { x: e.clientX, y: e.clientY };
      
      this.createSelectionArea();
      e.preventDefault();
    }

    handleScreenshotMouseMove(e) {
      if (!this.isSelecting || this.mode !== 'screenshot') return;
      
      this.selectionEnd = { x: e.clientX, y: e.clientY };
      this.updateSelectionArea();
      e.preventDefault();
    }

    handleScreenshotMouseUp(e) {
      if (!this.isSelecting || this.mode !== 'screenshot') return;
      
      this.isSelecting = false;
      this.selectionEnd = { x: e.clientX, y: e.clientY };
      
      this.captureScreenshotArea();
      e.preventDefault();
    }

    createSelectionArea() {
      if (this.selectionArea) {
        this.selectionArea.remove();
      }
      
      this.selectionArea = document.createElement('div');
      this.selectionArea.className = 'tq-selection-area';
      this.overlay.appendChild(this.selectionArea);
    }

    updateSelectionArea() {
      if (!this.selectionArea || !this.selectionStart || !this.selectionEnd) return;
      
      const left = Math.min(this.selectionStart.x, this.selectionEnd.x);
      const top = Math.min(this.selectionStart.y, this.selectionEnd.y);
      const width = Math.abs(this.selectionEnd.x - this.selectionStart.x);
      const height = Math.abs(this.selectionEnd.y - this.selectionStart.y);
      
      this.selectionArea.style.left = left + 'px';
      this.selectionArea.style.top = top + 'px';
      this.selectionArea.style.width = width + 'px';
      this.selectionArea.style.height = height + 'px';
    }

    clearSelection() {
      if (this.selectionArea) {
        this.selectionArea.remove();
        this.selectionArea = null;
      }
      this.selectionStart = null;
      this.selectionEnd = null;
      this.isSelecting = false;
    }

    async captureScreenshotArea() {
      if (!this.selectionStart || !this.selectionEnd) return;
      
      if (!this.librariesLoaded || !window.html2canvas) {
        this.showToast('PDF libraries not loaded yet. Please try again.', 'error');
        this.cancelMode();
        return;
      }
      
      const left = Math.min(this.selectionStart.x, this.selectionEnd.x);
      const top = Math.min(this.selectionStart.y, this.selectionEnd.y);
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
          y: top + window.scrollY,
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
        console.error('Screenshot capture failed:', error);
        this.showToast('Screenshot capture failed. Please try again.', 'error');
        this.cancelMode();
      }
    }

    enableHoverCapture() {
      document.body.classList.add('tq-hovering');
      this.overlay.style.pointerEvents = 'none';
      this.overlay.style.background = 'rgba(0, 0, 0, 0.1)';
      
      // More precise hover detection like Fabric
      const hoverHandler = (e) => {
        if (this.mode !== 'hover') return;
        
        const element = e.target;
        
        // Skip our own UI elements
        if (element.closest('.tq-overlay') || element.classList.contains('tq-hover-highlight')) {
          return;
        }
        
        // Better element detection logic like Fabric
        const isImage = element.tagName === 'IMG';
        const isSVG = element.tagName === 'SVG' || element.closest('svg');
        const isVideo = element.tagName === 'VIDEO';
        const hasText = element.textContent && element.textContent.trim().length > 3;
        const isContentElement = [
          'P', 'DIV', 'SPAN', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 
          'ARTICLE', 'SECTION', 'BLOCKQUOTE', 'LI', 'TD', 'TH'
        ].includes(element.tagName);
        
        // More intelligent element selection
        const isValidTarget = isImage || isSVG || isVideo || 
          (hasText && isContentElement && element.offsetWidth > 50 && element.offsetHeight > 20);
        
        if (isValidTarget) {
          this.clearHoverHighlight();
          this.hoveredElement = element;
          
          // Better highlighting like Fabric
          element.style.outline = '2px solid #ff6b35';
          element.style.outlineOffset = '2px';
          element.style.backgroundColor = 'rgba(255, 107, 53, 0.1)';
          element.classList.add('tq-hover-highlight');
        }
      };
      
      const clickHandler = (e) => {
        if (this.mode !== 'hover' || !this.hoveredElement) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        this.captureHoveredElement();
      };
      
      document.addEventListener('mouseover', hoverHandler);
      document.addEventListener('click', clickHandler);
      
      // Store handlers for cleanup
      this.hoverHandler = hoverHandler;
      this.clickHandler = clickHandler;
    }

    handleHoverMouseOver(e) {
      if (this.mode !== 'hover') return;
      
      const element = e.target;
      
      if (element.closest('.tq-overlay') || element.classList.contains('tq-hover-highlight')) {
        return;
      }
      
      const isImage = element.tagName === 'IMG';
      const hasText = element.textContent && element.textContent.trim().length > 0;
      const isContentElement = ['P', 'DIV', 'SPAN', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'ARTICLE', 'SECTION'].includes(element.tagName);
      
      if (isImage || (hasText && isContentElement)) {
        this.clearHoverHighlight();
        this.hoveredElement = element;
        element.classList.add('tq-hover-highlight');
      }
    }

    handleHoverMouseOut(e) {
      if (this.mode !== 'hover') return;
      
      const element = e.target;
      if (element === this.hoveredElement) {
        this.clearHoverHighlight();
      }
    }

    handleHoverClick(e) {
      if (this.mode !== 'hover' || !this.hoveredElement) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      this.captureHoveredElement();
    }

    clearHoverHighlight() {
      if (this.hoveredElement) {
        this.hoveredElement.style.outline = '';
        this.hoveredElement.style.outlineOffset = '';
        this.hoveredElement.style.backgroundColor = '';
        this.hoveredElement.classList.remove('tq-hover-highlight');
        this.hoveredElement = null;
      }
    }

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
          content: capturedContent,
          element: this.getElementInfo(element)
        };
        
        this.hideOverlay();
        this.showNoteModal();
        
      } catch (error) {
        console.error('Hover capture failed:', error);
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
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            
            try {
              ctx.drawImage(img, 0, 0);
              const dataURL = canvas.toDataURL('image/png');
              resolve({
                dataURL: dataURL,
                src: imgElement.src,
                alt: imgElement.alt || '',
                width: img.naturalWidth,
                height: img.naturalHeight
              });
            } catch (error) {
              resolve({
                dataURL: null,
                src: imgElement.src,
                alt: imgElement.alt || '',
                width: img.naturalWidth,
                height: img.naturalHeight
              });
            }
          };
          
          img.onerror = () => {
            resolve({
              dataURL: null,
              src: imgElement.src,
              alt: imgElement.alt || '',
              width: imgElement.offsetWidth,
              height: imgElement.offsetHeight
            });
          };
          
          img.src = imgElement.src;
        }
      });
    }

    async captureTextElement(textElement) {
      const computedStyle = window.getComputedStyle(textElement);
      const rect = textElement.getBoundingClientRect();
      
      const textContent = textElement.textContent || textElement.innerText;
      const innerHTML = textElement.innerHTML;
      
      // Preserve ALL formatting and links
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

    getElementInfo(element) {
      return {
        tagName: element.tagName,
        className: element.className,
        id: element.id,
        attributes: Array.from(element.attributes).reduce((acc, attr) => {
          acc[attr.name] = attr.value;
          return acc;
        }, {})
      };
    }

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
            <div class="tq-preview-title">Captured Text with Formatting:</div>
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
      
      // URL (clickable)
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(0, 0, 255);
      pdf.textWithLink('Source: ' + data.url, margin, yPosition, { url: data.url });
      pdf.setTextColor(0, 0, 0);
      yPosition += 15;
      
      // Content based on type
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
        pdf.text('Captured Text with Formatting:', margin, yPosition);
        yPosition += 10;
        
        pdf.setFont(undefined, 'normal');
        
        // Preserve text with formatting
        const textLines = pdf.splitTextToSize(data.content.text, contentWidth);
        pdf.text(textLines, margin, yPosition);
        yPosition += textLines.length * 5 + 10;
        
        // Add clickable links
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
      
      // Download PDF
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
      console.log('Cancelling current mode');
      this.isActive = false;
      this.mode = null;
      this.capturedData = null;
      this.hideOverlay();
      this.closeModal();
      this.clearEventListeners();
    }

    clearEventListeners() {
      document.removeEventListener('mouseover', this.handleHoverMouseOver);
      document.removeEventListener('mouseout', this.handleHoverMouseOut);
      document.removeEventListener('click', this.handleHoverClick);
      
      if (this.overlay) {
        this.overlay.removeEventListener('mousedown', this.handleScreenshotMouseDown);
        this.overlay.removeEventListener('mousemove', this.handleScreenshotMouseMove);
        this.overlay.removeEventListener('mouseup', this.handleScreenshotMouseUp);
        this.overlay.style.pointerEvents = 'none';
      }
    }

    showToast(message, type = 'success') {
      const toast = document.createElement('div');
      toast.className = `tq-toast ${type}`;
      toast.textContent = message;
      
      document.body.appendChild(toast);
      
      setTimeout(() => toast.classList.add('show'), 100);
      
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }
  }

  window.theQuicknessExtension = new TheQuicknessExtension();

})();