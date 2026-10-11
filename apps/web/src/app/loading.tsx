/**
 * app/loading.tsx
 * Trạng thái đang tải toàn cục (Suspense fallback của route segment).
 */
export default function Loading() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center gap-6 px-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <svg
        className="h-8 w-8 animate-spin text-ocean-secondary"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <div className="flex w-full max-w-sm flex-col gap-3" aria-hidden="true">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-2/3" />
      </div>
      <span className="sr-only">Đang tải...</span>
    </main>
  );
}
