export interface CnpjData {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  situacao_cadastral: string;
  data_situacao_cadastral: string;
  motivo_situacao_cadastral: string;
  natureza_juridica: string;
  porte: string;
  capital_social: string;
  data_abertura: string;
  tipo: string;
  cnae_principal_descricao: string;
  cnae_principal_codigo: string;
  endereco: {
    uf: string;
    municipio: string;
    bairro: string;
    logradouro: string;
    numero: string;
    cep: string;
    complemento: string;
  };
  socios: Array<{
    nome: string;
    qualificacao: string;
  }>;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface CompanyResult {
  data: CnpjData;
  coordinates: Coordinates | null;
}
