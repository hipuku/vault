# Vault: workflow

How changes get into Vault: branches, pull requests, the checks that gate them, review, keeping
Figma and code in step, and releases.

## Contents

- [Branches and pull requests](#branches-and-pull-requests)
- [Checks](#checks)
- [Review](#review)
- [Design sync](#design-sync)
- [Releases](#releases)

---

## Branches and pull requests

Nothing is committed to `main` directly. Every change goes through a branch named
`<type>/<short-name>` (`feat`, `fix`, `design`, `a11y`, `docs`, `refactor`, `chore`, `deps`) and a
pull request that uses the template, carries one type label, and is squash merged. The pull
request title becomes the commit on `main`, and labels group the release notes.

The `main` ruleset requires a pull request, the checks below, resolved conversations and a linear
history, and it applies to the owner too.

## Checks

| Check        | Workflow           | Runs                                                                                                | Required |
| ------------ | ------------------ | --------------------------------------------------------------------------------------------------- | -------- |
| Lint         | `ci.yml`           | `npm run lint` (ESLint, the punctuation check and markdownlint), `npm run lint:css`, `npm run knip` | Yes      |
| Format       | `ci.yml`           | `npm run format:check`                                                                              | Yes      |
| Typecheck    | `ci.yml`           | `npm run typecheck`                                                                                 | Yes      |
| Test         | `ci.yml`           | `npm run test:run`                                                                                  | Yes      |
| Build        | `ci.yml`           | `npm run build`, after the four above pass                                                          | Yes      |
| End to end   | `ci.yml`           | `npm run e2e`, the built app launched in Electron, after Build passes                               | Yes      |
| Links        | `ci.yml`           | lychee, offline: every relative link and heading anchor in the markdown resolves                    | Yes      |
| Figma parity | `figma-parity.yml` | `npm run figma:check`, described under [Design sync](#design-sync)                                  | Yes      |

## Review

CodeRabbit reviews every pull request that is not a draft. Its configuration,
`.coderabbit.yaml`, gives it this repo's rules by path:

- **Component stylesheets:** design tokens only, no raw colour, length, radius, shadow, duration
  or font value.
- **Components:** imports stay within their tier or below it, and interactive elements have an
  accessible name and keyboard handling.
- **Renderer:** no imports from main and no Node built-ins.
- **Main and preload:** values reach SQLite only as bound parameters, file paths and URLs go
  through `ownedFontPath` and `safeProtocol`, and no new outbound request goes unremarked.
- **Markdown:** Australian English and claims the code supports.

It is not a required check. Each comment is applied in a commit or answered with a reason, then
resolved; the ruleset will not merge a pull request with an open conversation.

## Design sync

Vault's design lives in five Figma files: tokens, atoms, molecules, organisms and screens. The
Figma parity check compares the first four with the code on every pull request, so a difference in
a component is found when it is made rather than when someone notices. Variables are compared from
an exported snapshot, so a variable changed in Figma is found once that snapshot is refreshed.

### What is compared

| Item               | Code                                                                | Figma                                             |
| ------------------ | ------------------------------------------------------------------- | ------------------------------------------------- |
| `token --dot-xs`   | A custom property Vault declares in `styles/tokens.css`             | A variable in the tokens file, by its code syntax |
| `component Button` | A component folder, and the tier it sits in                         | A component in that tier's file                   |
| `axis Button.size` | A prop typed as a union of strings, or an alias for one             | A variant property of the component set           |
| `states Button`    | The `:hover`, `:active` and `:disabled` rules its stylesheet writes | The `hover`, `pressed` and `disabled` variants    |

Some things are left out on purpose:

- **`--haus-*` tokens.** They are haus's roles, held in the haus library in Figma. Their parity
  is haus's to check.
- **Focus.** The ring is drawn for every element by one rule in `global.css`, so no component's
  stylesheet names it.
- **Booleans and text properties.** In Figma these are as often layer toggles as props.
- **Construction parts.** Figma components named with a leading underscore or a slash.
- **Screens.** They are compositions of the tiers, which are compared.

A component's states come from its own stylesheet. When that styles none, they come from the global
class the component is (IconButton is `.icon-btn`, PopoverTrigger is `.pill`, the cards are
`.card`), as `global.css` writes them. A state inside `:not()` excludes rather than styles, so
`:hover:not(:disabled)` counts as hover only.

### Exceptions

Some differences are meant to be there, and `figma/exceptions.json` lists each one with its reason,
the way `stylelint.config.mjs` enumerates its raw-value exceptions. An excepted item is left out of
the comparison, and the report gives the count. The check warns when an exception is no longer
needed, because its item has left both sides or both sides now agree.

The exceptions fall into four groups:

- **States drawn as variants.** A modal's tabs, a field's placeholder or value, a palette's kind:
  Figma draws each so every look exists, and the code derives them from data or internal state
  rather than taking a prop.
- **Position, not appearance.** `align` and `side` say where a popover, menu, tooltip or modal
  sits, which Figma does not need a variant for.
- **Hover on an organism's inner parts.** The rule styles a row, a swatch or a drop zone inside,
  and Figma draws the organism at rest.
- **States inherited through composition.** A molecule whose trigger is a PopoverTrigger or an
  IconButton has that atom's states, compared on the atom.

### Where Figma is read from

Components are read live from Figma's REST API, with a personal access token stored as the
`FIGMA_TOKEN` repository secret. Variables cannot be read that way: the REST variables endpoint
needs an Enterprise plan. They come from `figma/snapshot/tokens.json`, exported through Figma's
Plugin API, and the check warns when the tokens file has changed since that export.

Without the token (a fork, a Dependabot pull request, or a local run), everything comes from the
snapshots in `figma/snapshot/`, and the report says so.

When Figma rate-limits the check or fails with a server error, it retries twice, honouring a
`Retry-After` of up to a minute. A file Figma still cannot serve is compared from its snapshot, and
the report names the file, the status and the snapshot's date, and the weekly run leaves the issues
alone. While the tokens snapshot is older than the tokens file, the weekly run also leaves token
issues alone, opening and closing only component ones. A rejected token is not a fallback: it fails
the check, because a snapshot would hide it.

### How a finding is decided

`figma/baseline.json` holds, for every item, the pair of values code and Figma had when the
baseline was last accepted. The check compares each side with its own half of that pair, which
says which side moved:

| Code      | Figma     | Finding                   | Effect                                       |
| --------- | --------- | ------------------------- | -------------------------------------------- |
| Moved     | Not moved | Code ahead of Figma       | Fails the pull request                       |
| Not moved | Moved     | Changed in Figma          | A drift decision issue                       |
| Lacks it  | Added it  | New in Figma              | A design proposal issue                      |
| Moved     | Moved     | Conflict                  | Fails the pull request                       |
| Not moved | Not moved | Known drift               | Listed in the tracking issue; never fails    |
| Match     | Match     | Agreed since the baseline | `npm run figma:accept` moves the baseline on |

The `figma-later` label turns code ahead of Figma into a warning, for a change whose Figma update
follows in its own pull request. It never waives a conflict.

`scripts/figma/diff.mjs` holds these rules, and `test/figmaParity.test.ts` tests each one. No
model takes part in deciding whether the check passes.

### Where each report goes

- **The pull request:** the Figma parity check, and one comment, updated in place, listing what
  this change needs to act on. Known drift is a count there, not a table.
- **The job summary:** the full report on every run.
- **Issues, every Monday:** one `design-proposal` issue per item new in Figma, one
  `drift-decision` issue per item changed in Figma or in conflict, and one tracking issue listing
  the known drift. An issue closes itself when its item is resolved.

### Resolving a finding

- **Code ahead of Figma.** Update Figma so the check matches, or accept the difference as known
  drift with `npm run figma:accept -- "<item>"` in the same pull request.
- **Changed in Figma.** Answer the issue with `/keep-code` (Figma changes back to the shipped
  value) or `/take-figma` (code changes to the Figma value, in its own pull request).
- **New in Figma.** Build it, or remove it from Figma.
- **After either side changes,** run `npm run figma:accept` in the pull request that brings them
  together, so the baseline records the agreement.

### The agent

Updating Figma is done by an AI agent working through the Figma MCP server, in a session the owner
runs. It has a narrow brief:

- **It may** read the Figma files, refresh the snapshots (`npm run figma:check -- --plugin-code`
  prints the export it runs; `--save` stores the result), draft the change that would bring Figma
  in line with code, and apply that change once the owner approves it.
- **A component change includes its page.** Each component's page has Preview, Design and Code
  panels beside the set: its examples, its properties and tokens, its props and where it is used.
  The check compares tokens and component sets, not those panels, so the agent updates them in the
  same change, and checks that new variants keep their bindings to the component's text and
  boolean properties.
- **Its edits add rather than replace** where they can: new variants cloned from existing ones,
  bound to the same library variables, so undoing one means deleting what it added. The Figma MCP
  server cannot save a named version, so Figma's automatic version history holds the earlier
  state, and the owner saves a named version by hand before a large edit.
- **It may not** decide a drift decision, merge a pull request, accept a baseline, or publish the
  Figma library. Those are the owner's.

The check itself never calls the agent. It is a script that passes or fails the same way every
time; the agent only acts on its findings when asked.

### Commands

```bash
npm run figma:check                        # compare, print the report, exit 1 if failing
npm run figma:accept                       # accept every current pair as the baseline
npm run figma:accept -- "axis Popover.align"   # accept one item
npm run figma:check -- --refresh           # with FIGMA_TOKEN, save live components to the snapshot
npm run figma:check -- --plugin-code       # print the Plugin API export for a Figma file
npm run figma:check -- --save tokens out.json  # store that export's result as a snapshot
```

## Releases

A release is a tag. Pushing a `vX.Y.Z` tag on a commit on `main` runs `release.yml`, which builds
unsigned `.dmg` files for Apple silicon and Intel and attaches them to a draft GitHub release. The
draft's notes are generated from the merged pull requests, grouped by label through
`.github/release.yml`; they are edited, and the draft is published by hand. The version bump is its
own pull request, so the tag points at a commit that passed every check.
