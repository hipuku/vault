# scripts

## `inject-specs.mjs` — resolved values for the Figma reference

The reference pages in `vault-figma-reference/` list which tokens a component uses. That is not
enough to build it in Figma, where you type actual numbers. These scripts read the real
stylesheets and emit a table of **property · token · resolved value** per rule.

Values are resolved through the whole `var()` chain, `rem` is converted to px at a 16px root, and
OKLCH becomes hex — or `rgba()` where the colour carries alpha, since Figma takes opacity
separately. Relative colour syntax (`oklch(from … l c h / .2)`, used by the focus ring) is
resolved too.

```bash
REF=../vault-figma-reference node scripts/inject-specs.mjs atoms.html '{"1 · Button":"src/renderer/src/atoms/Button/Button.module.css"}'
```

Re-run it after a token change and the reference stops drifting from the code — which is the
whole reason it exists.
