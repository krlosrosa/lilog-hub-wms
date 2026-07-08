const MIME_TO_EXTENSION: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
};

export function extensionFromMimeType(mimeType: string): string {
  return MIME_TO_EXTENSION[mimeType.toLowerCase()] ?? 'webp';
}

export function buildImageUploadName(prefix: string, mimeType: string): string {
  const safePrefix = prefix.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${safePrefix}.${extensionFromMimeType(mimeType)}`;
}
