export type RequestUser = {
  id: number;
  email: string;
  role: string;
};

export function getRequestUser(request: { user?: RequestUser }): RequestUser | null {
  return request.user ?? null;
}
