function extensionFromMime(mimeType: string): string {
  if (mimeType.includes('webp')) return 'webp';
  if (mimeType.includes('png')) return 'png';
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
  return 'bin';
}

export function buildPhotoFilename(
  exportId: string,
  outboxId: number,
  photoId: number,
  mimeType: string,
): string {
  const ext = extensionFromMime(mimeType);
  return `kls-${exportId}-item${outboxId}-foto${photoId}.${ext}`;
}

export function buildJsonFilename(exportId: string): string {
  return `kls-sync-export-${exportId}.json`;
}
