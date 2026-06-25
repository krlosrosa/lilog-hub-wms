import { existsSync } from 'node:fs';

import puppeteer from 'puppeteer';

const WINDOWS_CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA
    ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
    : null,
].filter((candidate): candidate is string => Boolean(candidate));

export async function resolvePuppeteerExecutablePath(): Promise<string> {
  const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
  if (fromEnv && existsSync(fromEnv)) {
    return fromEnv;
  }

  try {
    const bundled = await puppeteer.executablePath();
    if (existsSync(bundled)) {
      return bundled;
    }
  } catch {
    // bundled browser not installed yet
  }

  for (const candidate of WINDOWS_CHROME_CANDIDATES) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    'Chrome não encontrado para geração de PDF. Execute `pnpm exec puppeteer browsers install chrome` em apps/api ou defina PUPPETEER_EXECUTABLE_PATH.',
  );
}
