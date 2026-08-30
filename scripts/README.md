# scripts

## `inject-variants.mjs`: the variant matrix for the Figma reference

Reads each component's props interface and stylesheet, and writes a table into the reference
page: every property, its type, its possible values and its default, plus a `state` axis built
from the pseudo-classes the CSS actually styles, and a count of how many frames the component set
needs.

```bash
REF=../vault-figma-reference node scripts/inject-variants.mjs atoms.html \
  '{"1 · Button":"src/renderer/src/atoms/Button/Button"}'
```

The value is that it is generated. Re-run it after changing a prop union and the reference cannot
drift from the code: add a `variant` and the table grows a column on its own.

Re-running does not update: a section that already carries a matrix is skipped, so the first
run wins and a later change to a prop union is silently not written. Clear the old blocks by
hand first. This is the presence-check pattern rather than a delimited block that is rewritten
every run, and it should be the latter.

## `inject-matrix.mjs`: every variant × state, rendered

The variant table names the axes; it does not tell you what `secondary + hover` looks like.
This walks the stylesheet's cascade for each combination and writes a grid: a rendered chip
carrying the real values, the values themselves, and a note where a state is identical to the
default and therefore needs no frame of its own.

```bash
REF=../vault-figma-reference node scripts/inject-matrix.mjs atoms.html scripts/matrix.atoms.json
```

Two things it gets right that a naive read does not. It sorts matched rules by **specificity**
before source order, so `.trigger:focus-visible` correctly beats a later `.block`. Without that
the matrix showed a focus ring the browser never renders. And it marks combinations that do not
differ from the default: Button multiplies out to 32 frames but only **13** are distinct, because
`active` is styled for `primary` alone.
