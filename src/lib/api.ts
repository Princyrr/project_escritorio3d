import type { CnpjData, Coordinates, CompanyResult } from './types';

const MINHARECEITA_API = 'https://minhareceita.org';
const RECEITAWS_API = 'https://www.receitaws.com.br/v1/cnpj';
const NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';

function cleanCnpj(input: string): string {
  return input.replace(/[^\d]/g, '');
}

const SITUACAO_MAP: Record<number, string> = {
  1: 'NULA',
  2: 'ATIVA',
  3: 'SUSPENSA',
  4: 'INAPTA',
  8: 'BAIXADA',
};

// Primary API: minhareceita.org — free, no auth, CORS enabled, richest data
async function fetchCnpjMinhareceita(cnpj: string): Promise<CnpjData> {
  const res = await fetch(`${MINHARECEITA_API}/${cnpj}`, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`minhareceita: ${res.status}`);
  }

  const j = await res.json();

  const situacao =
    j.descricao_situacao_cadastral ??
    SITUACAO_MAP[j.situacao_cadastral] ??
    '';

  const socios = Array.isArray(j.qsa)
    ? j.qsa.map((s: Record<string, unknown>) => ({
        nome: String(s['nome_socio'] ?? s['nome'] ?? ''),
        qualificacao: String(s['qualificacao_socio'] ?? s['qual'] ?? ''),
      }))
    : [];

  const tipo =
    j.descricao_identificador_matriz_filial ??
    (j.identificador_matriz_filial === 1 ? 'MATRIZ' : 'FILIAL');

  return {
    cnpj: j.cnpj ?? cnpj,
    razao_social: j.razao_social ?? '',
    nome_fantasia: j.nome_fantasia ?? '',
    situacao_cadastral: situacao,
    data_situacao_cadastral: formatDateISO(j.data_situacao_cadastral),
    motivo_situacao_cadastral:
      j.descricao_motivo_situacao_cadastral ??
      j.motivo_situacao_cadastral ??
      '',
    natureza_juridica: j.natureza_juridica ?? '',
    porte: j.porte ?? '',
    capital_social: String(j.capital_social ?? ''),
    data_abertura: formatDateISO(j.data_inicio_atividade),
    tipo,
    cnae_principal_descricao: j.cnae_fiscal_descricao ?? '',
    cnae_principal_codigo: formatCnae(j.cnae_fiscal),
    endereco: {
      uf: j.uf ?? '',
      municipio: j.municipio ?? '',
      bairro: j.bairro ?? '',
      logradouro: `${j.descricao_tipo_de_logradouro ?? ''} ${j.logradouro ?? ''}`.trim(),
      numero: j.numero ?? '',
      cep: j.cep ?? '',
      complemento: j.complemento ?? '',
    },
    socios,
  };
}

// Fallback API: ReceitaWS
async function fetchCnpjReceitaWS(cnpj: string): Promise<CnpjData> {
  const res = await fetch(`${RECEITAWS_API}/${cnpj}`, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    if (res.status === 429)
      throw new Error('Muitas consultas. Aguarde alguns segundos e tente novamente.');
    if (res.status === 404) throw new Error('CNPJ não encontrado.');
    throw new Error(`ReceitaWS: ${res.status}`);
  }

  const j = await res.json();

  if (j.status && j.status !== 'OK') {
    throw new Error(j.message || j.error || 'CNPJ não encontrado.');
  }

  const atividade = Array.isArray(j.atividade_principal)
    ? j.atividade_principal[0]
    : j.atividade_principal;

  const socios = Array.isArray(j.qsa)
    ? j.qsa.map((s: Record<string, unknown>) => ({
        nome: String(s['nome'] ?? ''),
        qualificacao: String(s['qual'] ?? ''),
      }))
    : [];

  return {
    cnpj: j.cnpj ?? cnpj,
    razao_social: j.nome ?? '',
    nome_fantasia: j.fantasia ?? '',
    situacao_cadastral: j.situacao ?? '',
    data_situacao_cadastral: j.data_situacao ?? '',
    motivo_situacao_cadastral: j.motivo_situacao ?? '',
    natureza_juridica: j.natureza_juridica ?? '',
    porte: j.porte ?? '',
    capital_social: j.capital_social ?? '',
    data_abertura: j.abertura ?? '',
    tipo: j.tipo ?? '',
    cnae_principal_descricao: atividade?.text ?? '',
    cnae_principal_codigo: atividade?.code ?? '',
    endereco: {
      uf: j.uf ?? '',
      municipio: j.municipio ?? '',
      bairro: j.bairro ?? '',
      logradouro: j.logradouro ?? '',
      numero: j.numero ?? '',
      cep: j.cep ?? '',
      complemento: j.complemento ?? '',
    },
    socios,
  };
}

export async function fetchCnpj(rawCnpj: string): Promise<CnpjData> {
  const cnpj = cleanCnpj(rawCnpj);
  if (cnpj.length !== 14) {
    throw new Error('CNPJ inválido. Deve conter 14 dígitos.');
  }

  try {
    return await fetchCnpjMinhareceita(cnpj);
  } catch {
    // Fallback to ReceitaWS
    return await fetchCnpjReceitaWS(cnpj);
  }
}

export async function geocodeAddress(
  data: CnpjData
): Promise<Coordinates | null> {
  const { logradouro, numero, bairro, municipio, uf } = data.endereco;
  const parts = [logradouro, numero, bairro, municipio, uf, 'Brasil']
    .filter(Boolean)
    .join(', ');

  const url = `${NOMINATIM_API}?format=json&q=${encodeURIComponent(
    parts
  )}&limit=1&countrycodes=br`;

  const res = await fetch(url, {
    headers: { 'Accept-Language': 'pt-BR' },
  });

  if (!res.ok) return null;

  const json = await res.json();
  if (!Array.isArray(json) || json.length === 0) {
    const fallbackUrl = `${NOMINATIM_API}?format=json&q=${encodeURIComponent(
      `${municipio}, ${uf}, Brasil`
    )}&limit=1&countrycodes=br`;
    const fbRes = await fetch(fallbackUrl);
    if (!fbRes.ok) return null;
    const fbJson = await fbRes.json();
    if (!Array.isArray(fbJson) || fbJson.length === 0) return null;
    return { lat: parseFloat(fbJson[0].lat), lng: parseFloat(fbJson[0].lon) };
  }

  return { lat: parseFloat(json[0].lat), lng: parseFloat(json[0].lon) };
}

export async function lookupCnpj(
  cnpj: string
): Promise<CompanyResult> {
  const data = await fetchCnpj(cnpj);
  let coordinates: Coordinates | null = null;
  try {
    coordinates = await geocodeAddress(data);
  } catch {
    coordinates = null;
  }
  return { data, coordinates };
}

// Convert ISO date (YYYY-MM-DD) to DD/MM/YYYY
function formatDateISO(date: string | null | undefined): string {
  if (!date) return '';
  const str = String(date);
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return `${str.slice(8, 10)}/${str.slice(5, 7)}/${str.slice(0, 4)}`;
  }
  return str;
}

// Format CNAE code from integer (8550301) to standard format (85.50-3-01)
function formatCnae(code: number | string | null | undefined): string {
  if (!code) return '';
  const str = String(code).padStart(7, '0');
  if (str.length === 7) {
    return `${str.slice(0, 2)}.${str.slice(2, 4)}-${str.slice(4, 5)}-${str.slice(5, 7)}`;
  }
  return str;
}
