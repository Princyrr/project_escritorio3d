import { useState, useCallback, useEffect, useRef } from 'react';
import { Globe2, AlertCircle, Info, Cloud, MapPinned, Building2 } from 'lucide-react';
import Globe3D from '@/components/Globe3D';
import SearchBar from '@/components/SearchBar';
import CompanyInfo from '@/components/CompanyInfo';
import { lookupCnpj } from '@/lib/api';
import type { CompanyResult } from '@/lib/types';
import { BRAZIL_STATES, normalizeBrazilState } from '@/lib/brazilStates';

const COMPANY_HISTORY_STORAGE_KEY = 'cnpj-atlas:consulted-companies:v1';
const COMPANIES_VISIBLE_STORAGE_KEY = 'cnpj-atlas:companies-visible:v1';
const MAX_SAVED_COMPANIES = 200;

function loadConsultedCompanies(): CompanyResult[] {
  try {
    const saved = localStorage.getItem(COMPANY_HISTORY_STORAGE_KEY);
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is CompanyResult => {
      if (!item || typeof item !== 'object') return false;
      const company = item as Partial<CompanyResult>;
      const data = company.data;
      if (!data || typeof data.cnpj !== 'string' || typeof data.situacao_cadastral !== 'string') return false;
      if (!data.endereco || typeof data.endereco.uf !== 'string') return false;
      const coords = company.coordinates;
      return coords === null || Boolean(
        coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng)
      );
    }).slice(0, MAX_SAVED_COMPANIES);
  } catch {
    return [];
  }
}

function loadCompaniesEnabled(): boolean {
  try {
    return localStorage.getItem(COMPANIES_VISIBLE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function StatusCount({
  companies,
  color,
  label,
  status,
}: {
  companies: CompanyResult[];
  color: string;
  label: string;
  status: string;
}) {
  const count = companies.filter(
    (company) => company.data.situacao_cadastral.toUpperCase().includes(status)
  ).length;

  return (
    <span className="flex items-center gap-1.5 text-slate-300">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}: {count}
    </span>
  );
}

export default function App() {
  const [result, setResult] = useState<CompanyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cloudsEnabled, setCloudsEnabled] = useState(false);
  const [companiesEnabled, setCompaniesEnabled] = useState(loadCompaniesEnabled);
  const [consultedCompanies, setConsultedCompanies] = useState<CompanyResult[]>(loadConsultedCompanies);
  const activeRequest = useRef(0);
  const stateCode = normalizeBrazilState(result?.data?.endereco?.uf);
  const selectedState = BRAZIL_STATES.find((state) => state.sigla === stateCode);
  const isActive = result?.data?.situacao_cadastral?.toUpperCase() === 'ATIVA';

  useEffect(() => {
    try {
      localStorage.setItem(
        COMPANY_HISTORY_STORAGE_KEY,
        JSON.stringify(consultedCompanies.slice(0, MAX_SAVED_COMPANIES))
      );
    } catch {
      // Keep the current session usable if browser storage is unavailable or full.
    }
  }, [consultedCompanies]);

  useEffect(() => {
    try {
      localStorage.setItem(COMPANIES_VISIBLE_STORAGE_KEY, String(companiesEnabled));
    } catch {
      // Keep the toggle usable even when browser storage is unavailable.
    }
  }, [companiesEnabled]);

  const handleSearch = useCallback(async (cnpj: string) => {
    const requestId = ++activeRequest.current;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await lookupCnpj(cnpj);
      if (activeRequest.current === requestId) {
        setResult(res);
        setConsultedCompanies((current) => [
          res,
          ...current.filter((company) => company.data.cnpj !== res.data.cnpj),
        ].slice(0, MAX_SAVED_COMPANIES));
      }
    } catch (err) {
      if (activeRequest.current === requestId) {
        setError(err instanceof Error ? err.message : 'Erro ao consultar CNPJ.');
      }
    } finally {
      if (activeRequest.current === requestId) setLoading(false);
    }
  }, []);

  const handleClear = useCallback(() => {
    activeRequest.current += 1;
    setResult(null);
    setError(null);
    setLoading(false);
  }, []);

  const handleCompanyMarkerClick = useCallback((company: CompanyResult) => {
    activeRequest.current += 1;
    setLoading(false);
    setError(null);
    setResult(company);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-slate-950 via-[#0a0f1e] to-slate-950 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(30,144,255,0.08),transparent_60%)] pointer-events-none" />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="px-6 py-4 border-b border-white/5 backdrop-blur-sm bg-slate-950/50">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
              <Globe2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                CNPJ Atlas
              </h1>
              <p className="text-xs text-slate-500">Consulte empresas e veja sua localização no globo 3D</p>
            </div>
            <a
              href="#/edificio"
              className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-lg border border-cyan-300/30 bg-slate-900/85 px-3 py-2 text-sm font-medium text-cyan-100 transition-colors hover:bg-cyan-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
            >
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Edifício de partículas</span>
              <span className="sm:hidden">Edifício</span>
            </a>
            <a href="#/relevo" className="inline-flex shrink-0 items-center rounded-lg border border-violet-300/30 bg-violet-500/10 px-3 py-2 text-sm font-medium text-violet-100 hover:bg-violet-500/20">Relevo 3D</a>
            <a href="#/rosto" className="inline-flex shrink-0 items-center rounded-lg border border-cyan-300/30 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-500/20">Rosto holográfico</a>
            <a href="#/aria" className="inline-flex shrink-0 items-center rounded-lg border border-violet-300/30 bg-violet-500/10 px-3 py-2 text-sm font-medium text-violet-100 hover:bg-violet-500/20">Aria 3D</a>
            <a href="#/robo" className="inline-flex shrink-0 items-center rounded-lg border border-cyan-300/30 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-500/20">Robô interativo</a>
            <a href="#/escritorio" className="inline-flex shrink-0 items-center rounded-lg border border-orange-300/30 bg-orange-500/10 px-3 py-2 text-sm font-medium text-orange-100 hover:bg-orange-500/20">Escritório 3D</a>
          </div>
        </header>

        {/* Search */}
        <div className="px-6 py-4 border-b border-white/5 backdrop-blur-sm bg-slate-950/30">
          <div className="max-w-3xl mx-auto">
            <SearchBar onSearch={handleSearch} onClear={handleClear} loading={loading} />
            {error && (
              <div className="mt-3 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          {/* Globe */}
          <div className="relative flex-1 min-h-[400px] lg:min-h-0">
            <Globe3D
              coords={result?.coordinates ?? null}
              highlightState={result?.data?.endereco?.uf || null}
              isActive={isActive}
              cloudsEnabled={cloudsEnabled}
              companiesEnabled={companiesEnabled}
              consultedCompanies={consultedCompanies}
              onCompanySelect={handleCompanyMarkerClick}
            />
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setCloudsEnabled((enabled) => !enabled)}
                aria-pressed={cloudsEnabled}
                className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium shadow-lg backdrop-blur-md transition-colors ${
                  cloudsEnabled
                    ? 'border-cyan-300/50 bg-cyan-500/20 text-cyan-100 shadow-cyan-500/10'
                    : 'border-white/10 bg-slate-900/80 text-slate-300 hover:border-cyan-300/30 hover:text-white'
                }`}
              >
                <Cloud className="h-4 w-4" />
                Nuvem
                <span className={`h-2 w-2 rounded-full ${cloudsEnabled ? 'bg-cyan-300' : 'bg-slate-600'}`} />
              </button>
              <button
                type="button"
                onClick={() => setCompaniesEnabled((enabled) => !enabled)}
                aria-pressed={companiesEnabled}
                className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium shadow-lg backdrop-blur-md transition-colors ${
                  companiesEnabled
                    ? 'border-emerald-300/50 bg-emerald-500/20 text-emerald-100 shadow-emerald-500/10'
                    : 'border-white/10 bg-slate-900/80 text-slate-300 hover:border-emerald-300/30 hover:text-white'
                }`}
              >
                <MapPinned className="h-4 w-4" />
                Empresas ({consultedCompanies.length})
                <span className={`h-2 w-2 rounded-full ${companiesEnabled ? 'bg-emerald-300' : 'bg-slate-600'}`} />
              </button>
            </div>
            {/* Hint */}
            {!result && !loading && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs text-slate-500 bg-slate-900/60 backdrop-blur-sm rounded-full px-4 py-2 border border-white/5">
                <Info className="w-3.5 h-3.5" />
                Arraste para girar o globo · Consulte um CNPJ para localizar
              </div>
            )}
            {result && (
              <div className={`absolute top-28 left-4 bg-slate-900/80 backdrop-blur-md rounded-lg px-3 py-2 border text-xs shadow-lg ${
                isActive ? 'border-emerald-400/40 shadow-emerald-500/10' : 'border-red-400/40 shadow-red-500/10'
              }`}>
                <p className="text-slate-300">Estado do CNPJ</p>
                <p className={`font-bold text-base ${isActive ? 'text-emerald-300' : 'text-red-300'}`}>
                  {selectedState ? `${selectedState.sigla} — ${selectedState.nome}` : result.data.endereco.uf}
                </p>
                {result.coordinates && (
                  <p className="text-slate-400">
                    {result.data.endereco.municipio} · {isActive ? 'Ativa' : 'Baixada'}
                  </p>
                )}
              </div>
            )}
            {companiesEnabled && (
              <div className="absolute bottom-16 left-4 z-20 rounded-lg border border-white/10 bg-slate-950/85 px-3 py-2.5 text-xs text-slate-200 shadow-lg backdrop-blur-md">
                <p className="mb-2 font-semibold text-white">Empresas consultadas no mapa</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  <StatusCount color="bg-emerald-400" label="Ativas" companies={consultedCompanies} status="ATIVA" />
                  <StatusCount color="bg-red-400" label="Baixadas" companies={consultedCompanies} status="BAIXADA" />
                  <StatusCount color="bg-amber-300" label="Suspensas" companies={consultedCompanies} status="SUSPENSA" />
                  <StatusCount color="bg-violet-400" label="Inaptas" companies={consultedCompanies} status="INAPTA" />
                </div>
                <p className="mt-2 border-t border-white/10 pt-2 text-slate-400">
                  {consultedCompanies.filter((company) => company.coordinates).length} com localização
                </p>
              </div>
            )}
          </div>

          {/* Info panel */}
          {result && (
            <div className="w-full lg:w-[420px] lg:max-h-[calc(100vh-130px)] overflow-y-auto p-5 lg:p-6 border-t lg:border-t-0 lg:border-l border-cyan-300/10 bg-gradient-to-b from-slate-950/95 via-[#0a1221]/95 to-slate-950/95 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <CompanyInfo data={result.data} coords={result.coordinates} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
