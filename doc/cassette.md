## Recording
```
const player = new CassettePlayer({ bus: eventBus });

// Start recording
player.startRecording('My Demo');

// Record frames - each interaction
player.recordFrame('entity-id', 'highlight', 250, { label: 'First step' });
player.recordFrame('entity-id-2', 'focus', 500);

// Stop and save
const cassette = player.stopRecording();
// Returns: { id, name, frames, created, modified, version }
```


## Loading and playing
```
// Load a cassette (from stored data)
player.play(cassette.id);

// Or load from JSON/imported data
const importedCassette = {
  id: 'my-cassette',
  name: 'Walkthrough',
  frames: [...]
};
player.play(importedCassette.id, importedCassette);

// Playback controls
player.pause();      // Pause without reset
player.resume();     // Continue from pause
player.stop();       // Stop and reset to start

// Navigation
player.nextFrame();       // Move to next frame
player.previousFrame();   // Go back one frame
player.seek(frameIndex);  // Jump to specific frame

// Control speed
player.setSpeed(2.0);   // 2x speed
player.setSpeed(0.5);   // 0.5x (half speed)
```


## Cassette frame
```
{
  targetId: string,           // Entity or relation ID
  action: string,             // e.g., 'highlight', 'focus'
  duration: number,           // Milliseconds to display
  metadata: object,           // Optional custom data
  timestamp: number           // When recorded
}
```


## Export / Persist cassette
```
// Export to JSON
const cassette = player.getCurrentCassette();
const json = JSON.stringify(cassette, null, 2);

// Save to file or localStorage
localStorage.setItem('my-cassette', json);

// Later, load from storage
const saved = JSON.parse(localStorage.getItem('my-cassette'));
player.play(saved.id, saved);  // Load and play
```


## Get and List cassettes
```
// Get current cassette being played
player.getCurrentCassette();

// Get cassette by ID
player.getCassette(cassette.id);

// List all loaded cassettes
player.getCassettes();

// Get current playback state
const state = player.getState();
// { isPlaying, currentFrameIndex, totalFrames, speed }
```


## Cassette events
```
'cassette.play.started'    // Playback begins
'cassette.frame.enter'     // Frame becomes active
'cassette.frame.exit'      // Frame ends
'cassette.play.ended'      // Playback complete
'cassette.player.pause'    // Paused
'cassette.player.stop'     // Stopped
```