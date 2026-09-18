// ============================================================
// NexOS — Preço de lote/atacado (desconto por quantidade)
//
// Fonte única da verdade: client (vitrine/drawer) e servidor
// (/api/checkout) usam estas funções — o total exibido é sempre
// o total cobrado.
//
// COMO DESATIVAR TUDO: mude BULK_ENABLED para false. Pronto —
// volta ao preço cheio em qualquer quantidade, sem mexer em
// mais nenhum arquivo.
//
// COMO AJUSTAR: edite BULK_TIERS (minQty → preço unitário).
// Âncora atual: 50 un. → R$ 50,00 /un.
// ============================================================

export const BULK_ENABLED = true;

/** Só estes productIds participam do atacado. */
export const BULK_PRODUCT_IDS: string[] = ['placa'];

/** Teto do seletor de quantidade (vitrine) e da API. */
export const BULK_MAX_QTY = 50;

export interface BulkTier {
  minQty: number;
  unitPrice: number;
  tag: string;
}

export const BULK_TIERS: BulkTier[] = [
  { minQty: 50, unitPrice: 50.0, tag: 'Atacado 50+' },
  { minQty: 25, unitPrice: 59.9, tag: 'Atacado 25+' },
  { minQty: 10, unitPrice: 64.9, tag: 'Atacado 10+' },
];

/** Preço unitário vigente p/ a quantidade (nunca acima do base). */
export function bulkUnitPrice(basePrice: number, qty: number, productId?: string): number {
  if (!BULK_ENABLED) return basePrice;
  const q = Math.floor(qty);
  if (!Number.isFinite(q) || q < 1) return basePrice;
  if (productId && !BULK_PRODUCT_IDS.includes(productId)) return basePrice;
  let best = basePrice;
  for (const t of BULK_TIERS) {
    if (q >= t.minQty && t.unitPrice < best) best = t.unitPrice;
  }
  return best;
}

/** Etiqueta da faixa ativa (ex.: 'Atacado 10+') ou null. */
export function bulkTag(qty: number, productId?: string): string | null {
  if (!BULK_ENABLED) return null;
  const q = Math.floor(qty);
  if (!Number.isFinite(q) || q < 1) return null;
  if (productId && !BULK_PRODUCT_IDS.includes(productId)) return null;
  let tag: string | null = null;
  let bestMin = 0;
  for (const t of BULK_TIERS) {
    if (q >= t.minQty && t.minQty > bestMin) {
      bestMin = t.minQty;
      tag = t.tag;
    }
  }
  return tag;
}
