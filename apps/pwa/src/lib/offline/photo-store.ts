import type { AppDB, PhotoEntry } from './db';

export interface SavePhotoInput {
  relatedId: string;
  blob: Blob;
  mimeType: string;
}

export async function savePhoto(
  database: AppDB,
  input: SavePhotoInput
): Promise<number> {
  return database.photos.add({
    relatedId: input.relatedId,
    blob: input.blob,
    mimeType: input.mimeType,
    createdAt: Date.now(),
  });
}

export async function getPhoto(
  database: AppDB,
  id: number
): Promise<PhotoEntry | undefined> {
  return database.photos.get(id);
}

export async function deletePhoto(database: AppDB, id: number): Promise<void> {
  await database.photos.delete(id);
}

export async function deletePhotos(database: AppDB, ids: number[]): Promise<void> {
  await database.photos.bulkDelete(ids);
}

export async function getPhotosByRelated(
  database: AppDB,
  relatedId: string
): Promise<PhotoEntry[]> {
  return database.photos.where('relatedId').equals(relatedId).sortBy('createdAt');
}

export async function setPhotoUploadedUrl(
  database: AppDB,
  id: number,
  uploadedUrl: string
): Promise<void> {
  await database.photos.update(id, { uploadedUrl });
}

export function createObjectUrl(photo: PhotoEntry): string {
  return URL.createObjectURL(photo.blob);
}
