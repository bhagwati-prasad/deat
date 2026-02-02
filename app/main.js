import { Graph } from './src/core/graph.js';
import { Schema } from './src/core/schema.js';
import { EventBus } from './src/core/event/bus.js';
import { QueryEngine } from './src/core/query-engine.js';
import { UndoRedoManager } from './src/core/undo-redo.js';
import { AnnotationService } from './src/services/annotation-service.js';
import { CassettePlayer } from './src/services/cassette-player.js';
import { UIBridge } from './src/ui/bridge.js';
import { JSONRenderer } from './src/ui/renderers/json-renderer.js';
import { TreeRenderer } from './src/ui/renderers/tree-renderer.js';
import { D3Renderer } from './src/ui/renderers/d3-renderer.js';
import GitHubAdapter from './src/adapters/data/github-adapter.js';

// ============= Graph Manager =============
class GraphManager {
  constructor() {
    this.graphs = new Map();
    this.activeGraphId = null;
  }

  createGraph(name, id = null) {
    const graphId = id || `graph-${Date.now()}`;
    const eventBus = new EventBus();
    const schema = new Schema();
    const graph = new Graph(eventBus, schema);
    
    this.graphs.set(graphId, {
      id: graphId,
      name: name,
      graph: graph,
      eventBus: eventBus,
      schema: schema,
      queryEngine: new QueryEngine(graph),
      undoRedo: new UndoRedoManager(graph, eventBus),
      annotationService: new AnnotationService(graph, eventBus),
      cassettePlayer: new CassettePlayer(graph, eventBus),
      uiBridge: new UIBridge(graph, eventBus),
      createdAt: new Date()
    });
    
    return graphId;
  }

  getGraph(id) {
    return this.graphs.get(id);
  }

  getActiveGraph() {
    return this.graphs.get(this.activeGraphId);
  }

  setActiveGraph(id) {
    if (this.graphs.has(id)) {
      this.activeGraphId = id;
      return true;
    }
    return false;
  }

  deleteGraph(id) {
    if (id === this.activeGraphId) return false;
    return this.graphs.delete(id);
  }

  listGraphs() {
    return Array.from(this.graphs.values());
  }
}

// ============= Initialize System =============
const graphManager = new GraphManager();

// Create default graph
const defaultGraphId = graphManager.createGraph('Sample Data');
graphManager.setActiveGraph(defaultGraphId);

// Helper functions to get active graph components
const getActiveGraph = () => graphManager.getActiveGraph().graph;
const getActiveEventBus = () => graphManager.getActiveGraph().eventBus;
const getActiveSchema = () => graphManager.getActiveGraph().schema;
const getActiveQueryEngine = () => graphManager.getActiveGraph().queryEngine;
const getActiveUndoRedo = () => graphManager.getActiveGraph().undoRedo;

// Legacy references (for backward compatibility)
const eventBus = getActiveEventBus();
const schema = getActiveSchema();

// Register entity types
schema.registerEntityType('person', {
  name: { type: 'string', required: true },
  role: { type: 'string', required: false },
  email: { type: 'string', required: false }
});
schema.registerEntityType('project', {
  title: { type: 'string', required: true },
  status: { type: 'string', required: false },
  repository: { type: 'string', required: false }
});
schema.registerEntityType('team', {
  name: { type: 'string', required: true },
  description: { type: 'string', required: false }
});

// Note: GitHub entity types (organization, repository, user) and OWNS relation
// are already registered by Schema's _loadDefaults() method

// Register custom relation types (GitHub types are already registered)
schema.registerRelationType('works_on', {
  role: { type: 'string', required: false }
});
schema.registerRelationType('belongs_to', {});
schema.registerRelationType('manages', {});

// Initialize GitHub adapter (will be configured with token later)
let githubAdapter = null;

// ============= UI State =============
let currentRenderer = 'd3';
let recordedFrames = [];
let isRecording = false;
let recordingStartTime = 0;
let selectedEntity = null;

// ============= Initialize Renderers =============
const d3Container = document.getElementById('d3-renderer');
const treeContainer = document.getElementById('tree-renderer');
const jsonContainer = document.getElementById('json-renderer');

const d3Renderer = new D3Renderer({ theme: 'light', mode: 'view' });
d3Renderer.init(d3Container, { theme: 'light', mode: 'view' });

const treeRenderer = new TreeRenderer({ theme: 'light', mode: 'view' });
treeRenderer.init(treeContainer, { theme: 'light', mode: 'view' });

const jsonRenderer = new JSONRenderer({ theme: 'light', mode: 'view' });
jsonRenderer.init(jsonContainer, { theme: 'light', mode: 'view' });

const renderers = {
  d3: d3Renderer,
  tree: treeRenderer,
  json: jsonRenderer
};

// ============= Create Sample Data =============
function createSampleData() {
  const activeGraph = getActiveGraph();
  const activeAnnotationService = graphManager.getActiveGraph().annotationService;
  
  // People
  activeGraph.addEntity({
    id: 'person_alice',
    type: 'person',
    metadata: { name: 'Alice Chen', role: 'Lead Developer', email: 'alice@example.com' }
  });
  activeGraph.addEntity({
    id: 'person_bob',
    type: 'person',
    metadata: { name: 'Bob Smith', role: 'Designer', email: 'bob@example.com' }
  });
  activeGraph.addEntity({
    id: 'person_carol',
    type: 'person',
    metadata: { name: 'Carol Davis', role: 'Product Manager', email: 'carol@example.com' }
  });

  // Projects
  activeGraph.addEntity({
    id: 'project_graphsense',
    type: 'project',
    metadata: { title: 'GraphSense', status: 'active', repository: 'graphsense' }
  });
  activeGraph.addEntity({
    id: 'project_dataviz',
    type: 'project',
    metadata: { title: 'DataViz Platform', status: 'active', repository: 'dataviz' }
  });

  // Team
  activeGraph.addEntity({
    id: 'team_platform',
    type: 'team',
    metadata: { name: 'Platform Team', description: 'Core infrastructure' }
  });

  // Relations
  activeGraph.addRelation({
    id: 'rel_alice_gs',
    type: 'works_on',
    from: 'person_alice',
    to: 'project_graphsense',
    metadata: { role: 'Engineer' }
  });
  activeGraph.addRelation({
    id: 'rel_bob_gs',
    type: 'works_on',
    from: 'person_bob',
    to: 'project_graphsense',
    metadata: { role: 'Designer' }
  });
  activeGraph.addRelation({
    id: 'rel_alice_dv',
    type: 'works_on',
    from: 'person_alice',
    to: 'project_dataviz',
    metadata: { role: 'Lead' }
  });
  activeGraph.addRelation({
    id: 'rel_team',
    type: 'belongs_to',
    from: 'person_alice',
    to: 'team_platform',
    metadata: {}
  });

  // Annotations
  activeAnnotationService.addNote('project_graphsense', 'Core entity graph system');
  activeAnnotationService.addTag('project_graphsense', 'critical');
  activeAnnotationService.addTag('project_graphsense', 'active');

  // Create sample cassette for guided walkthrough
  createSampleCassette();
}

// ============= Sample Cassette Creation =============
function createSampleCassette() {
  const cassettePlayer = graphManager.getActiveGraph().cassettePlayer;
  
  const sampleCassette = {
    id: 'cassette-sample-walkthrough',
    name: 'Team Structure Overview',
    description: 'Guided walkthrough of the team and project structure',
    frames: [
      {
        targetId: 'person_alice',
        action: 'highlight',
        duration: 1500,
        metadata: { label: 'Alice - Lead Developer' }
      },
      {
        targetId: 'rel_alice_gs',
        action: 'focus',
        duration: 1200,
        metadata: { label: 'Works on GraphSense' }
      },
      {
        targetId: 'project_graphsense',
        action: 'highlight',
        duration: 1500,
        metadata: { label: 'GraphSense Project' }
      },
      {
        targetId: 'person_bob',
        action: 'highlight',
        duration: 1200,
        metadata: { label: 'Bob - Designer' }
      },
      {
        targetId: 'rel_bob_gs',
        action: 'focus',
        duration: 1200,
        metadata: { label: 'Bob also works on GraphSense' }
      },
      {
        targetId: 'rel_alice_dv',
        action: 'highlight',
        duration: 1500,
        metadata: { label: 'Alice leads DataViz' }
      },
      {
        targetId: 'project_dataviz',
        action: 'highlight',
        duration: 1500,
        metadata: { label: 'DataViz Platform' }
      },
      {
        targetId: 'team_platform',
        action: 'focus',
        duration: 1500,
        metadata: { label: 'Platform Team' }
      }
    ],
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    version: '1.0.0'
  };
  
  // Add to cassette player
  cassettePlayer.cassettes = cassettePlayer.cassettes || new Map();
  cassettePlayer.cassettes.set(sampleCassette.id, sampleCassette);
  
  // Update cassette list UI
  updateCassetteList();
}

createSampleData();
graphManager.getActiveGraph().uiBridge.setRenderer(d3Renderer);

// ============= Graph List UI Management =============
function updateGraphsList() {
  const graphsList = document.getElementById('graphs-list');
  graphsList.innerHTML = '';
  
  graphManager.listGraphs().forEach(graphData => {
    const item = document.createElement('div');
    item.className = 'sidebar-item';
    item.style.cursor = 'pointer';
    item.style.display = 'flex';
    item.style.justifyContent = 'space-between';
    item.style.alignItems = 'center';
    item.style.padding = 'var(--spacing-sm)';
    
    if (graphData.id === graphManager.activeGraphId) {
      item.setAttribute('active', '');
    }
    
    const textSpan = document.createElement('span');
    textSpan.className = 'sidebar-item-text';
    textSpan.textContent = graphData.name;
    textSpan.style.flex = '1';
    textSpan.style.overflow = 'hidden';
    textSpan.style.textOverflow = 'ellipsis';
    textSpan.style.whiteSpace = 'nowrap';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '✕';
    deleteBtn.style.border = 'none';
    deleteBtn.style.background = 'transparent';
    deleteBtn.style.color = 'var(--text-secondary)';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.style.padding = '2px 6px';
    deleteBtn.style.marginLeft = 'var(--spacing-sm)';
    deleteBtn.title = 'Delete graph';
    
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (graphManager.listGraphs().length === 1) {
        alert('Cannot delete the last graph');
        return;
      }
      if (confirm(`Delete graph "${graphData.name}"?`)) {
        if (graphData.id === graphManager.activeGraphId) {
          // Switch to another graph first
          const otherGraph = graphManager.listGraphs().find(g => g.id !== graphData.id);
          graphManager.setActiveGraph(otherGraph.id);
        }
        graphManager.deleteGraph(graphData.id);
        updateGraphsList();
        renderAll();
      }
    });
    
    item.appendChild(textSpan);
    if (graphManager.listGraphs().length > 1) {
      item.appendChild(deleteBtn);
    }
    
    item.addEventListener('click', () => {
      graphManager.setActiveGraph(graphData.id);
      updateGraphsList();
      renderAll();
    });
    
    graphsList.appendChild(item);
  });
}

// Initialize graphs list
updateGraphsList();

// ============= Event Handlers =============

// Sidebar toggle
document.getElementById('sidebar-toggle').addEventListener('click', () => {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('collapsed');
  // Save preference to localStorage
  const isCollapsed = sidebar.classList.contains('collapsed');
  localStorage.setItem('sidebarCollapsed', isCollapsed);
});

// Restore sidebar state from localStorage
if (localStorage.getItem('sidebarCollapsed') === 'true') {
  document.getElementById('sidebar').classList.add('collapsed');
}

// Render the initial state
function renderAll() {
  const activeGraph = getActiveGraph();
  const graphData = activeGraph.serialize();
  d3Renderer.render(graphData);
  treeRenderer.render(graphData);
  jsonRenderer.render(graphData);
  updateStats();
}

function updateStats() {
  const activeGraph = getActiveGraph();
  document.getElementById('entity-count').textContent = activeGraph.entities.size;
  document.getElementById('relation-count').textContent = activeGraph.relations.size;
}

// ============= Console Functions =============
const consoleOutput = document.getElementById('console-output');
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;
const originalInfo = console.info;

// Intercept console methods
console.log = function(...args) {
  originalLog.apply(console, args);
  addConsoleOutput(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '), 'log');
};

console.error = function(...args) {
  originalError.apply(console, args);
  addConsoleOutput(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '), 'error');
};

console.warn = function(...args) {
  originalWarn.apply(console, args);
  addConsoleOutput(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '), 'warn');
};

console.info = function(...args) {
  originalInfo.apply(console, args);
  addConsoleOutput(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '), 'info');
};

function addConsoleOutput(text, type = 'log') {
  const line = document.createElement('div');
  line.className = `console-line ${type}`;
  line.textContent = text;
  consoleOutput.appendChild(line);
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function isDottedPath(command) {
  return /^\s*[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)+\s*$/.test(command);
}

function resolvePath(command) {
  const parts = command.trim().split('.');
  let current = window;
  for (const part of parts) {
    if (current == null || !(part in current)) {
      return { exists: false, missing: part };
    }
    current = current[part];
  }
  return { exists: true, value: current };
}

window.executeConsoleCommand = function() {
  const input = document.getElementById('console-input');
  const command = input.value.trim();
  
  if (!command) return;

  if (command === '/clear') {
    consoleOutput.innerHTML = '';
    input.value = '';
    input.focus();
    return;
  }
  
  // Show the command being executed
  addConsoleOutput(`> ${command}`, 'input');
  
  try {
    // Execute command with access to GS and console logging
    const result = eval(command);

    if (result === undefined && isDottedPath(command)) {
      const resolved = resolvePath(command);
      if (!resolved.exists) {
        throw new Error(`Unknown reference: ${command}`);
      }
    }
    
    // Show result
    if (result !== undefined) {
      if (typeof result === 'object') {
        addConsoleOutput(JSON.stringify(result, null, 2), 'success');
      } else {
        addConsoleOutput(String(result), 'success');
      }
    }
  } catch (error) {
    addConsoleOutput(`Error: ${error.message}`, 'error');
  }
  
  // Clear input
  input.value = '';
  input.focus();
};

// Theme selector
document.getElementById('theme-selector').addEventListener('change', (e) => {
  const theme = e.target.value;
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
  // Update all renderers with new theme
  Object.values(renderers).forEach(r => r.setTheme(theme));
});

// Renderer switcher (via tabs)
document.querySelectorAll('.renderer-tab').forEach(el => {
  el.addEventListener('click', () => {
    const renderer = el.dataset.renderer;
    currentRenderer = renderer;
    // Update tab highlights
    document.querySelectorAll('.renderer-tab').forEach(e => e.classList.remove('active'));
    el.classList.add('active');
    // Show active renderer
    document.querySelectorAll('.renderer-content').forEach(e => e.classList.remove('active'));
    document.getElementById(`${renderer}-renderer`).classList.add('active');
    if (renderer !== 'console') {
      renderAll();
    }
  });
});

// Mode selector
document.getElementById('mode-selector').addEventListener('change', (e) => {
  const mode = e.target.value;
  graphManager.getActiveGraph().uiBridge.setMode(mode);
  Object.values(renderers).forEach(r => r.setMode(mode));
});

// New graph button
document.getElementById('new-graph-btn').addEventListener('click', () => {
  const name = prompt('Enter graph name:');
  if (name && name.trim()) {
    const newGraphId = graphManager.createGraph(name.trim());
    graphManager.setActiveGraph(newGraphId);
    updateGraphsList();
    renderAll();
  }
});

// Add entity
let entityCounter = 0;
document.getElementById('add-entity-btn').addEventListener('click', () => {
  entityCounter++;
  const entity = {
    id: `entity_${entityCounter}`,
    type: 'person',
    metadata: { name: `Person ${entityCounter}`, role: 'Team Member' }
  };
  getActiveGraph().addEntity(entity);
  renderAll();
  if (isRecording) {
    recordedFrames.push({
      type: 'entity.add',
      timestamp: Date.now() - recordingStartTime,
      data: entity
    });
  }
});

// GitHub Import
document.getElementById('github-import-btn').addEventListener('click', async () => {
  const token = document.getElementById('github-token-input').value.trim();
  const sourceType = document.getElementById('github-source-type').value;
  const name = document.getElementById('github-name-input').value.trim();
  const importType = document.getElementById('github-import-type').value;
  const statusEl = document.getElementById('github-status');
  
  if (!token) {
    statusEl.textContent = '⚠️ Please enter a GitHub token';
    statusEl.style.display = 'block';
    statusEl.style.color = 'var(--color-error)';
    return;
  }
  
  if (!name) {
    statusEl.textContent = '⚠️ Please enter a username or organization name';
    statusEl.style.display = 'block';
    statusEl.style.color = 'var(--color-error)';
    return;
  }
  
  try {
    // Initialize adapter with token
    githubAdapter = new GitHubAdapter(token);
    
    statusEl.textContent = '🔄 Importing data...';
    statusEl.style.display = 'block';
    statusEl.style.color = 'var(--text-secondary)';
    
    // Build query based on source type and import type
    let query = {};
    if (sourceType === 'org') {
      query.org = name;
      if (importType === 'info') {
        query.type = 'org';
      } else if (importType === 'repos') {
        query.type = 'repos';
      } else if (importType === 'members') {
        query.type = 'users';
      }
    } else {
      // User repositories
      query.user = name;
      if (importType === 'info') {
        query.type = 'user-info';
      } else if (importType === 'repos') {
        query.type = 'user-repos';
      }
    }
    
    // Fetch data from GitHub (with pagination)
    statusEl.textContent = '🔄 Fetching data from GitHub...';
    const rawData = await githubAdapter.fetch(query);
    
    // Show count if array
    if (Array.isArray(rawData)) {
      statusEl.textContent = `🔄 Mapping ${rawData.length} items to graph...`;
    } else {
      statusEl.textContent = '🔄 Mapping data to graph...';
    }
    
    // Create a new graph for the imported data
    const graphName = `${sourceType === 'org' ? 'Org' : 'User'}: ${name}`;
    const newGraphId = graphManager.createGraph(graphName);
    const newGraphData = graphManager.getGraph(newGraphId);
    
    // Map to entities and relations
    const { entities, relations } = await githubAdapter.map(rawData, newGraphData.schema);
    
    statusEl.textContent = `🔄 Adding ${entities.size} entities and ${relations.size} relations to graph...`;
    
    // Add to new graph
    let entityCount = 0;
    let relationCount = 0;
    
    entities.forEach(entity => {
      try {
        newGraphData.graph.addEntity(entity);
        entityCount++;
      } catch (error) {
        console.warn('Failed to add entity:', entity.id, error);
      }
    });
    
    relations.forEach(relation => {
      try {
        newGraphData.graph.addRelation(relation);
        relationCount++;
      } catch (error) {
        console.warn('Failed to add relation:', relation.id, error);
      }
    });
    
    // Switch to the new graph
    graphManager.setActiveGraph(newGraphId);
    updateGraphsList();
    
    // Update UI
    renderAll();
    
    statusEl.textContent = `✅ Imported ${entityCount} entities and ${relationCount} relations`;
    statusEl.style.color = 'var(--color-success)';
    
    // Auto-hide success message after 5 seconds (longer to see large counts)
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 5000);
    
  } catch (error) {
    console.error('GitHub import error:', error);
    statusEl.textContent = `❌ Error: ${error.message || 'Failed to import'}`;
    statusEl.style.display = 'block';
    statusEl.style.color = 'var(--color-error)';
  }
});

// Undo/Redo
document.getElementById('undo-btn').addEventListener('click', () => {
  getActiveUndoRedo().undo();
  renderAll();
});

document.getElementById('redo-btn').addEventListener('click', () => {
  getActiveUndoRedo().redo();
  renderAll();
});

// Cassette recording event handlers
document.getElementById('record-btn').addEventListener('click', function() {
  const cassettePlayer = graphManager.getActiveGraph().cassettePlayer;
  if (!isRecording) {
    isRecording = true;
    recordedFrames = [];
    recordingStartTime = Date.now();
    this.style.background = 'var(--color-error)';
    this.style.color = 'white';
    this.style.borderColor = 'var(--color-error)';
    document.getElementById('save-cassette-btn').disabled = false;
  } else {
    isRecording = false;
    this.style.background = 'var(--bg-primary)';
    this.style.color = 'var(--text-primary)';
    this.style.borderColor = 'var(--border-color)';
  }
});

document.getElementById('save-cassette-btn').addEventListener('click', () => {
  if (recordedFrames.length === 0) {
    alert('No frames recorded');
    return;
  }
  const cassette = {
    id: 'cassette-' + Date.now(),
    name: 'Recording ' + new Date().toLocaleTimeString(),
    description: `${recordedFrames.length} frames recorded`,
    frames: recordedFrames,
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    version: '1.0.0'
  };
  const cassettePlayer = graphManager.getActiveGraph().cassettePlayer;
  if (!cassettePlayer.cassettes) cassettePlayer.cassettes = new Map();
  cassettePlayer.cassettes.set(cassette.id, cassette);
  
  recordedFrames = [];
  document.getElementById('record-btn').style.background = 'var(--bg-primary)';
  document.getElementById('record-btn').style.color = 'var(--text-primary)';
  document.getElementById('record-btn').style.borderColor = 'var(--border-color)';
  isRecording = false;
  
  updateCassetteList();
  alert(`Cassette saved with ${cassette.frames.length} frames!`);
});

// Play/Pause/Stop buttons
document.getElementById('play-btn').addEventListener('click', () => {
  const cassettePlayer = graphManager.getActiveGraph().cassettePlayer;
  const selectedCassette = document.querySelector('.cassette-item.active');
  if (!selectedCassette) {
    alert('Please select a cassette first');
    return;
  }
  const cassetteId = selectedCassette.dataset.id;
  cassettePlayer.play(cassetteId);
  updateCassettePlayback();
});

document.getElementById('pause-btn').addEventListener('click', () => {
  const cassettePlayer = graphManager.getActiveGraph().cassettePlayer;
  cassettePlayer.pause();
  updateCassettePlayback();
});

document.getElementById('stop-btn').addEventListener('click', () => {
  const cassettePlayer = graphManager.getActiveGraph().cassettePlayer;
  cassettePlayer.stop();
  updateCassettePlayback();
});

// Scrubber functionality
document.getElementById('cassette-scrubber').addEventListener('click', (e) => {
  const cassettePlayer = graphManager.getActiveGraph().cassettePlayer;
  const cassette = cassettePlayer.getCurrentCassette();
  if (!cassette || !cassettePlayer.isPlaying()) return;
  
  const rect = e.currentTarget.getBoundingClientRect();
  const percent = (e.clientX - rect.left) / rect.width;
  const frameIndex = Math.floor(percent * cassette.frames.length) - 1;
  cassettePlayer.seek(Math.max(0, Math.min(frameIndex, cassette.frames.length - 1)));
  updateCassettePlayback();
});

// ============= Cassette UI Functions =============
function updateCassetteList() {
  const cassettePlayer = graphManager.getActiveGraph().cassettePlayer;
  const cassettes = cassettePlayer.cassettes || new Map();
  const listEl = document.getElementById('cassette-list');
  
  listEl.innerHTML = '';
  
  if (cassettes.size === 0) {
    listEl.innerHTML = '<div style="padding: var(--spacing-md); color: var(--text-secondary); font-size: 11px;"><em>No cassettes</em></div>';
    return;
  }
  
  cassettes.forEach((cassette, id) => {
    const item = document.createElement('div');
    item.className = 'cassette-item';
    item.dataset.id = id;
    item.innerHTML = `
      <div class="cassette-item-title">${cassette.name}</div>
      <div class="cassette-item-meta">${cassette.frames?.length || 0} frames</div>
    `;
    
    item.addEventListener('click', () => {
      document.querySelectorAll('.cassette-item').forEach(el => el.classList.remove('active'));
      item.classList.add('active');
      document.getElementById('play-btn').disabled = false;
      
      // Set the selected cassette as current in the cassette player
      const cassetteId = item.dataset.id;
      const cassette = cassettePlayer.cassettes.get(cassetteId);
    
      // Store current cassette ID in the player (use play with no autostart)
      cassettePlayer.play(cassetteId);
      cassettePlayer.stop(); // Stop after setting so it doesn't auto-play
    
      //document.getElementById('play-btn').disabled = false;
      updateCassettePlayback();
    });
    
    listEl.appendChild(item);
  });
}

function updateCassettePlayback() {
  const cassettePlayer = graphManager.getActiveGraph().cassettePlayer;
  const cassette = cassettePlayer.getCurrentCassette();
  
  if (!cassette) {
    document.getElementById('current-frame-cassette').textContent = '0';
    document.getElementById('total-frames-cassette').textContent = '0';
    document.getElementById('cassette-scrubber-track').style.setProperty('--progress', '0%');
    document.getElementById('current-frame-entities').innerHTML = '';
    document.getElementById('play-btn').disabled = true;
    document.getElementById('pause-btn').disabled = true;
    document.getElementById('stop-btn').disabled = true;
    return;
  }
  
  const frameIndex = cassettePlayer.getCurrentFrameIndex();
  const totalFrames = cassette.frames.length;
  const isPlaying = cassettePlayer.isPlaying();
  
  // Update frame display
  document.getElementById('current-frame-cassette').textContent = frameIndex + 1;
  document.getElementById('total-frames-cassette').textContent = totalFrames;
  
  // Update scrubber
  const progress = totalFrames > 0 ? ((frameIndex + 1) / totalFrames) * 100 : 0;
  document.getElementById('cassette-scrubber-track').style.setProperty('--progress', progress + '%');
  
  // Update button states
  document.getElementById('play-btn').disabled = isPlaying;
  document.getElementById('pause-btn').disabled = !isPlaying;
  document.getElementById('stop-btn').disabled = !isPlaying;
  
  // Update current frame entities
  if (frameIndex >= 0 && frameIndex < cassette.frames.length) {
    const frame = cassette.frames[frameIndex];
    const entityIcon = getEntityIcon(frame.targetId);
    document.getElementById('current-frame-entities').innerHTML = `
      <div class="cassette-entity-icon" title="${frame.targetId}">
        ${entityIcon}
      </div>
    `;
  } else {
    document.getElementById('current-frame-entities').innerHTML = '';
  }
}

function getEntityIcon(entityId) {
  const graph = getActiveGraph();
  const entity = graph.entities.get(entityId);
  const relation = graph.relations.get(entityId);
  
  if (entity) {
    const typeIcons = {
      person: '👤',
      project: '📦',
      team: '👥',
      repository: '📚',
      organization: '🏢',
      user: '👤'
    };
    return typeIcons[entity.type] || '•';
  } else if (relation) {
    return '🔗';
  }
  return '•';
}

// Listen to cassette playback events
eventBus.subscribe('cassette.frame.enter', (event) => {
  updateCassettePlayback();
});

eventBus.subscribe('cassette.play.ended', (event) => {
  updateCassettePlayback();
});

// Reset
document.getElementById('reset-btn').addEventListener('click', () => {
  if (confirm('Reset current graph?')) {
    getActiveGraph().reset();
    recordedFrames = [];
    isRecording = false;
    selectedEntity = null;
    document.getElementById('record-btn').textContent = '⏺️ Start Recording';
    document.getElementById('play-btn').textContent = '▶️ Play';
    createSampleData();
    renderAll();
  }
});

// Listen to graph events
eventBus.subscribe('*', (event) => {
  if (isRecording && event.type !== 'annotation' && event.type !== 'cassette') {
    recordedFrames.push({
      type: event.type,
      timestamp: Date.now() - recordingStartTime,
      data: event.data
    });
  }
});

// Cassette playback events (old reference removed, updated below)
// These events are now handled by updateCassettePlayback() function

// Initial render
renderAll();
updateCassetteList();

// ============= Expose Global API =============
window.GS = {
  // Graph Management
  graphManager,
  getActiveGraph,
  getActiveEventBus,
  getActiveSchema,
  getActiveQueryEngine,
  getActiveUndoRedo,
  
  // Active Graph Components
  get graph() { return getActiveGraph(); },
  get eventBus() { return getActiveEventBus(); },
  get schema() { return getActiveSchema(); },
  get queryEngine() { return getActiveQueryEngine(); },
  get undoRedo() { return getActiveUndoRedo(); },
  get cassettePlayer() { return graphManager.getActiveGraph().cassettePlayer; },
  get annotationService() { return graphManager.getActiveGraph().annotationService; },
  get uiBridge() { return graphManager.getActiveGraph().uiBridge; },
  
  // Renderers
  renderers,
  d3Renderer,
  treeRenderer,
  jsonRenderer,
  
  // UI Functions
  renderAll,
  updateStats,
  updateGraphsList,
  updateCassetteList,
  updateCassettePlayback,
  getEntityIcon,
  createSampleData,
  createSampleCassette,
  
  // Utilities
  eventBus: () => getActiveEventBus(),
  schema: () => getActiveSchema(),
  
  // State
  get currentRenderer() { return currentRenderer; },
  get isRecording() { return isRecording; },
  get recordedFrames() { return recordedFrames; },
  get selectedEntity() { return selectedEntity; }
};

console.log('✓ GraphSense initialized');
console.log('✓ Access via window.GS or just GS in console');
console.log('✓ Available: GS.graph, GS.eventBus, GS.schema, GS.cassettePlayer, etc.');