import { request } from '@/lib/offline/api-client';

import type { AuthUser, ChangePasswordInput, LoginInput, LoginResponse } from './types';

export async function loginApi(input: LoginInput): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function getMeApi(): Promise<AuthUser> {
  return request<AuthUser>('/auth/me');
}

export async function logoutApi(): Promise<void> {
  await request<void>('/auth/logout', { method: 'POST' });
}

export async function changePasswordApi(input: ChangePasswordInput): Promise<void> {
  await request<void>('/auth/change-password', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}
