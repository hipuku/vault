/* What the Figma parity check compares, and where each side lives.

   The five vault files in Figma split the same way the code does: one file of
   tokens, one per component tier, and one of screens. Screens are compositions
   of the tiers, so they are not compared; the tiers they are made from are. */

export const FIGMA_FILES = {
  tokens: { key: 'gnDwjK1DXLHSQOF6GUnmgl', name: 'vault · tokens' },
  atoms: { key: 'A5ternYGD52mJ5HhCVqHKY', name: 'vault · atoms' },
  molecules: { key: '1OyWUcN60pO7C9TwNiv2Rj', name: 'vault · molecules' },
  organisms: { key: 'l3vhIuUGcFBtbCO0mP76uP', name: 'vault · organisms' },
}

export const TIERS = ['atoms', 'molecules', 'organisms']

export const PATHS = {
  tokens: 'src/renderer/src/styles/tokens.css',
  components: 'src/renderer/src',
  snapshot: 'figma/snapshot',
  baseline: 'figma/baseline.json',
  exceptions: 'figma/exceptions.json',
}

/* The states a stylesheet can express, in the words Figma's `state` axis uses.
   A design can carry more (`editing`, `selected`) because some states are set
   by script rather than by a pseudo-class; those are not compared.

   Focus is not compared either. The ring is drawn once for every element, by
   `*:focus-visible` in global.css, so a component's own stylesheet never names
   it, and a Figma `focus` variant would read as drift on every component. */
export const CSS_STATES = {
  hover: 'hover',
  active: 'pressed',
  disabled: 'disabled',
}
export const COMPARED_STATES = new Set(Object.values(CSS_STATES))

/* Figma components that are construction parts, not components of the app:
   a leading underscore (`_Panel content`) or a slash (`SegmentedControl /
   Segment`, a part drawn inside its parent). */
export const isPrivateComponent = name => name.startsWith('_') || name.startsWith('.') || name.includes('/')
