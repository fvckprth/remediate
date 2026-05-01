# Morphing Surface Animation Pattern

This document outlines the "Morphing Surface" animation pattern used in the Remediate widget. This approach creates a fluid, premium feel when transitioning between different UI panels (e.g., Settings, Capture, Notes, Review) without causing jarring layout shifts or visual clutter.

## The Problem with Standard Animations

When building dynamic interfaces that swap between different views, the naive approach is to animate the width/height of the inner contents directly. This causes:

1. **Visual Clutter:** Elements inside the panel shift, squish, and reflow during the animation.
2. **Jarring Choreography:** Multiple nested elements trying to animate their layout simultaneously feels chaotic.
3. **Bounciness:** Overusing spring physics can make the interface feel playful but less professional.

## The "Morphing Surface" Solution

Instead of animating the contents, we animate a single outer "surface" container, while the inner contents simply crossfade.

### Key Principles

1. **Single Animated Container (`PanelHost`)**
  The outer wrapper (`.rm-panel-host`) is the only element that transitions its layout properties (`width`, `height`, `border-radius`).
2. **Overflow Clipping**
  The host container uses `overflow: hidden`. As it morphs from one size to another, it acts as a clipping mask for the content inside.
3. **Content Crossfading**
  The inner panels (`.rm-panel-wrapper`) **do not** animate their dimensions. They only animate their `opacity` (fade in/out). Because the host is clipping them, they appear to smoothly reveal themselves as the surface expands or contracts.
4. **Smooth Easing (No Bounce)**
  We use a highly tuned cubic-bezier curve (`cubic-bezier(0.19, 1, 0.22, 1)`) instead of a spring. This provides a fast, snappy entrance that smoothly decelerates, feeling intentional and polished.

---

## Implementation Details

### 1. The React Component (`PanelHost.tsx`)

The React component is responsible for knowing the exact `width` and `height` of the active panel and applying it to the host container. It also keeps exiting panels mounted long enough for their fade-out animation to complete.

```tsx
export function PanelHost({ panelKey, position, children }: PanelHostProps) {
  // ... state management for active and exiting panels ...
  const [hostBounds, setHostBounds] = useState({ width: 0, height: 0 });

  return (
    <div
      className="rm-panel-host"
      style={{
        width: hostBounds.width > 0 ? hostBounds.width : undefined,
        height: hostBounds.height > 0 ? hostBounds.height : undefined,
      }}
    >
      {panels.map((panel) => (
        <div key={panel.id} className="rm-panel-wrapper">
          {/* Inner content renders here at its full natural size */}
          {panel.content}
        </div>
      ))}
    </div>
  );
}
```

### 2. The CSS (`widget.css`)

The CSS handles the actual transitions. Notice how the host handles dimensions, while the wrapper handles opacity.

```css
/* The Morphing Surface */
.rm-panel-host {
  position: fixed;
  overflow: hidden; /* Crucial for the clipping effect */
  background: #1c1c1c;
  border-radius: 1rem;
  
  /* Smooth, non-bouncy easing for dimensions */
  transition: 
    width 400ms cubic-bezier(0.19, 1, 0.22, 1), 
    height 400ms cubic-bezier(0.19, 1, 0.22, 1), 
    border-radius 400ms cubic-bezier(0.19, 1, 0.22, 1);
    
  will-change: width, height, border-radius;
}

/* The Inner Content */
.rm-panel-wrapper {
  grid-area: stack; /* Stack multiple panels on top of each other */
  
  /* Simple crossfade, no layout shifts */
  animation: rm-fade-in 150ms ease-out forwards;
  animation-delay: 50ms; /* Slight delay allows the host to start morphing first */
  opacity: 0;
}

.rm-panel-wrapper[data-exiting] {
  animation: rm-fade-out 100ms ease-out forwards !important;
  pointer-events: none;
}

@keyframes rm-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes rm-fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}
```

## Summary for AI Agents

When asked to build or fix panel transition animations:

- **DO NOT** animate the `width`/`height` of the individual form/content elements.
- **DO NOT** use default `ease` or overly bouncy springs unless explicitly requested.
- **DO** wrap the content in a fixed-size or auto-measuring host container with `overflow: hidden`.
- **DO** transition the host's dimensions.
- **DO** crossfade the inner contents.

