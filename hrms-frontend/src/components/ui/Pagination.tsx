/**
 * Reusable pagination component.
 * Shows page numbers with prev/next buttons.
 */
interface Props {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-1 py-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-2.5 py-1.5 text-xs text-gray-500 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Precedent
      </button>
      {start > 1 && <span className="px-1 text-xs text-gray-400">...</span>}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`w-8 h-8 text-xs rounded ${
            p === currentPage
              ? 'bg-[#0f172a] text-white font-medium'
              : 'text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          {p}
        </button>
      ))}
      {end < totalPages && <span className="px-1 text-xs text-gray-400">...</span>}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-2.5 py-1.5 text-xs text-gray-500 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Suivant
      </button>
    </div>
  );
}
