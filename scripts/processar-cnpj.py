#!/usr/bin/env python3
"""Gera totais de estabelecimentos por UF e situação a partir dos dados da RFB.

Aceita arquivos .ZIP (com CSVs dentro) e arquivos CSV/TXT já extraídos.
Os arquivos da Receita são separados por ponto e vírgula e usam Latin-1.
"""

import argparse
import csv
import io
import json
import sys
import zipfile
from collections import defaultdict
from pathlib import Path


STATUS = {
    "02": "ativas",
    "03": "suspensas",
    "04": "inaptas",
    "08": "baixadas",
}
UFS = {
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
    "RS", "RO", "RR", "SC", "SP", "SE", "TO",
}


def count_rows(stream, counts):
    text = io.TextIOWrapper(stream, encoding="latin-1", newline="")
    reader = csv.reader(text, delimiter=";")
    for row in reader:
        # Layout oficial de ESTABELE: situação cadastral na coluna 6 e UF na 19.
        if len(row) <= 19:
            continue
        status = row[5].strip().zfill(2)
        uf = row[19].strip().upper()
        if status in STATUS and uf in UFS:
            counts[uf][STATUS[status]] += 1


def main():
    parser = argparse.ArgumentParser(
        description="Conta estabelecimentos por UF e situação cadastral."
    )
    parser.add_argument("pasta", type=Path, help="Pasta com os arquivos ESTABELE baixados")
    parser.add_argument(
        "--saida",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "src" / "data" / "cnpj-por-uf.json",
        help="Destino do JSON resumido (padrão: src/data/cnpj-por-uf.json)",
    )
    args = parser.parse_args()
    source = args.pasta.expanduser().resolve()
    if not source.is_dir():
        parser.error(f"A pasta não existe: {source}")

    files = [
        path for path in source.rglob("*")
        if path.is_file() and "ESTABELE" in path.name.upper()
        and path.suffix.lower() in {".zip", ".csv", ".txt"}
    ]
    if not files:
        parser.error("Não encontrei arquivos ZIP, CSV ou TXT com ESTABELE no nome.")

    counts = defaultdict(lambda: {key: 0 for key in STATUS.values()})
    processed = 0
    for path in files:
        try:
            if zipfile.is_zipfile(path):
                with zipfile.ZipFile(path) as archive:
                    members = [name for name in archive.namelist() if not name.endswith("/")]
                    for name in members:
                        with archive.open(name) as member:
                            count_rows(member, counts)
                processed += 1
            else:
                with path.open("rb") as stream:
                    count_rows(stream, counts)
                processed += 1
            print(f"Processado: {path.name}")
        except (OSError, zipfile.BadZipFile, UnicodeError) as error:
            print(f"Aviso: não consegui ler {path.name}: {error}", file=sys.stderr)

    if not processed:
        parser.error("Nenhum arquivo pôde ser processado.")

    result = {
        "fonte": "Receita Federal - Dados Abertos do CNPJ",
        "tipoContagem": "estabelecimentos",
        "observacao": "Contagem por UF e situação cadastral; inclui matrizes e filiais.",
        "ufs": {
            uf: counts[uf]
            for uf in sorted(UFS)
        },
    }
    args.saida.parent.mkdir(parents=True, exist_ok=True)
    args.saida.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Resumo criado: {args.saida.resolve()}")


if __name__ == "__main__":
    main()
