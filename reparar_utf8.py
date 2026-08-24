from pathlib import Path

ROOT = Path("src")
EXTENSIONS = {".js", ".jsx", ".ts", ".tsx"}

# Textos típicos de UTF-8 interpretado incorrectamente
BAD_MARKERS = (
    "Ã",
    "Â",
    "ðŸ",
    "â",
)

def score(text):
    return sum(text.count(marker) for marker in BAD_MARKERS)

changed = []

for path in ROOT.rglob("*"):
    if path.suffix.lower() not in EXTENSIONS:
        continue

    original = path.read_text(encoding="utf-8")

    # Primero intentamos Windows-1252 porque permite recuperar
    # correctamente los emojis convertidos a "ðŸ..."
    try:
        candidate = original.encode("cp1252").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        candidate = None

    if candidate is not None and score(candidate) < score(original):
        path.write_text(candidate, encoding="utf-8", newline="")
        changed.append(path)
        print(f"REPARADO: {path}")

print()
print(f"Archivos reparados: {len(changed)}")