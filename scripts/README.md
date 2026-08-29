# scripts

## `inject-variants.mjs` — the variant matrix for the Figma reference

Reads each component's props interface and stylesheet, and writes a table into the reference
page: every property, its type, its possible values and its default — plus a `state` axis built
from the pseudo-classes the CSS actually styles, and a count of how many frames the component set
needs.

```bash
REF=../vault-figma-reference node scripts/inject-variants.mjs atoms.html \
  '{"1 · Button":"src/renderer/src/atoms/Button/Button"}'
```

The value is that it is generated. Re-run it after changing a prop union and the reference cannot
drift from the code — add a `variant` and the table grows a column on its own.

Re-running is safe: a section that already carries a matrix is skipped, so clear the old blocks
first if you want them rebuilt.
