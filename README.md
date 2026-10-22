# Prismatik

Modular WebGL 3D renderer.

Prismatik is a lightweight rendering pipeline built with WebGL1. It's designed to be fast, modular, and easy to drop into any web application.

---

## Structure

```
prismatik/
  prismatik-core/     — rendering essentials: context, shaders, geometry, textures, render loop
  prismatik-utils/    — optional utilities: orbit, menu, GIF, OBJ
  prismatik-shader/   — prebuilt shaders: retro (PS1) and ascii
```

---

## Packages

### `prismatik-core`
Core packages. Context creation, shader compilation, geometry (VBO, cuboid builder, matrix math), texture loading, and a `requestAnimationFrame` render step. Essentials for a basic WebGL scene.

### `prismatik-utils`
Add on utilities. Orbit control (quaternion-based, mouse and touch), pause menu (Canvas2D overlay, DPR-scaled), GIF animation parser and player, and OBJ mesh loader.

### `prismatik-shader`
Pre-built shader packages. Import as sub-packages:
- `prismatik-shader/retro` — PS1-style renderer with vertex snapping, affine texture mapping, and depth fog
- `prismatik-shader/ascii` — ASCII art renderer with a configurable character atlas

---

## Design

- **WebGL1** — broad device support, no extensions required
- **No framework dependencies** — plain TypeScript, works anywhere
- **Shader impls own their state** — uniform locations cached in `onInit`, set in `onBeforeDraw`
- **Modular** — use `prismatik-core` alone, or layer in utils and shaders as needed

---

## License

MIT — see [LICENSE](./LICENSE)
