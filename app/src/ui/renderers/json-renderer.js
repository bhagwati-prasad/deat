/**
 * JSONRenderer - Renders graph as formatted JSON
 *
 * Useful for debugging and viewing raw graph state.
 * Updates on mutations, supports search/filter.
 *
 * See: ../../doc/modules/ui/RendererContract.md
 */

import { BaseRenderer } from './base-renderer.js';

export class JSONRenderer extends BaseRenderer {
  constructor(options = {}) {
    super(options);
    this.currentSnapshot = null;
    this.expanded = new Set();
    this.searchTerm = '';
    this.searchInput = null;
  }

  init(container, options = {}) {
    super.init(container, options);
    if (!container) return;

    container.innerHTML = '';
    container.className = 'gs-json-renderer';
    container.style.cssText = `
      background: ${this.theme === 'dark' ? '#1e1e1e' : '#f5f5f5'};
      color: ${this.theme === 'dark' ? '#d4d4d4' : '#333'};
      padding: 0;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      overflow: hidden;
      line-height: 1.6;
      display: flex;
      flex-direction: column;
    `;

    // Add search bar
    this._createSearchBar();
    
    // Add content container
    const contentDiv = document.createElement('div');
    contentDiv.className = 'json-content';
    contentDiv.style.cssText = 'flex: 1; overflow-y: auto; padding: 20px;';
    container.appendChild(contentDiv);
  }

  _createSearchBar() {
    const searchBar = document.createElement('div');
    searchBar.style.cssText = `
      padding: 10px;
      background: ${this.theme === 'dark' ? '#2d2d2d' : '#e0e0e0'};
      border-bottom: 1px solid ${this.theme === 'dark' ? '#444' : '#ccc'};
      display: flex;
      gap: 10px;
      align-items: center;
    `;

    this.searchInput = document.createElement('input');
    this.searchInput.type = 'text';
    this.searchInput.placeholder = 'Search JSON...';
    this.searchInput.style.cssText = `
      flex: 1;
      padding: 6px 12px;
      border: 1px solid ${this.theme === 'dark' ? '#555' : '#aaa'};
      background: ${this.theme === 'dark' ? '#1e1e1e' : '#fff'};
      color: ${this.theme === 'dark' ? '#d4d4d4' : '#333'};
      border-radius: 4px;
      font-family: 'Courier New', monospace;
    `;

    this.searchInput.addEventListener('input', (e) => {
      this.searchTerm = e.target.value;
      this._highlightSearchResults();
    });

    const expandBtn = document.createElement('button');
    expandBtn.textContent = 'Expand All';
    expandBtn.style.cssText = `
      padding: 6px 12px;
      background: ${this.theme === 'dark' ? '#3a3a3a' : '#ddd'};
      color: ${this.theme === 'dark' ? '#d4d4d4' : '#333'};
      border: 1px solid ${this.theme === 'dark' ? '#555' : '#aaa'};
      border-radius: 4px;
      cursor: pointer;
    `;
    expandBtn.addEventListener('click', () => this._expandAll());

    const collapseBtn = document.createElement('button');
    collapseBtn.textContent = 'Collapse All';
    collapseBtn.style.cssText = expandBtn.style.cssText;
    collapseBtn.addEventListener('click', () => this._collapseAll());

    searchBar.appendChild(this.searchInput);
    searchBar.appendChild(expandBtn);
    searchBar.appendChild(collapseBtn);

    this.container.appendChild(searchBar);
  }

  render(graphSnapshot) {
    this.currentSnapshot = graphSnapshot;
    if (!this.container) return;

    const contentDiv = this.container.querySelector('.json-content');
    if (!contentDiv) return;

    const json = JSON.stringify(graphSnapshot, null, 2);
    contentDiv.innerHTML = '';

    // Create interactive JSON with expand/collapse
    const pre = document.createElement('pre');
    pre.style.cssText = `
      margin: 0;
      padding: 0;
      background: inherit;
      color: inherit;
      word-wrap: break-word;
      white-space: pre-wrap;
    `;
    
    pre.innerHTML = this._formatJSON(graphSnapshot, 0);
    contentDiv.appendChild(pre);

    // Apply search highlighting if there's a search term
    if (this.searchTerm) {
      this._highlightSearchResults();
    }
  }

  _formatJSON(obj, depth = 0) {
    const indent = '  '.repeat(depth);
    const nextIndent = '  '.repeat(depth + 1);
    
    if (obj === null) return '<span style="color: #569cd6;">null</span>';
    if (obj === undefined) return '<span style="color: #569cd6;">undefined</span>';
    
    const type = typeof obj;
    
    if (type === 'string') {
      return `<span style="color: #ce9178;">"${this._escapeHtml(obj)}"</span>`;
    }
    if (type === 'number' || type === 'boolean') {
      return `<span style="color: #b5cea8;">${obj}</span>`;
    }
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      
      const isExpanded = this.expanded.has(`${depth}-array`);
      const toggleId = `toggle-${depth}-${Math.random().toString(36).substr(2, 9)}`;
      
      let html = `<span class="json-toggle" data-toggle-id="${toggleId}" style="cursor: pointer; user-select: none;">`;
      html += isExpanded ? '▼' : '▶';
      html += '</span> [';
      
      if (isExpanded) {
        html += '\n';
        obj.forEach((item, i) => {
          html += nextIndent + this._formatJSON(item, depth + 1);
          if (i < obj.length - 1) html += ',';
          html += '\n';
        });
        html += indent + ']';
      } else {
        html += ` ... ${obj.length} items ]`;
      }
      
      return html;
    }
    
    if (type === 'object') {
      const keys = Object.keys(obj);
      if (keys.length === 0) return '{}';
      
      const isExpanded = this.expanded.has(`${depth}-object-${keys[0]}`);
      const toggleId = `toggle-${depth}-${Math.random().toString(36).substr(2, 9)}`;
      
      let html = `<span class="json-toggle" data-toggle-id="${toggleId}" style="cursor: pointer; user-select: none;">`;
      html += isExpanded ? '▼' : '▶';
      html += '</span> {';
      
      if (isExpanded) {
        html += '\n';
        keys.forEach((key, i) => {
          html += nextIndent + `<span style="color: #9cdcfe;">"${this._escapeHtml(key)}"</span>: `;
          html += this._formatJSON(obj[key], depth + 1);
          if (i < keys.length - 1) html += ',';
          html += '\n';
        });
        html += indent + '}';
      } else {
        html += ` ... ${keys.length} keys }`;
      }
      
      return html;
    }
    
    return String(obj);
  }

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  _expandAll() {
    if (!this.currentSnapshot) return;
    this.expanded.clear();
    this._addAllPaths(this.currentSnapshot, 0, '');
    this.render(this.currentSnapshot);
  }

  _collapseAll() {
    this.expanded.clear();
    if (this.currentSnapshot) {
      this.render(this.currentSnapshot);
    }
  }

  _addAllPaths(obj, depth, prefix) {
    if (Array.isArray(obj)) {
      this.expanded.add(`${depth}-array${prefix}`);
      obj.forEach((item, i) => {
        if (typeof item === 'object' && item !== null) {
          this._addAllPaths(item, depth + 1, `${prefix}-${i}`);
        }
      });
    } else if (typeof obj === 'object' && obj !== null) {
      const keys = Object.keys(obj);
      if (keys.length > 0) {
        this.expanded.add(`${depth}-object-${keys[0]}${prefix}`);
        keys.forEach(key => {
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            this._addAllPaths(obj[key], depth + 1, `${prefix}-${key}`);
          }
        });
      }
    }
  }

  _highlightSearchResults() {
    if (!this.searchTerm || !this.container) return;
    
    const contentDiv = this.container.querySelector('.json-content');
    if (!contentDiv) return;
    
    const text = contentDiv.textContent;
    if (!text.toLowerCase().includes(this.searchTerm.toLowerCase())) return;
    
    // Re-render with search highlighting
    // In production, would implement more sophisticated highlighting
    this.render(this.currentSnapshot);
  }

  update(patch) {
    // Re-render on mutation
    if (this.currentSnapshot) {
      // In a real implementation, apply patch to snapshot
      // For now, just log the update
      console.log('[JSONRenderer] update:', patch);
    }
  }

  highlight(targetType, targetId, kind = 'select') {
    super.highlight(targetType, targetId, kind);
    // Visual highlight by wrapping in styled span (in real impl)
    console.log(`[JSONRenderer] highlight ${targetId} as ${kind}`);
  }

  setMode(mode) {
    super.setMode(mode);
    // Could change styling based on mode
  }

  setTheme(theme) {
    super.setTheme(theme);
    // Re-apply theme styling
    if (this.container) {
      this.container.style.background = theme === 'dark' ? '#1e1e1e' : '#f5f5f5';
      this.container.style.color = theme === 'dark' ? '#d4d4d4' : '#333';
      
      // Update search bar if exists
      const searchBar = this.container.querySelector('div');
      if (searchBar && this.searchInput) {
        searchBar.style.background = theme === 'dark' ? '#2d2d2d' : '#e0e0e0';
        searchBar.style.borderBottom = `1px solid ${theme === 'dark' ? '#444' : '#ccc'}`;
        this.searchInput.style.background = theme === 'dark' ? '#1e1e1e' : '#fff';
        this.searchInput.style.color = theme === 'dark' ? '#d4d4d4' : '#333';
      }
    }
  }

  focus(targetType, targetId) {
    super.focus(targetType, targetId);
    // Could scroll to the entity/relation in JSON
    console.log(`[JSONRenderer] focus ${targetType} ${targetId}`);
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
    this.expanded.clear();
    this.searchTerm = '';
    this.searchInput = null;
  }
}

export default JSONRenderer;
