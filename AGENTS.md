## Learned User Preferences
- Never use React fragments.
- The widget chrome (toolbar, panels, popovers) must always use a dark-themed UI, regardless of the host app's color scheme.
- Prefer CSS for animations and avoid heavy animation libraries.
- Do not animate individual panel content dimensions; only animate the host container.
- Animations must support `prefers-reduced-motion`.
- Panels should always stay within the viewport.
- Morph between states instead of using hard cuts, and ensure shapes never look broken mid-animation.
- The container should never get smaller than the 'Feedback' pill width during animations.
- Morphing surfaces must expand symmetrically from their center (e.g., animate `left`/`right` and use `justify-items: center`).
- Prevent text or content from briefly flashing incorrect states during morph transitions by carefully timing crossfades.
- To avoid delayed border-radius morphing, use a value matching half the container height (e.g. `32px`) instead of `9999px`.
- Fix horizontal clipping in fully-rounded pills by increasing horizontal padding to push content past the curve, rather than increasing container height.
## Learned Workspace Facts
- The project is a package, so styles should be modified in `package/src/styles/widget.css`.
- Media uploads must use presigned URLs directly from the browser to S3/R2; never proxy large files through the Next.js API layer.
- Never lose feedback; if the API is down, store submissions in `localStorage` and retry silently on the next widget initialization.
