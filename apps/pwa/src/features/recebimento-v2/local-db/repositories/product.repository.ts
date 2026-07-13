import type { RecebimentoV2DB } from '../db.js';
import type { ProductRecord } from '../schema.js';

const PRODUCT_CURSOR_KEY = 'products::cursor';

export class ProductRepository {
  constructor(private readonly db: RecebimentoV2DB) {}

  async searchProducts(query: string, limit = 20): Promise<ProductRecord[]> {
    const lower = query.toLowerCase();

    const results = await this.db.products
      .filter((p) => {
        if (p.deletedAt !== null) return false;
        return (
          p.sku.toLowerCase().includes(lower) ||
          p.ean.toLowerCase().includes(lower) ||
          p.dum.toLowerCase().includes(lower) ||
          p.description.toLowerCase().includes(lower)
        );
      })
      .limit(limit)
      .toArray();

    return results;
  }

  async getProductBySku(sku: string): Promise<ProductRecord | undefined> {
    return this.db.products.where('sku').equals(sku).filter((p) => p.deletedAt === null).first();
  }

  async getProductByGtin(gtin: string): Promise<ProductRecord | undefined> {
    const byEan = await this.db.products
      .where('ean')
      .equals(gtin)
      .filter((p) => p.deletedAt === null)
      .first();
    if (byEan) return byEan;

    return this.db.products
      .where('dum')
      .equals(gtin)
      .filter((p) => p.deletedAt === null)
      .first();
  }

  async getProductById(produtoId: string): Promise<ProductRecord | undefined> {
    return this.db.products.get(produtoId);
  }

  async bulkUpsertProducts(products: ProductRecord[]): Promise<void> {
    await this.db.products.bulkPut(products);
  }

  async applyTombstones(produtoIds: string[]): Promise<void> {
    const now = Date.now();
    await this.db.transaction('rw', this.db.products, async () => {
      for (const id of produtoIds) {
        await this.db.products.update(id, { deletedAt: now });
      }
    });
  }

  async getCursor(): Promise<string | undefined> {
    const meta = await this.db.syncMeta.get(PRODUCT_CURSOR_KEY);
    return meta ? String(meta.value) : undefined;
  }

  async setCursor(cursor: string): Promise<void> {
    await this.db.syncMeta.put({
      id: PRODUCT_CURSOR_KEY,
      value: cursor,
      updatedAt: Date.now(),
    });
  }
}
