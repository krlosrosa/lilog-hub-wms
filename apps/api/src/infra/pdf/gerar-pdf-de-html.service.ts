import { Injectable } from '@nestjs/common';
import type { OnModuleDestroy } from '@nestjs/common';
import puppeteer, { type Browser } from 'puppeteer';

import { resolvePuppeteerExecutablePath } from './resolve-puppeteer-executable.js';

@Injectable()
export class GerarPdfDeHtmlService implements OnModuleDestroy {
  private browserPromise: Promise<Browser> | null = null;
  private executablePathPromise: Promise<string> | null = null;

  private async getExecutablePath(): Promise<string> {
    if (!this.executablePathPromise) {
      this.executablePathPromise = resolvePuppeteerExecutablePath();
    }

    return this.executablePathPromise;
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browserPromise) {
      const executablePath = await this.getExecutablePath();

      this.browserPromise = puppeteer.launch({
        headless: true,
        executablePath,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }

    return this.browserPromise;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.browserPromise) {
      const browser = await this.browserPromise;
      await browser.close();
      this.browserPromise = null;
    }
  }

  async gerarPdf(html: string): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      await page.setContent(html, { waitUntil: 'load' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '12mm',
          right: '12mm',
          bottom: '12mm',
          left: '12mm',
        },
      });

      return Buffer.from(pdf);
    } finally {
      await page.close();
    }
  }
}
