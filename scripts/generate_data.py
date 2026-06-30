#!/usr/bin/env python3
"""Generate src/data/ferias.json from the source Excel workbook.

The source file (docs/Lista_Ferias_del_Agricultor.xlsx) is the official list of
farmer's markets ("ferias del agricultor") in Costa Rica. This script reads it,
normalizes the free-text "days" column into canonical day-of-week keys, and emits
a typed JSON module that the Next.js app bundles at build time.

Usage:
    python3 scripts/generate_data.py

Requires: openpyxl  (pip install openpyxl)
"""

from __future__ import annotations

import json
import re
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "docs" / "Lista_Ferias_del_Agricultor.xlsx"
OUTPUT = ROOT / "src" / "data" / "ferias.json"

# Canonical day keys, ordered Monday -> Sunday.
DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

# Spanish day token (accent-stripped, lowercased) -> canonical key.
DAY_TOKENS = {
    "lunes": "mon",
    "martes": "tue",
    "miercoles": "wed",
    "jueves": "thu",
    "viernes": "fri",
    "sabado": "sat",
    "domingo": "sun",
}


def strip_accents(text: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", text) if unicodedata.category(c) != "Mn"
    )


def slugify(text: str) -> str:
    base = strip_accents(text).lower()
    base = re.sub(r"[^a-z0-9]+", "-", base).strip("-")
    return base or "feria"


def parse_days(raw: str) -> list[str]:
    """Turn '"Viernes - sábado"' into ['fri', 'sat'] in canonical week order."""
    tokens = re.split(r"[-,/]| y ", raw)
    found: set[str] = set()
    for token in tokens:
        key = DAY_TOKENS.get(strip_accents(token).strip().lower())
        if key:
            found.add(key)
    return [d for d in DAY_ORDER if d in found]


def clean(value: object) -> str:
    return str(value).strip() if value is not None else ""


def main() -> None:
    wb = openpyxl.load_workbook(SOURCE, data_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))

    # Row 0 is a banner, row 1 is the header; data starts at row 2.
    regions: dict[str, dict[str, str]] = {}
    ferias: list[dict] = []
    used_ids: set[str] = set()

    for raw in rows[2:]:
        region_name = clean(raw[0])
        name = clean(raw[1])
        days_label = clean(raw[2])
        administrator = clean(raw[3])
        if not name:
            continue

        region_id = slugify(region_name)
        if region_id not in regions:
            regions[region_id] = {"id": region_id, "name": region_name}

        phones = [clean(p) for p in (raw[4], raw[5]) if clean(p)]

        feria_id = slugify(name)
        if feria_id in used_ids:
            feria_id = f"{feria_id}-{region_id}"
        suffix = 2
        base_id = feria_id
        while feria_id in used_ids:
            feria_id = f"{base_id}-{suffix}"
            suffix += 1
        used_ids.add(feria_id)

        ferias.append(
            {
                "id": feria_id,
                "name": name,
                "regionId": region_id,
                "days": parse_days(days_label),
                "daysLabel": days_label,
                "administrator": administrator,
                "phones": phones,
            }
        )

    ferias.sort(key=lambda f: strip_accents(f["name"]).lower())

    payload = {
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "source": "Lista de Ferias del Agricultor (June 2026)",
        "regions": sorted(regions.values(), key=lambda r: strip_accents(r["name"]).lower()),
        "ferias": ferias,
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(ferias)} ferias across {len(regions)} regions -> {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
