/**
 * Renderer Contract Tests
 *
 * Verifies that all renderers implement the required contract.
 * Tests multiple renderer implementations against the same contract.
 *
 * See: ../../../doc/modules/ui/RendererContract.md
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import BaseRenderer from '../../../src/ui/renderers/base-renderer.js';
import JSONRenderer from '../../../src/ui/renderers/json-renderer.js';
import TreeRenderer from '../../../src/ui/renderers/tree-renderer.js';
import D3Renderer from '../../../src/ui/renderers/d3-renderer.js';

/**
 * Test suite factory for renderer contract compliance
 */
const testRendererContract = (RendererClass, rendererName) => {
  describe(`${rendererName} - Contract Compliance`, () => {
    let renderer;
    let container;

    beforeEach(() => {
      renderer = new RendererClass();
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      if (renderer && renderer.destroy) {
        renderer.destroy();
      }
      if (container && container.parentNode) {
        document.body.removeChild(container);
      }
    });

    describe('Lifecycle Methods', () => {
      it('should implement init(container, options)', () => {
        expect(renderer.init).toBeDefined();
        expect(typeof renderer.init).toBe('function');
        
        expect(() => {
          renderer.init(container, { mode: 'view', theme: 'light' });
        }).not.toThrow();
        
        expect(renderer.container).toBe(container);
      });

      it('should implement destroy()', () => {
        expect(renderer.destroy).toBeDefined();
        expect(typeof renderer.destroy).toBe('function');
        
        renderer.init(container);
        expect(() => renderer.destroy()).not.toThrow();
      });

      it('should clean up on destroy', () => {
        renderer.init(container);
        const childCountBefore = container.children.length;
        
        renderer.destroy();
        
        expect(renderer.container).toBeNull();
        // Container should be cleaned (or at least marked for cleanup)
      });
    });

    describe('Rendering Methods', () => {
      beforeEach(() => {
        renderer.init(container);
      });

      it('should implement render(graphSnapshot)', () => {
        expect(renderer.render).toBeDefined();
        expect(typeof renderer.render).toBe('function');
        
        const snapshot = {
          entities: [
            { id: 'e1', type: 'User', metadata: { title: 'Alice' } }
          ],
          relations: []
        };
        
        expect(() => renderer.render(snapshot)).not.toThrow();
      });

      it('should handle empty graph', () => {
        const snapshot = { entities: [], relations: [] };
        expect(() => renderer.render(snapshot)).not.toThrow();
      });

      it('should implement update(patch)', () => {
        expect(renderer.update).toBeDefined();
        expect(typeof renderer.update).toBe('function');
        
        const patch = {
          type: 'graph.entity.added',
          data: { entity: { id: 'e1', type: 'User' } }
        };
        
        expect(() => renderer.update(patch)).not.toThrow();
      });
    });

    describe('Interaction Methods', () => {
      beforeEach(() => {
        renderer.init(container);
        renderer.render({
          entities: [
            { id: 'e1', type: 'User', metadata: { title: 'Alice' } },
            { id: 'e2', type: 'User', metadata: { title: 'Bob' } }
          ],
          relations: [
            { id: 'r1', from: 'e1', to: 'e2', type: 'follows' }
          ]
        });
      });

      it('should implement highlight(targetType, targetId, kind)', () => {
        expect(renderer.highlight).toBeDefined();
        expect(typeof renderer.highlight).toBe('function');
        
        expect(() => {
          renderer.highlight('entity', 'e1', 'select');
        }).not.toThrow();
        
        expect(() => {
          renderer.highlight('entity', 'e1', 'hover');
        }).not.toThrow();
        
        expect(() => {
          renderer.highlight('relation', 'r1', 'select');
        }).not.toThrow();
      });

      it('should implement clearHighlight()', () => {
        expect(renderer.clearHighlight).toBeDefined();
        expect(typeof renderer.clearHighlight).toBe('function');
        
        renderer.highlight('entity', 'e1', 'select');
        expect(() => renderer.clearHighlight('entity', 'e1')).not.toThrow();
      });

      it('should implement focus(targetType, targetId)', () => {
        expect(renderer.focus).toBeDefined();
        expect(typeof renderer.focus).toBe('function');
        
        expect(() => {
          renderer.focus('entity', 'e1');
        }).not.toThrow();
      });

      it('should implement drillDown(entityId)', () => {
        expect(renderer.drillDown).toBeDefined();
        expect(typeof renderer.drillDown).toBe('function');
        
        expect(() => {
          renderer.drillDown('e1');
        }).not.toThrow();
      });

      it('should implement drillUp()', () => {
        expect(renderer.drillUp).toBeDefined();
        expect(typeof renderer.drillUp).toBe('function');
        
        expect(() => {
          renderer.drillUp();
        }).not.toThrow();
      });
    });

    describe('Mode and Theme Methods', () => {
      beforeEach(() => {
        renderer.init(container);
      });

      it('should implement setMode(mode)', () => {
        expect(renderer.setMode).toBeDefined();
        expect(typeof renderer.setMode).toBe('function');
        
        ['view', 'edit', 'annotate'].forEach(mode => {
          expect(() => renderer.setMode(mode)).not.toThrow();
          expect(renderer.mode).toBe(mode);
        });
      });

      it('should implement setTheme(theme)', () => {
        expect(renderer.setTheme).toBeDefined();
        expect(typeof renderer.setTheme).toBe('function');
        
        ['light', 'dark'].forEach(theme => {
          expect(() => renderer.setTheme(theme)).not.toThrow();
          expect(renderer.theme).toBe(theme);
        });
      });
    });

    describe('Event Emission', () => {
      beforeEach(() => {
        renderer.init(container);
        renderer.render({
          entities: [{ id: 'e1', type: 'User', metadata: { title: 'Alice' } }],
          relations: []
        });
      });

      it('should support event subscription via on()', () => {
        expect(renderer.on).toBeDefined();
        expect(typeof renderer.on).toBe('function');
        
        const listener = jest.fn();
        renderer.on('testEvent', listener);
        renderer._emitEvent('testEvent', { data: 'test' });
        
        expect(listener).toHaveBeenCalledWith({ data: 'test' });
      });

      it('should support event unsubscription via off()', () => {
        expect(renderer.off).toBeDefined();
        expect(typeof renderer.off).toBe('function');
        
        const listener = jest.fn();
        renderer.on('testEvent', listener);
        renderer.off('testEvent', listener);
        renderer._emitEvent('testEvent', {});
        
        expect(listener).not.toHaveBeenCalled();
      });

      it('should emit modeChange event when mode changes', (done) => {
        renderer.on('modeChange', (data) => {
          expect(data.mode).toBe('edit');
          done();
        });
        
        renderer.setMode('edit');
      });

      it('should emit themeChange event when theme changes', (done) => {
        renderer.on('themeChange', (data) => {
          expect(data.theme).toBe('dark');
          done();
        });
        
        renderer.setTheme('dark');
      });
    });
  });
};

// Run contract tests for all renderer implementations
describe('Renderer Contract Tests', () => {
  testRendererContract(JSONRenderer, 'JSONRenderer');
  testRendererContract(TreeRenderer, 'TreeRenderer');
  testRendererContract(D3Renderer, 'D3Renderer');
});
