// Pure, client-safe page-window math for paginated lists (1-based pages). No prisma/server imports,
// so it can be shared by client components and API routes alike.

export interface PageBounds {
  /** Total number of pages (always >= 1, even when empty). */
  totalPages: number;
  /** 1-based index of the first item on the page (0 when the list is empty). */
  from: number;
  /** 1-based index of the last item on the page (0 when the list is empty). */
  to: number;
}

/** Compute the visible window ("showing from–to of total") for a page, clamping page into range. */
export function pageBounds(
  total: number,
  page: number,
  pageSize: number,
): PageBounds {
  const size = Math.max(Math.trunc(pageSize) || 1, 1);
  const safeTotal = Math.max(total, 0);
  const totalPages = Math.max(1, Math.ceil(safeTotal / size));
  const clampedPage = Math.min(Math.max(Math.trunc(page) || 1, 1), totalPages);
  const from = safeTotal === 0 ? 0 : (clampedPage - 1) * size + 1;
  const to = Math.min(clampedPage * size, safeTotal);
  return { totalPages, from, to };
}
