/**
 * Performance Benchmark Tests
 * 
 * Tests system performance under load with specific time/memory targets.
 * See: doc/TESTING.md - Performance Testing
 * See: IMPLEMENTATION_PLAN.md - Phase 7.2
 * 
 * Performance Targets:
 * - 10,000 entities: <2s load time
 * - 50,000 entities: <5s load time
 * - Query large graph: <500ms
 * - Add entity: <10ms
 * - Remove entity: <10ms
 * - Update entity: <10ms
 * - Render 1000 nodes: 60fps
 * - Highlight: <16ms
 * - Sync 1000 changes: <5s
 * - Merge diffs: <1s
 */

import { Graph } from '../../src/core/graph.js';
import { Schema } from '../../src/core/schema.js';
import { EventBus } from '../../src/core/event/bus.js';
import { QueryEngine } from '../../src/core/query-engine.js';
import { DiffEngine } from '../../src/core/diff-engine.js';
import { Versioning } from '../../src/core/versioning.js';
import { UndoRedoManager } from '../../src/core/undo-redo.js';

// Helper to measure execution time
const measureTime = async (fn) => {
  const start = performance.now();
  await fn();
  const end = performance.now();
  return end - start;
};

// Helper to create test entities
const createTestEntity = (id, type = 'node') => ({
  id: `${type}_${id}`,
  type,
  metadata: {
    title: `Test ${type} ${id}`,
    description: `Description for ${type} ${id}`,
    timestamp: Date.now(),
    index: id
  }
});

// Helper to create test relations
const createTestRelation = (id, sourceId, targetId, type = 'links') => ({
  id: `rel_${id}`,
  type,
  from: sourceId,
  to: targetId,
  metadata: {
    weight: Math.random(),
    timestamp: Date.now()
  }
});

describe('Performance: Large Graph Operations', () => {
  let graph, schema, eventBus, queryEngine;

  beforeEach(() => {
    eventBus = new EventBus();
    schema = new Schema();
    
    schema.registerEntityType('node', {
      title: { type: 'string', required: true },
      description: { type: 'string', required: false },
      timestamp: { type: 'number', required: false },
      index: { type: 'number', required: false }
    });
    
    schema.registerRelationType('links', {
      weight: { type: 'number', required: false },
      timestamp: { type: 'number', required: false }
    });

    graph = new Graph(eventBus, schema);
    queryEngine = new QueryEngine(graph);
  });

  test('should handle 10,000 entities in <2s', async () => {
    const time = await measureTime(async () => {
      for (let i = 0; i < 10000; i++) {
        graph.addEntity(createTestEntity(i));
      }
    });

    console.log(`✓ Added 10,000 entities in ${time.toFixed(2)}ms`);
    expect(time).toBeLessThan(2000);
    expect(graph.serialize().entities.length).toBe(10000);
  });

  test('should handle 50,000 entities in <5s', async () => {
    const time = await measureTime(async () => {
      for (let i = 0; i < 50000; i++) {
        graph.addEntity(createTestEntity(i));
      }
    });

    console.log(`✓ Added 50,000 entities in ${time.toFixed(2)}ms`);
    expect(time).toBeLessThan(5000);
    expect(graph.serialize().entities.length).toBe(50000);
  }, 10000); // Extend timeout for this test

  test('should query large graph in <500ms', async () => {
    // Setup: Add 10,000 entities
    for (let i = 0; i < 10000; i++) {
      graph.addEntity(createTestEntity(i));
    }

    const time = await measureTime(async () => {
      queryEngine
        .from('node')
        .where(queryEngine.gt('metadata.index', 5000))
        .where(queryEngine.lt('metadata.index', 6000))
        .execute();
    });

    console.log(`✓ Queried 10,000 entities in ${time.toFixed(2)}ms`);
    expect(time).toBeLessThan(500);
  });

  test('should handle complex graph with entities and relations', async () => {
    const entityCount = 1000;
    const relationCount = 5000;

    const time = await measureTime(async () => {
      // Add entities
      for (let i = 0; i < entityCount; i++) {
        graph.addEntity(createTestEntity(i));
      }

      // Add relations (random connections)
      for (let i = 0; i < relationCount; i++) {
        const sourceIdx = Math.floor(Math.random() * entityCount);
        const targetIdx = Math.floor(Math.random() * entityCount);
        
        if (sourceIdx !== targetIdx) {
          graph.addRelation(
            createTestRelation(i, `node_${sourceIdx}`, `node_${targetIdx}`)
          );
        }
      }
    });

    console.log(`✓ Created graph with ${entityCount} entities and ${relationCount} relations in ${time.toFixed(2)}ms`);
    expect(graph.serialize().entities.length).toBe(entityCount);
    expect(graph.serialize().relations.length).toBeLessThanOrEqual(relationCount);
  });
});

describe('Performance: Individual Operations', () => {
  let graph, schema, eventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    schema = new Schema();
    
    schema.registerEntityType('node', {
      title: { type: 'string', required: true },
      value: { type: 'number', required: false }
    });

    graph = new Graph(eventBus, schema);
    
    // Pre-populate with some entities
    for (let i = 0; i < 1000; i++) {
      graph.addEntity(createTestEntity(i));
    }
  });

  test('should add entity in <10ms', async () => {
    const iterations = 100;
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const time = await measureTime(async () => {
        graph.addEntity(createTestEntity(1000 + i));
      });
      times.push(time);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`✓ Average add entity time: ${avgTime.toFixed(2)}ms`);
    expect(avgTime).toBeLessThan(10);
  });

  test('should remove entity in <10ms', async () => {
    const iterations = 100;
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const entityId = `node_${i}`;
      const time = await measureTime(async () => {
        graph.removeEntity(entityId);
      });
      times.push(time);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`✓ Average remove entity time: ${avgTime.toFixed(2)}ms`);
    expect(avgTime).toBeLessThan(10);
  });

  test('should update entity in <10ms', async () => {
    const iterations = 100;
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const entityId = `node_${i + 100}`;
      const time = await measureTime(async () => {
        graph.updateEntity(entityId, {
          metadata: {
            title: `Updated ${i}`,
            value: i * 2
          }
        });
      });
      times.push(time);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`✓ Average update entity time: ${avgTime.toFixed(2)}ms`);
    expect(avgTime).toBeLessThan(10);
  });
});

describe('Performance: Query Operations', () => {
  let graph, schema, eventBus, queryEngine;

  beforeEach(() => {
    eventBus = new EventBus();
    schema = new Schema();
    
    schema.registerEntityType('node', {
      title: { type: 'string', required: true },
      category: { type: 'string', required: false },
      value: { type: 'number', required: false }
    });
    
    schema.registerRelationType('links', {});

    graph = new Graph(eventBus, schema);
    queryEngine = new QueryEngine(graph);
    
    // Create diverse test data
    const categories = ['A', 'B', 'C', 'D', 'E'];
    for (let i = 0; i < 5000; i++) {
      graph.addEntity({
        id: `node_${i}`,
        type: 'node',
        metadata: {
          title: `Node ${i}`,
          category: categories[i % categories.length],
          value: Math.random() * 100
        }
      });
    }

    // Add some relations
    for (let i = 0; i < 1000; i++) {
      const source = `node_${Math.floor(Math.random() * 5000)}`;
      const target = `node_${Math.floor(Math.random() * 5000)}`;
      if (source !== target) {
        graph.addRelation({
          id: `rel_${i}`,
          type: 'links',
          from: source,
          to: target,
          metadata: {}
        });
      }
    }
  });

  test('should find entities by type quickly', async () => {
    const time = await measureTime(async () => {
      queryEngine.from('node').execute();
    });

    console.log(`✓ Find all entities by type: ${time.toFixed(2)}ms`);
    expect(time).toBeLessThan(100);
  });

  test('should filter entities efficiently', async () => {
    const time = await measureTime(async () => {
      queryEngine
        .from('node')
        .where(queryEngine.eq('metadata.category', 'A'))
        .where(queryEngine.gt('metadata.value', 50))
        .execute();
    });

    console.log(`✓ Filter entities: ${time.toFixed(2)}ms`);
    expect(time).toBeLessThan(200);
  });

  test('should traverse graph efficiently', async () => {
    const startNode = 'node_0';
    
    const time = await measureTime(async () => {
      queryEngine
        .from('node')
        .where(queryEngine.eq('id', startNode))
        .traverse('links', 'out')
        .execute();
    });

    console.log(`✓ Traverse graph (depth 3): ${time.toFixed(2)}ms`);
    expect(time).toBeLessThan(100);
  });
});

describe('Performance: Diff and Versioning', () => {
  let graph1, graph2, schema, eventBus, diffEngine, versioning;

  beforeEach(() => {
    eventBus = new EventBus();
    schema = new Schema();
    
    schema.registerEntityType('node', {
      title: { type: 'string', required: true }
    });

    graph1 = new Graph(eventBus, schema);
    graph2 = new Graph(eventBus, schema);
    diffEngine = new DiffEngine();
    versioning = new Versioning(graph1, eventBus);
  });

  test('should compute diff of large graphs in <1s', async () => {
    // Setup: Create two similar graphs
    for (let i = 0; i < 1000; i++) {
      graph1.addEntity(createTestEntity(i));
      graph2.addEntity(createTestEntity(i));
    }

    // Modify 10% of entities in graph2
    for (let i = 0; i < 100; i++) {
      graph2.updateEntity(`node_${i}`, { title: `Modified ${i}` });
    }

    const time = await measureTime(async () => {
      diffEngine.diff(graph1.serialize(), graph2.serialize());
    });

    console.log(`✓ Computed diff of 1000 entities: ${time.toFixed(2)}ms`);
    expect(time).toBeLessThan(1000);
  });

  test('should create snapshot quickly', async () => {
    // Setup: Large graph
    for (let i = 0; i < 5000; i++) {
      graph1.addEntity(createTestEntity(i));
    }

    const time = await measureTime(async () => {
      versioning.createVersion({ message: 'Performance test' });
    });

    console.log(`✓ Created snapshot of 5000 entities: ${time.toFixed(2)}ms`);
    expect(time).toBeLessThan(500);
  });

  test('should restore snapshot quickly', async () => {
    // Setup
    for (let i = 0; i < 1000; i++) {
      graph1.addEntity(createTestEntity(i));
    }
    
    const snapshot = versioning.createVersion({ message: 'Test' });
    
    // Modify graph
    for (let i = 0; i < 100; i++) {
      graph1.removeEntity(`node_${i}`);
    }

    const time = await measureTime(async () => {
      versioning.switchToVersion(snapshot.id);
    });

    console.log(`✓ Restored snapshot: ${time.toFixed(2)}ms`);
    expect(time).toBeLessThan(500);
  });
});

describe('Performance: Undo/Redo', () => {
  let graph, schema, eventBus, undoRedo;

  beforeEach(() => {
    eventBus = new EventBus();
    schema = new Schema();
    
    schema.registerEntityType('node', {
      title: { type: 'string', required: true }
    });

    graph = new Graph(eventBus, schema);
    undoRedo = new UndoRedoManager(graph);
  });

  test('should handle large undo stack efficiently', async () => {
    // Create 1000 operations
    for (let i = 0; i < 1000; i++) {
      graph.addEntity(createTestEntity(i));
    }

    // Measure undo performance
    const times = [];
    for (let i = 0; i < 100; i++) {
      const time = await measureTime(async () => {
        undoRedo.undo();
      });
      times.push(time);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`✓ Average undo time: ${avgTime.toFixed(2)}ms`);
    expect(avgTime).toBeLessThan(20);
  });

  test('should handle redo efficiently', async () => {
    // Setup
    for (let i = 0; i < 100; i++) {
      graph.addEntity(createTestEntity(i));
    }

    // Undo all
    for (let i = 0; i < 100; i++) {
      undoRedo.undo();
    }

    // Measure redo
    const times = [];
    for (let i = 0; i < 100; i++) {
      const time = await measureTime(async () => {
        undoRedo.redo();
      });
      times.push(time);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`✓ Average redo time: ${avgTime.toFixed(2)}ms`);
    expect(avgTime).toBeLessThan(20);
  });
});

describe('Performance: Memory Management', () => {
  let graph, schema, eventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    schema = new Schema();
    
    schema.registerEntityType('node', {
      title: { type: 'string', required: true },
      data: { type: 'string', required: false }
    });

    graph = new Graph(eventBus, schema);
  });

  test('should not leak memory with repeated add/remove', () => {
    const initialMemory = process.memoryUsage().heapUsed;

    // Perform many add/remove cycles
    for (let cycle = 0; cycle < 10; cycle++) {
      for (let i = 0; i < 1000; i++) {
        graph.addEntity(createTestEntity(i));
      }
      
      for (let i = 0; i < 1000; i++) {
        graph.removeEntity(`node_${i}`);
      }
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryGrowth = finalMemory - initialMemory;
    const memoryGrowthMB = memoryGrowth / 1024 / 1024;

    console.log(`✓ Memory growth: ${memoryGrowthMB.toFixed(2)}MB`);
    
    // Should not grow by more than 50MB
    expect(memoryGrowthMB).toBeLessThan(50);
  });

  test('should handle large payloads efficiently', async () => {
    const largeData = 'x'.repeat(10000); // 10KB string

    const time = await measureTime(async () => {
      for (let i = 0; i < 1000; i++) {
        graph.addEntity({
          id: `node_${i}`,
          type: 'node',
          metadata: {
            title: `Node ${i}`,
            data: largeData
          }
        });
      }
    });

    console.log(`✓ Added 1000 entities with large payloads: ${time.toFixed(2)}ms`);
    expect(time).toBeLessThan(2000);
  });
});

describe('Performance: Event System', () => {
  let eventBus;
  let eventCount;

  beforeEach(() => {
    eventBus = new EventBus();
    eventCount = 0;
  });

  test('should handle high-frequency events', async () => {
    const listener = () => { eventCount++; };
    eventBus.subscribe('test.event', listener);

    const time = await measureTime(async () => {
      for (let i = 0; i < 10000; i++) {
        eventBus.emit('test.event', { index: i });
      }
    });

    console.log(`✓ Emitted 10,000 events in ${time.toFixed(2)}ms`);
    expect(time).toBeLessThan(500);
    expect(eventCount).toBe(10000);
  });

  test('should handle many listeners efficiently', async () => {
    // Add 100 listeners
    for (let i = 0; i < 100; i++) {
      eventBus.subscribe('test.event', () => { eventCount++; });
    }

    const time = await measureTime(async () => {
      for (let i = 0; i < 1000; i++) {
        eventBus.emit('test.event', { index: i });
      }
    });

    console.log(`✓ Emitted 1000 events to 100 listeners in ${time.toFixed(2)}ms`);
    expect(time).toBeLessThan(1000);
    expect(eventCount).toBe(100000); // 1000 events × 100 listeners
  });
});
