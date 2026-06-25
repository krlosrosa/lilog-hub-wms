import { createHash } from 'node:crypto';

import { S3Client } from '@aws-sdk/client-s3';
import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const R2_PROVIDER = 'R2_PROVIDER';

export type R2Client = S3Client;

export type R2Config = {
  client: R2Client;
  bucketName: string;
};

function readR2Env(configService: ConfigService, key: string): string | undefined {
  const value = configService.get<string>(key)?.trim();
  return value || undefined;
}

function resolveS3Endpoint(configService: ConfigService): string | undefined {
  const explicitEndpoint = readR2Env(configService, 'R2_S3_ENDPOINT');

  if (explicitEndpoint) {
    return explicitEndpoint;
  }

  const accountId = readR2Env(configService, 'R2_ACCOUNT_ID');

  if (!accountId) {
    return undefined;
  }

  return `https://${accountId}.r2.cloudflarestorage.com`;
}

const R2_CONFIG_HINT =
  'Defina R2_ACCOUNT_ID, R2_BUCKET_NAME e R2_API_TOKEN (token cfat_ do dashboard R2), ou R2_ACCESS_KEY_ID + R2_SECRET_ACCESS_KEY.';

type R2Credentials = {
  accessKeyId: string;
  secretAccessKey: string;
};

function hasExplicitS3Credentials(configService: ConfigService): boolean {
  return Boolean(
    readR2Env(configService, 'R2_ACCESS_KEY_ID') &&
      readR2Env(configService, 'R2_SECRET_ACCESS_KEY'),
  );
}

function resolveExplicitS3Credentials(
  configService: ConfigService,
): R2Credentials | null {
  const accessKeyId = readR2Env(configService, 'R2_ACCESS_KEY_ID');
  const secretAccessKey = readR2Env(configService, 'R2_SECRET_ACCESS_KEY');

  if (!accessKeyId || !secretAccessKey) {
    return null;
  }

  return { accessKeyId, secretAccessKey };
}

function deriveS3SecretFromApiToken(apiToken: string): string {
  return createHash('sha256').update(apiToken).digest('hex');
}

async function fetchTokenIdFromVerify(
  apiToken: string,
  accountId: string,
): Promise<string> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/tokens/verify`,
    {
      headers: { Authorization: `Bearer ${apiToken}` },
    },
  );

  if (!response.ok) {
    throw new ServiceUnavailableException(
      'R2_API_TOKEN inválido ou sem permissão. Verifique o token em Cloudflare R2 > Manage R2 API Tokens.',
    );
  }

  const payload = (await response.json()) as {
    success?: boolean;
    result?: { id?: string };
  };

  const tokenId = payload.result?.id?.trim();

  if (!payload.success || !tokenId) {
    throw new ServiceUnavailableException(
      'Não foi possível obter o ID do token R2. Defina R2_TOKEN_ID manualmente ou recrie o token.',
    );
  }

  return tokenId;
}

async function resolveR2Credentials(
  configService: ConfigService,
): Promise<R2Credentials | null> {
  const explicit = resolveExplicitS3Credentials(configService);

  if (explicit) {
    return explicit;
  }

  const apiToken = readR2Env(configService, 'R2_API_TOKEN');

  if (!apiToken) {
    return null;
  }

  const accountId = readR2Env(configService, 'R2_ACCOUNT_ID');

  if (!accountId) {
    throw new ServiceUnavailableException(
      'R2_ACCOUNT_ID é obrigatório ao usar R2_API_TOKEN.',
    );
  }

  const tokenId =
    readR2Env(configService, 'R2_TOKEN_ID') ??
    (await fetchTokenIdFromVerify(apiToken, accountId));

  return {
    accessKeyId: tokenId,
    secretAccessKey: deriveS3SecretFromApiToken(apiToken),
  };
}

export function isR2Configured(configService: ConfigService): boolean {
  return Boolean(
    resolveS3Endpoint(configService) &&
      readR2Env(configService, 'R2_BUCKET_NAME') &&
      (hasExplicitS3Credentials(configService) ||
        readR2Env(configService, 'R2_API_TOKEN')),
  );
}

export async function createR2Client(
  configService: ConfigService,
): Promise<R2Client> {
  const endpoint = resolveS3Endpoint(configService);
  const credentials = await resolveR2Credentials(configService);

  if (!endpoint || !credentials) {
    throw new ServiceUnavailableException(
      `Armazenamento R2 (API S3) não configurado. ${R2_CONFIG_HINT}`,
    );
  }

  const { accessKeyId, secretAccessKey } = credentials;

  const region = readR2Env(configService, 'R2_REGION') ?? 'auto';

  return new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    // R2 não suporta checksums automáticos do AWS SDK v3.7+ (causa 401 Unauthorized)
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
}

export async function createR2Config(
  configService: ConfigService,
): Promise<R2Config | null> {
  if (!isR2Configured(configService)) {
    return null;
  }

  const bucketName = readR2Env(configService, 'R2_BUCKET_NAME');

  if (!bucketName) {
    return null;
  }

  return {
    client: await createR2Client(configService),
    bucketName,
  };
}

export function assertR2Config(config: R2Config | null): R2Config {
  if (!config) {
    throw new ServiceUnavailableException(
      `Armazenamento R2 (API S3) não configurado. ${R2_CONFIG_HINT}`,
    );
  }

  return config;
}

export const r2Provider = {
  provide: R2_PROVIDER,
  useFactory: async (
    configService: ConfigService,
  ): Promise<R2Config | null> => createR2Config(configService),
  inject: [ConfigService],
};
