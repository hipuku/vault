import { useState, useCallback } from 'react'
import type { AssetType } from '@shared/types'

type FavouriteChannel = {
  colour: typeof window.api.colour.updateFavourite
  font: typeof window.api.font.updateFavourite
  palette: typeof window.api.palette.updateFavourite
  type_scale: typeof window.api.typeScale.updateFavourite
}

function getUpdater(assetType: AssetType): (id: number, favourite: 0 | 1) => Promise<void> {
  const map: FavouriteChannel = {
    colour: window.api.colour.updateFavourite,
    font: window.api.font.updateFavourite,
    palette: window.api.palette.updateFavourite,
    type_scale: window.api.typeScale.updateFavourite,
  }
  return map[assetType]
}

export function useFavourite(
  assetType: AssetType,
  id: number,
  initial: 0 | 1
): { favourite: boolean; toggle: () => Promise<void> } {
  const [favourite, setFavourite] = useState(initial === 1)

  const toggle = useCallback(async (): Promise<void> => {
    const next = favourite ? 0 : 1
    await getUpdater(assetType)(id, next as 0 | 1)
    setFavourite(!favourite)
  }, [assetType, id, favourite])

  return { favourite, toggle }
}
