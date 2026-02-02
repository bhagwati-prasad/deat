# Console Tab - Quick Reference

## Overview

A new **Console** renderer tab has been added to GraphSense that allows you to interact directly with the `GS` API from the browser. This is perfect for experimentation, debugging, and automation.

## Accessing the Console

1. Open the main application (`index.html`)
2. Click the **Console** tab in the renderer tabs (between "JSON View" and others)
3. Type JavaScript code in the input field
4. Press **Enter** or click **Execute**

## Features

### Full GS Access
The console has full access to the global `GS` object, so you can:

```javascript
// Graph operations
GS.graph.addEntity({ id: 'e1', type: 'person', metadata: { name: 'Test' } })
GS.graph.addRelation({ id: 'rel1', from: 'e1', to: 'e2', type: 'works_on' })
GS.graph.entities.size

// Event bus
GS.eventBus.subscribe('*', (event) => console.log(event))

// Schema
GS.schema.getEntityType('person')

// Cassette player
GS.cassettePlayer.getCassettes()
GS.cassettePlayer.play('cassette-id')

// Undo/Redo
GS.undoRedo.undo()
GS.undoRedo.redo()

// Renderers
GS.renderAll()
GS.d3Renderer.render(graphData)
```

### Console Output

All output is captured and displayed in the console:
- **Blue text**: Input commands
- **Green text**: Success/return values
- **Red text**: Errors
- **Yellow text**: Warnings
- **Cyan text**: Info messages

### Formatted Output

Objects are automatically formatted as JSON for easy inspection:

```javascript
GS.graph.serialize()
// Output:
// {
//   "entities": [...],
//   "relations": [...]
// }
```

## Common Use Cases

### Inspect Graph State
```javascript
// Get current graph data
GS.graph.serialize()

// Count entities and relations
GS.graph.entities.size
GS.graph.relations.size

// List all cassettes
GS.cassettePlayer.getCassettes()
```

### Create Data
```javascript
// Add entity
GS.graph.addEntity({
  id: 'person-1',
  type: 'person',
  metadata: { name: 'Alice', role: 'Developer' }
})

// Add relation
GS.graph.addRelation({
  id: 'rel-1',
  from: 'person-1',
  to: 'project-1',
  type: 'works_on'
})

// Re-render
GS.renderAll()
```

### Test Event System
```javascript
// Listen to all events
GS.eventBus.subscribe('*', (event) => console.log(event))

// Trigger an action
GS.graph.addEntity({...})
```

### Manage Cassettes
```javascript
// Create sample cassette
GS.createSampleCassette()

// Get cassettes
GS.cassettePlayer.getCassettes()

// Play cassette
const cassettes = GS.cassettePlayer.getCassettes()
if (cassettes.length > 0) {
  GS.cassettePlayer.play(cassettes[0].id)
}

// Control playback
GS.cassettePlayer.pause()
GS.cassettePlayer.resume()
GS.cassettePlayer.stop()
```

### Record Cassette
```javascript
// Start recording
GS.graph.addEntity({ id: 'e1', type: 'person', metadata: { name: 'Test' } })
// (perform actions)
// Save recording is done through UI
```

### Undo/Redo
```javascript
GS.undoRedo.undo()
GS.undoRedo.redo()
```

### Switch Graph
```javascript
// Get all graphs
GS.graphManager.listGraphs()

// Switch to a graph
GS.graphManager.setActiveGraph('graph-id')

// Create new graph
const id = GS.graphManager.createGraph('New Graph')
GS.graphManager.setActiveGraph(id)
GS.renderAll()
```

## Tips & Tricks

### Clear Console
Scroll up in the output area or refresh the page

### Multi-line Commands
For complex operations, you can write multi-line JavaScript:

```javascript
// Create entities and relations
const entities = [
  { id: 'e1', type: 'person', metadata: { name: 'Alice' } },
  { id: 'e2', type: 'person', metadata: { name: 'Bob' } }
];

entities.forEach(e => GS.graph.addEntity(e));
GS.graph.addRelation({
  id: 'rel1',
  from: 'e1',
  to: 'e2',
  type: 'knows'
});

GS.renderAll();
```

### Debug Events
```javascript
// Log all graph events
GS.eventBus.subscribe('*', (event) => {
  console.log(`Event: ${event.type}`, event.data)
})
```

### Test Query Engine
```javascript
// Query entities
GS.queryEngine.from('person').count()

// More complex queries
GS.queryEngine.from('repository')
  .where({ 'metadata.title': { contains: 'Graph' } })
  .execute()
```

### Inspect Current Selection
```javascript
// Get currently selected entity
GS.selectedEntity

// Get current renderer
GS.currentRenderer

// Is recording?
GS.isRecording
```

## Error Handling

Errors are automatically caught and displayed in red:

```javascript
GS.graph.addEntity({ id: 'invalid' })
// Error: Entity must have a type property
```

## Performance Notes

- Large operations may take time (check browser dev tools)
- Console output is kept in memory - refresh to clear
- Each command is isolated in its own execution context

## Accessibility

The console tab is fully functional with:
- Keyboard input (type and press Enter)
- Button execution
- Full GS API access
- Console interception for logging
- JSON formatting

## Integration with UI

The console tab works alongside other features:
- Changes made in console are reflected in Graph View/Tree View/JSON View
- Cassette operations sync with UI
- Events propagate normally
- All renderers respond to changes

## Advanced Examples

### Bulk Create Entities
```javascript
const types = ['person', 'project', 'team'];
for (let i = 0; i < 10; i++) {
  GS.graph.addEntity({
    id: `entity-${i}`,
    type: types[i % types.length],
    metadata: { name: `Entity ${i}` }
  });
}
GS.renderAll();
```

### Auto-replay Events
```javascript
// Get all events from current session
const events = [];
GS.eventBus.subscribe('*', (event) => {
  events.push(event);
  console.log(`${events.length}: ${event.type}`);
});
```

### Create Complex Graph
```javascript
// Create team structure
GS.graph.addEntity({ id: 'team1', type: 'team', metadata: { name: 'Platform' } });
GS.graph.addEntity({ id: 'p1', type: 'person', metadata: { name: 'Alice' } });
GS.graph.addEntity({ id: 'proj1', type: 'project', metadata: { title: 'GraphSense' } });

GS.graph.addRelation({
  id: 'r1',
  from: 'p1',
  to: 'team1',
  type: 'belongs_to'
});

GS.graph.addRelation({
  id: 'r2',
  from: 'p1',
  to: 'proj1',
  type: 'works_on'
});

GS.renderAll();
console.log('Graph created!');
```

---

**The console tab is your direct line to GraphSense's API!** 🚀
