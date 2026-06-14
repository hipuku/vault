import { execFile } from 'child_process'
import { promisify } from 'util'
import type { InstalledFamily } from '../../shared/types'

const exec = promisify(execFile)

interface Typeface { family?: string; style?: string; valid?: string }
interface FontFileItem { path?: string; typefaces?: Typeface[] }

/** Enumerate fonts installed on the Mac (Font Book) via system_profiler, grouped
 *  by family with one face per distinct style. Hidden system fonts (leading dot)
 *  are skipped. */
export async function listInstalledFonts(): Promise<InstalledFamily[]> {
  const { stdout } = await exec('system_profiler', ['SPFontsDataType', '-json'], {
    maxBuffer: 128 * 1024 * 1024,
  })
  const data = JSON.parse(stdout) as { SPFontsDataType?: FontFileItem[] }
  const byFamily = new Map<string, Array<{ path: string; style: string }>>()

  for (const item of data.SPFontsDataType ?? []) {
    const path = item.path
    if (!path) continue
    for (const tf of item.typefaces ?? []) {
      if (tf.valid === 'no') continue
      const family = (tf.family ?? '').trim()
      if (!family || family.startsWith('.')) continue
      const style = (tf.style ?? 'Regular').trim()
      const faces = byFamily.get(family) ?? []
      if (!faces.some(f => f.style === style)) faces.push({ path, style })
      byFamily.set(family, faces)
    }
  }

  return [...byFamily.entries()]
    .map(([family, faces]) => ({ family, faces }))
    .sort((a, b) => a.family.localeCompare(b.family))
}
