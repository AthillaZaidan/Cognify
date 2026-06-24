# Cognify

> Platform mobile privacy-first untuk deteksi dini relapse ADHD melalui passive smartphone behavioral monitoring.

Cognify memantau 5 sinyal behavioral pasif dari smartphone — tanpa membaca konten apapun, hanya metadata. Ketika pola mulai menyimpang dari baseline personal, sistem mengirimkan alert ke pasien dan psikolog.

---

## 👤 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| **Patient** | `patient_000@cognify.demo` | `cognify-demo` |
| **Patient** | `patient_001@cognify.demo` | `cognify-demo` |
| **Patient** | `patient_002@cognify.demo` | `cognify-demo` |
| **Patient** | `patient_003@cognify.demo` | `cognify-demo` |
| **Patient** | `patient_004@cognify.demo` | `cognify-demo` |
| **Psychologist** | `psych_000@cognify.demo` | `cognify-demo` |

> ⚠️ **Demo mode:** Aplikasi sudah dilengkapi mock data (5 pasien + 1 psikolog). Tidak perlu backend untuk menjalankan demo.

---

## 🧠 Fitur Utama

### Untuk Pasien
- **Dashboard Harian** — status risiko hari ini (Stable / Mild Drift / Attention Needed) + metrik behavioral
- **Anomaly Card** — muncul otomatis saat terdeteksi deteriorasi, menjelaskan sinyal apa yang berubah
- **Digital Habits** — grafik screen time 7 hari, app switching, fragmentasi, pola aktivitas
- **Sleep Analysis** — durasi tidur 7 hari, rata-rata bedtime/wake time, konsistensi tidur
- **Recovery Actions** — micro-intervention berbasis CBT (Focus Reset, Sleep Wind-Down, dll.)
- **Behavioral Tracker** — passive monitoring via AppState (app switching, session duration, sleep proxy)

### Untuk Psikolog
- **Patient Overview** — semua pasien diurutkan berdasarkan risiko (merah → hijau)
- **Alert Feed** — alert otomatis saat pasien attention_needed, bisa di-acknowledge dengan catatan

---

## 📊 5 Sinyal Behavioral

| Sinyal | Yang Diukur |
|--------|-------------|
| Sleep duration | Durasi tidur dari inactivity window |
| App-switching frequency | Jumlah switch per jam → proxy distractibility |
| Screen time | Total waktu layar aktif per hari |
| Screen time variance | Seberapa irregular pola screen time |
| Session fragmentation | Rata-rata durasi sesi — makin pendek makin fragmentasi |

---

## 🏗️ Tech Stack

### Frontend (Mobile)
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **React Native** | 0.81.5 | Framework mobile cross-platform |
| **Expo** | ~54.0.33 | Build, deploy, dan development toolchain |
| **Expo Router** | ~6.0.23 | File-based routing |
| **TypeScript** | ~5.9.2 | Type safety |
| **React Native Chart Kit** | ^6.12.0 | Data visualization (LineChart, BarChart) |
| **React Native SVG** | 15.12.1 | 3D ilustrasi kustom |
| **Expo Linear Gradient** | ~15.0.8 | Background gradien premium |
| **Axios** | ^1.15.0 | HTTP client |
| **Plus Jakarta Sans** | — | Tipografi (Google Fonts) |

### Backend (Python)
| Teknologi | Fungsi |
|-----------|--------|
| **FastAPI** | REST API (12 endpoints) |
| **PostgreSQL** | Database relasional (6 tabel) |
| **scikit-learn** | Machine Learning (IsolationForest, StandardScaler) |
| **SHAP** | Model explainability (TreeExplainer) |
| **NumPy / Pandas** | Komputasi numerik |

### Machine Learning
| Komponen | Detail |
|----------|--------|
| **Model** | IsolationForest (n_estimators=200, contamination=0.05) |
| **Ensemble** | Z-Score + WCS + IsolationForest + SHAP |
| **Training data** | OBF-Psychiatric (Nature Scientific Data, Jan 2025) — 45 ADHD patients |
| **Validation** | Mann-Whitney U: p=2.68e-233, AUC-ROC: 0.8455 |
| **Patient detection** | 99% dengan 0 false positive |

---

## 📁 Struktur Proyek

```
repo/
├── frontend/                     # React Native (Expo) mobile app
│   ├── app/                      # Screens & navigation
│   │   ├── _layout.tsx           # Root layout + font loading
│   │   ├── index.tsx             # Redirect ke tabs
│   │   └── (tabs)/
│   │       ├── _layout.tsx       # Bottom tab navigator
│   │       ├── index.tsx         # Dashboard (Patient/Psikolog)
│   │       ├── digital-habits.tsx
│   │       ├── sleep.tsx
│   │       ├── interventions.tsx
│   │       └── psychologist.tsx
│   ├── components/               # Shared UI components
│   │   ├── LoginScreen.tsx
│   │   ├── RiskBadge.tsx         # Badge animasi risiko
│   │   ├── MetricCard.tsx        # Kartu metrik glass
│   │   ├── AnomalyCard.tsx       # Kartu warning anomali
│   │   ├── InterventionCard.tsx  # Kartu CBT action
│   │   ├── PatientRow.tsx        # Baris pasien
│   │   ├── TrendChart.tsx        # LineChart wrapper
│   │   ├── BarChart.tsx          # BarChart wrapper
│   │   └── Illustrations.tsx     # 6 ilustrasi 3D SVG
│   ├── constants/
│   │   ├── colors.ts             # Palet "Cobalt Aura" light mode
│   │   └── typography.ts         # Skala Plus Jakarta Sans
│   ├── hooks/
│   │   └── useBehavioralTracker.ts  # Passive phone monitoring
│   ├── context/
│   │   ├── AuthContext.tsx        # Auth state management
│   │   └── BehavioralTrackerContext.tsx
│   ├── services/
│   │   ├── api.ts                # Axios typed API + mock fallback
│   │   └── mock.ts               # Mock data (5 pasien, 1 psikolog)
│   ├── types/
│   │   └── api.ts                # Shared TypeScript types
│   ├── utils/
│   │   ├── format.ts             # Formatter (jam, tanggal, statistik)
│   │   └── authStorage.ts        # Secure auth persistence
│   ├── app.json                  # Expo config
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                      # Python FastAPI backend
│   ├── main.py                   # 12 endpoints + ML pipeline
│   ├── bridge.py                 # Smartphone → actigraphy proxy
│   ├── seed_db.py                # Database seeder
│   ├── schema.sql                # PostgreSQL DDL (6 tabel)
│   ├── requirements.txt
│   └── model/
│       ├── cognify_model.pkl     # IsolationForest (pre-trained)
│       ├── scaler.pkl            # StandardScaler
│       ├── shap_explainer.pkl    # SHAP TreeExplainer
│       └── training_report.json  # Feature statistics
│
└── plan/                         # Dokumen perencanaan
    ├── COGNIFY_OVERVIEW.md       # Product overview
    ├── COGNIFY_FINAL_PLAN_ALL_DONE.md  # Full implementation plan
    ├── COGNIFY_ML_PLAN.md        # ML technical plan
    └── COGNIFY_STATUS.md         # Project status
```

---

## 🚀 Cara Menjalankan

### Prasyarat

- **Node.js** ≥ 18
- **npm** ≥ 9
- **Expo Go** (install dari Play Store / App Store untuk testing di HP)
- **Python 3.11+** & **PostgreSQL** (hanya untuk backend — opsional, aplikasi bisa jalan tanpa backend)

---

### 💻 Mode PC (Web Browser)

> Tidak perlu backend. Aplikasi berjalan mandiri dengan data mock.

```bash
# 1. Masuk ke direktori frontend
cd repo/frontend

# 2. Install dependencies (skip jika sudah)
npm install

# 3. Jalankan server development
npx expo start --web
```

Browser akan otomatis terbuka di **http://localhost:8081**. Jika tidak, buka manual URL tersebut di Chrome atau Firefox.

**Login:**
- Email: `patient_000@cognify.demo`
- Password: `cognify-demo`

---

### 📱 Mode HP (Expo Go)

> HP dan komputer harus terhubung ke **jaringan WiFi yang sama**.

```bash
# 1. Masuk ke direktori frontend
cd repo/frontend

# 2. Install dependencies (skip jika sudah)
npm install

# 3. Jalankan server
npx expo start
```

Metro Bundler akan menampilkan QR code di terminal. Buka aplikasi **Expo Go** di HP, lalu:

- **Android:** Scan QR code langsung dari aplikasi Expo Go
- **iOS:** Buka Camera app → arahkan ke QR code → tap notifikasi Expo Go

Atau masukkan URL manual: `exp://<IP_KOMPUTER>:8081`

> Cara cek IP komputer: jalankan `hostname -I` di terminal.

---

### 🖥️ Mode Backend + Frontend (Full Stack)

> Membutuhkan PostgreSQL yang sudah berjalan.

```bash
# 1. Setup database
createdb cognify_db
psql cognify_db -f repo/backend/schema.sql

# 2. Setup backend
cd repo/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # sesuaikan DATABASE_URL

# 3. Seed database
python seed_db.py

# 4. Jalankan backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# 5. Jalankan frontend (di terminal terpisah)
cd repo/frontend
npx expo start
```

Ubah `EXPO_PUBLIC_API_URL` di `frontend/.env` ke IP backend: `http://<IP_BACKEND>:8000`.

---

## 🎨 Design System

**Cognify "Cobalt Aura"** — light mode premium dengan sentuhan klinis.

| Elemen | Spesifikasi |
|--------|-------------|
| **Warna Primer** | `#3B5DE7` (cobalt blue) |
| **Background** | `#F5F8FF` (cloud white) |
| **Cards** | `#FFFFFF` dengan shadow biru lembut |
| **Success** | `#22C55E` · Warning: `#F59E0B` · Danger: `#EF4444` |
| **Tipografi** | Plus Jakarta Sans (400/500/600/700/800) |
| **Ilustrasi** | 6 ilustrasi 3D SVG kustom |

---

## 📡 API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/health` | Health check |
| `POST` | `/login` | Autentikasi demo |
| `GET` | `/dashboard/{user_id}` | Dashboard lengkap + anomaly + trends 7d |
| `GET` | `/behavioral-trends/{user_id}` | Data behavioral per hari (max 30) |
| `POST` | `/behavioral-logs` | Kirim log behavioral dari tracker |
| `GET` | `/anomalies/{user_id}` | Riwayat anomaly (max 30) |
| `GET` | `/interventions/{user_id}` | Daftar intervensi |
| `POST` | `/interventions/{id}/complete` | Tandai intervensi selesai |
| `POST` | `/interventions/{id}/dismiss` | Abaikan intervensi |
| `GET` | `/psychologist/patients/{psych_id}` | Daftar pasien (urut WCS) |
| `GET` | `/alerts/{psych_id}` | Alert untuk psikolog |
| `POST` | `/alerts/{id}/acknowledge` | Acknowledge alert |
| `POST` | `/analyze` | Jalankan ML pipeline (Z-Score + IF + SHAP) |

---

## 🧪 ML Pipeline

```
POST /analyze
  │
  ├─ 1. smartphone_to_actigraphy_proxy() → 9 fitur actigraphy
  ├─ 2. StandardScaler.transform()
  ├─ 3. IsolationForest.score_samples() → anomaly score
  ├─ 4. SHAP TreeExplainer → kontribusi per fitur
  ├─ 5. Z-Score per sinyal vs baseline personal
  ├─ 6. WCS (Weighted Composite Score)
  ├─ 7. Risk classification + alert severity
  ├─ 8. CBT intervention selection (top 2 sinyal)
  └─ 9. DB write + response
```

---

## 📈 Key Metrics

| Klaim | Nilai | Sumber |
|-------|-------|--------|
| Patient-level detection rate | 99% | Evaluation, 100 synthetic patients |
| False positive patients | 0 | Confusion matrix |
| Avg detection lag | 4.7 hari | vs gap antar sesi 2–4 minggu |
| AUC-ROC | 0.8455 | ROC curve |
| Mann-Whitney U p-value | 2.68e-233 | ADHD vs control scores |
| Dilatih pada | OBF-Psychiatric | Nature Scientific Data, Jan 2025 |

---

## ⚠️ Keterbatasan Demo

- **Mock data** digunakan saat backend tidak tersedia (default: ON). Set `EXPO_PUBLIC_USE_MOCK=0` untuk disable.
- **Behavioral tracker** di Expo hanya bisa memonitor AppState (switch count, session duration, inactivity windows). Di production, gunakan native modules untuk metrik yang lebih akurat.
- **Auth** sederhana (email + shared password) — tidak ada JWT atau session management.
- **Notifikasi push** tidak diimplementasikan di versi demo.

---

## 📝 Lisensi

Proyek kompetisi HSIL — internal use only.
