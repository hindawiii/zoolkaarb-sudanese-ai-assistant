// Validate supported operations before any image processing or AI request.
export const PHOTO_EDIT_ACTIONS = [
  "remove-bg", "restore", "enhance", "filter-bw", "filter-warm", "filter-cool",
  "anime-hero", "clothes-formal", "clothes-traditional", "clothes-casual",
  "smart-blender", "anime-studio", "anime-scene-swap", "verify-anime-anatomy",
  "outfitter-studio", "outfit-swatch",
] as const;

export const isPhotoEditAction = (action: string): boolean =>
  PHOTO_EDIT_ACTIONS.some((supported) => supported === action);