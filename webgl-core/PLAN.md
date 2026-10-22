# webgl-core — v1 Implementation Plan

The shared WebGL foundation consumed by shelfify and artcast. Owns context setup, the render loop, VBO management, shader compilation, the shader interface that retro-shader and ascii-shader implement, and the canvas pause menu overlay system.

---

## Repository Structure

**Location**: `C:\Users\charl\Documents\Coding\Projects\AgenticDev\Prototypes\webgl-core\`

```
webgl-core/
  src/
    context.ts       # WebGL context creation and capability checks
    loop.ts          # rAF render loop — start, stop, tick callbacks
    vbo.ts           # VBO creation, upload, update helpers
    shader.ts        # shader compilation, program linking, uniform helpers
    types.ts         # all shared interfaces — ShaderProgram, Renderer, ShaderImpl, MenuConfig
    menu.ts          # canvas pause menu overlay — rendering, input handling, state
    dev/
      index.html     # local test page
      main.ts        # minimal triangle + shader swap + menu smoke test
    index.ts         # public entry point
  dist/              # built output (gitignored)
  package.json
  tsconfig.json
  vite.config.ts
```

---

## Package Config

**`package.json`**:
- `"type": "module"` — ESM throughout
- `"main": "./dist/webgl-core.js"`
- `"types": "./dist/webgl-core.d.ts"`
- `"exports"` map for named sub-paths (`context`, `loop`, `vbo`, `shader`, `menu`)
- Scripts: `dev` (Vite dev server), `build` (Vite library mode), `typecheck` (tsc --noEmit)
- Zero runtime dependencies

**`vite.config.ts`** — library mode, ESM output, single entry `src/index.ts`

**`tsconfig.json`** — strict mode, `"declaration": true`, `"moduleResolution": "bundler"`

---

## Core Types (`src/types.ts`)

```ts
// --- Shader interface ---

interface ShaderImpl {
  vertSrc: string;
  fragSrc: string;
  onInit?(gl: WebGLRenderingContext, program: WebGLProgram): void;
  onBeforeDraw?(gl: WebGLRenderingContext, program: WebGLProgram, uniforms: UniformMap): void;
}

type UniformMap = Record<string, WebGLUniformLocation | null>;

// --- Compiled program ---

interface ShaderProgram {
  program: WebGLProgram;
  uniforms: UniformMap;
  use(): void;
  dispose(): void;
}

// --- VBO ---

interface VBO {
  buffer: WebGLBuffer;
  upload(data: Float32Array): void;
  bind(): void;
  dispose(): void;
}

// --- Render loop ---

interface RenderLoop {
  start(): void;
  stop(): void;
  onTick(cb: (dt: number) => void): void;
}

// --- Menu ---

interface MenuConfig {
  enabled: boolean;          // false = menu never renders, input never intercepted
  items: MenuItem[];
}

interface MenuItem {
  label: string;
  onSelect(): void;
}

interface PauseMenu {
  open(): void;
  close(): void;
  isOpen(): boolean;
  render(ctx: CanvasRenderingContext2D | WebGLRenderingContext): void;
  handleInput(e: KeyboardEvent | TouchEvent | MouseEvent): boolean; // true = input consumed
}
```

---

## Context (`src/context.ts`)

```ts
createContext(canvas: HTMLCanvasElement): WebGLRenderingContext
```

- Requests a `webgl` context with `{ antialias: false }` — consumers opt into AA if needed.
- Throws a descriptive error if WebGL is unavailable rather than returning null.
- Sets `canvas` width/height from `devicePixelRatio` — called once on mount, again on resize.

---

## Render Loop (`src/loop.ts`)

```ts
createRenderLoop(): RenderLoop
```

- `start()` — begins `requestAnimationFrame` loop, computing `dt` each tick.
- `stop()` — cancels the pending rAF; safe to call when already stopped.
- `onTick(cb)` — registers a callback called each frame with `dt` in seconds. Multiple callbacks allowed; called in registration order.
- Loop does not call render directly — consumers register tick callbacks that call their own render.

---

## VBO Management (`src/vbo.ts`)

```ts
createVBO(gl: WebGLRenderingContext, usage?: GLenum): VBO
```

- `usage` defaults to `gl.STATIC_DRAW`. Pass `gl.DYNAMIC_DRAW` for geometry that updates at runtime (e.g. art slot quads in artcast).
- `upload(data)` — calls `bufferData` or `bufferSubData` depending on whether the buffer has been initialised yet.
- `bind()` — binds to `ARRAY_BUFFER`.
- `dispose()` — calls `deleteBuffer`.

---

## Shader Compilation (`src/shader.ts`)

```ts
compileShader(gl: WebGLRenderingContext, impl: ShaderImpl, uniformNames: string[]): ShaderProgram
swapShader(gl: WebGLRenderingContext, current: ShaderProgram, next: ShaderImpl, uniformNames: string[]): ShaderProgram
```

- `compileShader` — compiles vert + frag, links program, resolves all uniform locations into a `UniformMap`, calls `impl.onInit` if defined.
- `swapShader` — disposes `current`, compiles and returns the new program. Used by the pause menu shader switch.
- Compilation errors throw with the full GLSL error log attached.

---

## Pause Menu (`src/menu.ts`)

```ts
createPauseMenu(config: MenuConfig): PauseMenu
```

Rendered on the canvas — no DOM elements. Drawn as a semi-transparent overlay on top of the scene each frame when open.

### Behaviour

- `open()` / `close()` — toggle menu state. Consumer suspends game input while `isOpen()` is true.
- `render()` — draws the overlay: dimmed background rect, menu items as text, selection highlight. Called by the consumer inside their tick callback when `isOpen()`.
- `handleInput(e)` — processes keyboard (arrow keys + Enter, Escape to close), mouse click, and touch tap. Returns `true` if the event was consumed so the consumer can skip its own input handling.
- When `config.enabled` is `false`: `open()` is a no-op, `isOpen()` always returns `false`, `render()` draws nothing, `handleInput()` always returns `false`.

### Menu items

Consumer passes `MenuItem[]` at init — each item has a label and an `onSelect` callback. The shader swap is just one possible `onSelect` — the menu doesn't know about shaders specifically.

---

## Implementation Order

1. `package.json`, `tsconfig.json`, `vite.config.ts`
2. `src/types.ts` — all interfaces
3. `src/context.ts` — WebGL context creation
4. `src/vbo.ts` — buffer helpers
5. `src/shader.ts` — compilation + swap
6. `src/loop.ts` — rAF loop
7. `src/menu.ts` — pause menu overlay
8. `src/dev/` — test page: triangle rendered with a stub shader, menu opens/closes, shader swap works
9. `src/index.ts` — public exports

---

## Testing

1. `npm run dev` — test page opens, triangle renders
2. Shader swap — menu opens, selecting a different shader re-renders the triangle with new appearance, no flicker
3. `config.enabled: false` — menu toggle key does nothing, triangle renders as normal
4. VBO `DYNAMIC_DRAW` — updating geometry data mid-frame reflects on next render
5. Context error — running on a browser with WebGL disabled throws a readable error
6. `npm run build` — produces `dist/webgl-core.js` + `dist/webgl-core.d.ts`, no errors
7. `npm run typecheck` — no TypeScript errors
