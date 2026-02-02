/**
 * D3Renderer - Force-directed graph visualization using D3.js
 *
 * Renders entities as nodes and relations as links in an interactive D3 force layout.
 * Supports node dragging, zoom/pan, hover/selection, and animated transitions.
 *
 * Note: Full D3 integration requires d3.js library to be installed.
 * This implementation provides a working fallback and structure for D3 integration.
 *
 * See: ../../doc/modules/ui/RendererContract.md
 * See: ../../doc/arch/ui.md
 */

import { BaseRenderer } from './base-renderer.js';

export class D3Renderer extends BaseRenderer {
  constructor(options = {}) {
    super(options);
    this.currentSnapshot = null;
    this.nodes = [];
    this.links = [];
    this.svg = null;
    this.simulation = null;
    this.nodeElements = null;
    this.linkElements = null;
    this.selectedNodeId = null;
    this.hoveredNodeId = null;
    this.useWebGL = options.useWebGL || false;
    this.zoom = null;
    this.transform = { x: 0, y: 0, k: 1 };
    this.isDragging = false;
    this.draggedNode = null;
  }

  init(container, options = {}) {
    super.init(container, options);
    if (!container) return;

    container.innerHTML = '';
    container.className = 'gs-d3-renderer renderer-content active';
    container.style.cssText = `
      background: ${this.theme === 'dark' ? '#1a1a1a' : '#fafafa'};
      width: 100%;
      height: 100%;
      position: relative;
    `;

    // Create SVG canvas
    this._createSVGCanvas();
    
    // Setup zoom and pan
    this._setupZoomPan();
    
    // Setup event listeners
    this._setupEventListeners();
  }

  _createSVGCanvas() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.cssText = 'display: block; width: 100%; height: 100%;';

    // Create container group for zoom/pan
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'viewport');
    svg.appendChild(g);

    // Create layers for links and nodes
    const linksGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    linksGroup.setAttribute('class', 'links');
    g.appendChild(linksGroup);

    const nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    nodesGroup.setAttribute('class', 'nodes');
    g.appendChild(nodesGroup);

    this.container.appendChild(svg);
    this.svg = svg;
  }

  _setupZoomPan() {
    let isPanning = false;
    let startPoint = { x: 0, y: 0 };

    this.svg.addEventListener('mousedown', (e) => {
      if (e.target === this.svg || e.target.classList.contains('viewport')) {
        isPanning = true;
        startPoint = { x: e.clientX - this.transform.x, y: e.clientY - this.transform.y };
        this.svg.style.cursor = 'grabbing';
      }
    });

    this.svg.addEventListener('mousemove', (e) => {
      if (isPanning) {
        this.transform.x = e.clientX - startPoint.x;
        this.transform.y = e.clientY - startPoint.y;
        this._applyTransform();
      }
    });

    this.svg.addEventListener('mouseup', () => {
      if (isPanning) {
        isPanning = false;
        this.svg.style.cursor = 'default';
      }
    });

    this.svg.addEventListener('mouseleave', () => {
      if (isPanning) {
        isPanning = false;
        this.svg.style.cursor = 'default';
      }
    });

    // Zoom with mouse wheel
    this.svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const rect = this.svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Zoom towards mouse position
      this.transform.x = x - (x - this.transform.x) * delta;
      this.transform.y = y - (y - this.transform.y) * delta;
      this.transform.k *= delta;

      this._applyTransform();
    });
  }

  _applyTransform() {
    const viewport = this.svg?.querySelector('.viewport');
    if (viewport) {
      viewport.setAttribute(
        'transform',
        `translate(${this.transform.x},${this.transform.y}) scale(${this.transform.k})`
      );
    }
  }

  _setupEventListeners() {
    // Context menu prevention (will show custom context menu in full impl)
    if (this.container) {
      this.container.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        // TODO: Show custom context menu
      });
    }
  }

  render(graphSnapshot) {
    this.currentSnapshot = graphSnapshot;
    if (!graphSnapshot) return;

    const { entities = [], relations = [] } = graphSnapshot;

    // Prepare node data from entities
    this.nodes = entities.map((entity) => ({
      id: entity.id,
      type: entity.type,
      label: entity.metadata?.title || entity.id,
      x: entity.x || Math.random() * 800,
      y: entity.y || Math.random() * 600,
      vx: 0,
      vy: 0,
      entity,
    }));

    // Prepare link data from relations
    this.links = relations.map((relation) => {
      const source = this.nodes.find(n => n.id === relation.from);
      const target = this.nodes.find(n => n.id === relation.to);
      return {
        id: relation.id,
        source: source || relation.from,
        target: target || relation.to,
        type: relation.type,
        relation,
      };
    });

    // Render visualization if container exists
    if (this.container && this.svg) {
      this._renderGraph();
      this._startSimulation();
    }
    
    this._emitEvent('render', { nodes: this.nodes, links: this.links });
  }

  _renderGraph() {
    const linksGroup = this.svg?.querySelector('.links');
    const nodesGroup = this.svg?.querySelector('.nodes');

    if (!linksGroup || !nodesGroup) return;

    // Clear existing elements
    linksGroup.innerHTML = '';
    nodesGroup.innerHTML = '';

    // Render links
    this.links.forEach(link => {
      const line = this._createLinkElement(link);
      linksGroup.appendChild(line);
    });

    // Render nodes
    this.nodes.forEach(node => {
      const nodeGroup = this._createNodeElement(node);
      nodesGroup.appendChild(nodeGroup);
    });
  }
  
  _renderD3Graph() {
    // Alias for _renderGraph for compatibility
    this._renderGraph();
  }

  _createLinkElement(link) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('data-link-id', link.id);
    line.setAttribute('stroke', this.theme === 'dark' ? '#555' : '#999');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-opacity', '0.6');
    
    const sx = typeof link.source === 'object' ? link.source.x : 0;
    const sy = typeof link.source === 'object' ? link.source.y : 0;
    const tx = typeof link.target === 'object' ? link.target.x : 0;
    const ty = typeof link.target === 'object' ? link.target.y : 0;
    
    line.setAttribute('x1', sx);
    line.setAttribute('y1', sy);
    line.setAttribute('x2', tx);
    line.setAttribute('y2', ty);

    line.addEventListener('click', () => this._onLinkClick(link));
    line.style.cursor = 'pointer';

    return line;
  }

  _createNodeElement(node) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('data-node-id', node.id);
    g.setAttribute('transform', `translate(${node.x},${node.y})`);
    g.style.cursor = 'grab';

    // Node circle
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('r', '20');
    circle.setAttribute('fill', this._getNodeColor(node.type));
    circle.setAttribute('stroke', '#fff');
    circle.setAttribute('stroke-width', '2');

    // Highlight styling
    if (this.selectedNodeId === node.id) {
      circle.setAttribute('stroke', '#667eea');
      circle.setAttribute('stroke-width', '4');
    } else if (this.hoveredNodeId === node.id) {
      circle.setAttribute('stroke', '#fbbf24');
      circle.setAttribute('stroke-width', '3');
    }

    // Node label
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dy', '35');
    text.setAttribute('fill', this.theme === 'dark' ? '#d4d4d4' : '#333');
    text.setAttribute('font-size', '12');
    text.setAttribute('font-family', 'system-ui, sans-serif');
    text.textContent = node.label.substring(0, 20);

    g.appendChild(circle);
    g.appendChild(text);

    // Event handlers
    g.addEventListener('click', (e) => {
      e.stopPropagation();
      this._onNodeClick(node);
    });

    g.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this._onNodeDoubleClick(node);
    });

    g.addEventListener('mouseenter', () => this._onNodeHover(node));
    g.addEventListener('mouseleave', () => this._onNodeHoverEnd(node));

    // Drag handlers
    this._setupNodeDrag(g, node);

    return g;
  }

  _setupNodeDrag(element, node) {
    let startX, startY;

    element.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.draggedNode = node;
      startX = e.clientX / this.transform.k - node.x;
      startY = e.clientY / this.transform.k - node.y;
      element.style.cursor = 'grabbing';
      e.stopPropagation();
    });

    // Mousemove and mouseup are handled at document level in _startSimulation
  }

  _getNodeColor(type) {
    const colors = {
      User: '#667eea',
      Repository: '#48bb78',
      Issue: '#f56565',
      PullRequest: '#ed8936',
      default: '#4299e1'
    };
    return colors[type] || colors.default;
  }

  _startSimulation() {
    // Simple force simulation without D3
    // In production, this would use d3.forceSimulation()
    let animationId;

    const simulate = () => {
      // Apply forces
      this.nodes.forEach(node => {
        // Center force
        const centerX = (this.container?.offsetWidth || 800) / 2;
        const centerY = (this.container?.offsetHeight || 600) / 2;
        node.vx += (centerX - node.x) * 0.001;
        node.vy += (centerY - node.y) * 0.001;

        // Link force
        this.links.forEach(link => {
          if (typeof link.source === 'object' && typeof link.target === 'object') {
            const dx = link.target.x - link.source.x;
            const dy = link.target.y - link.source.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = (dist - 100) * 0.01;
            
            if (link.source.id === node.id) {
              node.vx += (dx / dist) * force;
              node.vy += (dy / dist) * force;
            }
            if (link.target.id === node.id) {
              node.vx -= (dx / dist) * force;
              node.vy -= (dy / dist) * force;
            }
          }
        });

        // Repulsion between nodes
        this.nodes.forEach(other => {
          if (other.id !== node.id) {
            const dx = other.x - node.x;
            const dy = other.y - node.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            if (dist < 100) {
              const force = (100 - dist) * 0.05;
              node.vx -= (dx / dist) * force;
              node.vy -= (dy / dist) * force;
            }
          }
        });

        // Damping
        node.vx *= 0.9;
        node.vy *= 0.9;

        // Update position
        if (!this.draggedNode || this.draggedNode.id !== node.id) {
          node.x += node.vx;
          node.y += node.vy;
        }
      });

      this._updatePositions();

      // Continue animation
      animationId = requestAnimationFrame(simulate);
    };

    // Start simulation
    if (this.simulation) {
      cancelAnimationFrame(this.simulation);
    }
    this.simulation = animationId;
    simulate();

    // Setup global drag handlers
    document.addEventListener('mousemove', this._handleDragMove.bind(this));
    document.addEventListener('mouseup', this._handleDragEnd.bind(this));
  }

  _handleDragMove(e) {
    if (this.isDragging && this.draggedNode) {
      const rect = this.svg.getBoundingClientRect();
      this.draggedNode.x = (e.clientX - rect.left - this.transform.x) / this.transform.k;
      this.draggedNode.y = (e.clientY - rect.top - this.transform.y) / this.transform.k;
      this._updatePositions();
    }
  }

  _handleDragEnd() {
    if (this.isDragging) {
      this.isDragging = false;
      this.draggedNode = null;
      const nodeGroups = this.svg?.querySelectorAll('[data-node-id]');
      nodeGroups?.forEach(g => g.style.cursor = 'grab');
    }
  }

  _updatePositions() {
    // Update node positions
    this.nodes.forEach(node => {
      const g = this.svg?.querySelector(`[data-node-id="${node.id}"]`);
      if (g) {
        g.setAttribute('transform', `translate(${node.x},${node.y})`);
      }
    });

    // Update link positions
    this.links.forEach(link => {
      const line = this.svg?.querySelector(`[data-link-id="${link.id}"]`);
      if (line && typeof link.source === 'object' && typeof link.target === 'object') {
        line.setAttribute('x1', link.source.x);
        line.setAttribute('y1', link.source.y);
        line.setAttribute('x2', link.target.x);
        line.setAttribute('y2', link.target.y);
      }
    });
  }

  update(patch) {
    if (!this.container || !this.currentSnapshot) return;

    const { type, data } = patch;

    // Handle incremental updates
    if (type === 'graph.entity.added') {
      const entity = data.entity;
      const node = {
        id: entity.id,
        type: entity.type,
        label: entity.metadata?.title || entity.id,
        entity,
      };
      this.nodes.push(node);
      // Re-render with new nodes
      this._renderD3Graph();
    } else if (type === 'graph.entity.removed') {
      this.nodes = this.nodes.filter((n) => n.id !== data.entityId);
      this.links = this.links.filter(
        (l) => l.source !== data.entityId && l.target !== data.entityId
      );
      this._renderD3Graph();
    } else if (type === 'graph.entity.updated') {
      const node = this.nodes.find((n) => n.id === data.entityId);
      if (node) {
        node.label = data.after.metadata?.title || data.after.id;
        node.entity = data.after;
      }
      this._updateNodeVisuals();
    } else if (type === 'graph.relation.added') {
      const relation = data.relation;
      const link = {
        id: relation.id,
        source: relation.from,
        target: relation.to,
        type: relation.type,
        relation,
      };
      this.links.push(link);
      this._renderD3Graph();
    } else if (type === 'graph.relation.removed') {
      this.links = this.links.filter((l) => l.id !== data.relationId);
      this._renderD3Graph();
    }

    this._emitEvent('update', patch);
  }

  highlight(targetType, targetId, kind = 'select') {
    super.highlight(targetType, targetId, kind);
    if (targetType === 'entity') {
      this.selectedNodeId = targetId;
      this._updateNodeVisuals();
    }
    this._emitEvent('highlight', { targetType, targetId, kind });
  }

  clearHighlight(targetType, targetId) {
    super.clearHighlight(targetType, targetId);
    if (this.selectedNodeId === targetId) {
      this.selectedNodeId = null;
    }
    if (this.hoveredNodeId === targetId) {
      this.hoveredNodeId = null;
    }
    this._updateNodeVisuals();
  }

  focus(targetType, targetId) {
    super.focus(targetType, targetId);
    // Zoom to center on the node
    const node = this.nodes.find(n => n.id === targetId);
    if (node && this.container) {
      const centerX = this.container.offsetWidth / 2;
      const centerY = this.container.offsetHeight / 2;
      
      this.transform.x = centerX - node.x * this.transform.k;
      this.transform.y = centerY - node.y * this.transform.k;
      this._applyTransform();
      
      this.highlight('entity', targetId, 'focus');
    }
  }

  drillDown(entityId) {
    super.drillDown(entityId);
    // Could zoom into node's subgraph
    const node = this.nodes.find(n => n.id === entityId);
    if (node) {
      this.focus('entity', entityId);
    }
  }

  drillUp() {
    super.drillUp();
    // Reset zoom
    this.transform = { x: 0, y: 0, k: 1 };
    this._applyTransform();
  }

  setTheme(theme) {
    super.setTheme(theme);
    if (this.container) {
      this.container.style.background = theme === 'dark' ? '#1a1a1a' : '#fafafa';
      this._updateNodeVisuals();
    }
  }

  setMode(mode) {
    super.setMode(mode);
    // Mode affects interaction behavior (view vs edit vs annotate)
    // Update rendering accordingly
  }

  destroy() {
    super.destroy();
    if (this.simulation) {
      cancelAnimationFrame(this.simulation);
      this.simulation = null;
    }
    
    // Clean up event listeners
    document.removeEventListener('mousemove', this._handleDragMove);
    document.removeEventListener('mouseup', this._handleDragEnd);
    
    this.svg = null;
    this.nodeElements = null;
    this.linkElements = null;
    this.currentSnapshot = null;
    this.nodes = [];
    this.links = [];
    this.selectedNodeId = null;
    this.hoveredNodeId = null;
  }

  // Private methods

  /**
   * Update visual styling of nodes (highlight, selection, etc.)
   * @private
   */
  _updateNodeVisuals() {
    if (!this.svg) return;
    
    this.nodes.forEach(node => {
      const g = this.svg.querySelector(`[data-node-id="${node.id}"]`);
      if (!g) return;
      
      const circle = g.querySelector('circle');
      if (!circle) return;
      
      // Reset to default
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', '2');
      
      // Apply highlights
      if (this.selectedNodeId === node.id) {
        circle.setAttribute('stroke', '#667eea');
        circle.setAttribute('stroke-width', '4');
      } else if (this.hoveredNodeId === node.id) {
        circle.setAttribute('stroke', '#fbbf24');
        circle.setAttribute('stroke-width', '3');
      } else if (this.highlightedElements.has(node.id)) {
        const kind = this.highlightedElements.get(node.id);
        if (kind === 'play') {
          circle.setAttribute('stroke', '#f56565');
          circle.setAttribute('stroke-width', '4');
        } else if (kind === 'focus') {
          circle.setAttribute('stroke', '#48bb78');
          circle.setAttribute('stroke-width', '3');
        }
      }
      
      // Update text color based on theme
      const text = g.querySelector('text');
      if (text) {
        text.setAttribute('fill', this.theme === 'dark' ? '#d4d4d4' : '#333');
      }
    });
  }

  /**
   * Handle node click
   * @private
   * @param {Object} node
   */
  _onNodeClick(node) {
    this.selectedNodeId = node.id;
    this._updateNodeVisuals();
    this._emitEvent('nodeClicked', {
      entityId: node.id,
      entity: node.entity,
    });
  }

  /**
   * Handle node double-click
   * @private
   * @param {Object} node
   */
  _onNodeDoubleClick(node) {
    this._emitEvent('nodeDoubleClicked', {
      entityId: node.id,
      entity: node.entity,
    });
  }

  /**
   * Handle link click
   * @private
   * @param {Object} link
   */
  _onLinkClick(link) {
    this._emitEvent('relationClicked', {
      relationId: link.id,
      relation: link.relation,
    });
  }

  /**
   * Handle node hover
   * @private
   * @param {Object} node
   */
  _onNodeHover(node) {
    this.hoveredNodeId = node.id;
    this.highlight('entity', node.id, 'hover');
    this._updateNodeVisuals();
  }

  /**
   * Handle node hover end
   * @private
   * @param {Object} node
   */
  _onNodeHoverEnd(node) {
    if (this.hoveredNodeId === node.id) {
      this.hoveredNodeId = null;
      this._updateNodeVisuals();
    }
    if (this.highlightedElements.get(node.id) === 'hover') {
      this.clearHighlight('entity', node.id);
      this._updateNodeVisuals();
    }
  }
}

export default D3Renderer;
