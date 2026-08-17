import type { HttpResponse, RequestDescriptor } from '../types/index.js';
import type { HttpAdapter } from '../network/HttpAdapter.js';

export class FakeHttpAdapter implements HttpAdapter {
  readonly requests: RequestDescriptor[] = [];
  private responses = new Map<string, HttpResponse>();
  defaultResponse: HttpResponse = { status: 200, body: { ok: true } };

  setResponse(key: string, response: HttpResponse): void {
    this.responses.set(key, response);
  }

  async get(url: string, headers?: Record<string, string>): Promise<HttpResponse> {
    return this.request({ method: 'GET', url, headers });
  }

  async post(url: string, body?: unknown, headers?: Record<string, string>): Promise<HttpResponse> {
    return this.request({ method: 'POST', url, body, headers });
  }

  async put(url: string, body?: unknown, headers?: Record<string, string>): Promise<HttpResponse> {
    return this.request({ method: 'PUT', url, body, headers });
  }

  async patch(url: string, body?: unknown, headers?: Record<string, string>): Promise<HttpResponse> {
    return this.request({ method: 'PATCH', url, body, headers });
  }

  async delete(url: string, headers?: Record<string, string>): Promise<HttpResponse> {
    return this.request({ method: 'DELETE', url, headers });
  }

  async request(descriptor: RequestDescriptor): Promise<HttpResponse> {
    this.requests.push(descriptor);
    return this.responses.get(descriptor.url) ?? this.defaultResponse;
  }
}
