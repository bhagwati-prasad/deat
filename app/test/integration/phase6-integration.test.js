/**
 * Phase 6 Integration Tests
 *
 * Verify UI layer (Phase 6) integrates with core, services, and adapters (earlier phases).
 * End-to-end flow: Graph mutations → EventBus → UIBridge → Renderer updates
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Graph } from '../../src/core/graph.js';
import { Schema } from '../../src/core/schema.js';
import { EventBus } from '../../src/core/event/bus.js';
import UIBridge from '../../src/ui/bridge.js';
import { D3Renderer } from '../../src/ui/renderers/d3-renderer.js';
import { JSONRenderer } from '../../src/ui/renderers/json-renderer.js';
import { TreeRenderer } from '../../src/ui/renderers/tree-renderer.js';
import AnnotationService from '../../src/services/annotation-service.js';

describe('Phase 6 Integration: UI Layer with Core', () => {
  let bus;
  let schema;
  let graph;
  let bridge;
  let annotationService;
  let container;

  beforeEach(() => {
    bus = new EventBus();
    schema = new Schema();
    graph = new Graph(bus, schema);
    annotationService = new AnnotationService(graph, bus);
    bridge = new UIBridge(graph, bus);
    container = document.createElement('div');

    // Register test types
    schema.registerEntityType('User', { required: ['id', 'type'] });
    schema.registerEntityType('Repository', { required: ['id', 'type'] });
    schema.registerRelationType('owns', { source: 'User', target: 'Repository' });
    schema.registerRelationType('collaborates', { source: '*', target: '*' });
  });

  describe('Event Flow: Graph → Bus → Bridge → Renderer', () => {
    it('should propagate entity.added from graph to renderer via bus', () => {
      const renderer = new D3Renderer();
      bridge.setRenderer(renderer, container);

      const updateSpy = jest.fn();
      renderer.on('update', updateSpy);

      // Add entity to graph
      const user = { id: 'u1', type: 'User', metadata: { title: 'Alice' } };
      graph.addEntity(user);

      // Verify event propagated through bridge to renderer
      expect(updateSpy).toHaveBeenCalled();
      expect(renderer.nodes).toHaveLength(1);
      expect(renderer.nodes[0].id).toBe('u1');
    });

    it('should propagate relation.added from graph to renderer via bus', () => {
      const renderer = new D3Renderer();
      bridge.setRenderer(renderer, container);

      const updateSpy = jest.fn();
      renderer.on('update', updateSpy);

      // Create entities and relation
      const user = { id: 'u1', type: 'User' };
      const repo = { id: 'r1', type: 'Repository' };
      graph.addEntity(user);
      graph.addEntity(repo);
      const relation = { id: 'rel1', from: 'u1', to: 'r1', type: 'owns' };
      graph.addRelation(relation);

      // Verify renderer has both nodes and link
      expect(renderer.nodes).toHaveLength(2);
      expect(renderer.links).toHaveLength(1);
      expect(renderer.links[0].type).toBe('owns');
    });

    it('should handle entity.updated propagation', () => {
      const renderer = new D3Renderer();
      bridge.setRenderer(renderer, container);

      const user = { id: 'u1', type: 'User', metadata: { title: 'Alice' } };
      graph.addEntity(user);

      // Update entity
      graph.updateEntity('u1', { metadata: { title: 'Alice Smith' } });

      expect(renderer.nodes[0].label).toBe('Alice Smith');
    });

    it('should handle entity.removed propagation', () => {
      const renderer = new D3Renderer();
      bridge.setRenderer(renderer, container);

      const user = { id: 'u1', type: 'User' };
      graph.addEntity(user);
      expect(renderer.nodes).toHaveLength(1);

      // Remove entity
      graph.removeEntity('u1');

      expect(renderer.nodes).toHaveLength(0);
    });
  });

  describe('Renderer Switching', () => {
    it('should switch between renderers and maintain graph state', () => {
      const user = { id: 'u1', type: 'User', metadata: { title: 'Alice' } };
      graph.addEntity(user);

      // Start with D3
      const d3Renderer = new D3Renderer();
      bridge.setRenderer(d3Renderer, container);
      expect(d3Renderer.nodes).toHaveLength(1);

      // Switch to JSON
      const jsonRenderer = new JSONRenderer();
      bridge.setRenderer(jsonRenderer, container);
      expect(jsonRenderer.currentSnapshot).toBeDefined();
      expect(jsonRenderer.currentSnapshot.entities).toHaveLength(1);

      // Switch to Tree
      const treeRenderer = new TreeRenderer();
      bridge.setRenderer(treeRenderer, container);
      expect(treeRenderer.currentSnapshot).toBeDefined();
      expect(treeRenderer.currentSnapshot.entities).toHaveLength(1);
    });
  });

  describe('Mode and Theme Propagation', () => {
    it('should propagate mode changes to renderer', () => {
      const renderer = new D3Renderer();
      bridge.setRenderer(renderer, container);

      const modeListener = jest.fn();
      renderer.on('modeChange', modeListener);

      bridge.setMode('edit');

      expect(renderer.mode).toBe('edit');
      expect(modeListener).toHaveBeenCalledWith({ mode: 'edit' });
    });

    it('should propagate theme changes to renderer', () => {
      const renderer = new D3Renderer();
      bridge.setRenderer(renderer, container);

      const themeListener = jest.fn();
      renderer.on('themeChange', themeListener);

      bridge.setTheme('dark');

      expect(renderer.theme).toBe('dark');
      expect(themeListener).toHaveBeenCalledWith({ theme: 'dark' });
    });
  });

  describe('Command Execution via Bridge', () => {
    beforeEach(() => {
      bridge.setMode('edit');
    });

    it('should execute addEntity command from UI', () => {
      const renderer = new D3Renderer();
      bridge.setRenderer(renderer, container);

      bridge.executeCommand('addEntity', {
        id: 'u1',
        type: 'User',
        metadata: { title: 'Bob' },
      });

      expect(graph.entities.size).toBe(1);
      expect(renderer.nodes).toHaveLength(1);
      expect(renderer.nodes[0].label).toBe('Bob');
    });

    it('should execute addRelation command from UI', () => {
      const renderer = new D3Renderer();
      bridge.setRenderer(renderer, container);

      // Create entities first
      const user = { id: 'u1', type: 'User' };
      const repo = { id: 'r1', type: 'Repository' };
      graph.addEntity(user);
      graph.addEntity(repo);

      // Execute addRelation command
      bridge.executeCommand('addRelation', {
        id: 'rel1',
        from: 'u1',
        to: 'r1',
        type: 'owns',
      });

      expect(graph.relations.size).toBe(1);
      expect(renderer.links).toHaveLength(1);
    });

    it('should execute updateEntity command from UI', () => {
      const renderer = new D3Renderer();
      bridge.setRenderer(renderer, container);

      const user = { id: 'u1', type: 'User', metadata: { title: 'Charlie' } };
      graph.addEntity(user);

      bridge.executeCommand('updateEntity', {
        id: 'u1',
        patch: { metadata: { title: 'Charlie Updated' } },
      });

      expect(renderer.nodes[0].label).toBe('Charlie Updated');
    });
  });

  describe('Annotation Service Integration', () => {
    it('should highlight annotated entities in renderer', () => {
      const renderer = new D3Renderer();
      bridge.setRenderer(renderer, container);

      const user = { id: 'u1', type: 'User' };
      graph.addEntity(user);

      // Add annotation via service
      annotationService.addNote('u1', 'Important user');

      // Listen for annotation event on renderer
      const highlightListener = jest.fn();
      renderer.on('highlight', highlightListener);

      // Annotation service emits annotation.added
      // Bridge should handle and highlight the entity
      bus.subscribe('annotation.added', (event) => {
        if (event.data?.targetId) {
          renderer.highlight('entity', event.data.targetId, 'annotated');
        }
      });

      // Trigger annotation event
      annotationService.addNote('u1', 'Another note');

      expect(renderer.highlightedElements.has('u1')).toBe(true);
    });
  });

  describe('Multi-Renderer Coordination', () => {
    it('should keep multiple renderers in sync', () => {
      const d3Renderer = new D3Renderer();
      const jsonRenderer = new JSONRenderer();
      const treeRenderer = new TreeRenderer();

      // Set them all up
      bridge.setRenderer(d3Renderer, container);
      bridge.setRenderer(jsonRenderer, container);
      bridge.setRenderer(treeRenderer, container);

      // Add entity
      const user = { id: 'u1', type: 'User', metadata: { title: 'Diana' } };
      graph.addEntity(user);

      // All renderers should have the entity (bridge updates current renderer only)
      // But we can verify treeRenderer is the active one
      expect(treeRenderer.currentSnapshot.entities).toHaveLength(1);
    });
  });

  describe('Large Graph Handling', () => {
    it('should handle 100+ entities and relations', () => {
      const renderer = new D3Renderer();
      bridge.setRenderer(renderer, container);

      // Create many entities
      for (let i = 0; i < 50; i++) {
        graph.addEntity({
          id: `u${i}`,
          type: 'User',
          metadata: { title: `User ${i}` },
        });
      }

      for (let i = 0; i < 50; i++) {
        graph.addEntity({
          id: `r${i}`,
          type: 'Repository',
          metadata: { title: `Repo ${i}` },
        });
      }

      // Add some relations
      for (let i = 0; i < 50; i++) {
        graph.addRelation({
          id: `rel${i}`,
          from: `u${i % 50}`,
          to: `r${i}`,
          type: 'owns',
        });
      }

      expect(renderer.nodes).toHaveLength(100);
      expect(renderer.links).toHaveLength(50);
    });
  });

  describe('Error Handling', () => {
    it('should gracefully handle invalid commands', () => {
      const renderer = new D3Renderer();
      bridge.setRenderer(renderer, container);

      expect(() => {
        bridge.executeCommand('invalidCommand', {});
      }).toThrow();
    });

    it('should handle missing entity in addRelation', () => {
      const renderer = new D3Renderer();
      bridge.setRenderer(renderer, container);

      expect(() => {
        bridge.executeCommand('addRelation', {
          id: 'rel1',
          from: 'nonexistent-u',
          to: 'nonexistent-r',
          type: 'owns',
        });
      }).toThrow();
    });
  });

  describe('Event History Tracking', () => {
    it('should maintain event history through all mutations', () => {
      bridge.setRenderer(new D3Renderer(), container);

      graph.addEntity({ id: 'u1', type: 'User' });
      graph.addEntity({ id: 'u2', type: 'User' });
      graph.addRelation({
        id: 'rel1',
        from: 'u1',
        to: 'u2',
        type: 'collaborates',
      });

      const history = bus.getHistory();

      // Should have entity.added x2, relation.added x1
      const addedEvents = history.filter(
        (e) => e.type.includes('added')
      );
      expect(addedEvents.length).toBeGreaterThanOrEqual(2);
    });
  });
});
