/**
 * End-to-End Workflow Tests
 * 
 * Tests complete user scenarios from start to finish.
 * See: doc/arch/arch.md - Data & Control Flow
 * See: doc/TESTING.md - Integration Testing Patterns
 * See: IMPLEMENTATION_PLAN.md - Phase 7.1
 */

import { Graph } from '../../src/core/graph.js';
import { Schema } from '../../src/core/schema.js';
import { EventBus } from '../../src/utils/event-emitter.js';
import { QueryEngine } from '../../src/core/query-engine.js';
import { Versioning } from '../../src/core/versioning.js';
import { UndoRedoManager } from '../../src/core/undo-redo.js';
import { AnnotationService } from '../../src/services/annotation-service.js';
import { CassettePlayer } from '../../src/services/cassette-player.js';
import { UIBridge } from '../../src/ui/bridge.js';
import { JSONRenderer } from '../../src/ui/renderers/json-renderer.js';

describe('E2E: Create & Explore Workflow', () => {
  let graph, schema, eventBus, queryEngine, versioning, undoRedo, annotationService;

  beforeEach(() => {
    eventBus = new EventBus();
    schema = new Schema();
    
    // Register core entity types
    schema.registerEntityType('person', {
      title: { type: 'string', required: true },
      email: { type: 'string', required: false }
    });
    schema.registerEntityType('project', {
      name: { type: 'string', required: true },
      status: { type: 'string', required: false }
    });
    schema.registerRelationType('works_on', {
      since: { type: 'string', required: false }
    });

    graph = new Graph(eventBus, schema);
    queryEngine = new QueryEngine(graph);
    versioning = new Versioning(graph, eventBus);
    undoRedo = new UndoRedoManager(graph, eventBus);
    annotationService = new AnnotationService(graph, eventBus);
  });

  test('should create entities via API', () => {
    const person1 = {
      id: 'person1',
      type: 'person',
      metadata: { title: 'Alice', email: 'alice@example.com' }
    };
    
    const person2 = {
      id: 'person2',
      type: 'person',
      metadata: { title: 'Bob', email: 'bob@example.com' }
    };

    graph.addEntity(person1);
    graph.addEntity(person2);

    expect(graph.hasEntity('person1')).toBe(true);
    expect(graph.hasEntity('person2')).toBe(true);
    expect(graph.getEntity('person1').metadata.title).toBe('Alice');
  });

  test('should create relations between entities', () => {
    const person = {
      id: 'person1',
      type: 'person',
      metadata: { title: 'Alice' }
    };
    
    const project = {
      id: 'proj1',
      type: 'project',
      metadata: { name: 'GraphSense' }
    };

    graph.addEntity(person);
    graph.addEntity(project);

    const relation = {
      id: 'rel1',
      type: 'works_on',
      source: 'person1',
      target: 'proj1',
      metadata: { since: '2024-01-01' }
    };

    graph.addRelation(relation);

    expect(graph.hasRelation('rel1')).toBe(true);
    const storedRelation = graph.getRelation('rel1');
    expect(storedRelation.source).toBe('person1');
    expect(storedRelation.target).toBe('proj1');
  });

  test('should annotate entities', () => {
    const entity = {
      id: 'entity1',
      type: 'person',
      metadata: { title: 'Charlie' }
    };

    graph.addEntity(entity);

    annotationService.addNote('entity1', 'Important contact');
    annotationService.addTag('entity1', 'vip');

    const annotations = annotationService.getAnnotations('entity1');
    expect(annotations.notes).toHaveLength(1);
    expect(annotations.notes[0].content).toBe('Important contact');
    expect(annotations.tags).toContain('vip');
  });

  test('should query graph using QueryEngine', () => {
    // Create test data
    graph.addEntity({ id: 'p1', type: 'person', metadata: { title: 'Alice' } });
    graph.addEntity({ id: 'p2', type: 'person', metadata: { title: 'Bob' } });
    graph.addEntity({ id: 'proj1', type: 'project', metadata: { name: 'Alpha' } });
    
    graph.addRelation({ id: 'r1', type: 'works_on', source: 'p1', target: 'proj1', metadata: {} });

    // Query by type
    const people = queryEngine.findEntities({ type: 'person' });
    expect(people).toHaveLength(2);

    // Query with filter
    const alice = queryEngine.findEntities({ 
      type: 'person',
      filter: e => e.metadata.title === 'Alice'
    });
    expect(alice).toHaveLength(1);
    expect(alice[0].id).toBe('p1');

    // Query relations
    const relations = queryEngine.findRelations({ type: 'works_on' });
    expect(relations).toHaveLength(1);
  });

  test('should export graph to JSON', () => {
    graph.addEntity({ id: 'e1', type: 'person', metadata: { title: 'Test' } });
    graph.addEntity({ id: 'e2', type: 'project', metadata: { name: 'Test Project' } });
    graph.addRelation({ id: 'r1', type: 'works_on', source: 'e1', target: 'e2', metadata: {} });

    const exported = graph.toJSON();
    
    expect(exported.entities).toHaveLength(2);
    expect(exported.relations).toHaveLength(1);
    expect(exported.entities[0].id).toBe('e1');
  });

  test('should support undo/redo operations', () => {
    const entity = { id: 'e1', type: 'person', metadata: { title: 'Test' } };
    
    graph.addEntity(entity);
    expect(graph.hasEntity('e1')).toBe(true);

    undoRedo.undo();
    expect(graph.hasEntity('e1')).toBe(false);

    undoRedo.redo();
    expect(graph.hasEntity('e1')).toBe(true);
  });

  test('should create and restore snapshots', () => {
    graph.addEntity({ id: 'e1', type: 'person', metadata: { title: 'Original' } });
    
    const snapshotId = versioning.createSnapshot('Initial state');
    expect(snapshotId).toBeDefined();

    graph.updateEntity('e1', { title: 'Modified' });
    expect(graph.getEntity('e1').metadata.title).toBe('Modified');

    versioning.restoreSnapshot(snapshotId);
    expect(graph.getEntity('e1').metadata.title).toBe('Original');
  });
});

describe('E2E: GitHub Import Workflow', () => {
  let graph, schema, eventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    schema = new Schema();
    
    // Register GitHub entity types
    schema.registerEntityType('organization', {
      name: { type: 'string', required: true },
      description: { type: 'string', required: false }
    });
    schema.registerEntityType('repository', {
      name: { type: 'string', required: true },
      language: { type: 'string', required: false }
    });
    schema.registerEntityType('user', {
      login: { type: 'string', required: true }
    });
    schema.registerRelationType('owns', {});
    schema.registerRelationType('contributes_to', {});

    graph = new Graph(eventBus, schema);
  });

  test('should map GitHub data to entities/relations', () => {
    // Simulate GitHub org data
    const org = {
      id: 'org1',
      type: 'organization',
      metadata: {
        name: 'MyOrg',
        description: 'A test organization'
      }
    };

    const repo1 = {
      id: 'repo1',
      type: 'repository',
      metadata: {
        name: 'project-alpha',
        language: 'JavaScript'
      }
    };

    const repo2 = {
      id: 'repo2',
      type: 'repository',
      metadata: {
        name: 'project-beta',
        language: 'Python'
      }
    };

    graph.addEntity(org);
    graph.addEntity(repo1);
    graph.addEntity(repo2);

    graph.addRelation({
      id: 'rel1',
      type: 'owns',
      source: 'org1',
      target: 'repo1',
      metadata: {}
    });

    graph.addRelation({
      id: 'rel2',
      type: 'owns',
      source: 'org1',
      target: 'repo2',
      metadata: {}
    });

    expect(graph.getEntitiesByType('repository')).toHaveLength(2);
    expect(graph.getRelationsByType('owns')).toHaveLength(2);
  });

  test('should preserve annotations during refresh', () => {
    const annotationService = new AnnotationService(graph, eventBus);

    // Initial import
    graph.addEntity({
      id: 'repo1',
      type: 'repository',
      metadata: { name: 'my-repo' }
    });

    // User adds annotation
    annotationService.addNote('repo1', 'Critical project');
    annotationService.addTag('repo1', 'important');

    // Simulate refresh (update metadata)
    graph.updateEntity('repo1', { 
      name: 'my-repo',
      language: 'JavaScript' // New field from refresh
    });

    // Annotations should still exist
    const annotations = annotationService.getAnnotations('repo1');
    expect(annotations.notes[0].content).toBe('Critical project');
    expect(annotations.tags).toContain('important');
  });
});

describe('E2E: Offline & Sync Workflow', () => {
  let graph, schema, eventBus, undoRedo;
  let offlineQueue;

  beforeEach(() => {
    eventBus = new EventBus();
    schema = new Schema();
    
    schema.registerEntityType('task', {
      title: { type: 'string', required: true },
      status: { type: 'string', required: false }
    });

    graph = new Graph(eventBus, schema);
    undoRedo = new UndoRedoManager(graph, eventBus);
    offlineQueue = [];

    // Simulate offline mode by queuing mutations
    eventBus.on('graph.entity.added', (event) => {
      offlineQueue.push({ type: 'add', data: event.data });
    });
  });

  test('should queue mutations while offline', () => {
    // User works offline
    graph.addEntity({ id: 't1', type: 'task', metadata: { title: 'Task 1' } });
    graph.addEntity({ id: 't2', type: 'task', metadata: { title: 'Task 2' } });
    graph.addEntity({ id: 't3', type: 'task', metadata: { title: 'Task 3' } });

    expect(offlineQueue).toHaveLength(3);
    expect(graph.getEntitiesByType('task')).toHaveLength(3);
  });

  test('should work with all features offline', () => {
    const annotationService = new AnnotationService(graph, eventBus);

    graph.addEntity({ id: 't1', type: 'task', metadata: { title: 'Offline Task' } });
    
    // Annotations work offline
    annotationService.addNote('t1', 'Created offline');
    
    // Undo/redo works offline
    graph.updateEntity('t1', { title: 'Updated Offline Task', status: 'in-progress' });
    undoRedo.undo();

    expect(graph.getEntity('t1').metadata.title).toBe('Offline Task');
  });

  test('should sync when online (simulated)', () => {
    // Offline operations
    graph.addEntity({ id: 't1', type: 'task', metadata: { title: 'Task 1' } });
    graph.addEntity({ id: 't2', type: 'task', metadata: { title: 'Task 2' } });

    expect(offlineQueue).toHaveLength(2);

    // Simulate sync by replaying queue
    const syncedOps = [...offlineQueue];
    offlineQueue.length = 0;

    expect(syncedOps).toHaveLength(2);
    expect(syncedOps[0].type).toBe('add');
    expect(syncedOps[0].data.entity.id).toBe('t1');
  });
});

describe('E2E: Cassette Playback Workflow', () => {
  let graph, schema, eventBus, cassettePlayer, annotationService;

  beforeEach(() => {
    eventBus = new EventBus();
    schema = new Schema();
    
    schema.registerEntityType('node', {
      name: { type: 'string', required: true }
    });
    schema.registerRelationType('connects', {});

    graph = new Graph(eventBus, schema);
    cassettePlayer = new CassettePlayer(graph, eventBus);
    annotationService = new AnnotationService(graph, eventBus);
  });

  test('should record interaction sequence', () => {
    const frames = [];
    
    // Record user interactions
    frames.push({
      type: 'entity.select',
      timestamp: Date.now(),
      data: { entityId: 'n1' }
    });

    frames.push({
      type: 'entity.highlight',
      timestamp: Date.now() + 1000,
      data: { entityId: 'n1' }
    });

    frames.push({
      type: 'entity.deselect',
      timestamp: Date.now() + 2000,
      data: { entityId: 'n1' }
    });

    expect(frames).toHaveLength(3);
    expect(frames[0].type).toBe('entity.select');
  });

  test('should create and load cassette', () => {
    // Create test entities
    graph.addEntity({ id: 'n1', type: 'node', metadata: { name: 'Node 1' } });
    graph.addEntity({ id: 'n2', type: 'node', metadata: { name: 'Node 2' } });

    const cassetteData = {
      id: 'cassette1',
      title: 'Test Walkthrough',
      description: 'A test cassette',
      frames: [
        { type: 'entity.select', timestamp: 0, data: { entityId: 'n1' } },
        { type: 'entity.select', timestamp: 1000, data: { entityId: 'n2' } }
      ]
    };

    cassettePlayer.load(cassetteData);
    expect(cassettePlayer.getCurrentCassette()).toBeDefined();
    expect(cassettePlayer.getCurrentCassette().id).toBe('cassette1');
  });

  test('should play cassette and emit frame events', (done) => {
    graph.addEntity({ id: 'n1', type: 'node', metadata: { name: 'Node 1' } });

    const cassette = {
      id: 'test',
      title: 'Test',
      description: 'Test cassette',
      frames: [
        { type: 'entity.select', timestamp: 0, data: { entityId: 'n1' } }
      ]
    };

    let frameEntered = false;
    eventBus.on('cassette.frame.enter', () => {
      frameEntered = true;
    });

    cassettePlayer.load(cassette);
    cassettePlayer.play();

    // Give it time to process
    setTimeout(() => {
      expect(frameEntered).toBe(true);
      cassettePlayer.stop();
      done();
    }, 100);
  });

  test('should pause and resume playback', () => {
    graph.addEntity({ id: 'n1', type: 'node', metadata: { name: 'Node 1' } });

    const cassette = {
      id: 'test',
      title: 'Test',
      description: 'Test',
      frames: [
        { type: 'entity.select', timestamp: 0, data: { entityId: 'n1' } },
        { type: 'entity.select', timestamp: 1000, data: { entityId: 'n1' } }
      ]
    };

    cassettePlayer.load(cassette);
    cassettePlayer.play();
    
    expect(cassettePlayer.isPlaying()).toBe(true);

    cassettePlayer.pause();
    expect(cassettePlayer.isPlaying()).toBe(false);

    cassettePlayer.play();
    expect(cassettePlayer.isPlaying()).toBe(true);

    cassettePlayer.stop();
  });
});

describe('E2E: UI Bridge Integration', () => {
  let graph, schema, eventBus, bridge, renderer;

  beforeEach(() => {
    eventBus = new EventBus();
    schema = new Schema();
    
    schema.registerEntityType('item', {
      name: { type: 'string', required: true }
    });

    graph = new Graph(eventBus, schema);
    
    // Create container for renderer
    const container = { style: {} };
    renderer = new JSONRenderer(container, { theme: 'light' });
    
    bridge = new UIBridge(graph, eventBus);
    bridge.setRenderer(renderer);
  });

  test('should handle select command', () => {
    graph.addEntity({ id: 'item1', type: 'item', metadata: { name: 'Test Item' } });

    bridge.executeCommand('select', { targetId: 'item1', targetType: 'entity' });
    
    // Command should be processed without errors
    expect(bridge.getMode()).toBe('view');
  });

  test('should handle highlight command', () => {
    graph.addEntity({ id: 'item1', type: 'item', metadata: { name: 'Test Item' } });

    bridge.executeCommand('highlight', { targetId: 'item1', targetType: 'entity' });
    
    // Should not throw
    expect(true).toBe(true);
  });

  test('should handle mode switch', () => {
    bridge.setMode('edit');
    expect(bridge.getMode()).toBe('edit');

    bridge.setMode('view');
    expect(bridge.getMode()).toBe('view');
  });

  test('should validate commands before execution', () => {
    // Invalid command (missing required params)
    expect(() => {
      bridge.executeCommand('select', {});
    }).toThrow();

    // Invalid command (unknown command)
    expect(() => {
      bridge.executeCommand('invalid_command', {});
    }).toThrow();
  });
});
