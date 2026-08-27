"use client";

import { useEffect, useRef } from "react";
import type { ShopPage } from "@/lib/types";

/**
 * Renders whatever embed snippet the admin pastes in — a Shopify Buy Button
 * script, an iframe, or raw HTML. Scripts in `innerHTML` never execute, so we
 * re-create them here; that is what makes Shopify's own snippet work.
 */
export default function ShopEmbed({ shop }: { shop: ShopPage }) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !shop.embedHtml.trim()) return;

    host.innerHTML = shop.embedHtml;

    const scripts = Array.from(host.querySelectorAll("script"));
    for (const original of scripts) {
      const replacement = document.createElement("script");
      for (const attribute of Array.from(original.attributes)) {
        replacement.setAttribute(attribute.name, attribute.value);
      }
      replacement.text = original.text;
      original.replaceWith(replacement);
    }

    return () => {
      host.innerHTML = "";
    };
  }, [shop.embedHtml]);

  if (!shop.embedHtml.trim()) {
    return (
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 border border-dashed border-white/15 p-10 text-center">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--pnc-muted)]">
            Shopify embed slot
          </p>
          <p className="max-w-md text-[14px] leading-relaxed text-[var(--pnc-muted)]">
            Paste your Shopify Buy Button or storefront embed code in{" "}
            <span className="text-[var(--pnc-fg)]">/admin → Shop</span> and it renders here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={hostRef}
      className="mx-auto w-full max-w-6xl px-5"
      style={{ minHeight: shop.embedHeight || undefined }}
    />
  );
}
