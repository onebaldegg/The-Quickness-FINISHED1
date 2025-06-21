// THE QUICKNESS - Professional-Grade Content Script
// Built to exceed Fabric's quality and performance

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
      this.crosshairs = null;
      this.hoveredElement = null;
      this.capturedData = null;
      this.modal = null;
      this.librariesLoaded = false;
      this.animationFrame = null;
      this.keyState = { ctrl: false, alt: false };
      
      this.init();
    }

    init() {
      console.log('THE QUICKNESS initialized - Professional Grade');
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

    // 1. SUPERIOR SELECTION OVERLAY - Smooth, responsive, animated
    createOverlay() {
      // Main overlay with smooth fade-in
      this.overlay = document.createElement('div');
      this.overlay.className = 'tq-overlay';
      this.overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.4);
        z-index: 2147483647;
        cursor: crosshair;
        display: none;
        pointer-events: none;
        transition: all 0.2s ease;
        backdrop-filter: blur(1px);
      `;
      
      // Selection box with smooth animations
      this.selectionBox = document.createElement('div');
      this.selectionBox.className = 'tq-selection-box';
      this.selectionBox.style.cssText = `
        position: absolute;
        border: 2px solid #007cff;
        background: rgba(0, 124, 255, 0.1);
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.8);
        pointer-events: none;
        opacity: 0;
        transform: scale(0.95);
        transition: all 0.1s ease;
        border-radius: 2px;
      `;
      
      // Crosshair guides for precision
      this.crosshairs = document.createElement('div');
      this.crosshairs.className = 'tq-crosshairs';
      this.crosshairs.style.cssText = `
        position: absolute;
        pointer-events: none;
        z-index: 2147483648;
      `;
      
      this.overlay.appendChild(this.selectionBox);
      this.overlay.appendChild(this.crosshairs);
      document.body.appendChild(this.overlay);
    }

    // Enhanced key event handling
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
      console.log('Starting professional screenshot mode');
      this.mode = 'screenshot';
      this.isActive = true;
      this.showOverlaySmooth();
      this.enableScreenshotSelection();
      this.showToast('🎯 Select area to capture - Drag to select');
    }

    startHoverMode() {
      console.log('Starting advanced hover capture');
      this.mode = 'hover';
      this.isActive = true;
      this.showOverlaySmooth();
      this.enableAdvancedHoverCapture();
      this.showToast('🎯 Hover over elements to capture - Click to select');
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

    showOverlaySmooth() {
      this.overlay.style.display = 'block';
      this.overlay.style.opacity = '0';
      
      requestAnimationFrame(() => {
        this.overlay.style.opacity = '1';
      });
      
      document.body.style.userSelect = 'none';
    }

    hideOverlaySmooth() {
      this.overlay.style.opacity = '0';
      
      setTimeout(() => {
        this.overlay.style.display = 'none';
        this.selectionBox.style.opacity = '0';
        this.selectionBox.style.transform = 'scale(0.95)';
      }, 200);
      
      document.body.style.userSelect = '';
      this.clearSelection();
      this.clearHoverHighlight();
    }

    // SUPERIOR SELECTION MECHANISM
    enableScreenshotSelection() {
      this.overlay.style.pointerEvents = 'all';
      
      this.overlay.addEventListener('mousedown', this.handleScreenshotMouseDown.bind(this));
      this.overlay.addEventListener('mousemove', this.handleScreenshotMouseMove.bind(this));
      this.overlay.addEventListener('mouseup', this.handleScreenshotMouseUp.bind(this));
    }

    handleScreenshotMouseDown(e) {
      if (this.mode !== 'screenshot') return;
      
      this.isSelecting = true;
      this.selectionStart = { 
        x: e.clientX, 
        y: e.clientY,
        pageX: e.pageX,
        pageY: e.pageY
      };
      
      this.selectionBox.style.opacity = '1';
      this.selectionBox.style.transform = 'scale(1)';
      this.updateCrosshairs(e.clientX, e.clientY);
      
      e.preventDefault();
    }

    handleScreenshotMouseMove(e) {
      if (!this.isSelecting || this.mode !== 'screenshot') {
        if (this.mode === 'screenshot') {
          this.updateCrosshairs(e.clientX, e.clientY);
        }
        return;
      }
      
      this.selectionEnd = { 
        x: e.clientX, 
        y: e.clientY,
        pageX: e.pageX,
        pageY: e.pageY
      };
      
      // Use requestAnimationFrame for smooth updates
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
      }
      
      this.animationFrame = requestAnimationFrame(() => {
        this.updateSelectionBoxSmooth();
        this.updateCrosshairs(e.clientX, e.clientY);
      });
      
      e.preventDefault();
    }

    handleScreenshotMouseUp(e) {
      if (!this.isSelecting || this.mode !== 'screenshot') return;
      
      this.isSelecting = false;
      this.selectionEnd = { 
        x: e.clientX, 
        y: e.clientY,
        pageX: e.pageX,
        pageY: e.pageY
      };
      
      this.hideCrosshairs();
      this.captureScreenshotArea();
      e.preventDefault();
    }

    updateSelectionBoxSmooth() {
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

    updateCrosshairs(x, y) {
      this.crosshairs.innerHTML = `
        <div style="position: absolute; left: 0; top: ${y}px; width: 100vw; height: 1px; background: rgba(0, 124, 255, 0.6); pointer-events: none;"></div>
        <div style="position: absolute; left: ${x}px; top: 0; width: 1px; height: 100vh; background: rgba(0, 124, 255, 0.6); pointer-events: none;"></div>
      `;
    }

    hideCrosshairs() {
      this.crosshairs.innerHTML = '';
    }

    clearSelection() {
      this.selectionStart = null;
      this.selectionEnd = null;
      this.isSelecting = false;
      this.hideCrosshairs();
      
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
      }
    }

    // 2. ADVANCED HOVER DETECTION - Superior element targeting
    enableAdvancedHoverCapture() {
      this.overlay.style.pointerEvents = 'none';
      this.overlay.style.background = 'rgba(0, 0, 0, 0.2)';
      
      const smartHoverHandler = (e) => {
        if (this.mode !== 'hover') return;
        
        const element = this.findBestTargetElement(e.target);
        
        if (element && element !== this.hoveredElement) {
          this.clearHoverHighlight();
          this.highlightElementProfessional(element);
        }
      };
      
      const preciseClickHandler = (e) => {
        if (this.mode !== 'hover' || !this.hoveredElement) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        this.captureHoveredElement();
      };
      
      document.addEventListener('mouseover', smartHoverHandler);
      document.addEventListener('click', preciseClickHandler);
      
      this.smartHoverHandler = smartHoverHandler;
      this.preciseClickHandler = preciseClickHandler;
    }

    // Smart element detection algorithm
    findBestTargetElement(element) {
      // Skip our UI
      if (element.closest('.tq-overlay') || element.classList.contains('tq-hover-highlight')) {
        return null;
      }
      
      // Score elements based on capture value
      const candidates = this.getElementCandidates(element);
      return this.selectBestCandidate(candidates);
    }

    getElementCandidates(startElement) {
      const candidates = [];
      let current = startElement;
      
      // Walk up the DOM tree to find good candidates
      for (let i = 0; i < 5 && current && current !== document.body; i++) {
        const score = this.scoreElement(current);
        if (score > 0) {
          candidates.push({ element: current, score });
        }
        current = current.parentElement;
      }
      
      return candidates;
    }

    scoreElement(element) {
      let score = 0;
      const rect = element.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(element);
      
      // Size factors
      if (rect.width > 50 && rect.height > 20) score += 10;
      if (rect.width > 200 && rect.height > 100) score += 20;
      
      // Content type scoring
      const tagName = element.tagName;
      
      if (tagName === 'IMG' || tagName === 'SVG') score += 50;
      if (tagName === 'VIDEO' || tagName === 'CANVAS') score += 45;
      if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(tagName)) score += 40;
      if (['P', 'ARTICLE', 'SECTION'].includes(tagName)) score += 35;
      if (['DIV', 'SPAN'].includes(tagName)) score += 10;
      
      // Content quality
      const text = element.textContent?.trim() || '';
      if (text.length > 20) score += 15;
      if (text.length > 100) score += 10;
      
      // Visual significance
      if (computedStyle.backgroundImage !== 'none') score += 20;
      if (parseFloat(computedStyle.fontSize) > 16) score += 10;
      
      // Penalties
      if (rect.width < 30 || rect.height < 15) score -= 20;
      if (computedStyle.display === 'none') score = 0;
      if (computedStyle.visibility === 'hidden') score = 0;
      
      return Math.max(0, score);
    }

    selectBestCandidate(candidates) {
      if (candidates.length === 0) return null;
      
      candidates.sort((a, b) => b.score - a.score);
      return candidates[0].element;
    }

    highlightElementProfessional(element) {
      this.hoveredElement = element;
      
      // Professional highlight with smooth animation
      element.style.outline = '2px solid #ff6b35';
      element.style.outlineOffset = '2px';
      element.style.backgroundColor = 'rgba(255, 107, 53, 0.1)';
      element.style.transition = 'all 0.15s ease';
      element.style.transform = 'scale(1.01)';
      element.style.boxShadow = '0 4px 20px rgba(255, 107, 53, 0.3)';
      element.classList.add('tq-hover-highlight');
      
      // Add selection indicator
      const indicator = document.createElement('div');
      indicator.className = 'tq-hover-indicator';
      indicator.style.cssText = `
        position: absolute;
        top: -8px;
        left: -8px;
        background: #ff6b35;
        color: white;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 11px;
        font-weight: bold;
        z-index: 2147483648;
        pointer-events: none;
      `;
      indicator.textContent = '✓ Click to capture';
      
      const rect = element.getBoundingClientRect();
      indicator.style.position = 'fixed';
      indicator.style.top = (rect.top - 8) + 'px';
      indicator.style.left = (rect.left - 8) + 'px';
      
      document.body.appendChild(indicator);
      this.hoverIndicator = indicator;
    }

    clearHoverHighlight() {
      if (this.hoveredElement) {
        this.hoveredElement.style.outline = '';
        this.hoveredElement.style.outlineOffset = '';
        this.hoveredElement.style.backgroundColor = '';
        this.hoveredElement.style.transition = '';
        this.hoveredElement.style.transform = '';
        this.hoveredElement.style.boxShadow = '';
        this.hoveredElement.classList.remove('tq-hover-highlight');
        this.hoveredElement = null;
      }
      
      if (this.hoverIndicator) {
        this.hoverIndicator.remove();
        this.hoverIndicator = null;
      }
    }

    // 3. HIGH-QUALITY SCREENSHOT CAPTURE
    async captureScreenshotArea() {
      if (!this.selectionStart || !this.selectionEnd) return;
      
      if (!this.librariesLoaded || !window.html2canvas) {
        this.showToast('⚠️ Libraries loading... Please try again.', 'error');
        this.cancelMode();
        return;
      }
      
      const left = Math.min(this.selectionStart.pageX, this.selectionEnd.pageX);
      const top = Math.min(this.selectionStart.pageY, this.selectionEnd.pageY);
      const width = Math.abs(this.selectionEnd.pageX - this.selectionStart.pageX);
      const height = Math.abs(this.selectionEnd.pageY - this.selectionStart.pageY);
      
      if (width < 10 || height < 10) {
        this.showToast('❌ Selection too small. Please select a larger area.', 'error');
        this.cancelMode();
        return;
      }
      
      try {
        // Show capture progress
        this.showToast('📸 Capturing high-quality screenshot...', 'info');
        
        this.hideOverlaySmooth();
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // High-quality capture with optimized settings
        const canvas = await window.html2canvas(document.body, {
          x: left,
          y: top,
          width: width,
          height: height,
          useCORS: true,
          allowTaint: false,
          scale: window.devicePixelRatio || 1, // High-DPI support
          backgroundColor: null,
          removeContainer: true,
          scrollX: 0,
          scrollY: 0,
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight
        });
        
        // Convert to high-quality PNG
        const imageData = canvas.toDataURL('image/png', 1.0);
        
        this.capturedData = {
          type: 'screenshot',
          url: window.location.href,
          title: document.title,
          content: imageData,
          dimensions: { width, height },
          quality: 'high-dpi'
        };
        
        this.showNoteModal();
        
      } catch (error) {
        console.error('High-quality capture failed:', error);
        this.showToast('❌ Capture failed. Please try again.', 'error');
        this.cancelMode();
      }
    }

    async captureHoveredElement() {
      if (!this.hoveredElement) return;
      
      const element = this.hoveredElement;
      const isImage = element.tagName === 'IMG';
      
      try {
        this.showToast('📸 Capturing element with formatting...', 'info');
        
        let capturedContent;
        let contentType;
        
        if (isImage) {
          capturedContent = await this.captureImageElementHQ(element);
          contentType = 'image';
        } else {
          capturedContent = await this.captureTextElementHQ(element);
          contentType = 'text';
        }
        
        this.capturedData = {
          type: contentType,
          url: window.location.href,
          title: document.title,
          content: capturedContent,
          element: this.getElementInfo(element),
          quality: 'professional'
        };
        
        this.hideOverlaySmooth();
        this.showNoteModal();
        
      } catch (error) {
        console.error('Element capture failed:', error);
        this.showToast('❌ Capture failed. Please try again.', 'error');
        this.cancelMode();
      }
    }

    async captureImageElementHQ(imgElement) {
      return new Promise((resolve) => {
        if (imgElement.complete && imgElement.naturalWidth > 0) {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // High-quality canvas settings
          canvas.width = imgElement.naturalWidth;
          canvas.height = imgElement.naturalHeight;
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          try {
            ctx.drawImage(imgElement, 0, 0);
            const dataURL = canvas.toDataURL('image/png', 1.0);
            resolve({
              dataURL: dataURL,
              src: imgElement.src,
              alt: imgElement.alt || '',
              width: imgElement.naturalWidth,
              height: imgElement.naturalHeight,
              quality: 'original'
            });
          } catch (error) {
            resolve({
              dataURL: null,
              src: imgElement.src,
              alt: imgElement.alt || '',
              width: imgElement.naturalWidth,
              height: imgElement.naturalHeight,
              quality: 'reference'
            });
          }
        } else {
          // Handle loading images
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            try {
              ctx.drawImage(img, 0, 0);
              const dataURL = canvas.toDataURL('image/png', 1.0);
              resolve({
                dataURL: dataURL,
                src: imgElement.src,
                alt: imgElement.alt || '',
                width: img.naturalWidth,
                height: img.naturalHeight,
                quality: 'high'
              });
            } catch (error) {
              resolve({
                dataURL: null,
                src: imgElement.src,
                alt: imgElement.alt || '',
                width: img.naturalWidth,
                height: img.naturalHeight,
                quality: 'reference'
              });
            }
          };
          
          img.onerror = () => {
            resolve({
              dataURL: null,
              src: imgElement.src,
              alt: imgElement.alt || '',
              width: imgElement.offsetWidth,
              height: imgElement.offsetHeight,
              quality: 'fallback'
            });
          };
          
          img.src = imgElement.src;
        }
      });
    }

    async captureTextElementHQ(textElement) {
      const computedStyle = window.getComputedStyle(textElement);
      const rect = textElement.getBoundingClientRect();
      
      const textContent = textElement.textContent || textElement.innerText;
      const innerHTML = textElement.innerHTML;
      
      // Advanced link extraction with context
      const links = Array.from(textElement.querySelectorAll('a')).map(link => ({
        text: link.textContent,
        href: link.href,
        title: link.title || '',
        context: this.getLinkContext(link)
      }));
      
      // Comprehensive style preservation
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
          textDecoration: computedStyle.textDecoration,
          letterSpacing: computedStyle.letterSpacing,
          wordSpacing: computedStyle.wordSpacing,
          textTransform: computedStyle.textTransform,
          borderRadius: computedStyle.borderRadius,
          padding: computedStyle.padding,
          margin: computedStyle.margin
        },
        dimensions: {
          width: rect.width,
          height: rect.height
        },
        quality: 'complete-formatting'
      };
    }

    getLinkContext(linkElement) {
      const parent = linkElement.parentElement;
      if (!parent) return '';
      
      const siblings = Array.from(parent.childNodes);
      const linkIndex = siblings.indexOf(linkElement);
      
      const beforeText = siblings.slice(Math.max(0, linkIndex - 2), linkIndex)
        .map(node => node.textContent || '').join('').trim();
      const afterText = siblings.slice(linkIndex + 1, linkIndex + 3)
        .map(node => node.textContent || '').join('').trim();
      
      return `${beforeText} [LINK] ${afterText}`.trim();
    }

    getElementInfo(element) {
      return {
        tagName: element.tagName,
        className: element.className,
        id: element.id,
        attributes: Array.from(element.attributes).reduce((acc, attr) => {
          acc[attr.name] = attr.value;
          return acc;
        }, {}),
        xpath: this.getElementXPath(element)
      };
    }

    getElementXPath(element) {
      if (element.id) {
        return `//*[@id="${element.id}"]`;
      }
      
      const parts = [];
      let current = element;
      
      while (current && current.nodeType === Node.ELEMENT_NODE) {
        let index = 0;
        let sibling = current.previousSibling;
        
        while (sibling) {
          if (sibling.nodeType === Node.ELEMENT_NODE && sibling.tagName === current.tagName) {
            index++;
          }
          sibling = sibling.previousSibling;
        }
        
        const tagName = current.tagName.toLowerCase();
        const part = index > 0 ? `${tagName}[${index + 1}]` : tagName;
        parts.unshift(part);
        
        current = current.parentNode;
      }
      
      return parts.length ? '/' + parts.join('/') : '';
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
      let qualityBadge = '';
      
      if (data.quality) {
        qualityBadge = `<span style="background: #28a745; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px; margin-left: 8px;">🎯 ${data.quality}</span>`;
      }
      
      if (data.type === 'screenshot') {
        previewSection = `
          <div class="tq-preview-section">
            <div class="tq-preview-title">📸 Screenshot Preview ${qualityBadge}</div>
            <div class="tq-preview-content">
              <img src="${data.content}" alt="Screenshot" class="tq-preview-image">
            </div>
          </div>
        `;
      } else if (data.type === 'image' && data.content.dataURL) {
        previewSection = `
          <div class="tq-preview-section">
            <div class="tq-preview-title">🖼️ Captured Image ${qualityBadge}</div>
            <div class="tq-preview-content">
              <img src="${data.content.dataURL}" alt="${data.content.alt}" class="tq-preview-image">
            </div>
          </div>
        `;
      } else if (data.type === 'image' && !data.content.dataURL) {
        previewSection = `
          <div class="tq-preview-section">
            <div class="tq-preview-title">🔗 Image Reference ${qualityBadge}</div>
            <div class="tq-preview-content">
              <div class="tq-preview-text">${data.content.src}</div>
            </div>
          </div>
        `;
      } else if (data.type === 'text') {
        previewSection = `
          <div class="tq-preview-section">
            <div class="tq-preview-title">📝 Captured Text ${qualityBadge}</div>
            <div class="tq-preview-content">
              <div class="tq-preview-text">${data.content.text.substring(0, 200)}${data.content.text.length > 200 ? '...' : ''}</div>
            </div>
          </div>
        `;
      }
      
      return `
        <div class="tq-modal-header">
          <h3 class="tq-modal-title">🚀 THE QUICKNESS - Professional Capture</h3>
          <p class="tq-modal-url">${data.url}</p>
        </div>
        
        ${previewSection}
        
        <div class="tq-form-group">
          <label class="tq-label" for="tq-note-input">✍️ Your Note:</label>
          <textarea class="tq-textarea" id="tq-note-input" placeholder="Add your professional note here..."></textarea>
        </div>
        
        <div class="tq-button-group">
          <button class="tq-button tq-button-secondary" id="tq-cancel-btn">Cancel</button>
          <button class="tq-button tq-button-primary" id="tq-save-btn">
            <span class="tq-save-text">💾 Save Professional PDF</span>
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
        this.saveProfessionalPDF(note);
      });
      
      backdrop.addEventListener('click', () => {
        this.closeModal();
        this.cancelMode();
      });
      
      textarea.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
          const note = textarea.value.trim();
          this.saveProfessionalPDF(note);
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

    async saveProfessionalPDF(note) {
      const saveBtn = this.modal.querySelector('#tq-save-btn');
      const saveText = saveBtn.querySelector('.tq-save-text');
      
      saveBtn.disabled = true;
      saveText.innerHTML = '🔄 <div class="tq-loading"><div class="tq-spinner"></div> Creating Professional PDF...</div>';
      
      try {
        await this.generateProfessionalPDF(note);
        this.showToast('✅ Professional PDF saved successfully!');
        this.closeModal();
        this.cancelMode();
      } catch (error) {
        console.error('PDF creation failed:', error);
        this.showToast('❌ Failed to create PDF. Please try again.', 'error');
        
        saveBtn.disabled = false;
        saveText.innerHTML = '💾 Save Professional PDF';
      }
    }

    async generateProfessionalPDF(note) {
      if (!window.jspdf) {
        throw new Error('jsPDF library not loaded');
      }
      
      const data = this.capturedData;
      
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
      
      // Professional header
      pdf.setFontSize(18);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(0, 124, 255);
      pdf.text('🚀 THE QUICKNESS', margin, yPosition);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Professional Capture • ${new Date().toLocaleDateString()}`, margin, yPosition + 8);
      yPosition += 25;
      
      // Source URL (clickable)
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(0, 0, 255);
      pdf.textWithLink('🔗 Source: ' + data.url, margin, yPosition, { url: data.url });
      pdf.setTextColor(0, 0, 0);
      yPosition += 15;
      
      // Quality indicator
      if (data.quality) {
        pdf.setFontSize(8);
        pdf.setTextColor(40, 167, 69);
        pdf.text(`✨ Quality: ${data.quality}`, margin, yPosition);
        yPosition += 12;
      }
      
      // Content section
      if (data.type === 'screenshot' || (data.type === 'image' && data.content.dataURL)) {
        const imgData = data.type === 'screenshot' ? data.content : data.content.dataURL;
        
        const img = new Image();
        img.src = imgData;
        
        await new Promise((resolve) => {
          img.onload = () => {
            const imgWidth = img.width;
            const imgHeight = img.height;
            const ratio = Math.min(contentWidth / imgWidth, (pageHeight - yPosition - 80) / imgHeight);
            
            const displayWidth = imgWidth * ratio;
            const displayHeight = imgHeight * ratio;
            
            // Center the image
            const xOffset = (pageWidth - displayWidth) / 2;
            
            pdf.addImage(imgData, 'PNG', xOffset, yPosition, displayWidth, displayHeight);
            yPosition += displayHeight + 15;
            resolve();
          };
          
          img.onerror = () => {
            pdf.setTextColor(220, 53, 69);
            pdf.text('⚠️ Image could not be embedded', margin, yPosition);
            yPosition += 15;
            resolve();
          };
        });
        
      } else if (data.type === 'text') {
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text('📝 Captured Text:', margin, yPosition);
        yPosition += 12;
        
        pdf.setFont(undefined, 'normal');
        pdf.setFontSize(10);
        
        const textLines = pdf.splitTextToSize(data.content.text, contentWidth);
        pdf.text(textLines, margin, yPosition);
        yPosition += textLines.length * 4 + 15;
        
        // Professional link handling
        if (data.content.links && data.content.links.length > 0) {
          pdf.setFont(undefined, 'bold');
          pdf.setFontSize(11);
          pdf.text('🔗 Links:', margin, yPosition);
          yPosition += 12;
          
          pdf.setFont(undefined, 'normal');
          pdf.setFontSize(9);
          pdf.setTextColor(0, 0, 255);
          
          data.content.links.forEach(link => {
            const linkText = `• ${link.text}`;
            pdf.textWithLink(linkText, margin, yPosition, { url: link.href });
            yPosition += 10;
          });
          
          pdf.setTextColor(0, 0, 0);
          yPosition += 10;
        }
        
      } else if (data.type === 'image' && !data.content.dataURL) {
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text('🖼️ Image Reference:', margin, yPosition);
        yPosition += 12;
        
        pdf.setFont(undefined, 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 255);
        pdf.textWithLink(data.content.src, margin, yPosition, { url: data.content.src });
        pdf.setTextColor(0, 0, 0);
        yPosition += 20;
      }
      
      // Professional notes section
      if (note) {
        if (yPosition > pageHeight - 80) {
          pdf.addPage();
          yPosition = margin;
        }
        
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(0, 124, 255);
        pdf.text('✍️ Professional Notes:', margin, yPosition);
        yPosition += 15;
        
        pdf.setFont(undefined, 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        const noteLines = pdf.splitTextToSize(note, contentWidth);
        pdf.text(noteLines, margin, yPosition);
        yPosition += noteLines.length * 4 + 15;
      }
      
      // Professional footer
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text('Generated by THE QUICKNESS • Professional Web Capture Extension', margin, pageHeight - 10);
      
      // Download the professional PDF
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
      console.log('Cancelling professional mode');
      this.isActive = false;
      this.mode = null;
      this.capturedData = null;
      this.hideOverlaySmooth();
      this.closeModal();
      this.clearEventListeners();
    }

    clearEventListeners() {
      if (this.smartHoverHandler) {
        document.removeEventListener('mouseover', this.smartHoverHandler);
      }
      if (this.preciseClickHandler) {
        document.removeEventListener('click', this.preciseClickHandler);
      }
      
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
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007cff'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        z-index: 2147483647;
        font-size: 14px;
        font-weight: 500;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        max-width: 300px;
      `;
      toast.textContent = message;
      
      document.body.appendChild(toast);
      
      requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
      });
      
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
      }, 4000);
    }
  }

  window.theQuicknessExtension = new TheQuicknessExtension();

})();