import { app } from 'electron'
import { join, extname } from 'path'
import { mkdir, copyFile } from 'fs/promises'
import { randomUUID } from 'crypto'
import type { LocalFontFile } from '../../shared/types'

/** App-managed font directory (created on demand). */
async function fontsDir(): Promise<string> {
  const dir = join(app.getPath('userData'), 'fonts')
  await mkdir(dir, { recursive: true })
  return dir
}

/** Copy each source file into app storage so the vault owns the bytes (paths
 *  never break on a moved/deleted original). Returns the managed file map. */
export async function copyFontFiles(files: LocalFontFile[]): Promise<LocalFontFile[]> {
  const dir = await fontsDir()
  const out: LocalFontFile[] = []
  for (const f of files) {
    const ext = extname(f.path) || '.ttf'
    const dest = join(dir, `${randomUUID()}${ext}`)
    await copyFile(f.path, dest)
    out.push({ path: dest, weight: f.weight, style: f.style })
  }
  return out
}
