export type Section = 'colours' | 'fonts' | 'palettes' | 'type_scales'
export type AssetType = 'colour' | 'font' | 'palette' | 'type_scale'

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
  weights: string  // JSON-encoded string[]
  favourite: 0 | 1
  created_at: string
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
  base_hex: string
  favourite: 0 | 1
  created_at: string
  updated_at: string
}

export interface Swatch {
  id: number
  palette_id: number
  hex: string
  label: string
  sort_order: number
  locked: 0 | 1
  created_at: string
}

export type TypeScaleStepName =
  | 'Display' | 'H1' | 'H2' | 'H3' | 'H4' | 'H5' | 'H6'
  | 'Body Large' | 'Body' | 'Body Small' | 'Caption' | 'Label'

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

// Derived API surface — source of truth for both preload and window.api typings
export interface VaultApi {
  colour: {
    create:           (hex: string, name: string) => Promise<Colour>
    list:             () => Promise<Colour[]>
    updateName:       (id: number, name: string) => Promise<void>
    updateFavourite:  (id: number, favourite: 0 | 1) => Promise<void>
    delete:           (id: number) => Promise<void>
  }
  font: {
    addGoogle:        (family: string, category: string, weights: string) => Promise<Font>
    addLocal:         (family: string, category: string, sourceUrl: string) => Promise<Font>
    list:             () => Promise<Font[]>
    updateFavourite:  (id: number, favourite: 0 | 1) => Promise<void>
    delete:           (id: number) => Promise<void>
    googleList:       () => Promise<GoogleFontMeta[]>
    readFile:         (path: string) => Promise<Uint8Array>
  }
  /** Resolve a dropped/selected File to its absolute path (Electron 33+ via webUtils). */
  getPathForFile: (file: File) => string
  palette: {
    createFromHex:     (name: string, baseHex: string, swatches: string[]) => Promise<Palette>
    createFromLibrary: (name: string, hexList: string[]) => Promise<Palette>
    list:              () => Promise<Palette[]>
    updateFavourite:   (id: number, favourite: 0 | 1) => Promise<void>
    duplicate:         (id: number) => Promise<Palette>
    delete:            (id: number) => Promise<void>
    regenerate:        (id: number) => Promise<Swatch[]>
  }
  swatch: {
    list:         (paletteId: number) => Promise<Swatch[]>
    updateLabel:  (id: number, label: string) => Promise<void>
    updateLocked: (id: number, locked: 0 | 1) => Promise<void>
  }
  typeScale: {
    create:           (name: string, headingFontId: number | null, bodyFontId: number | null, baseSize: number, ratio: string, steps: TypeScaleStepInput[]) => Promise<TypeScale>
    list:             () => Promise<TypeScale[]>
    updateFavourite:  (id: number, favourite: 0 | 1) => Promise<void>
    delete:           (id: number) => Promise<void>
  }
  typeScaleStep: {
    list:   (typeScaleId: number) => Promise<TypeScaleStep[]>
    update: (id: number, size: number, weight: number, lineHeight: string, letterSpacing: string) => Promise<void>
  }
  tag: {
    create:         (label: string, colour: string) => Promise<TagWithCount>
    update:         (id: number, label: string, colour: string) => Promise<void>
    list:           () => Promise<TagWithCount[]>
    delete:         (id: number) => Promise<void>
    assign:         (assetType: AssetType, assetId: number, tagId: number) => Promise<void>
    remove:         (assetType: AssetType, assetId: number, tagId: number) => Promise<void>
    listForAsset:   (assetType: AssetType, assetId: number) => Promise<Tag[]>
    listForSection: (assetType: AssetType) => Promise<Tag[]>
    listAssetIds:   (assetType: AssetType, tagId: number) => Promise<number[]>
  }
  clipboard: {
    write: (text: string) => Promise<void>
  }
}
