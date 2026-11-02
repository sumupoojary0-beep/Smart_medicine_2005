"""
Measure how well your OCR reads the handwritten medicine names in the
"Doctor's Handwritten Prescription BD" dataset (CC BY 4.0, Mendeley Data).

The test split (780 word images, 78 brands, 10 per brand) is never used for
training, so this is an honest BASELINE for your report.

Run from the ocr-service folder, venv active:
    python -m scripts.eval_handwriting_dataset "D:\\path\\Dataset" --engine paddle
    python -m scripts.eval_handwriting_dataset "D:\\path\\Dataset" --engine trocr
    python -m scripts.eval_handwriting_dataset "D:\\path\\Dataset" --engine paddle --limit 100   # quick try

"D:\\path\\Dataset" is the folder that contains Training/, Validation/, Testing/.

Reported per engine:
  raw exact match      the OCR text equals the brand name (ignoring case/spaces)
  empty read           the OCR returned nothing
  CER                  character error rate of the raw text (lower is better)
  top-1 / top-3        after matching the OCR text to the 78 known brands
                       (this is what a "closed list" pipeline would achieve)
  generic correct      the top-1 brand has the right active ingredient
  seconds / image      median time per image
Predictions are saved to reports/handwriting_<engine>.csv so you can look at
every mistake.
"""
import argparse
import csv
import re
import statistics
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from PIL import Image, ImageOps  # noqa: E402
from rapidfuzz import process, fuzz  # noqa: E402
from rapidfuzz.distance import Levenshtein  # noqa: E402


def norm(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", (text or "").lower())


def load_rows(root: Path, split: str) -> list[dict]:
    folder = root / split
    label_file = next(folder.glob("*_labels.csv"))
    images = next(p for p in folder.iterdir() if p.is_dir())
    rows = []
    with open(label_file, encoding="utf-8-sig", newline="") as f:
        for r in csv.DictReader(f):
            rows.append({"path": images / r["IMAGE"], "brand": r["MEDICINE_NAME"], "generic": r["GENERIC_NAME"]})
    return rows


def evaluate(rows: list[dict], read_fn, brands: list[str], brand_to_generic: dict[str, str]) -> tuple[dict, list[dict]]:
    keys = [norm(b) for b in brands]
    results, times = [], []
    for row in rows:
        start = time.perf_counter()
        text = read_fn(row["path"]) or ""
        times.append(time.perf_counter() - start)

        t = norm(text)
        top = process.extract(t, keys, scorer=fuzz.ratio, limit=3) if t else []
        top_brands = [brands[idx] for _, _, idx in top]
        truth = norm(row["brand"])
        results.append({
            "image": row["path"].name, "truth": row["brand"], "read": text,
            "top1": top_brands[0] if top_brands else "",
            "top3": " | ".join(top_brands),
            "raw_exact": bool(t) and t == truth,
            "empty": not t,
            "cer": Levenshtein.normalized_distance(t, truth),
            "top1_ok": bool(top_brands) and norm(top_brands[0]) == truth,
            "top3_ok": any(norm(b) == truth for b in top_brands),
            "generic_ok": bool(top_brands) and brand_to_generic[top_brands[0]] == row["generic"],
        })
    n = len(results)
    pct = lambda key: 100.0 * sum(r[key] for r in results) / n  # noqa: E731
    summary = {
        "images": n, "raw_exact": pct("raw_exact"), "empty": pct("empty"),
        "cer": 100.0 * statistics.mean(r["cer"] for r in results),
        "top1": pct("top1_ok"), "top3": pct("top3_ok"), "generic": pct("generic_ok"),
        "sec_per_image": statistics.median(times),
    }
    return summary, results


def make_paddle_reader(pad: int):
    from app import ocr_engine as eng
    ocr = eng.get_ocr_engine()

    def read(path: Path) -> str:
        with Image.open(path) as im:
            im = ImageOps.expand(im.convert("RGB"), border=pad, fill="white")
            tmp = path.with_name("_padded_tmp.png")
            try:
                im.save(tmp)
                lines = eng.extract_prediction_lines(predictions=ocr.predict(str(tmp)), scale=1.0, source_name="eval")
            finally:
                tmp.unlink(missing_ok=True)
        return " ".join(l.get("text", "") for l in lines).strip()
    return read


def make_trocr_reader():
    from app.handwriting_engine import recognize_handwritten_line

    def read(path: Path) -> str:
        with Image.open(path) as im:
            return recognize_handwritten_line(im.copy()).get("text", "")
    return read


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("dataset_root")
    ap.add_argument("--split", default="Testing", choices=["Testing", "Validation", "Training"])
    ap.add_argument("--engine", default="paddle", choices=["paddle", "trocr"])
    ap.add_argument("--limit", type=int, default=0, help="only the first N images (quick try)")
    ap.add_argument("--pad", type=int, default=24, help="white border added for PaddleOCR (tight crops confuse its detector)")
    args = ap.parse_args()

    root = Path(args.dataset_root)
    rows = load_rows(root, args.split)
    all_rows = load_rows(root, "Training") + rows
    brand_to_generic = {r["brand"]: r["generic"] for r in all_rows}
    brands = sorted(brand_to_generic)
    if args.limit:
        rows = rows[: args.limit]

    read_fn = make_paddle_reader(args.pad) if args.engine == "paddle" else make_trocr_reader()
    read_fn(rows[0]["path"])  # warm-up, not counted
    print(f"Evaluating {args.engine} on {len(rows)} {args.split} images, {len(brands)} brands ...")
    summary, results = evaluate(rows, read_fn, brands, brand_to_generic)

    out = Path("reports")
    out.mkdir(exist_ok=True)
    out_file = out / f"handwriting_{args.engine}.csv"
    with open(out_file, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(results[0]))
        w.writeheader()
        w.writerows(results)

    print("\n=== Results ===")
    print(f"images                : {summary['images']}")
    print(f"raw exact match      : {summary['raw_exact']:.1f}%   (OCR text equals the brand)")
    print(f"empty read           : {summary['empty']:.1f}%   (nothing detected)")
    print(f"character error rate : {summary['cer']:.1f}%   (lower is better)")
    print(f"top-1 (known brands) : {summary['top1']:.1f}%")
    print(f"top-3 (known brands) : {summary['top3']:.1f}%")
    print(f"generic correct      : {summary['generic']:.1f}%   (right active ingredient)")
    print(f"seconds per image    : {summary['sec_per_image']:.2f}")
    print(f"\nEvery prediction saved to {out_file}")


if __name__ == "__main__":
    main()
