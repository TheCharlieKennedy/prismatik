# Prismatik / Shelfify — Audit Notes

Gaps identified across the monorepo. Separate from active development — address when relevant.

---

## Naming gaps

- `shelfify/src/renderers/webgl.ts` — named after the technology, not the layer. This is the Prismatik renderer for shelfify; should be `prismatik.ts`.
- `shelfify/src/core/` — mirrors `prismatik-core` naming, risks confusion. Shelfify's scroll/focus logic and domain types would be clearer under `shelf/` or `engine/`.
- `Prismatik/prismatik-core/src/maths.ts` — contains both matrix math and VBO management (`createVBO`, `VBO`). VBO is not math. Consider splitting into `maths.ts` and `vbo.ts`.
- `shelfify/src/itemTypes/flatArt.ts` — filename says `flatArt`, exports say `FramedItem`/`createFramedItem`. Pick one name.
- `shelfify/src/layouts/display2.ts` — `display2` is a placeholder iteration name, not a description. The layout has a distinct fan/spread style — give it a real name (e.g. `fan.ts` / `fanLayout`).

---

## Misplaced code

- `shelfify/src/renderers/webgl.ts` `applyMobileScale` — hardcodes `visibleCount: 5` at `< 480px` and `9` otherwise. Configuration decisions belong in `ShelfConfig` or `ShelfLayout`, not the renderer.
- `shelfify/src/renderers/webgl.ts` — `activeLayout` is initialised to `displayLayout` as a hardcoded default inside the renderer. The default should come from `ShelfConfig` or the consumer.
- `Prismatik/prismatik-utils/src/gif.ts` — `updateGif` contains hardcoded GB cartridge compositing values (`cropSize = f.width / 2`, `- 20` pixel offsets). Shelf-specific knowledge in a generic utility. Strip the hardcoded values and pass compositing logic via callback, or move it to shelfify.
- `Prismatik/prismatik-core/src/dev/main.ts` — imports `createPauseMenu` from `'../menu'` and `createOrbitControl` from `'../orbit'`, both of which belong in `prismatik-utils`. The dev harness was never updated after the package split.

---

## Structural gaps

- `shelfify/src/core/types.ts` `ItemType.draw` — still has `textureOverride?: WebGLTexture` on the interface. The highlight contract fix (generic `drawFn` callback) was applied to `highlight.ts` but `ItemType` and `case.ts` were never cleaned up. The parameter is now unused but still present.
- `shelfify/src/layouts/display2.ts` — not exported from `shelfify/src/index.ts` and not included in the dev harness layout array. Effectively dead.
- `shelfify/src/dev/main.ts` — duplicates config across `createShelfEngine` and `createWebGLRenderer` (`totalItems`, `visibleCount`, `loop`, `menu.*`). These can drift. Share a single constructed config object.
- `shelfify/src/renderers/webgl.ts` — imports `highlight`, `overlay`, `autoRotate` via sub-paths (`'prismatik-utils/highlight'` etc.) while `createPauseMenu` is imported from the barrel. Inconsistent — use barrel imports throughout or sub-paths throughout.
- `Prismatik/prismatik-core/src/dev/main.ts` — stale dev harness. References `'../loop'` and `'../vbo'` which no longer exist (`loop` → `step`, `vbo` folded into `maths`). Harness is broken.
- `Prismatik/prismatik-shader/src/ascii/charset.ts` — not exported from either `ascii/index.ts` or the package root. No way to build a custom charset externally. Flag for review when ascii shader is revisited.
