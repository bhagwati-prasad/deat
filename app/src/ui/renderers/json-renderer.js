/**
 * JSONRenderer - Renders graph as formatted JSON
 *
 * Useful for debugging and viewing raw graph state.
 * Provides editable, pretty-printed JSON view.
 *
 * See: ../../doc/modules/ui/RendererContract.md
 */

import { BaseRenderer } from './base-renderer.js';

export class JSONRenderer extends BaseRenderer {
  constructor(options = {}) {
    super(options);
    this.currentSnapshot = null;
    this.searchTerm = '';
    this.searchInput = null;
    this.jsonTextarea = null;
    this.isEditable = true;
  }

  init(container, options = {}) {
    super.init(container, options);
    if (!container) return;

    container.innerHTML = '';
    container.className = 'gs-json-renderer renderer-content';
    container.style.cssText = `
      background: ${this.theme === 'dark' ? '#1e1e1e' : '#f5f5f5'};
      color: ${this.theme === 'dark' ? '#d4d4d4' : '#333'};
      padding: 0;
      font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.6;
      flex-direction: column;
    `;

    // Add toolbar
    this._createToolbar();
    
    // Add content container with textarea
    const contentDiv = document.createElement('div');
    contentDiv.className = 'json-content';
    contentDiv.style.cssText = 'flex: 1; overflow: hidden; padding: 0; position: relative;';
    
    // Create editable textarea
    this.jsonTextarea = document.createElement('textarea');
    this.jsonTextarea.className = 'json-textarea';
    this.jsonTextarea.spellcheck = false;
    this.jsonTextarea.style.cssText = `
      width: 100%;
      height: 100%;
      padding: 20px;
      border: none;
      outline: none;
      resize: none;
      background: ${this.theme === 'dark' ? '#1e1e1e' : '#f5f5f5'};
      color: ${this.theme === 'dark' ? '#d4d4d4' : '#333'};
      font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.6;
      tab-size: 2;
      -moz-tab-size: 2;
    `;
    
    // Handle tab key for indentation
    this.jsonTextarea.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.jsonTextarea.selectionStart;
        const end = this.jsonTextarea.selectionEnd;
        const value = this.jsonTextarea.value;
        
        // Insert two spaces for tab
        this.jsonTextarea.value = value.substring(0, start) + '  ' + value.substring(end);
        this.jsonTextarea.selectionStart = this.jsonTextarea.selectionEnd = start + 2;
      }
    });
    
    // Auto-save on blur or Ctrl+S
    this.jsonTextarea.addEventListener('blur', () => {
      this._applyChanges();
    });
    
    this.jsonTextarea.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this._applyChanges();
      }
    });
    
    contentDiv.appendChild(this.jsonTextarea);
    container.appendChild(contentDiv);
  }

  _createToolbar() {
    const toolbar = document.createElement('div');
    toolbar.style.cssText = `
      padding: 10px;
      background: ${this.theme === 'dark' ? '#2d2d2d' : '#e0e0e0'};
      border-bottom: 1px solid ${this.theme === 'dark' ? '#444' : '#ccc'};
      display: flex;
      gap: 10px;
      align-items: center;
    `;

    // Search input
    this.searchInput = document.createElement('input');
    this.searchInput.type = 'text';
    this.searchInput.placeholder = 'Search...';
    this.searchInput.style.cssText = `
      flex: 1;
      padding: 6px 12px;
      border: 1px solid ${this.theme === 'dark' ? '#555' : '#aaa'};
      background: ${this.theme === 'dark' ? '#1e1e1e' : '#fff'};
      color: ${this.theme === 'dark' ? '#d4d4d4' : '#333'};
      border-radius: 4px;
      font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
      font-size: 12px;
    `;

    this.searchInput.addEventListener('input', (e) => {
      this.searchTerm = e.target.value;
      this._highlightSearch();
    });

    // Format button
    const formatBtn = this._createButton('Format', () => {
      this._formatJSON();
    });

    // Compact button
    const compactBtn = this._createButton('Compact', () => {
      this._compactJSON();
    });

    // Copy button
    const copyBtn = this._createButton('Copy', () => {
      this._copyToClipboard();
    });

    // Apply button
    const applyBtn = this._createButton('Apply Changes', () => {
      this._applyChanges();
    }, '#667eea');

    toolbar.appendChild(this.searchInput);
    toolbar.appendChild(formatBtn);
    toolbar.appendChild(compactBtn);
    toolbar.appendChild(copyBtn);
    toolbar.appendChild(applyBtn);

    this.container.appendChild(toolbar);
  }

  _createButton(text, onClick, bgColor = null) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.cssText = `
      padding: 6px 12px;
      background: ${bgColor || (this.theme === 'dark' ? '#3a3a3a' : '#ddd')};
      color: ${bgColor ? '#fff' : (this.theme === 'dark' ? '#d4d4d4' : '#333')};
      border: 1px solid ${this.theme === 'dark' ? '#555' : '#aaa'};
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-family: system-ui, sans-serif;
      white-space: nowrap;
    `;
    
    btn.addEventListener('mouseenter', () => {
      btn.style.opacity = '0.8';
    });
    
    btn.addEventListener('mouseleave', () => {
      btn.style.opacity = '1';
    });
    
    btn.addEventListener('click', onClick);
    return btn;
  }

  render(graphSnapshot) {
    this.currentSnapshot = graphSnapshot;
    if (!this.jsonTextarea || !this.container) return;

    if (!graphSnapshot) {
      this.jsonTextarea.value = '// No data to display';
      return;
    }

    // Pretty print the JSON
    const json = JSON.stringify(graphSnapshot, null, 2);
    this.jsonTextarea.value = json;
    
    // Apply syntax highlighting if search is active
    if (this.searchTerm) {
      this._highlightSearch();
    }
  }

  _formatJSON() {
    try {
      const json = JSON.parse(this.jsonTextarea.value);
      this.jsonTextarea.value = JSON.stringify(json, null, 2);
      this._showMessage('Formatted successfully', 'success');
    } catch (err) {
      this._showMessage('Invalid JSON: ' + err.message, 'error');
    }
  }

  _compactJSON() {
    try {
      const json = JSON.parse(this.jsonTextarea.value);
      this.jsonTextarea.value = JSON.stringify(json);
      this._showMessage('Compacted successfully', 'success');
    } catch (err) {
      this._showMessage('Invalid JSON: ' + err.message, 'error');
    }
  }

  _copyToClipboard() {
    this.jsonTextarea.select();
    document.execCommand('copy');
    this._showMessage('Copied to clipboard', 'success');
  }

  _applyChanges() {
    try {
      const json = JSON.parse(this.jsonTextarea.value);
      this.currentSnapshot = json;
      this._showMessage('Changes applied', 'success');
      
      // Emit event to notify of changes
      this._emitEvent('dataChanged', { data: json });
    } catch (err) {
      this._showMessage('Invalid JSON: ' + err.message, 'error');
    }
  }

  _highlightSearch() {
    if (!this.searchTerm || !this.jsonTextarea) return;
    
    const value = this.jsonTextarea.value;
    const index = value.toLowerCase().indexOf(this.searchTerm.toLowerCase());
    
    if (index !== -1) {
      this.jsonTextarea.focus();
      this.jsonTextarea.setSelectionRange(index, index + this.searchTerm.length);
      this.jsonTextarea.scrollTop = this.jsonTextarea.scrollHeight * (index / value.length);
    }
  }

  _showMessage(text, type = 'info') {
    // Create temporary message overlay
    const msg = document.createElement('div');
    msg.textContent = text;
    msg.style.cssText = `
      position: absolute;
      top: 60px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === 'error' ? '#f56565' : type === 'success' ? '#48bb78' : '#4299e1'};
      color: white;
      border-radius: 4px;
      font-size: 13px;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: slideIn 0.3s ease;
    `;
    
    this.container.style.position = 'relative';
    this.container.appendChild(msg);
    
    setTimeout(() => {
      msg.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => msg.remove(), 300);
    }, 2000);
  }

  update(patch) {
    // Re-render on mutation
    if (this.currentSnapshot) {
      console.log('[JSONRenderer] update:', patch);
      // In production, apply patch to snapshot
      // For now, just keep current value
    }
  }

  highlight(targetType, targetId, kind = 'select') {
    super.highlight(targetType, targetId, kind);
    // Could highlight the JSON key if we wanted to
    console.log(`[JSONRenderer] highlight ${targetId} as ${kind}`);
  }

  setMode(mode) {
    super.setMode(mode);
    if (this.jsonTextarea) {
      this.jsonTextarea.readOnly = (mode === 'view');
    }
  }

  setTheme(theme) {
    super.setTheme(theme);
    // Re-apply theme styling
    if (this.container) {
      this.container.style.background = theme === 'dark' ? '#1e1e1e' : '#f5f5f5';
      this.container.style.color = theme === 'dark' ? '#d4d4d4' : '#333';
      
      if (this.jsonTextarea) {
        this.jsonTextarea.style.background = theme === 'dark' ? '#1e1e1e' : '#f5f5f5';
        this.jsonTextarea.style.color = theme === 'dark' ? '#d4d4d4' : '#333';
      }
      
      // Update toolbar if exists
      const toolbar = this.container.querySelector('div');
      if (toolbar && this.searchInput) {
        toolbar.style.background = theme === 'dark' ? '#2d2d2d' : '#e0e0e0';
        toolbar.style.borderBottom = `1px solid ${theme === 'dark' ? '#444' : '#ccc'}`;
        this.searchInput.style.background = theme === 'dark' ? '#1e1e1e' : '#fff';
        this.searchInput.style.color = theme === 'dark' ? '#d4d4d4' : '#333';
        this.searchInput.style.borderColor = theme === 'dark' ? '#555' : '#aaa';
      }
    }
  }

  focus(targetType, targetId) {
    super.focus(targetType, targetId);
    // Could scroll to the entity/relation in JSON
    if (this.jsonTextarea) {
      const value = this.jsonTextarea.value;
      const index = value.indexOf(`"id": "${targetId}"`);
      if (index !== -1) {
        this.jsonTextarea.focus();
        this.jsonTextarea.setSelectionRange(index, index + targetId.length + 8);
        this.jsonTextarea.scrollTop = this.jsonTextarea.scrollHeight * (index / value.length);
      }
    }
  }

  drillDown(entityId) {
    super.drillDown(entityId);
    console.log(`[JSONRenderer] drillDown ${entityId}`);
  }

  drillUp() {
    super.drillUp();
    console.log('[JSONRenderer] drillUp');
  }

  destroy() {
    super.destroy();
    this.currentSnapshot = null;
    this.searchTerm = '';
    this.searchInput = null;
    this.jsonTextarea = null;
  }
}

export default JSONRenderer;
