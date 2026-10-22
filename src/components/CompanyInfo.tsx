import type { CnpjData, Coordinates } from '@/lib/types';
import { MapPin, Building2, Calendar, DollarSign, Users, FileText, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface Props {
  data: CnpjData;
  coords: Coordinates | null;
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  if (!value || value === 'null') return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/[0.07] last:border-0">
      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-300/10 bg-cyan-300/[0.06] text-cyan-300/90 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.14em]">{label}</p>
        <p className="text-sm text-slate-100 leading-relaxed break-words">{value}</p>
      </div>
    </div>
  );
}

export default function CompanyInfo({ data, coords }: Props) {
  const isReallyActive = data.situacao_cadastral?.toUpperCase() === 'ATIVA';

  const enderecoCompleto = [
    `${data.endereco.logradouro}${data.endereco.numero ? ', ' + data.endereco.numero : ''}`,
    data.endereco.bairro,
    `${data.endereco.municipio} - ${data.endereco.uf}`,
    data.endereco.cep,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div
        className={`flex items-center gap-3 rounded-xl px-4 py-3.5 border shadow-inner ${
          isReallyActive
            ? 'bg-gradient-to-r from-emerald-500/[0.12] to-emerald-500/[0.04] border-emerald-400/20 text-emerald-300'
            : 'bg-gradient-to-r from-red-500/[0.12] to-red-500/[0.04] border-red-400/20 text-red-300'
        }`}
      >
        {isReallyActive ? (
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300/15 bg-emerald-300/10"><CheckCircle2 className="w-5 h-5 shrink-0" /></span>
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-300/15 bg-red-300/10"><XCircle className="w-5 h-5 shrink-0" /></span>
        )}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70">Situação cadastral</p>
          <p className="text-base font-bold tracking-wide">{data.situacao_cadastral || 'INDEFINIDA'}</p>
        </div>
      </div>

      {/* Company name */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white/[0.07] to-white/[0.025] rounded-xl p-4 border border-white/[0.09] shadow-lg shadow-black/10">
        <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-300/70">
          <Building2 className="h-3.5 w-3.5" /> Identificação da empresa
        </div>
        <h3 className="text-lg font-bold text-white leading-snug tracking-tight">
          {data.razao_social || 'Razão social não disponível'}
        </h3>
        {data.nome_fantasia && data.nome_fantasia !== 'null' && data.nome_fantasia.trim() !== '' && (
          <p className="text-sm text-slate-400 mt-1">{data.nome_fantasia}</p>
        )}
        <div className="flex items-center gap-3 mt-2">
          <p className="text-xs text-cyan-200/90 font-mono tracking-wide">CNPJ: {data.cnpj}</p>
          {data.tipo && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
              {data.tipo}
            </span>
          )}
        </div>
      </div>

      {/* Coordinates */}
      {coords ? (
        <div className="flex items-center gap-2 text-sm text-cyan-300 bg-cyan-500/5 rounded-lg px-3 py-2 border border-cyan-500/20">
          <MapPin className="w-4 h-4 shrink-0" />
          <span className="font-mono text-xs">
            {coords.lat.toFixed(4)}°, {coords.lng.toFixed(4)}°
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-amber-300 bg-amber-500/5 rounded-lg px-3 py-2 border border-amber-500/20">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span className="text-xs">Localizando endereço no mapa...</span>
        </div>
      )}

      {/* Details */}
      <div className="bg-slate-900/35 rounded-xl px-4 py-1 border border-white/[0.08]">
        <div className="flex items-center gap-2 border-b border-white/[0.08] py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
          <FileText className="h-3.5 w-3.5 text-cyan-300" /> Dados cadastrais
        </div>
        <InfoRow icon={<Calendar className="w-4 h-4" />} label="Data de Abertura" value={data.data_abertura} />
        <InfoRow icon={<FileText className="w-4 h-4" />} label="Natureza Jurídica" value={data.natureza_juridica} />
        <InfoRow icon={<Building2 className="w-4 h-4" />} label="Porte" value={data.porte} />
        <InfoRow icon={<DollarSign className="w-4 h-4" />} label="Capital Social" value={formatCurrency(data.capital_social)} />
        <InfoRow icon={<FileText className="w-4 h-4" />} label="CNAE Principal" value={`${data.cnae_principal_codigo ? data.cnae_principal_codigo + ' — ' : ''}${data.cnae_principal_descricao}`} />
        <InfoRow icon={<MapPin className="w-4 h-4" />} label="Endereço" value={enderecoCompleto} />
        <InfoRow icon={<Calendar className="w-4 h-4" />} label="Data Situação" value={data.data_situacao_cadastral} />
        {data.motivo_situacao_cadastral && data.motivo_situacao_cadastral !== 'null' && data.motivo_situacao_cadastral.trim() !== '' && (
          <InfoRow icon={<FileText className="w-4 h-4" />} label="Motivo Situação" value={data.motivo_situacao_cadastral} />
        )}
      </div>

      {/* Sócios */}
      {data.socios.length > 0 && (
        <div className="bg-slate-900/35 rounded-xl p-4 border border-white/[0.08]">
          <div className="flex items-center gap-2 mb-3 text-cyan-300">
            <Users className="w-4 h-4" />
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.16em]">Sócios</h4>
            <span className="ml-auto rounded-full border border-cyan-300/15 bg-cyan-300/[0.07] px-2 py-0.5 text-[10px] text-cyan-100">{data.socios.length}</span>
          </div>
          <div className="space-y-2">
            {data.socios.slice(0, 8).map((s, i) => (
              <div key={i} className="text-sm border-b border-white/[0.07] py-2 last:border-0">
                <p className="text-slate-100 font-medium">{s.nome}</p>
                {s.qualificacao && s.qualificacao !== 'null' && s.qualificacao.trim() !== '' && (
                  <p className="text-xs text-slate-400">{s.qualificacao}</p>
                )}
              </div>
            ))}
            {data.socios.length > 8 && (
              <p className="text-xs text-slate-500">+{data.socios.length - 8} sócios...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatCurrency(value: string): string {
  if (!value || value === 'null') return '';
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
}
