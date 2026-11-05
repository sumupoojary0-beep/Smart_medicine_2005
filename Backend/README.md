# Smart Medicine Availability & Intelligent Janaushadhi Recommendation System

A web platform that helps patients find affordable PM Jan Aushadhi (PMBI) generic alternatives to branded medicines, check which nearby Kendra stocks them, and read prescriptions with OCR. Pharmacies manage stock and billing; administrators run the platform.

> Final-year B.E. project (CSE – IoT & Cyber Security with Blockchain Technology), MITE.

---

## Features

### Patients
- **Medicine search** by brand or generic name, typed or spoken. Spelling mistakes and brand names are matched to the active ingredient, with live suggestions.
- **Jan Aushadhi alternative** for each medicine: the PMBI generic with the same composition, the official composition text, and a price comparison with the saving shown as two tiles.
- **Prescription search (OCR):** upload a photo of a prescription or medicine box. PaddleOCR reads it, the text is matched to the catalogue, and candidates are shown with their Jan Aushadhi price. Every match asks the user to confirm; uncertain lines go to manual review.
- **Nearby pharmacies:** uses the browser location to list the nearest Kendras by distance on an interactive map, with a "View on map" action and Google Maps directions.
- **Account features:** registration and login with email OTP, saved medicines, search history, notifications, and best-pharmacy ranking preferences (nearest, cheapest, best stocked).

### Pharmacies and Kendras
- Inventory and stock management, and billing. Stock is deducted through billing (FIFO by batch expiry).
- Pharmacy registration, reviewed by an admin.

### Administrators
- Manage users, pharmacies and the medicine catalogue.
- Roles page showing who can do what.
- Settings: registration open or closed, and a maintenance mode that blocks everything except login and admins.
- Broadcast notifications to a chosen audience, with a history.
- Generic mapping: add or edit brand-to-generic mappings without changing code, with a "try it" test box.
- Audit log of administrative actions.

### Technical
- JWT access tokens plus rotating refresh tokens, role-based access control (USER / PHARMACY / ADMIN), rate limiting.
- A separate OCR service with adjustable speed settings and a benchmark script.
- Measured OCR evaluation on a public handwritten-medicine dataset, with an evaluation script you can re-run.

---

## Architecture

```
┌────────────┐   REST    ┌──────────────┐   Motor    ┌─────────┐
│  Frontend  │──────────▶│   Backend    │───────────▶│ MongoDB │
│ React/Vite │           │   FastAPI    │            └─────────┘
│  :5173     │           │   :8002      │
└─────┬──────┘           └───┬──────▲───┘
      │ prescription         │      │ catalogue lookup
      │ upload               ▼      │
      │                  ┌──────────┴───┐
      └─────────────────▶│ OCR service  │
                         │ FastAPI :8001│
                         └──────────────┘
```

| Part | Folder | Stack | Default port |
|---|---|---|---|
| Frontend | `Frontend/` | React 19, Vite 8, Tailwind CSS 4, React Query, React Router, React Leaflet | 5173 |
| Backend API | `Backend/` | FastAPI, MongoDB (Motor), Pydantic, JWT (python-jose), bcrypt | 8002 |
| OCR service | `ocr-service/` | FastAPI, PaddleOCR (printed text), transformer-based handwriting fallback, RapidFuzz matching | 8001 |

**How the key algorithms work**
- **Pharmacy ranking:** a weighted sum model (WSM) scores each Kendra on distance, price, stock quantity and expiry freshness (default weights 0.40 / 0.25 / 0.25 / 0.10). Users can change the weights in their profile; they must add up to 1.
- **Billing:** stock is deducted from the batch that expires first (FIFO). Invoice totals use `Decimal` and include GST. Stock edits use a version check so two simultaneous edits cannot overwrite each other.
- **Sessions:** refresh tokens are stored only as SHA-256 hashes and rotate on every use. Presenting an already-used token revokes all of that user's tokens.

---

## Getting started

### Prerequisites
- Node.js 20.19+ (or 22+)
- Python 3.10+
- MongoDB (local install or an Atlas connection string)
- An SMTP account for OTP emails (for Gmail, use an app password)

### 1. Backend (port 8002)

```bash
cd Backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env               # then fill in the values
uvicorn app.main:app --host 127.0.0.1 --port 8002 --reload
```

Generate a secret key for `.env` with:

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

API docs are served at <http://127.0.0.1:8002/docs>.

### 2. Load the data (once)

Run these from the `Backend/` folder with the virtual environment active.

```bash
python seed_data.py                       # medicines + Mysuru Kendras  (clears existing medicines and kendras)
python scripts/import_composition.py --apply     # official composition text (omit --apply for a dry run)
python scripts/apply_nppa_prices.py --apply      # NPPA ceiling prices where no brand price exists (dry run without --apply)
python scripts/seed_demo_inventory.py     # simulated stock so the ranking has something to rank
```

### 3. OCR service (port 8001)

```bash
cd ocr-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8001
```

The first start downloads the PaddleOCR and handwriting models and is slow; later starts are faster.

### 4. Frontend (port 5173)

```bash
cd Frontend
npm install
cp .env.example .env
npm run dev
```

Open <http://localhost:5173>.

### 5. Create an admin account

Admins cannot register through the website.

1. Register a normal account at `/register` and verify the email OTP.
2. From `Backend/` with the virtual environment active: `python scripts/make_admin.py you@example.com`
3. Sign in at `/admin/login`.

Other options: `--remove` turns the account back into a normal user, and `--list` shows current admins.

---

## Configuration

**Backend (`Backend/.env`)** — see `Backend/.env.example`.

**OCR service (optional environment variables)**

| Variable | Default | Purpose |
|---|---|---|
| `BACKEND_API_URL` | `http://127.0.0.1:8002/api/v1` | Where the OCR service looks up the medicine catalogue |
| `OCR_WARMUP` | `1` | Set to `0` to skip loading models at startup |
| `OCR_ENHANCED_PASS` | `1` | Set to `0` for a faster, single-pass read |
| `OCR_UPSCALE` | `2.0` | Image upscale factor before reading; lower is faster |
| `OCR_DET_MODEL`, `OCR_REC_MODEL` | PaddleOCR defaults | Override the detection / recognition models |

**Frontend (`Frontend/.env`)** — API base URLs and the optional `VITE_ENABLE_DEMO=true` flag, which shows one-click demo logins. Leave it unset for anything other than a demo.

---

## OCR evaluation

The handwriting recogniser is evaluated on the public *Doctor's Handwritten Prescription BD* dataset (Mendeley Data, CC BY 4.0).

```bash
cd ocr-service
python -m scripts.eval_handwriting_dataset "/path/to/Dataset" --engine paddle
python -m scripts.eval_handwriting_dataset "/path/to/Dataset" --engine trocr
python -m scripts.eval_handwriting_dataset "/path/to/Dataset" --engine paddle --limit 100   # quick try
```

`/path/to/Dataset` is the folder containing `Training/`, `Validation/` and `Testing/`. Results are written to `ocr-service/reports/`.

Latest saved run (`handwriting_paddle.csv`): 780 word images covering 78 medicine names.

| Metric | Result |
|---|---|
| Top-1 match | 91.9% |
| Top-3 match | 96.3% |
| Exact raw read | 45.1% |
| Mean character error rate | 0.165 |

These are word-level results on cropped words, not whole-prescription accuracy. That is why the app asks the user to confirm every match.

Speed can be measured with `python -m scripts.benchmark_ocr path/to/images --runs 3`.

---

## Data sources and limits

- **Medicines and prices:** drug code, generic name, pack size, category and Jan Aushadhi MRP come from the official PMBI product list export. Items with a zero MRP were excluded.
- **Brand comparison prices:** PMBI does not publish a matching branded price. In the seed data only a small set of items carry a sourced or estimated brand price. `apply_nppa_prices.py` adds NPPA ceiling prices (the maximum a brand may charge, so the saving shown is an upper bound) where the ingredient, form and strength match exactly. Medicines with no brand data show no saving.
- **Composition text:** only rows whose composition was verified are imported, so the app never shows a composition nobody checked.
- **Stock:** `seed_demo_inventory.py` creates simulated inventory for demonstration. It is not live Jan Aushadhi stock.

This application is an informational aid and is not medical advice. Always follow the prescribing doctor and confirm a substitute with a pharmacist.

---

## Project structure

```
Backend/          FastAPI app (routers → services → models), seed and admin scripts
Frontend/         React app (pages for user, pharmacy and admin portals) + docs/
ocr-service/      OCR FastAPI service, handwriting engine, evaluation scripts
```

## License

MIT — see [LICENSE](LICENSE).