/**
 * TreeRenderer - Renders graph as hierarchical tree structure
 *
 * Displays entities as nodes with drill-down capability.
 * Relations shown as tree structure connections.
 *
 * See: ../../doc/modules/ui/RendererContract.md
 */

import { BaseRenderer } from './base-renderer.js';

export class TreeRenderer extends BaseRenderer {
  constructor(options = {}) {
    super(options);
    this.currentSnapshot = null;
    this.expandedNodes = new Set();
    this.treeEl = null;
    this.drillStack = []; // Track drill-down history
    this.scrollPosition = 0; // Preserve scroll position
  }

  init(container, options = {}) {
    super.init(container, options);
    if (!container) return;

    container.innerHTML = '';
    container.className = 'gs-tree-renderer renderer-content';
    container.style.cssText = `
      background: ${this.theme === 'dark' ? '#1e1e1e' : '#f5f5f5'};
      color: ${this.theme === 'dark' ? '#d4d4d4' : '#333'};
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      line-height: 1.6;
      flex-direction: column;
    `;

    // Add navigation bar
    this._createNavigationBar();

    // Create scrollable tree container
    const scrollContainer = document.createElement('div');
    scrollContainer.className = 'tree-scroll-container';
    scrollContainer.style.cssText = 'flex: 1; overflow-y: auto; padding: 20px;';
    
    // Preserve scroll position
    scrollContainer.addEventListener('scroll', () => {
      this.scrollPosition = scrollContainer.scrollTop;
    });

    this.treeEl = document.createElement('ul');
    this.treeEl.style.cssText = 'list-style: none; padding-left: 0; margin: 0;';
    scrollContainer.appendChild(this.treeEl);
    container.appendChild(scrollContainer);
  }

  _createNavigationBar() {
    const navBar = document.createElement('div');
    navBar.className = 'tree-nav-bar';
    navBar.style.cssText = `
      padding: 10px;
      background: ${this.theme === 'dark' ? '#2d2d2d' : '#e0e0e0'};
      border-bottom: 1px solid ${this.theme === 'dark' ? '#444' : '#ccc'};
      display: flex;
      gap: 10px;
      align-items: center;
    `;

    const backBtn = document.createElement('button');
    backBtn.textContent = '← Back';
    backBtn.disabled = this.drillStack.length === 0;
    backBtn.style.cssText = `
      padding: 6px 12px;
      background: ${this.theme === 'dark' ? '#3a3a3a' : '#ddd'};
      color: ${this.theme === 'dark' ? '#d4d4d4' : '#333'};
      border: 1px solid ${this.theme === 'dark' ? '#555' : '#aaa'};
      border-radius: 4px;
      cursor: ${this.drillStack.length === 0 ? 'not-allowed' : 'pointer'};
      opacity: ${this.drillStack.length === 0 ? 0.5 : 1};
    `;
    backBtn.addEventListener('click', () => {
      if (this.drillStack.length > 0) {
        this.drillUp();
      }
    });

    const breadcrumb = document.createElement('span');
    breadcrumb.className = 'tree-breadcrumb';
    breadcrumb.style.cssText = 'flex: 1; color: #999; font-size: 13px;';
    breadcrumb.textContent = this.drillStack.length === 0 
      ? 'Root Graph' 
      : `Root → ${this.drillStack.map(s => s.title).join(' → ')}`;

    navBar.appendChild(backBtn);
    navBar.appendChild(breadcrumb);
    this.container.appendChild(navBar);
  }

  render(graphSnapshot) {
    this.currentSnapshot = graphSnapshot;
    if (!this.treeEl || !this.container) return;

    // Store scroll position
    const scrollContainer = this.container.querySelector('.tree-scroll-container');
    const currentScroll = scrollContainer ? scrollContainer.scrollTop : this.scrollPosition;

    this.treeEl.innerHTML = '';

    if (!graphSnapshot) {
      this.treeEl.innerHTML = '<li style="padding: 20px; color: #999;">No data to display</li>';
      return;
    }

    const { entities = [], relations = [] } = graphSnapshot;

    // Render entities as tree nodes
    entities.forEach((entity) => {
      const li = this._createEntityNode(entity);
      this.treeEl.appendChild(li);
    });

    // Add relations info
    if (relations.length > 0) {
      const relHeader = document.createElement('li');
      relHeader.innerHTML = '<strong>Relations</strong>';
      relHeader.style.cssText = 'margin-top: 20px; padding: 10px 0;';
      this.treeEl.appendChild(relHeader);

      const relList = document.createElement('ul');
      relList.style.cssText = 'list-style: none; padding-left: 20px; margin: 0;';

      relations.forEach((rel) => {
        const relLi = document.createElement('li');
        relLi.style.cssText =
          'padding: 5px 0; cursor: pointer; user-select: none;';
        relLi.innerHTML = `
          <span style="color: #667eea;">●</span> 
          <strong>${rel.type}</strong>: 
          <code>${rel.from}</code> → <code>${rel.to}</code>
        `;
        relLi.addEventListener('click', () => {
          this._emitEvent('relationClicked', { relationId: rel.id, relation: rel });
        });
        relList.appendChild(relLi);
      });

      this.treeEl.appendChild(relList);
    }

    // Restore scroll position
    if (scrollContainer && currentScroll) {
      setTimeout(() => {
        scrollContainer.scrollTop = currentScroll;
      }, 0);
    }

    // Update breadcrumb
    this._updateBreadcrumb();
  }

  _updateBreadcrumb() {
    const breadcrumb = this.container?.querySelector('.tree-breadcrumb');
    if (breadcrumb) {
      breadcrumb.textContent = this.drillStack.length === 0 
        ? 'Root Graph' 
        : `Root → ${this.drillStack.map(s => s.title).join(' → ')}`;
    }

    const backBtn = this.container?.querySelector('button');
    if (backBtn) {
      backBtn.disabled = this.drillStack.length === 0;
      backBtn.style.cursor = this.drillStack.length === 0 ? 'not-allowed' : 'pointer';
      backBtn.style.opacity = this.drillStack.length === 0 ? '0.5' : '1';
    }
  }

  _createEntityNode(entity) {
    const li = document.createElement('li');
    li.style.cssText = 'padding: 8px 0; cursor: pointer; user-select: none;';

    const nodeDiv = document.createElement('div');
    nodeDiv.style.cssText = `
      padding: 8px;
      border-radius: 4px;
      background: ${
        this.highlightedElements.has(entity.id)
          ? 'rgba(102, 126, 234, 0.15)'
          : 'transparent'
      };
      border-left: 3px solid ${
        this.highlightedElements.has(entity.id) ? '#667eea' : 'transparent'
      };
      transition: background 0.2s;
    `;

    const icon = document.createElement('span');
    icon.style.cssText =
      'margin-right: 8px; font-weight: bold; color: #667eea;';
    icon.textContent = this.expandedNodes.has(entity.id) ? '▼' : '▶';

    const label = document.createElement('span');
    label.textContent =
      `[${entity.type}] ${entity.metadata?.title || entity.id}`.substring(0, 50);

    nodeDiv.appendChild(icon);
    nodeDiv.appendChild(label);

    // Click handler
    nodeDiv.addEventListener('click', (e) => {
      e.stopPropagation();
      this._emitEvent('nodeClicked', { entityId: entity.id, entity });
    });

    // Double-click to expand metadata
    nodeDiv.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this._toggleNode(entity.id);
      icon.textContent = this.expandedNodes.has(entity.id) ? '▼' : '▶';
      this.render(this.currentSnapshot); // Re-render to show/hide metadata
    });

    // Add drill-down button if entity has subgraph
    if (entity.hasSubgraph || entity.metadata?.hasSubgraph) {
      const drillBtn = document.createElement('button');
      drillBtn.textContent = '🔍 Drill Down';
      drillBtn.style.cssText = `
        margin-left: 10px;
        padding: 4px 8px;
        background: ${this.theme === 'dark' ? '#3a3a3a' : '#ddd'};
        color: ${this.theme === 'dark' ? '#d4d4d4' : '#333'};
        border: 1px solid ${this.theme === 'dark' ? '#555' : '#aaa'};
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
      `;
      drillBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.drillDown(entity.id);
      });
      nodeDiv.appendChild(drillBtn);
    }

    li.appendChild(nodeDiv);

    // Expanded content (metadata)
    if (this.expandedNodes.has(entity.id)) {
      const meta = document.createElement('ul');
      meta.style.cssText =
        'list-style: none; padding-left: 24px; margin: 5px 0 0 0; color: #999;';

      Object.entries(entity.metadata || {}).forEach(([key, val]) => {
        const metaLi = document.createElement('li');
        metaLi.style.cssText = 'font-size: 12px; padding: 2px 0;';
        metaLi.innerHTML = `<strong>${key}:</strong> ${String(val).substring(
          0,
          40
        )}`;
        meta.appendChild(metaLi);
      });

      li.appendChild(meta);
    }

    return li;
  }

  _toggleNode(entityId) {
    if (this.expandedNodes.has(entityId)) {
      this.expandedNodes.delete(entityId);
    } else {
      this.expandedNodes.add(entityId);
    }
  }

  update(patch) {
    console.log('[TreeRenderer] update:', patch);
    // Re-render on changes
    if (this.currentSnapshot) {
      this.render(this.currentSnapshot);
    }
  }

  highlight(targetType, targetId, kind = 'select') {
    super.highlight(targetType, targetId, kind);
    // Visual highlight
    if (this.treeEl) {
      this.render(this.currentSnapshot);
    }
  }

  focus(targetType, targetId) {
    super.focus(targetType, targetId);
    // Scroll to entity in tree
    const scrollContainer = this.container?.querySelector('.tree-scroll-container');
    if (scrollContainer) {
      const nodeDiv = this.treeEl?.querySelector(`[data-entity-id="${targetId}"]`);
      if (nodeDiv) {
        nodeDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        this.highlight('entity', targetId, 'focus');
      }
    }
  }

  drillDown(entityId) {
    super.drillDown(entityId);
    const entity = this.currentSnapshot?.entities?.find(e => e.id === entityId);
    if (entity) {
      // Push current state to stack
      this.drillStack.push({
        entityId,
        title: entity.metadata?.title || entityId,
        snapshot: this.currentSnapshot
      });
      
      // In real implementation, would load subgraph
      // For now, just update UI state
      this._updateBreadcrumb();
      
      // Emit event so bridge/graph can load subgraph
      this._emitEvent('drillDown', { entityId });
    }
  }

  drillUp() {
    super.drillUp();
    if (this.drillStack.length > 0) {
      const previous = this.drillStack.pop();
      
      // Restore previous snapshot
      if (previous.snapshot) {
        this.render(previous.snapshot);
      }
      
      // Emit event so bridge/graph can navigate back
      this._emitEvent('drillUp', {});
    }
  }

  destroy() {
    super.destroy();
    this.currentSnapshot = null;
    this.expandedNodes.clear();
    this.drillStack = [];
    this.scrollPosition = 0;
    this.treeEl = null;
  }
}

export default TreeRenderer;
