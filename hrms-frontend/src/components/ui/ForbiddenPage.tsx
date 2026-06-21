/**
 * 403 Forbidden page.
 * Shown when user tries to access a page they don't have permission for.
 */
export default function ForbiddenPage() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h1 className="text-lg font-semibold text-gray-800">Acces refuse</h1>
        <p className="text-sm text-gray-500 mt-1">Vous n'avez pas les permissions pour acceder a cette page.</p>
        <a href="/dashboard" className="inline-block mt-4 text-sm text-blue-600 hover:underline">
          Retour au tableau de bord
        </a>
      </div>
    </div>
  );
}
