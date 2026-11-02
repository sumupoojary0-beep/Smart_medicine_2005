"""
Measure PaddleOCR speed on your own prescription photos.

Run from the ocr-service folder with the venv active:
    python -m scripts.benchmark_ocr path/to/folder_with_images [--runs 3]

It prints, per image and as a median, how long each stage takes:
  original pass  = PaddleOCR on the uploaded image
  enhance        = building the enlarged/sharpened copy
  enhanced pass  = PaddleOCR on that copy
and how many text lines each pass found.

Compare settings by running it several times with different env vars, e.g.
    python -m scripts.benchmark_ocr samples                              # current
    set OCR_ENHANCED_PASS=0 && python -m scripts.benchmark_ocr samples   # one pass only
    set OCR_DET_MODEL=PP-OCRv5_mobile_det && set OCR_REC_MODEL=PP-OCRv5_mobile_rec && python -m scripts.benchmark_ocr samples
(Windows PowerShell: $env:OCR_ENHANCED_PASS="0")

Speed alone is not the goal: also compare the text each setting reads on the
same images (the script prints the lines it finds with --show) and keep the
fastest setting that still reads the medicine names and strengths.
"""
import argparse
import statistics
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import ocr_engine as eng  # noqa: E402

EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def timed(fn, *args):
    start = time.perf_counter()
    result = fn(*args)
    return result, time.perf_counter() - start


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("folder")
    parser.add_argument("--runs", type=int, default=3)
    parser.add_argument("--show", action="store_true", help="print the text lines found")
    args = parser.parse_args()

    images = sorted(p for p in Path(args.folder).iterdir() if p.suffix.lower() in EXTS)
    if not images:
        raise SystemExit("No images found in that folder.")

    print(f"Settings: enhanced_pass={eng.ENHANCED_PASS} upscale={eng.UPSCALE} "
          f"det={eng.DET_MODEL or 'default'} rec={eng.REC_MODEL or 'default'}")
    _, load = timed(eng.get_ocr_engine)
    print(f"Model load: {load:.2f}s (paid once at service start)\n")
    ocr = eng.get_ocr_engine()
    ocr.predict(str(images[0]))  # warm-up run, not counted

    totals = {"original": [], "enhance": [], "enhanced": [], "total": []}
    for image in images:
        runs = {"original": [], "enhance": [], "enhanced": []}
        lines_o = lines_e = 0
        for _ in range(args.runs):
            preds, t_o = timed(ocr.predict, str(image))
            lines = eng.extract_prediction_lines(predictions=preds, scale=1.0, source_name="original")
            lines_o = len(lines)
            runs["original"].append(t_o)
            if eng.ENHANCED_PASS:
                (path, scale), t_h = timed(eng.create_enhanced_image, str(image))
                preds2, t_e = timed(ocr.predict, path)
                lines2 = eng.extract_prediction_lines(predictions=preds2, scale=scale, source_name="enhanced")
                lines_e = len(lines2)
                Path(path).unlink(missing_ok=True)
                runs["enhance"].append(t_h)
                runs["enhanced"].append(t_e)
        med = {k: (statistics.median(v) if v else 0.0) for k, v in runs.items()}
        total = sum(med.values())
        for k in med:
            totals[k].append(med[k])
        totals["total"].append(total)
        print(f"{image.name[:34]:34} original {med['original']:5.2f}s ({lines_o} lines) | "
              f"enhance {med['enhance']:4.2f}s | enhanced {med['enhanced']:5.2f}s ({lines_e} lines) | total {total:5.2f}s")
        if args.show:
            for ln in lines:
                print(f"     {ln.get('text','')}")

    print("\nMedian over images:")
    for k in ("original", "enhance", "enhanced", "total"):
        print(f"  {k:9} {statistics.median(totals[k]):6.2f}s")


if __name__ == "__main__":
    main()
