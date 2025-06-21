// THE QUICKNESS - Content Script (Basic Working Version)

(function() {
  'use strict';
  
  if (window.theQuicknessExtension) {
    return;
  }

  class TheQuicknessExtension {
    constructor() {
      this.isActive = false;
      this.mode = null;
      this.overlay = null;
      this.modal = null;
      this.capturedData = null;
      
      this.init();
    }

    init() {
      console.log('THE QUICKNESS extension initialized');
      this.createOverlay();
      this.bindEvents();
    }

    createOverlay() {
      this.overlay = document.createElement('div');
      this.overlay.className = 'tq-overlay';
      this.overlay.style.display = 'none';
      document.body.appendChild(this.overlay);
    }

    bindEvents() {
      document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey) {
          if (e.key === 'S') {
            e.preventDefault();
          } else if (e.key === 'C') {
            e.preventDefault();  
          } else if (e.key === 'N') {
            e.preventDefault();
          }
        }
        
        if (e.key === 'Escape' && this.isActive) {
          e.preventDefault();
          this.cancelMode();
        }
      });
    }

    startScreenshotMode() {
      console.log('Screenshot mode activated');
      this.mode = 'screenshot';
      this.isActive = true;
      this.capturedData = {
        type: 'screenshot',
        url: window.location.href,
        title: document.title
      };
      this.showToast('Screenshot mode - Add your note below');
      this.showNoteModal();
    }

    startHoverMode() {
      console.log('Hover capture mode activated');
      this.mode = 'hover';
      this.isActive = true;
      this.capturedData = {
        type: 'text capture',
        url: window.location.href,
        title: document.title
      };
      this.showToast('Hover capture mode - Add your note below');
      this.showNoteModal();
    }

    startQuickNoteMode() {
      console.log('Quick note mode activated');
      this.mode = 'note';
      this.isActive = true;
      this.capturedData = {
        type: 'quick note',
        url: window.location.href,
        title: document.title
      };
      this.showNoteModal();
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
      
      this.modal.innerHTML = `
        <div class="tq-modal-header">
          <h3 class="tq-modal-title">THE QUICKNESS - Add Note</h3>
          <p class="tq-modal-url">${this.capturedData.url}</p>
        </div>
        
        <div class="tq-preview-section">
          <div class="tq-preview-title">Capture Type: ${this.capturedData.type}</div>
        </div>
        
        <div class="tq-form-group">
          <label class="tq-label" for="tq-note-input">Your Note:</label>
          <textarea class="tq-textarea" id="tq-note-input" placeholder="Add your note here..."></textarea>
        </div>
        
        <div class="tq-button-group">
          <button class="tq-button tq-button-secondary" id="tq-cancel-btn">Cancel</button>
          <button class="tq-button tq-button-primary" id="tq-save-btn">Save</button>
        </div>
      `;
      
      document.body.appendChild(backdrop);
      document.body.appendChild(this.modal);
      
      this.bindModalEvents(backdrop);
      
      const textarea = this.modal.querySelector('.tq-textarea');
      if (textarea) {
        setTimeout(() => textarea.focus(), 100);
      }
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
        this.saveCapture(note);
      });
      
      backdrop.addEventListener('click', () => {
        this.closeModal();
        this.cancelMode();
      });
    }

    saveCapture(note) {
      const saveBtn = this.modal.querySelector('#tq-save-btn');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
      
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const noteWords = note.split(' ').slice(0, 2).join('-').replace(/[^a-zA-Z0-9-]/g, '') || 'note';
        const filename = `${timestamp}_${noteWords}.txt`;
        
        const content = this.generateTextContent(note);
        
        this.downloadAsFile(content, filename);
        
        this.showToast('File saved successfully!');
        this.closeModal();
        this.cancelMode();
        
      } catch (error) {
        console.error('Save failed:', error);
        this.showToast('Failed to save. Please try again.', 'error');
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save';
      }
    }

    downloadAsFile(content, filename) {
      const blob = new Blob([content], { type: 'text/plain' });
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

    generateTextContent(note) {
      const data = this.capturedData;
      let content = 'THE QUICKNESS Capture\n';
      content += '========================\n\n';
      content += `Source: ${data.url}\n`;
      content += `Title: ${data.title}\n`;
      content += `Date: ${new Date().toISOString()}\n`;
      content += `Type: ${data.type}\n\n`;
      
      if (note) {
        content += 'Notes:\n';
        content += note + '\n\n';
      }
      
      content += 'Generated by THE QUICKNESS Chrome Extension\n';
      
      return content;
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

    cancelMode() {
      this.isActive = false;
      this.mode = null;
      this.capturedData = null;
      this.closeModal();
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