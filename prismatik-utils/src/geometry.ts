export function makeCuboid(hw: number, hh: number, hd: number): Float32Array {
  const w = hw, h = hh, d = hd
  return new Float32Array([
    // front
    -w,-h, d,  0,0,   w,-h, d,  1,0,   w, h, d,  1,1,
    -w,-h, d,  0,0,   w, h, d,  1,1,  -w, h, d,  0,1,
    // back
     w,-h,-d,  0,0,  -w,-h,-d,  1,0,  -w, h,-d,  1,1,
     w,-h,-d,  0,0,  -w, h,-d,  1,1,   w, h,-d,  0,1,
    // left
    -w,-h,-d,  0,0,  -w,-h, d,  1,0,  -w, h, d,  1,1,
    -w,-h,-d,  0,0,  -w, h, d,  1,1,  -w, h,-d,  0,1,
    // right
     w,-h, d,  0,0,   w,-h,-d,  1,0,   w, h,-d,  1,1,
     w,-h, d,  0,0,   w, h,-d,  1,1,   w, h, d,  0,1,
    // top
    -w, h, d,  0,0,   w, h, d,  1,0,   w, h,-d,  1,1,
    -w, h, d,  0,0,   w, h,-d,  1,1,  -w, h,-d,  0,1,
    // bottom
    -w,-h,-d,  0,0,   w,-h,-d,  1,0,   w,-h, d,  1,1,
    -w,-h,-d,  0,0,   w,-h, d,  1,1,  -w,-h, d,  0,1,
  ])
}
