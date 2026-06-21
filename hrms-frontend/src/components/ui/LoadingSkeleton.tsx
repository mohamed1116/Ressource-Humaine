/**
 * Loading skeleton shimmer for tables.
 * Shows animated placeholder rows while data loads.
 */
export default function LoadingSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-5 py-4 border-b border-gray-50">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-4 bg-gray-100 rounded flex-1" style={{ maxWidth: j === 0 ? '80px' : undefined }} />
          ))}
        </div>
      ))}
    </div>
  );
}
