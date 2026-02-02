# Cassette Sidebar Visual Structure

## Layout Hierarchy

```
┌─────────────────────────────────────────┐
│  🎬 Cassette                            │ (section-title)
├─────────────────────────────────────────┤
│                                         │
│ ┌─ Playback Controls ──────────────────┐ (cassette-section)
│ │ [⏺️] [▶️] [⏸️] [⏹️]                    │
│ └────────────────────────────────────────┘
│                                         │
│ Frame: 0/0                              │ (cassette-playback-info)
│                                         │
│ ┌─ Scrubber ──────────────────────────┐ (cassette-scrubber)
│ │ ████████░░░░░░░░░░░░░░ 0:00        │
│ └────────────────────────────────────────┘
│                                         │
│ Current: [👤]                           │ (current-frame-entities)
│                                         │
│ ──────────────────────────────────────── 
│                                         │
│ Cassettes                               │
│ ┌─ Cassette Item 1 ─────────────────┐  │
│ │ Team Structure Overview            │  │ (cassette-item)
│ │ 8 frames                           │  │
│ └────────────────────────────────────┘  │
│                                         │
│ ┌─ Cassette Item 2 ─────────────────┐  │
│ │ Recording 10:30:45                 │  │
│ │ 5 frames                           │  │
│ └────────────────────────────────────┘  │
│                                         │
│ [💾 Save Current]                       │ (save-cassette-btn)
└─────────────────────────────────────────┘
```

## CSS Styling Breakdown

### Control Buttons (.cassette-btn)
```
┌──────┐
│  ⏺️  │  flex: 1; min-width: 45px;
├──────┤  padding: 8px;
│hover │  hover: accent color + transform
└──────┘  disabled: opacity 0.5
```

### Scrubber (.cassette-scrubber)
```
┌─────────────────────────────────────┐
│ ████████░░░░░░░░░░░░░░ 0:00        │  height: 28px;
├─────────────────────────────────────┤  --progress: 0%
└─────────────────────────────────────┘
         ▲
    track gradient fill
    from accent color
```

### Entity Icon (.cassette-entity-icon)
```
┌───────────┐
│     👤    │  width: 32px; height: 32px;
├───────────┤  border-radius: 8px;
│ neumorphic│  inset shadows for depth
└───────────┘  hover: lift effect
```

### Cassette Item (.cassette-item)
```
┌──────────────────────────────────┐
│ Team Structure Overview         │  padding: 8px;
│ 8 frames                        │  hover: shift right + accent border
├──────────────────────────────────┤  active: background accent color
└──────────────────────────────────┘
```

## Interactive States

### Recording (⏺️ button)
- **Normal**: Gray background
- **Recording**: Red background (#f48771)
  - Button text: ⏺️
  - User performs actions (captured as frames)
  - All graph changes recorded
- **Stopped**: Returns to gray

### Playback (▶️ button)
- **No cassette selected**: Disabled (gray, opacity 0.5)
- **Cassette selected**: Enabled (clickable)
- **Playing**: Disabled (can't double-play)
- **Paused**: Enabled (can resume)

### Scrubber
- **Not playing**: Appears but not interactive
- **Playing**: Shows progress, clickable for seeking
- **Hovered**: Enhanced shadow, visual feedback

### Cassette List Item
- **Default**: Light background, slight border
- **Hovered**: Shift right (transform), accent border
- **Active**: Accent background color, visible selection

## Color Scheme

### Light Mode
```
Background:    #ffffff (--bg-primary)
Secondary:     #f3f3f3 (--bg-secondary)
Tertiary:      #ececec (--bg-tertiary)
Text Primary:  #333333 (--text-primary)
Text Secondary:#666666 (--text-secondary)
Accent:        #0098ff (--color-accent)
Error:         #f48771 (--color-error - for recording)
```

### Dark Mode
```
Background:    #1e1e1e (--bg-primary)
Secondary:     #252526 (--bg-secondary)
Tertiary:      #2d2d30 (--bg-tertiary)
Text Primary:  #e0e0e0 (--text-primary)
Text Secondary:#b4b4b4 (--text-secondary)
Accent:        #0098ff (--color-accent - unchanged)
Error:         #f48771 (--color-error - unchanged)
```

## Responsive Behavior

### Cassette Controls
- **Wide sidebar** (250px): Buttons in single row
- **Narrow sidebar** (50px collapsed): Buttons wrap, flex-wrap active
- **Mobile** (if sidebar expands): Full width buttons

### Cassette List
- **Max height**: 150px with overflow-y auto
- **Scrollable**: Independent scroll from sidebar
- **Item height**: ~50px (variable with name length)

### Scrubber
- **Always full width**: Responds to container
- **Height fixed**: 28px regardless of width
- **Text**: Scales with font-size-sm (12px)

## Animation Timings

```
Button hover:          0.2s ease (translateY -1px)
Button active press:   Immediate (no transition)
Border/shadow:         0.2s ease
Transform on click:    0.1s ease
Progress fill:         0.1s (during playback)
Cassette item hover:   0.2s ease (translateX +2px)
```

## Accessibility Features

1. **Visual States**
   - Disabled buttons clearly distinguished
   - Active cassette highlighted
   - Hover states visible on all interactive elements

2. **Tooltips**
   - `title` attributes on buttons
   - Cassette items show name + frame count

3. **Keyboard Support**
   - Tab navigation through buttons
   - Click handlers for spacebar

4. **Color Contrast**
   - All text meets WCAG AA standards
   - Error red distinguishes recording state
   - Accent color visible in both themes

5. **Focus Indicators**
   - Outline on buttons when focused
   - Border color change on list items

## Sample Cassette Display

When loaded, the sample cassette appears:

```
┌──────────────────────────────┐
│ Team Structure Overview       │
│ 8 frames                      │
└──────────────────────────────┘

Clicking this item:
- Selects it (highlights with accent)
- Enables ▶️ Play button
- Updates scrubber (ready to play)

Click ▶️ Play:
- Frame 1: [👤] Alice highlighted
- Frame 2: [🔗] Relation focused
- Frame 3: [📦] Project highlighted
- ...continues through 8 frames
- Each frame has specific duration
```

## Entity Icon Mapping

```
Entity Type    │ Icon │ Color
───────────────┼──────┼───────────
person         │  👤  │ blue
project        │  📦  │ blue
team           │  👥  │ blue
repository     │  📚  │ green
organization   │  🏢  │ orange
relation       │  🔗  │ gray
unknown        │  •   │ gray
```

## Performance Considerations

1. **CSS Classes**: All reusable, no inline styles
2. **JavaScript**: Efficient DOM querying via IDs
3. **Redraws**: Minimal on scrubber interaction
4. **Gradients**: Hardware-accelerated
5. **Shadows**: Uses CSS inset/box-shadow (fast)

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| CSS Gradients | ✓ | ✓ | ✓ | ✓ |
| Box-shadow | ✓ | ✓ | ✓ | ✓ |
| CSS Variables | ✓ | ✓ | ✓ | ✓ |
| Flexbox | ✓ | ✓ | ✓ | ✓ |
| ES6 Arrow Functions | ✓ | ✓ | ✓ | ✓ |
