/**
 * UIBridge - Mediator between UI and Core system
 *
 * Translates user interactions into core commands and core events into UI updates.
 * Manages renderer lifecycle and mode switching.
 *
 * See: ../../doc/arch/ui.md
 * See: ../../doc/modules/ui/RendererContract.md
 */

export class UIBridge {
  constructor(graph, bus, options = {}) {
    this.graph = graph;
    this.bus = bus;
    this.renderer = options.renderer;
    this.mode = options.mode || 'view'; // view, edit, annotate
    this.theme = options.theme || 'light';
    this.container = null;
    this._unsubscribers = [];
  }

  /**
   * Set the active renderer
   *
   * @param {Object} renderer - Renderer instance implementing Renderer interface
   * @param {HTMLElement} container - DOM element for rendering
   */
  setRenderer(renderer, container) {
    // Cleanup old renderer and subscriptions
    if (this.renderer && this.renderer.destroy) {
      try {
        this.renderer.destroy();
      } catch (err) {
        console.error('Error destroying renderer:', err);
      }
    }
    
    // Unsubscribe from old events before setting new renderer
    this.unsubscribeFromEvents();

    this.renderer = renderer;
    this.container = container;

    if (renderer && container) {
      try {
        renderer.init(container, { mode: this.mode, theme: this.theme });
        // Render initial graph snapshot if available
        if (typeof this.graph.serialize === 'function') {
          renderer.render(this.graph.serialize());
        }
        // Subscribe to core events for incremental updates
        this.subscribeToEvents();
      } catch (err) {
        console.error('Error initializing renderer:', err);
      }
    }
  }

  /**
   * Get the active renderer
   */
  getRenderer() {
    return this.renderer;
  }

  /**
   * Set the UI mode
   *
   * @param {string} mode - 'view' | 'edit' | 'annotate'
   */
  setMode(mode) {
    this.mode = mode;
    if (this.renderer && this.renderer.setMode) {
      this.renderer.setMode(mode);
    }
  }

  /**
   * Set the theme
   *
   * @param {string} theme - Theme identifier
   */
  setTheme(theme) {
    this.theme = theme;
    if (this.renderer && this.renderer.setTheme) {
      this.renderer.setTheme(theme);
    }
  }

  /**
   * Execute a user command (from UI)
   *
   * @param {string} command - Command name
   * @param {Object} params - Command parameters
   * @throws {Error} on validation or execution failure
   */
  executeCommand(command, params = {}) {
    // Validate command
    if (!command || typeof command !== 'string') {
      throw new Error('Invalid command: command must be a non-empty string');
    }

    // Validate mode restrictions
    const writeCommands = ['addEntity', 'updateEntity', 'removeEntity', 'addRelation', 'updateRelation', 'removeRelation'];
    if (writeCommands.includes(command) && this.mode === 'view') {
      throw new Error(`Command '${command}' not allowed in view mode`);
    }

    try {
      switch (command) {
        case 'addEntity':
          if (!params.type) throw new Error('addEntity requires type parameter');
          this.graph.addEntity(params);
          break;
        case 'updateEntity':
          if (!params.id) throw new Error('updateEntity requires id parameter');
          if (!params.patch) throw new Error('updateEntity requires patch parameter');
          this.graph.updateEntity(params.id, params.patch);
          break;
        case 'removeEntity':
          if (!params.id) throw new Error('removeEntity requires id parameter');
          this.graph.removeEntity(params.id);
          break;
        case 'addRelation':
          if (!params.from) throw new Error('addRelation requires from parameter');
          if (!params.to) throw new Error('addRelation requires to parameter');
          if (!params.type) throw new Error('addRelation requires type parameter');
          this.graph.addRelation(params);
          break;
        case 'updateRelation':
          if (!params.id) throw new Error('updateRelation requires id parameter');
          if (!params.patch) throw new Error('updateRelation requires patch parameter');
          this.graph.updateRelation(params.id, params.patch);
          break;
        case 'removeRelation':
          if (!params.id) throw new Error('removeRelation requires id parameter');
          if (this.graph && typeof this.graph.removeRelation === 'function') {
            this.graph.removeRelation(params.id);
          } else {
            console.warn('removeRelation not implemented on graph');
          }
          break;
        default:
          throw new Error(`Unknown command: ${command}`);
      }
    } catch (error) {
      console.error(`Command '${command}' failed:`, error);
      // Emit error event for UI to handle
      this.bus.emit('ui.command.error', {
        command,
        params,
        error: error.message
      }, { source: 'UIBridge' });
      throw error;
    }
  }

  /**
   * Subscribe to core events and forward relevant ones to renderer
   */
  subscribeToEvents() {
    // Graph mutations
    const onGraphChange = (event) => {
      if (this.renderer && this.renderer.update) {
        try {
          this.renderer.update({ type: event.type, data: event.data });
          // After incremental update, provide full snapshot for renderers
          if (this.renderer && this.renderer.render && typeof this.graph.serialize === 'function') {
            try {
              this.renderer.render(this.graph.serialize());
            } catch (err) {
              console.error('Renderer full render failed:', err);
            }
          }
        } catch (err) {
          console.error('Renderer update failed:', err);
        }
      }
    };

    this._unsubscribers.push(
      this.bus.subscribe('graph.entity.added', onGraphChange),
      this.bus.subscribe('graph.entity.updated', onGraphChange),
      this.bus.subscribe('graph.entity.removed', onGraphChange),
      this.bus.subscribe('graph.relation.added', onGraphChange),
      this.bus.subscribe('graph.relation.updated', onGraphChange),
      this.bus.subscribe('graph.relation.removed', onGraphChange)
    );

    // Annotation events
    const onAnnotationChange = (event) => {
      const targetId = event.data?.targetId;
      if (this.renderer && this.renderer.highlight && targetId) {
        try {
          this.renderer.highlight('entity', targetId, 'annotated');
        } catch (err) {
          console.error('Highlight failed:', err);
        }
      }
    };

    this._unsubscribers.push(
      this.bus.subscribe('annotation.added', onAnnotationChange),
      this.bus.subscribe('annotation.updated', onAnnotationChange)
    );

    // Cassette events
    const onCassetteFrame = (event) => {
      const { targetId, targetType, action } = event.data;
      if (this.renderer && targetId) {
        try {
          if (action === 'highlight' && this.renderer.highlight) {
            this.renderer.highlight(targetType || 'entity', targetId, 'custom');
          } else if (action === 'focus' && this.renderer.focus) {
            this.renderer.focus(targetType || 'entity', targetId);
          } else if(typeof action === 'function') {
            action(event, this.renderer, targetType || 'entity', targetId);
          }
        } catch (err) {
          console.error('Cassette frame action failed:', err);
        }
      }
    };

    const onCassettePlaybackState = (event) => {
      const playback = event.data?.playback;
      if (this.renderer && this.renderer.setCassettePlaybackState && playback) {
        try {
          this.renderer.setCassettePlaybackState(playback);
        } catch (err) {
          console.error('Cassette playback state update failed:', err);
        }
      }
    };

    this._unsubscribers.push(
      this.bus.subscribe('cassette.frame.enter', onCassetteFrame),
      this.bus.subscribe('cassette.playback.state', onCassettePlaybackState),
      this.bus.subscribe('cassette.player.play', () => {
        if (this.renderer && this.renderer.setMode) {
          this.renderer.setMode('cassette');
        }
      }),
      this.bus.subscribe('cassette.player.stop', () => {
        if (this.renderer && this.renderer.setMode) {
          this.renderer.setMode(this.mode);
        }
        if (this.renderer && this.renderer.clearAllHighlights) {
          this.renderer.clearAllHighlights();
        }
        if (this.renderer && this.renderer.clearCassettePlaybackState) {
          this.renderer.clearCassettePlaybackState();
        }
      }),
      this.bus.subscribe('cassette.play.ended', () => {
        if (this.renderer && this.renderer.clearCassettePlaybackState) {
          this.renderer.clearCassettePlaybackState();
        }
      })
    );
  }

  /**
   * Unsubscribe from events
   */
  unsubscribeFromEvents() {
    this._unsubscribers.forEach((unsub) => {
      if (typeof unsub === 'function') unsub();
    });
    this._unsubscribers = [];
  }

  /**
   * Destroy the bridge and clean up resources
   */
  destroy() {
    this.unsubscribeFromEvents();
    if (this.renderer && this.renderer.destroy) {
      try {
        this.renderer.destroy();
      } catch (err) {
        console.error('Error destroying renderer:', err);
      }
    }
    this.renderer = null;
  }
}

export default UIBridge;

// See: ../../doc/arch/ui.md
