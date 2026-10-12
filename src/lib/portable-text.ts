import type { PortableTextBlock } from "emdash/client";

export type AnchoredPortableTextBlock = PortableTextBlock & { _anchorId?: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function slugifyHeading(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function headingText(block: PortableTextBlock): string {
  if (!Array.isArray(block.children)) return "";
  return block.children
    .filter(isRecord)
    .map((child) => (typeof child.text === "string" ? child.text : ""))
    .join("");
}

/** Assign deterministic IDs to standard Portable Text heading blocks. */
export function withHeadingAnchors(blocks: PortableTextBlock[]): AnchoredPortableTextBlock[] {
  const occurrences = new Map<string, number>();

  return blocks.map((block) => {
    const style = block.style;
    if (block._type !== "block" || typeof style !== "string" || !/^h[1-6]$/.test(style)) {
      return block;
    }

    const base = slugifyHeading(headingText(block)) || "section";
    const occurrence = (occurrences.get(base) ?? 0) + 1;
    occurrences.set(base, occurrence);
    return { ...block, _anchorId: occurrence === 1 ? base : `${base}-${occurrence}` };
  });
}
