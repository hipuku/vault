import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type { VaultApi, AssetType } from '../shared/types'

const api: VaultApi = {
  colour: {
    create:          (hex, name)            => ipcRenderer.invoke('colour:create', hex, name),
    list:            ()                     => ipcRenderer.invoke('colour:list'),
    updateName:      (id, name)             => ipcRenderer.invoke('colour:update-name', id, name),
    updateFavourite: (id, favourite)        => ipcRenderer.invoke('colour:update-favourite', id, favourite),
    palettesUsing:   (id)                   => ipcRenderer.invoke('colour:palettes-using', id),
    delete:          (id)                   => ipcRenderer.invoke('colour:delete', id),
  },
  font: {
    addGoogle:       (family, category, weights)  => ipcRenderer.invoke('font:add-google', family, category, weights),
    addLocal:        (family, files)               => ipcRenderer.invoke('font:add-local', family, files),
    list:            ()                           => ipcRenderer.invoke('font:list'),
    updateFavourite: (id, favourite)              => ipcRenderer.invoke('font:update-favourite', id, favourite),
    scalesUsing:     (id)                         => ipcRenderer.invoke('font:scales-using', id),
    delete:          (id)                         => ipcRenderer.invoke('font:delete', id),
    googleList:      ()                           => ipcRenderer.invoke('font:google-list'),
    listInstalled:   ()                           => ipcRenderer.invoke('font:list-installed'),
    reveal:          (path)                       => ipcRenderer.invoke('font:reveal', path),
    downloadGoogle:  (family, weights)            => ipcRenderer.invoke('font:download-google', family, weights),
    readFile:        (path)                       => ipcRenderer.invoke('font:read-file', path),
  },
  palette: {
    createTonal:      (name, seedHex, seedColourId, ramps) => ipcRenderer.invoke('palette:create-tonal', name, seedHex, seedColourId, ramps),
    createExpressive: (name, seeds, targetCount, strategy) => ipcRenderer.invoke('palette:create-expressive', name, seeds, targetCount, strategy),
    list:             ()                                   => ipcRenderer.invoke('palette:list'),
    updateName:       (id, name)                           => ipcRenderer.invoke('palette:update-name', id, name),
    delete:           (id)                                 => ipcRenderer.invoke('palette:delete', id),
  },
  swatch: {
    list:    (paletteId) => ipcRenderer.invoke('swatch:list', paletteId),
    promote: (id, name)  => ipcRenderer.invoke('swatch:promote', id, name),
  },
  typeScale: {
    create:          (name, headingFontId, bodyFontId, baseSize, ratio, steps) =>
      ipcRenderer.invoke('type-scale:create', name, headingFontId, bodyFontId, baseSize, ratio, steps),
    list:            ()                     => ipcRenderer.invoke('type-scale:list'),
    updateName:      (id, name)             => ipcRenderer.invoke('type-scale:update-name', id, name),
    delete:          (id)                   => ipcRenderer.invoke('type-scale:delete', id),
  },
  typeScaleStep: {
    list:   (typeScaleId)                                      => ipcRenderer.invoke('type-scale-step:list', typeScaleId),
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
