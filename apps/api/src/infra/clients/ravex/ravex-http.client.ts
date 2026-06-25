import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  RavexAccessTokenSchema,
  RavexApiError,
} from './ravex.types.js';
import type { RavexAccessToken } from './ravex.types.js';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

const TOKEN_EXPIRY_BUFFER_MS = 60_000;

@Injectable()
export class RavexHttpClient {
  private readonly logger = new Logger(RavexHttpClient.name);
  private readonly baseUrl: string;
  private readonly username: string;
  private readonly password: string;

  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: number | null = null;
  private authPromise: Promise<void> | null = null;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService
      .getOrThrow<string>('RAVEX_BASE_URL')
      .replace(/\/$/, '');
    this.username = this.configService.getOrThrow<string>('RAVEX_USERNAME');
    this.password = this.configService.getOrThrow<string>('RAVEX_PASSWORD');
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', path, { params });
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, { body });
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, { body });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  private async request<T>(
    method: HttpMethod,
    path: string,
    options: { body?: unknown; params?: Record<string, string> } = {},
    isRetry = false,
  ): Promise<T> {
    await this.ensureValidToken();

    const response = await this.executeFetch(method, path, options);

    if (response.status === 401 && !isRetry) {
      this.logger.warn(`Ravex ${method} ${path} returned 401, re-authenticating`);
      this.clearTokenState();
      await this.authenticate();
      return this.request<T>(method, path, options, true);
    }

    if (!response.ok) {
      const body = await this.parseResponseBody(response);
      throw new RavexApiError(
        `Ravex API ${method} ${path} failed with status ${response.status}`,
        response.status,
        body,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const body = await this.parseResponseBody(response);

    if (!isRetry && this.isAuthTokenPayload(body)) {
      this.logger.warn(
        `Ravex ${method} ${path} returned an auth token instead of API data, retrying`,
      );
      this.storeToken(RavexAccessTokenSchema.parse(body));
      return this.request<T>(method, path, options, true);
    }

    return body as T;
  }

  private async executeFetch(
    method: HttpMethod,
    path: string,
    options: { body?: unknown; params?: Record<string, string> } = {},
  ): Promise<Response> {
    const url = this.buildUrl(path, options.params);
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.accessToken}`,
    };

    const init: RequestInit = { method, headers };

    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(options.body);
    }

    try {
      return await fetch(url, init);
    } catch (error) {
      this.logger.error(`Ravex network error on ${method} ${path}`, error);
      throw new RavexApiError(
        `Ravex API ${method} ${path} network error`,
        0,
        error,
      );
    }
  }

  private isAuthTokenPayload(body: unknown): boolean {
    if (typeof body !== 'object' || body === null) {
      return false;
    }

    const record = body as Record<string, unknown>;

    return (
      typeof record.access_token === 'string' &&
      record.expires_in !== undefined &&
      !('success' in record)
    );
  }

  private async ensureValidToken(): Promise<void> {
    if (this.isTokenValid()) {
      return;
    }

    if (this.authPromise) {
      await this.authPromise;
      return;
    }

    this.authPromise = this.authenticate().finally(() => {
      this.authPromise = null;
    });

    await this.authPromise;
  }

  private isTokenValid(): boolean {
    if (!this.accessToken || !this.tokenExpiresAt) {
      return false;
    }

    return Date.now() < this.tokenExpiresAt - TOKEN_EXPIRY_BUFFER_MS;
  }

  private async authenticate(): Promise<void> {
    if (this.refreshToken) {
      try {
        await this.requestToken({ grant_type: 'refresh_token', refresh_token: this.refreshToken });
        return;
      } catch (error) {
        this.logger.warn('Ravex refresh token failed, falling back to password grant');
        this.clearTokenState();
      }
    }

    await this.requestToken({
      grant_type: 'password',
      username: this.username,
      password: this.password,
    });
  }

  private async requestToken(
    fields: Record<string, string>,
  ): Promise<void> {
    const formData = new FormData();

    for (const [key, value] of Object.entries(fields)) {
      formData.append(key, value);
    }

    const response = await fetch(`${this.baseUrl}/usuario/autenticar`, {
      method: 'POST',
      body: formData,
    });

    const body = await this.parseResponseBody(response);

    if (!response.ok) {
      throw new RavexApiError(
        'Ravex authentication failed',
        response.status,
        body,
      );
    }

    const parsed = RavexAccessTokenSchema.safeParse(body);

    if (!parsed.success) {
      throw new RavexApiError(
        'Ravex authentication returned an invalid token payload',
        response.status,
        body,
      );
    }

    this.storeToken(parsed.data);
  }

  private storeToken(token: RavexAccessToken): void {
    this.accessToken = token.access_token;

    if (token.refresh_token) {
      this.refreshToken = token.refresh_token;
    }

    this.tokenExpiresAt = Date.now() + token.expires_in * 1000;
  }

  private clearTokenState(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = null;
  }

  private buildUrl(path: string, params?: Record<string, string>): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${this.baseUrl}${normalizedPath}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    return url.toString();
  }

  private async parseResponseBody(response: Response): Promise<unknown> {
    const text = await response.text();

    if (!text) {
      return undefined;
    }

    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }
}
