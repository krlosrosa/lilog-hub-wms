import type { HttpResponse, RequestDescriptor } from '../types/index.js';

export interface HttpAdapter {
  get(url: string, headers?: Record<string, string>): Promise<HttpResponse>;
  post(url: string, body?: unknown, headers?: Record<string, string>): Promise<HttpResponse>;
  put(url: string, body?: unknown, headers?: Record<string, string>): Promise<HttpResponse>;
  patch(url: string, body?: unknown, headers?: Record<string, string>): Promise<HttpResponse>;
  delete(url: string, headers?: Record<string, string>): Promise<HttpResponse>;
  request(descriptor: RequestDescriptor): Promise<HttpResponse>;
}
