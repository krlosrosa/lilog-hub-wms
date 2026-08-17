export interface BlobUploadResult {
  etag?: string;
  bytesSent: number;
}

export interface BlobTransportAdapter {
  upload(url: string, bytes: Uint8Array | ArrayBuffer, contentType: string): Promise<BlobUploadResult>;
}
