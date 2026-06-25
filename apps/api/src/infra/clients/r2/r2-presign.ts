import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  type S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function generatePutPresignedUrl(
  client: S3Client,
  bucketName: string,
  chave: string,
  mimeType: string,
  expiresInSeconds: number,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: chave,
    ContentType: mimeType,
  });

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

export async function generateGetPresignedUrl(
  client: S3Client,
  bucketName: string,
  chave: string,
  expiresInSeconds: number,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: chave,
  });

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

export async function deleteR2Object(
  client: S3Client,
  bucketName: string,
  chave: string,
): Promise<void> {
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: chave,
    }),
  );
}

export async function putR2Object(
  client: S3Client,
  bucketName: string,
  chave: string,
  body: Buffer,
  mimeType: string,
): Promise<void> {
  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: chave,
      Body: body,
      ContentType: mimeType,
    }),
  );
}

export async function headR2Object(
  client: S3Client,
  bucketName: string,
  chave: string,
): Promise<{ contentLength: number; contentType: string | undefined }> {
  const response = await client.send(
    new HeadObjectCommand({
      Bucket: bucketName,
      Key: chave,
    }),
  );

  return {
    contentLength: response.ContentLength ?? 0,
    contentType: response.ContentType,
  };
}
