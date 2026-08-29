import fs from 'fs'
import { formatHex, converter } from 'culori'
const toRgb = converter('rgb')
const SRC = 'src/renderer/src'

// ---- token table -----------------------------------------------------------
const tokenCss = fs.readFileSync(`${SRC}/styles/tokens.css`, 'utf8')
const RAW = {}
for (const m of tokenCss.matchAll(/^\s*(--[a-z0-9-]+):\s*([^;]+);/gim)) RAW[m[1]] = m[2].trim()

const ROOT_PX = 16
export function resolve(value, depth = 0) {
  if (depth > 12) return value
  return value.replace(/var\((--[a-z0-9-]+)(?:,\s*([^)]*))?\)/gi, (_, name, fallback) =>
    RAW[name] !== undefined ? resolve(RAW[name], depth + 1) : (fallback ?? '').trim(),
  )
}
export function pretty(value) {
  let v = resolve(value).trim()
  // rem -> px, so a designer can type the number straight into Figma
  v = v.replace(/(-?[\d.]+)rem/g, (_, n) => `${+(parseFloat(n) * ROOT_PX).toFixed(2)}px`)
  // relative colour syntax: oklch(from <colour> l c h / a) -> rgba(), which Figma can take
  v = v.replace(
    /oklch\(\s*from\s+(oklch\([^)]*\)|#[0-9a-f]{3,8})\s+l\s+c\s+h\s*\/\s*([\d.]+)\s*\)/gi,
    (whole, base, alpha) => {
      try {
        const c = toRgb(base)
        const n = x => Math.round(x * 255)
        return `rgba(${n(c.r)}, ${n(c.g)}, ${n(c.b)}, ${alpha})`
      } catch {
        return whole
      }
    },
  )
  // oklch -> hex, or rgba() when it carries alpha (Figma needs the opacity separately)
  v = v.replace(/oklch\([^)]*\)/gi, c => {
    try {
      const p = toRgb(c)
      if (!p) return c
      const n = x => Math.round(x * 255)
      return p.alpha !== undefined && p.alpha < 1 ? `rgba(${n(p.r)}, ${n(p.g)}, ${n(p.b)}, ${p.alpha})` : formatHex(p)
    } catch {
      return c
    }
  })
  return v.replace(/\s+/g, ' ')
}
export function tokensIn(value) {
  return [...value.matchAll(/var\((--[a-z0-9-]+)/gi)].map(m => m[1])
}
