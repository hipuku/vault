export type Section = 'colours' | 'fonts' | 'palettes' | 'type_scales'
export type AssetType = 'colour' | 'font' | 'palette' | 'type_scale'

export type PaletteKind = 'tonal' | 'expressive'
export type RampName = 'primary' | 'neutral' | 'success' | 'warning' | 'error'
export type FillStrategy = 'cohesive-distinct' | 'interpolate' | 'harmony'

export interface TonalParams {
  kind: 'tonal'
  seedHex: string
  seedColourId: number | null
  ramps: RampName[]
}

export interface ExpressiveParams {
  kind: 'expressive'
  seeds: Array<{ hex: string; colourId: number | null }>
  targetCount: number
  strategy: FillStrategy
}

export type GenParams = TonalParams | ExpressiveParams

export interface SwatchInput {
  hex: string
  label: string
  group_key: string
  colour_id: number | null
  sort_order: number
}

export interface Colour {
  id: number
  name: string
  hex: string
  favourite: 0 | 1
  created_at: string
}

export interface Font {
  id: number
  family: string
  category: string
  source: 'google' | 'local'
  source_url: string
  weights: string // JSON-encoded string[]
  favourite: 0 | 1
  created_at: string
}

// One uploaded local font file mapped to a weight + style within a family.
export interface LocalFontFile {
  path: string
  weight: number
  style: 'normal' | 'italic'
}

// A font installed on the machine (Font Book), grouped by family.
export interface InstalledFace {
  path: string
  style: string
}
export interface InstalledFamily {
  family: string
  faces: InstalledFace[]
}

// A Google Fonts catalogue entry (from the metadata endpoint).
export interface GoogleFontMeta {
  family: string
  category: string
  weights: string[]
  popularity: number
}

export interface Palette {
  id: number
  name: string
  kind: PaletteKind
  base_hex: string
  gen_params: string
  favourite: 0 | 1
  created_at: string
  updated_at: string
}

export interface Swatch {
  id: number
  palette_id: number
  hex: string
  label: string
  group_key: string
  colour_id: number | null
  sort_order: number
  locked: 0 | 1
  created_at: string
}

// Step names span both presets: `markup` (HTML tags) and `semantic` (product roles).
export type TypeScaleStepName =
  // markup
  | 'H1'
  | 'H2'
  | 'H3'
  | 'H4'
  | 'H5'
  | 'H6'
  | 'Paragraph'
  | 'Small'
  // semantic
  | 'Display'
  | 'Headline'
  | 'Title'
  | 'Body Large'
  | 'Body'
  | 'Body Small'
  | 'Caption'
  | 'Label'

export type TypeScaleKind = 'markup' | 'semantic'

export interface TypeScale {
  id: number
  name: string
  heading_font_id: number | null
  body_font_id: number | null
  base_size: number
  ratio: string
  favourite: 0 | 1
  created_at: string
  updated_at: string
}

export interface TypeScaleStep {
  id: number
  type_scale_id: number
  step_name: TypeScaleStepName
  size: number
  weight: number
  line_height: string
  letter_spacing: string
  sort_order: number
}

// A step as supplied to create (no id/type_scale_id yet).
export interface TypeScaleStepInput {
  step_name: TypeScaleStepName
  size: number
  weight: number
  line_height: string
  letter_spacing: string
  sort_order: number
}

export interface Tag {
  id: number
  label: string
  colour: string
}

// Tag plus how many assets (across all sections) currently carry it.
export interface TagWithCount extends Tag {
  count: number
}

export type CopyFormat = 'hex' | 'rgb' | 'hsl' | 'css-var'

// Derived API surface: the source of truth for both preload and window.api typings
export interface VaultApi {
  colour: {
    create: (hex: string, name: string) => Promise<Colour>
    list: () => Promise<Colour[]>
    updateName: (id: number, name: string) => Promise<void>
    updateFavourite: (id: number, favourite: 0 | 1) => Promise<void>
    palettesUsing: (id: number) => Promise<Array<{ id: number; name: string }>>
    delete: (id: number) => Promise<void>
  }
  font: {
    addGoogle: (family: string, category: string, weights: string) => Promise<Font>
    addLocal: (family: string, files: LocalFontFile[]) => Promise<Font>
    list: () => Promise<Font[]>
    updateFavourite: (id: number, favourite: 0 | 1) => Promise<void>
    scalesUsing: (id: number) => Promise<Array<{ id: number; name: string }>>
    delete: (id: number) => Promise<void>
    googleList: () => Promise<GoogleFontMeta[]>
    listInstalled: () => Promise<InstalledFamily[]>
    reveal: (path: string) => Promise<void>
    downloadGoogle: (family: string, weights: string[]) => Promise<boolean>
    readFile: (path: string) => Promise<Uint8Array>
  }
  /** Resolve a dropped/selected File to its absolute path (Electron 33+ via webUtils). */
  getPathForFile: (file: File) => string
  palette: {
    createTonal: (name: string, seedHex: string, seedColourId: number | null, ramps: RampName[]) => Promise<Palette>
    createExpressive: (
      name: string,
      seeds: Array<{ hex: string; colourId: number | null }>,
      targetCount: number,
      strategy: FillStrategy,
    ) => Promise<Palette>
    list: () => Promise<Palette[]>
    updateName: (id: number, name: string) => Promise<void>
    delete: (id: number) => Promise<void>
  }
  swatch: {
    list: (paletteId: number) => Promise<Swatch[]>
    promote: (id: number, name: string) => Promise<Colour>
  }
  typeScale: {
    create: (
      name: string,
      headingFontId: number | null,
      bodyFontId: number | null,
      baseSize: number,
      ratio: string,
      steps: TypeScaleStepInput[],
    ) => Promise<TypeScale>
    list: () => Promise<TypeScale[]>
    updateName: (id: number, name: string) => Promise<void>
    delete: (id: number) => Promise<void>
  }
  typeScaleStep: {
    list: (typeScaleId: number) => Promise<TypeScaleStep[]>
  }
  tag: {
    create: (label: string, colour: string) => Promise<TagWithCount>
    update: (id: number, label: string, colour: string) => Promise<void>
    list: () => Promise<TagWithCount[]>
    delete: (id: number) => Promise<void>
    assign: (assetType: AssetType, assetId: number, tagId: number) => Promise<void>
    remove: (assetType: AssetType, assetId: number, tagId: number) => Promise<void>
    listForAsset: (assetType: AssetType, assetId: number) => Promise<Tag[]>
    listForSection: (assetType: AssetType) => Promise<Tag[]>
    listAssetIds: (assetType: AssetType, tagId: number) => Promise<number[]>
  }
  clipboard: {
    write: (text: string) => Promise<void>
  }
}
