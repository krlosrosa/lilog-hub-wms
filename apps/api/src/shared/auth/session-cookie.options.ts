export type SessionCookieOptions = {
  httpOnly: true;
  sameSite: 'lax';
  path: '/';
  secure: boolean;
  maxAge: number;
  domain?: string;
};

function isSecureCookieRequired(): boolean {
  if (process.env.COOKIE_SECURE === 'true') {
    return true;
  }

  if (process.env.COOKIE_SECURE === 'false') {
    return false;
  }

  if (process.env.NODE_ENV === 'production') {
    return true;
  }

  return (process.env.API_PUBLIC_URL ?? '').startsWith('https://');
}

export function getSessionCookieOptions(): SessionCookieOptions {
  const domain = process.env.COOKIE_DOMAIN?.trim();

  return {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: isSecureCookieRequired(),
    maxAge: 60 * 60 * 24,
    ...(domain ? { domain } : {}),
  };
}

export function getSessionCookieClearOptions() {
  const { path, domain, secure, sameSite } = getSessionCookieOptions();

  return {
    path,
    secure,
    sameSite,
    ...(domain ? { domain } : {}),
  };
}
