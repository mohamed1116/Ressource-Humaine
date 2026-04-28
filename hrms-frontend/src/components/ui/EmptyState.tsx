/**
 * Empty state illustration.
 * Shown when a list has no data. Clean and professional.
 */
interface Props {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionLink?: string;
}

export default function EmptyState({
  title = 'Aucun element',
  description = 'Il n\'y a rien a afficher pour le moment.',
  actionLabel,
  actionLink,
}: Props) {
  return (
    <div className="py-12 px-6 text-center">
      <svg className="w-12 h-12 mx-auto text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3" />
      </svg>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-xs text-gray-400 mt-1">{description}</p>
      {actionLabel && actionLink && (
        <a href={actionLink} className="inline-block mt-3 text-xs text-blue-600 hover:underline">{actionLabel}</a>
      )}
    </div>
  );
}
