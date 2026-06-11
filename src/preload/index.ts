import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type { VaultApi, AssetType } from '../shared/types'

const api: VaultApi = {
  colour: {
    create:          (hex, name)            => ipcRenderer.invoke('colour:create', hex, name),
    list:            ()                     => ipcRenderer.invoke('colour:list'),
    updateName:      (id, name)             => ipcRenderer.invoke('colour:update-name', id, name),
    updateFavourite: (id, favourite)        => ipcRenderer.invoke('colour:update-favourite', id, favourite),
    delete:          (id)                   => ipcRenderer.invoke('colour:delete', id),
  },
  font: {
    addGoogle:       (family, category, weights)  => ipcRenderer.invoke('font:add-google', family, category, weights),
    addLocal:        (family, category, sourceUrl) => ipcRenderer.invoke('font:add-local', family, category, sourceUrl),
    list:            ()                           => ipcRenderer.invoke('font:list'),
    updateFavourite: (id, favourite)              => ipcRenderer.invoke('font:update-favourite', id, favourite),
    delete:          (id)                         => ipcRenderer.invoke('font:delete', id),
    googleList:      ()                           => ipcRenderer.invoke('font:google-list'),
    readFile:        (path)                       => ipcRenderer.invoke('font:read-file', path),
  },
  palette: {
    createFromHex:     (name, baseHex, swatches) => ipcRenderer.invoke('palette:create-from-hex', name, baseHex, swatches),
    createFromLibrary: (name, hexList)          => ipcRenderer.invoke('palette:create-from-library', name, hexList),
    list:              ()                       => ipcRenderer.invoke('palette:list'),
    updateFavourite:   (id, favourite)          => ipcRenderer.invoke('palette:update-favourite', id, favourite),
    duplicate:         (id)                     => ipcRenderer.invoke('palette:duplicate', id),
    delete:            (id)                     => ipcRenderer.invoke('palette:delete', id),
    regenerate:        (id)                     => ipcRenderer.invoke('palette:regenerate', id),
  },
  swatch: {
    list:         (paletteId)          => ipcRenderer.invoke('swatch:list', paletteId),
    updateLabel:  (id, label)          => ipcRenderer.invoke('swatch:update-label', id, label),
    updateLocked: (id, locked)         => ipcRenderer.invoke('swatch:update-locked', id, locked),
  },
  typeScale: {
    create:          (name, headingFontId, bodyFontId, baseSize, ratio, steps) =>
      ipcRenderer.invoke('type-scale:create', name, headingFontId, bodyFontId, baseSize, ratio, steps),
    list:            ()                     => ipcRenderer.invoke('type-scale:list'),
    updateFavourite: (id, favourite)        => ipcRenderer.invoke('type-scale:update-favourite', id, favourite),
    delete:          (id)                   => ipcRenderer.invoke('type-scale:delete', id),
  },
  typeScaleStep: {
    list:   (typeScaleId)                                      => ipcRenderer.invoke('type-scale-step:list', typeScaleId),
    update: (id, size, weight, lineHeight, letterSpacing)      => ipcRenderer.invoke('type-scale-step:update', id, size, weight, lineHeight, letterSpacing),
  },
  tag: {
    create:         (label, colour)                      => ipcRenderer.invoke('tag:create', label, colour),
    update:         (id, label, colour)                  => ipcRenderer.invoke('tag:update', id, label, colour),
    list:           ()                                   => ipcRenderer.invoke('tag:list'),
    delete:         (id)                                 => ipcRenderer.invoke('tag:delete', id),
    assign:         (assetType: AssetType, assetId, tagId) => ipcRenderer.invoke('tag:assign', assetType, assetId, tagId),
    remove:         (assetType: AssetType, assetId, tagId) => ipcRenderer.invoke('tag:remove', assetType, assetId, tagId),
    listForAsset:   (assetType: AssetType, assetId)        => ipcRenderer.invoke('tag:list-for-asset', assetType, assetId),
    listForSection: (assetType: AssetType)                 => ipcRenderer.invoke('tag:list-for-section', assetType),
    listAssetIds:   (assetType: AssetType, tagId)          => ipcRenderer.invoke('tag:list-asset-ids', assetType, tagId),
  },
  clipboard: {
    write: (text) => ipcRenderer.invoke('clipboard:write', text),
  },
  getPathForFile: (file: File) => webUtils.getPathForFile(file),
}

contextBridge.exposeInMainWorld('api', api)
