import { createVBO, loadTexture, makeSolidTexture } from 'prismatik-core'

export interface ObjMesh {
  vbo: ReturnType<typeof createVBO>
  vertCount: number
  texture: WebGLTexture
}

interface Group {
  material: string
  verts: number[]
}

function parseMtl(text: string): Map<string, string> {
  const map = new Map<string, string>()
  let cur = ''
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (line.startsWith('newmtl ')) { cur = line.slice(7).trim(); continue }
    if (line.startsWith('map_Kd ') && cur) map.set(cur, line.slice(7).trim())
  }
  return map
}

function parseObj(text: string): { groups: Group[] } {
  const positions: number[] = []
  const uvs: number[] = []
  const groups: Group[] = []
  let cur: Group = { material: '', verts: [] }

  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (line.startsWith('v ')) {
      const [, x, y, z] = line.split(/\s+/)
      positions.push(+x, +y, +z)
    } else if (line.startsWith('vt ')) {
      const [, u, v] = line.split(/\s+/)
      uvs.push(+u, +v)
    } else if (line.startsWith('usemtl ')) {
      if (cur.verts.length > 0) groups.push(cur)
      cur = { material: line.slice(7).trim(), verts: [] }
    } else if (line.startsWith('f ')) {
      const tokens = line.slice(2).trim().split(/\s+/)
      for (let i = 1; i < tokens.length - 1; i++) {
        for (const tok of [tokens[0], tokens[i], tokens[i + 1]]) {
          const [vi, vti] = tok.split('/').map(Number)
          const px = positions[(vi - 1) * 3]
          const py = positions[(vi - 1) * 3 + 1]
          const pz = positions[(vi - 1) * 3 + 2]
          const u = vti ? uvs[(vti - 1) * 2] : 0
          const v = vti ? 1 - uvs[(vti - 1) * 2 + 1] : 0
          cur.verts.push(px, py, pz, u, v)
        }
      }
    }
  }
  if (cur.verts.length > 0) groups.push(cur)
  return { groups }
}

export async function loadObj(
  gl: WebGLRenderingContext,
  objUrl: string,
  mtlUrl: string,
  textureBaseUrl: string,
): Promise<ObjMesh[]> {
  const [objText, mtlText] = await Promise.all([
    fetch(objUrl).then(r => r.text()),
    fetch(mtlUrl).then(r => r.text()),
  ])

  const mtlMap = parseMtl(mtlText)
  const { groups } = parseObj(objText)

  const texCache = new Map<string, WebGLTexture>()
  await Promise.all(
    [...new Set(mtlMap.values())].map(async filename => {
      try {
        texCache.set(filename, await loadTexture(gl, `${textureBaseUrl}/${filename}`))
      } catch {
        texCache.set(filename, makeSolidTexture(gl, 255, 0, 255))
      }
    })
  )

  return groups.map(group => {
    const data = new Float32Array(group.verts)
    const vbo = createVBO(gl)
    vbo.upload(data)
    const texFile = mtlMap.get(group.material)
    const texture = (texFile && texCache.get(texFile)) ?? makeSolidTexture(gl, 255, 0, 255)
    return { vbo, vertCount: data.length / 5, texture }
  })
}
