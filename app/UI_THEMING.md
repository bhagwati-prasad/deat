# 🎨 GraphSense UI - Theme & Customization Guide

**Location:** [app/index.html](../app/index.html)

---

## Quick Start

Open `app/index.html` in your browser to see the full GraphSense system in action with:
- ✅ VS Code-like layout
- ✅ Light/Dark mode toggle
- ✅ All renderers (D3 Graph, Tree, JSON)
- ✅ Cassette recording/playback
- ✅ Sample dataset pre-loaded

---

## Theme System

### How It Works

The UI uses **CSS variables** for complete theming. A single class on the `<body>` switches between themes:

```html
<body>              <!-- Light mode (default) -->
<body class="dark-mode">  <!-- Dark mode -->
```

No JavaScript changes needed - pure CSS customization.

### CSS Variables Reference

#### Colors
```css
:root {
  /* Brand colors */
  --color-primary: #0e639c;    /* Main action color */
  --color-accent: #0098ff;     /* Highlights */
  --color-success: #4ec9b0;    /* Positive actions */
  --color-warning: #dcdcaa;    /* Warnings */
  --color-error: #f48771;      /* Errors */
  --color-info: #4fc1ff;       /* Information */
  
  /* Background colors */
  --bg-primary: #ffffff;       /* Main background */
  --bg-secondary: #f3f3f3;     /* Secondary areas */
  --bg-tertiary: #ececec;      /* Borders/dividers */
  
  /* Text colors */
  --text-primary: #333333;     /* Main text */
  --text-secondary: #666666;   /* Secondary text */
  --text-tertiary: #999999;    /* Tertiary text */
  
  /* UI elements */
  --border-color: #d4d4d4;
  --hover-bg: #f0f0f0;
}
```

#### Spacing Scale
```css
--spacing-xs: 4px;       /* Minimal spacing */
--spacing-sm: 8px;       /* Small spacing */
--spacing-md: 12px;      /* Medium spacing (default) */
--spacing-lg: 16px;      /* Large spacing */
--spacing-xl: 24px;      /* Extra large */
--spacing-2xl: 32px;     /* 2x extra large */
```

#### Typography
```css
--font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, ...;
--font-mono: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Courier New', ...;
--font-size-sm: 12px;
--font-size-base: 13px;
--font-size-md: 14px;
--font-size-lg: 16px;
--font-size-xl: 18px;
--line-height-base: 1.5;
--line-height-tight: 1.25;
```

#### Layout
```css
--sidebar-width: 250px;
--editor-width: 400px;
--panel-width: 300px;
--header-height: 40px;
--tab-height: 35px;
--border-radius: 4px;
--shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
```

---

## Creating New Themes

### Method 1: Override CSS Variables

Add a new theme class in the HTML:

```html
<body class="ocean-theme">
```

Define theme variables in CSS:

```css
body.ocean-theme {
  /* Colors */
  --color-primary: #006b96;
  --color-accent: #00d4ff;
  --color-success: #00a896;
  --bg-primary: #f0f7ff;
  --bg-secondary: #e8f3ff;
  --text-primary: #003d66;
  
  /* Keep other variables same or customize */
  --spacing-md: 12px;
  --font-size-base: 14px;
}
```

### Method 2: Create Multiple Themes

```css
/* Warm theme */
body.warm-theme {
  --color-primary: #d4541d;
  --color-accent: #ff7f50;
  --color-success: #f4a460;
  --bg-primary: #fffaf0;
}

/* Cool theme */
body.cool-theme {
  --color-primary: #003d82;
  --color-accent: #0084ff;
  --color-success: #00d4aa;
  --bg-primary: #f0f8ff;
}

/* High Contrast theme */
body.high-contrast {
  --color-primary: #000000;
  --bg-primary: #ffffff;
  --text-primary: #000000;
  --border-color: #000000;
}
```

### Method 3: Dynamic Theme Switching

JavaScript to switch themes:

```javascript
// Light to Dark
document.body.classList.add('dark-mode');

// Dark to Light
document.body.classList.remove('dark-mode');

// Custom theme
document.body.classList.add('ocean-theme');
document.body.classList.remove('dark-mode');
```

Existing selector in HTML:
```html
<select id="theme-selector" class="select">
  <option value="light">☀️ Light</option>
  <option value="dark">🌙 Dark</option>
</select>
```

---

## Layout Architecture

### VS Code-like Structure

```
┌────────────────────────────────────────────────┐
│  Header: Title, Theme Selector, Reset Button   │
├──────────────┬─────────────────────┬───────────┤
│              │                     │           │
│   Sidebar    │   Renderer Area     │  Control  │
│  - Views     │  - D3 Graph         │  Panel    │
│  - Cassette  │  - Tree View        │ - Ops     │
│  - Mode      │  - JSON View        │ - Stats   │
│  - Status    │                     │ - Cassette│
│              │                     │           │
└──────────────┴─────────────────────┴───────────┘
```

### Responsive Grid

```css
#app {
  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr;
  grid-template-rows: var(--header-height) 1fr;
}

.main-content {
  display: grid;
  grid-template-columns: 1fr var(--editor-width);
}
```

---

## Component Classes

### Buttons
```html
<button class="button">Primary Button</button>
<button class="button" disabled>Disabled Button</button>
<div class="button-group">
  <button class="button">Left</button>
  <button class="button">Right</button>
</div>
```

### Forms
```html
<label class="label">Entity Name</label>
<input type="text" class="input" />
<select class="select">
  <option>Option 1</option>
</select>
```

### Statistics
```html
<div class="stats">
  <div class="stat">
    <div class="stat-value">42</div>
    <div class="stat-label">Entities</div>
  </div>
</div>
```

### Status Indicator
```html
<span class="status-indicator online"></span>
<span class="status-indicator offline"></span>
```

---

## Dark Mode Implementation

The UI automatically switches all colors via CSS variables:

```css
body.dark-mode {
  --bg-primary: #1e1e1e;
  --bg-secondary: #252526;
  --bg-tertiary: #2d2d30;
  --text-primary: #e0e0e0;
  --text-secondary: #b4b4b4;
  --text-tertiary: #808080;
  --border-color: #3e3e42;
  --hover-bg: #2d2d30;
}
```

All components automatically adapt because they use `var()` for colors:

```css
.button {
  background: var(--color-primary);  /* Adapts to theme */
  color: white;
}

.panel {
  background: var(--bg-secondary);   /* Adapts to theme */
  color: var(--text-primary);         /* Adapts to theme */
}
```

---

## Extending the UI

### Add a New Renderer Tab

1. Add tab in HTML:
```html
<div class="renderer-tab" data-renderer="custom">Custom View</div>
```

2. Add renderer container:
```html
<div id="custom-renderer" class="renderer-content"></div>
```

3. Initialize in JavaScript:
```javascript
const customRenderer = new CustomRenderer(container, options);
renderers.custom = customRenderer;
```

### Add a New Control Panel Section

```html
<div class="panel-section">
  <div class="panel-title">New Section</div>
  <button class="button">Action</button>
</div>
```

### Add Theme Variables

```css
:root {
  /* Add new variables */
  --color-custom: #ff0000;
  --spacing-custom: 20px;
}

/* Use in components */
.custom-element {
  color: var(--color-custom);
  padding: var(--spacing-custom);
}
```

---

## Browser Support

- ✅ Chrome 49+
- ✅ Firefox 31+
- ✅ Safari 9.1+
- ✅ Edge 15+
- ✅ All modern browsers with CSS Variables support

---

## Performance Tips

1. **Use CSS Variables** - Minimal performance impact
2. **Debounce Theme Changes** - Switch themes sparingly
3. **CSS Transitions** - Smooth color changes:
   ```css
   body {
     transition: background-color 0.3s, color 0.3s;
   }
   ```

---

## Examples

See actual examples in [app/index.html](../app/index.html):
- Light & Dark mode toggle
- Full component usage
- Sample dataset
- Cassette recording/playback
- All renderers in action

---

## API Reference

### Global GS Object

```javascript
window.GS = {
  graph,           // Core graph instance
  queryEngine,     // Query builder
  undoRedo,        // Undo/redo manager
  annotationService, // Annotation API
  cassettePlayer,  // Cassette recorder/player
  uiBridge,        // UI-to-core bridge
  renderers        // All active renderers
}
```

---

## Troubleshooting

**Theme not switching?**
- Ensure CSS variables are defined in `:root` or `body`
- Check class is applied to `<body>` element
- Verify browser supports CSS Variables

**Layout looks broken?**
- Check viewport meta tag
- Ensure HTML structure matches expected grid layout
- Verify CSS is loaded

**Renderer not displaying?**
- Check container element exists
- Verify renderer is initialized
- Check browser console for errors

---

For more information, see:
- [CONTRIBUTING.md](../../CONTRIBUTING.md)
- [doc/arch/ui.md](../../doc/arch/ui.md)
- [app/index.html](../app/index.html)
