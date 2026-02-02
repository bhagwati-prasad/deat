# Cassette Sidebar - Quick Reference Guide

## What Was Built?

A completely redesigned Cassette sidebar section for GraphSense with:
1. **Neumorphic entity icons** showing current frame content
2. **Interactive scrubber slider** for playback control
3. **Cassette list** managing all recordings
4. **Playback controls** (Record, Play, Pause, Stop)
5. **Sample cassette** with 8-frame walkthrough

## Visual Layout

```
🎬 CASSETTE SECTION
├─ Controls:        [⏺️] [▶️] [⏸️] [⏹️]
├─ Info:            Frame: 3/8
├─ Scrubber:        ████████░░░░░░░
├─ Current:         [👤]
├─ Divider Line
├─ List Title:      Cassettes
├─ Cassette List:   
│  ├─ Team Structure Overview (8 frames)
│  └─ Recording 10:30:45 (5 frames)
└─ Save Button:     [💾 Save Current]
```

## Button Functions

| Button | State | Action |
|--------|-------|--------|
| ⏺️ Record | Gray | Click to start recording |
| ⏺️ Record | Red | Recording active, click to stop |
| ▶️ Play | Enabled | Start playback of selected cassette |
| ▶️ Play | Disabled | No cassette selected |
| ⏸️ Pause | Enabled | During playback, pause at frame |
| ⏸️ Pause | Disabled | When not playing |
| ⏹️ Stop | Enabled | During playback, stop and reset |
| ⏹️ Stop | Disabled | When not playing |

## Usage Instructions

### Record a Cassette
1. Click ⏺️ button (turns red)
2. Perform actions in graph (select entities, navigate)
3. Click ⏺️ again to stop recording
4. Click 💾 **Save Current** to save
5. Cassette appears in list below

### Play a Cassette
1. Select cassette from list (click on it)
2. Click ▶️ **Play** button
3. Watch scrubber progress and frame counter
4. Current entity icon shows what's being highlighted

### Control Playback
- **Pause**: Click ⏸️ to pause, still shows current frame
- **Resume**: Click ▶️ again to continue from pause
- **Seek**: Click anywhere on scrubber to jump to that position
- **Stop**: Click ⏹️ to stop and reset to beginning

## Sample Cassette

### "Team Structure Overview"
A pre-loaded walkthrough showing relationships:
- **8 frames** total
- **~10 seconds** duration
- Highlights: Alice → GraphSense → Bob → DataViz → Team
- Actions: Mix of highlight and focus
- Ready to play immediately

### To Play Sample
1. Page loads with sample cassette in list
2. Select "Team Structure Overview"
3. Click ▶️ Play
4. Watch entities highlight in order
5. Scrubber shows progress

## Styling Features

### Entity Icons
- **32x32px** neumorphic buttons
- **Types**: 👤 person, 📦 project, 👥 team, 🔗 relation
- **Hover**: Lift effect (translateY -2px)
- **Active**: Blue accent color with glow

### Scrubber Slider
- **Height**: 28px with rounded corners
- **Progress**: Blue gradient fill left to right
- **Interaction**: Click anywhere to seek
- **Display**: Frame counter "3/8"

### Cassette Items
- **Layout**: Name + frame count
- **Hover**: Slide right with accent border
- **Active**: Highlighted in accent color
- **Scrollable**: Max 150px height

## CSS Classes Reference

```css
.cassette-section          /* Main container */
.cassette-controls        /* Button grid */
.cassette-btn            /* Control buttons */
.cassette-scrubber       /* Slider container */
.cassette-scrubber-track /* Progress fill */
.cassette-entity-icon    /* Neumorphic icons */
.cassette-list           /* Cassettes list */
.cassette-item           /* List item */
.cassette-item-title     /* Cassette name */
.cassette-item-meta      /* Frame count text */
.cassette-playback-info  /* Frame counter */
```

## JavaScript Functions

### `createSampleCassette()`
Creates and loads the sample "Team Structure Overview" cassette.

### `updateCassetteList()`
Refreshes cassette list from cassette player data.
- Fetches from `cassettePlayer.cassettes`
- Creates clickable items
- Manages selection state

### `updateCassettePlayback()`
Updates all playback UI elements:
- Frame counter
- Scrubber progress
- Button states (enabled/disabled)
- Current entity icon

### `getEntityIcon(entityId)`
Returns emoji icon for entity/relation type.

## Color Scheme

### Light Mode
- **Background**: White
- **Accents**: #0098ff (blue)
- **Recording**: #f48771 (red)
- **Text**: #333333 (dark gray)

### Dark Mode
- **Background**: #1e1e1e (dark)
- **Accents**: #0098ff (blue - same)
- **Recording**: #f48771 (red - same)
- **Text**: #e0e0e0 (light gray)

## Keyboard Navigation

- **Tab**: Navigate between buttons
- **Enter/Space**: Activate button
- **Click scrubber**: Seek to position

## Tips & Tricks

### Recording Tips
- Press ⏺️ once to start (button turns red)
- Make all your changes
- Press ⏺️ again to stop (button returns to gray)
- Immediately click 💾 to save while fresh

### Playback Tips
- Select cassette first (it highlights)
- ▶️ becomes enabled when you select
- Click scrubber to jump around in playback
- ⏸️ pauses but remembers position
- ⏹️ stops and goes back to start

### List Management
- List shows newest cassettes at bottom
- Click cassette name to select it
- Selected item highlighted in blue
- Can select different cassettes while playing (switches)

## Responsive Behavior

**Wide Sidebar (250px)**
- Buttons in single row, fully visible
- List full width
- Icons properly spaced

**Narrow Sidebar (Collapsed)**
- Buttons wrap to multiple rows
- Emojis still visible
- Icons still clickable

**Mobile**
- Sidebar expands for interaction
- All elements touch-friendly
- Buttons large enough to tap

## Known Limitations

- Cassettes stored in memory (lost on refresh)
- Maximum 150px height for list (scroll if many cassettes)
- No export/import yet
- No editing cassettes once saved

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers with ES6 support

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Cassette not appearing | Click 💾 Save Current after recording |
| Play button disabled | Select cassette from list first |
| Scrubber doesn't respond | Only works during playback |
| Icons not showing | Check entity IDs match graph |
| Cassette lost on refresh | Cassettes stored in memory, use export to save |

## What's Neumorphism?

Neumorphism is a design style combining:
- **Soft shadows** (inset and outer)
- **Subtle gradients**
- **Soft borders**
- **Minimal contrast**
- **3D appearance** without bright colors

Result: Icons look *embossed* and *tactile* while staying minimal.

## File Locations

```
/workspaces/deat/
├─ app/
│  └─ index.html ..................... Main HTML with CSS & JS
├─ src/services/
│  └─ cassette-player.js ............. CassettePlayer class
└─ Documentation:
   ├─ CASSETTE_SIDEBAR_REDESIGN.md ... Complete guide
   ├─ CASSETTE_UI_REFERENCE.md ....... Visual reference
   └─ CASSETTE_IMPLEMENTATION_CHECKLIST.md ... Status
```

## Summary

✅ **Complete redesign** of cassette sidebar with modern UI
✅ **Neumorphic icons** for entity display
✅ **Interactive scrubber** for precise control
✅ **Cassette management** with list UI
✅ **Sample walkthrough** pre-loaded
✅ **Dark mode** support
✅ **Responsive** design
✅ **Fully functional** recording and playback

**Status**: Ready for production use! 🚀
