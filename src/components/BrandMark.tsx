// Lightweight, hand-built brand mark: a market basket with a sprouting leaf. Uses
// currentColor so it inherits the surrounding text color (white in the header, emerald in
// the hero). Decorative — always paired with the visible "La Feria CR" wordmark, so it is
// hidden from assistive tech by the caller.

export function BrandMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* leaf sprouting from the produce */}
      <path d="M16 11c0-3 2-5.5 5-6-.2 3-2 5.4-5 6Z" fill="currentColor" stroke="none" />
      <path d="M16 11c-.4-2.4-2.2-4.2-4.6-4.6" opacity="0.7" />
      {/* basket rim */}
      <path d="M6 12h20l-1.6 3H7.6L6 12Z" />
      {/* basket body */}
      <path d="M7.6 15l1.5 9a2 2 0 0 0 2 1.7h9.8a2 2 0 0 0 2-1.7l1.5-9" />
      {/* weave lines */}
      <path d="M12 16.5l.6 7M20 16.5l-.6 7M16 16.5v7" opacity="0.55" />
    </svg>
  );
}
