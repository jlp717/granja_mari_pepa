import type { CartItem } from "@/lib/types";

export interface DraftAddress {
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  type: "home" | "business";
}

export interface LocalDraft {
  version: 1;
  savedAt: string;
  items: Array<{ productId: string; quantity: number }>;
  address: DraftAddress;
  paymentPreference: "" | "card" | "bank" | "paypal";
  reference: string;
  notes: string;
}

export const LOCAL_DRAFT_KEY = "gmp-local-draft-v1";

export function createLocalDraft(
  items: CartItem[],
  address: DraftAddress,
  paymentPreference: LocalDraft["paymentPreference"],
  reference: string,
  notes: string,
  savedAt: string,
): LocalDraft {
  return {
    version: 1,
    savedAt,
    items: items.map(({ product, quantity }) => ({
      productId: product.id,
      quantity,
    })),
    address: { ...address },
    paymentPreference,
    reference,
    notes,
  };
}
