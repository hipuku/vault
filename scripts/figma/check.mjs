/* The Figma parity check.

     npm run figma:check                      compare, print, exit 1 if failing
     npm run figma:check -- --report out.md   also write the markdown report
     npm run figma:check -- --json out.json   also write the findings
     npm run figma:check -- --compact         known drift as a count (for pull requests)
     npm run figma:accept                     accept every current pair as the baseline
     npm run figma:accept -- "axis Popover.align"   accept one item
     npm run figma:check -- --refresh         save live components into the snapshot
     npm run figma:check -- --plugin-code     print the export code to run in Figma
     npm run figma:check -- --save tokens out.json   store that code's result as a snapshot

   With FIGMA_TOKEN set, components are read live from the REST API; without it,
   everything comes from figma/snapshot. Variables always come from the snapshot
   (see rest.mjs). FIGMA_LATER=1 is the `figma-later` waiver. */

import fs from 'fs'
import path from 'path'
import { FIGMA_FILES, PATHS, TIERS } from './config.mjs'
import { codeItems } from './code.mjs'
import { figmaItems } from './normalise.mjs'
import { diff, accept, applyExceptions } from './diff.mjs'
import { report } from './report.mjs'
import { fetchComponents, lastModified } from './rest.mjs'
import { pluginCode } from './plugin-export.mjs'

const args = process.argv.slice(2)
const flag = name => args.includes(name)
const option = name => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined)

const token = flag('--offline') ? undefined : process.env.FIGMA_TOKEN
const figmaLater = /^(1|true)$/i.test(process.env.FIGMA_LATER ?? '')

const snapshotPath = file => path.join(PATHS.snapshot, `${file}.json`)
function readSnapshot(file) {
  const p = snapshotPath(file)
  if (!fs.existsSync(p)) throw new Error(`No snapshot at ${p}. Export it with the code from --plugin-code.`)
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}
const writeJson = (p, data) => fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n')

async function figmaSide() {
  const warnings = []
  const tokens = readSnapshot('tokens')
  const items = figmaItems({ variables: tokens.variables }, null)

  if (token) {
    const modified = await lastModified(FIGMA_FILES.tokens.key, token)
    if (new Date(modified) > new Date(tokens.exportedAt)) {
      warnings.push(
        `The tokens snapshot was exported ${tokens.exportedAt} and the tokens file changed ${modified}. ` +
          'Variables were compared against the snapshot; re-export it to compare the current file.',
      )
    }
  }

  for (const tier of TIERS) {
    let snap
    if (token) {
      snap = await fetchComponents(FIGMA_FILES[tier].key, token)
      if (flag('--refresh'))
        writeJson(snapshotPath(tier), { exportedAt: new Date().toISOString(), source: 'rest', ...snap })
    } else {
      snap = readSnapshot(tier)
    }
    Object.assign(items, figmaItems({ components: snap.components }, tier))
  }

  if (!token) {
    const dates = ['tokens', ...TIERS].map(f => `${f} ${readSnapshot(f).exportedAt.slice(0, 10)}`).join(', ')
    warnings.push(`No FIGMA_TOKEN, so Figma was read from the committed snapshots (${dates}).`)
  }
  return { items, warnings, source: token ? 'the REST API for components, the snapshot for variables' : 'snapshots' }
}

async function main() {
  if (flag('--plugin-code')) {
    process.stdout.write(pluginCode())
    return
  }
  if (flag('--save')) {
    const [file, from] = args.slice(args.indexOf('--save') + 1)
    if (!FIGMA_FILES[file]) throw new Error(`--save takes one of: ${Object.keys(FIGMA_FILES).join(', ')}`)
    const exported = JSON.parse(fs.readFileSync(from, 'utf8'))
    writeJson(snapshotPath(file), {
      exportedAt: new Date().toISOString(),
      source: 'plugin',
      file: FIGMA_FILES[file],
      variables: exported.variables,
      components: exported.components,
    })
    console.log(`Saved ${snapshotPath(file)}.`)
    return
  }

  const read = p => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : {})
  const exceptions = read(PATHS.exceptions).items ?? {}
  const side = await figmaSide()
  const { warnings, source } = side
  const { code, figma, baseline, stale } = applyExceptions({
    code: codeItems(),
    figma: side.items,
    baseline: read(PATHS.baseline).items ?? {},
    exceptions,
  })
  for (const key of stale) {
    warnings.push(`The exception for \`${key}\` is no longer needed: remove it from ${PATHS.exceptions}.`)
  }

  if (flag('--accept')) {
    const keys = args.filter(a => !a.startsWith('--'))
    const items = accept({ code, figma, baseline, keys })
    writeJson(PATHS.baseline, { acceptedAt: new Date().toISOString(), items })
    console.log(
      `Baseline updated: ${keys.length ? keys.join(', ') : 'every item'} (${Object.keys(items).length} items).`,
    )
    return
  }

  const result = diff({ code, figma, baseline, figmaLater })
  const md = report({
    ...result,
    warnings,
    figmaLater,
    source,
    compact: flag('--compact'),
    exceptions: Object.keys(exceptions).length,
  })
  process.stdout.write(md)
  if (option('--report')) fs.writeFileSync(option('--report'), md)
  if (option('--json')) writeJson(option('--json'), { ...result, warnings })
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md)
  if (result.failing.length) process.exitCode = 1
}

main().catch(err => {
  console.error(err.message)
  process.exitCode = 2
})
