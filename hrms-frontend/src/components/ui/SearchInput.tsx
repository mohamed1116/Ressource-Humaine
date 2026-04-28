/**
 * Reusable search input with debounce.
 * Used on Employee list, All Requests, etc.
 */
import { useState, useEffect } from 'react';

interface Props {
  placeholder?: string;
  onSearch: (query: string) => void;
  delay?: number;
}

export default function SearchInput({ placeholder = 'Rechercher...', onSearch, delay = 300 }: Props) {
  const [value, setValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => onSearch(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
      />
    </div>
  );
}
