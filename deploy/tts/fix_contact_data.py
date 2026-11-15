#!/usr/bin/env python3
"""Unifica los datos de contacto publicos con la web oficial de Granja Maripepa.

Datos canonicos (granjamaripepa.com):
  968 46 75 14 / 639 77 86 55 / pedidos@granjamaripepa.com

Uso: python fix_contact_data.py <raiz-del-repo>
"""

import glob
import io
import os
import sys

GENERAL = [
    ("+34 965 123 456", "+34 968 46 75 14"),
    ("968 123 456", "968 46 75 14"),
    ("+34968123456", "+34968467514"),
    ("639 77 86 56", "639 77 86 55"),
    ("+34639778656", "+34639778655"),
    ("soporte@granja-mari-pepa.com", "pedidos@granjamaripepa.com"),
]

MESSAGES_ONLY = [
    ("pedidos@mari-pepa.com", "pedidos@granjamaripepa.com"),
]


def apply(path, pairs):
    with io.open(path, "r", encoding="utf-8") as handle:
        source = handle.read()
    updated = source
    changed = 0
    for old, new in pairs:
        count = updated.count(old)
        if count:
            updated = updated.replace(old, new)
            changed += count
    if changed:
        with io.open(path, "w", encoding="utf-8", newline="") as handle:
            handle.write(updated)
    return changed


def main(root):
    total = 0
    for path in sorted(glob.glob(os.path.join(root, "frontend", "messages", "*.json"))):
        count = apply(path, GENERAL + MESSAGES_ONLY)
        total += count
        print(os.path.basename(path), count)
    for relative in [
        "frontend/components/ui/global-chatbot.tsx",
        "frontend/components/customer/dashboard.tsx",
        "frontend/components/home/delegations-section.tsx",
    ]:
        path = os.path.join(root, relative)
        if not os.path.exists(path):
            print(relative, "missing")
            continue
        count = apply(path, GENERAL)
        total += count
        print(relative, count)
    print("TOTAL", total)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else ".")
