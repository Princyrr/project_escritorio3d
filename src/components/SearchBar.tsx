import { useState, FormEvent } from 'react';
import { Search, Loader2, X } from 'lucide-react';

interface Props {
  onSearch: (cnpj: string) => void;
  onClear: () => void;
  loading: boolean;
}

export default function SearchBar({ onSearch, onClear, loading }: Props) {
  const [value, setValue] = useState('');

  const clearSearch = () => {
    setValue('');
    onClear();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = value.replace(/[^\d]/g, '');
    if (cleaned.length === 14) {
      onSearch(cleaned);
    }
  };

  const formatCnpj = (raw: string) => {
    const d = raw.replace(/\D/g, '').slice(0, 14);
    return d
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400/60" />
        <input
          type="text"
          value={formatCnpj(value)}
          onChange={(e) => {
            const nextValue = e.target.value;
            setValue(nextValue);
            if (!nextValue.replace(/\D/g, '')) onClear();
          }}
          placeholder="00.000.000/0000-00"
          className="w-full bg-slate-900/80 border border-cyan-500/30 rounded-xl pl-12 pr-12 py-3.5 text-white text-lg tracking-wider placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all backdrop-blur-md"
          inputMode="numeric"
        />
        {value && !loading && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400 animate-spin" />
        )}
      </div>
      <button
        type="submit"
        disabled={loading || value.replace(/\D/g, '').length !== 14}
        className="ml-3 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/20"
      >
        Consultar
      </button>
    </form>
  );
}
