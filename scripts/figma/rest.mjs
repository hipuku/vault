/* Reads Figma through its REST API with a personal access token (FIGMA_TOKEN).

   The file endpoint returns every component and its property definitions on any
   plan, so components are read live. Variables are not: the REST variables
   endpoint needs an Enterprise plan, so they come from the snapshot exported by
   plugin-export.js, and this module only reports when that snapshot is older
   than the file. */

const API = 'https://api.figma.com/v1'

async function get(url, token) {
  const res = await fetch(url, { headers: { 'X-Figma-Token': token }, signal: AbortSignal.timeout(60_000) })
  if (!res.ok) throw new Error(`Figma API ${res.status} for ${url.replace(API, '')}`)
  return res.json()
}

/** When the file last changed, without downloading its tree. */
export async function lastModified(key, token) {
  const file = await get(`${API}/files/${key}?depth=1`, token)
  return file.lastModified
}

/** The file's components in the raw shape plugin-export.js also produces. */
export async function fetchComponents(key, token) {
  const file = await get(`${API}/files/${key}`, token)
  const components = []
  for (const page of file.document.children ?? []) {
    const walk = (node, parentType) => {
      if (node.type === 'COMPONENT_SET' || node.type === 'COMPONENT') {
        const defs = node.componentPropertyDefinitions ?? {}
        components.push({
          name: node.name,
          page: page.name,
          type: node.type,
          inSet: parentType === 'COMPONENT_SET',
          props: Object.entries(defs).map(([name, d]) => ({
            name,
            type: d.type,
            options: d.variantOptions ?? [],
          })),
        })
      }
      for (const child of node.children ?? []) walk(child, node.type)
    }
    walk(page, 'CANVAS')
  }
  return { file: { key, name: file.name, lastModified: file.lastModified }, components }
}
