# scripts

## `check-punctuation.mjs`: the em dash check

Part of `npm run lint`. Fails on an em dash, or its HTML entity, in any tracked file. A count per
file in `punctuation-baseline.json` can only go down, and the baseline is now empty, so every file is
held to none. `--write` records the current state.

## `variants.mjs`: what a component's props and stylesheet say

Reads a component's props interface into variant axes, booleans, text, slots and events, with their defaults, and
lists the interaction states its stylesheet styles. The Figma parity check builds its code side
from it.

## `figma/`: the Figma parity check

Compares vault's own tokens and its components with the Figma files on every pull request, against
the baseline in `figma/baseline.json`. `npm run figma:check` runs it and `npm run figma:accept`
moves the baseline. What it compares, how it decides and where it reports are in
[`WORKFLOW.md` § Design sync](../WORKFLOW.md#design-sync).
