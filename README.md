# Psalm 119:9 — Bible Reader

A clean, distraction-free Bible reading app with bookmarks, verse notes, highlights, a reading plan, and a prayer journal. Built with Next.js 14, Supabase, and Tailwind CSS.

**Live app:** [psalm119.app](https://psalm119.app)

---

## Features

- KJV, NKJV, NIV, ESV, and CEV translations
- Words of Jesus highlighted in red (KJV/NKJV)
- Verse-level notes with full-chapter note panel
- Highlights (5 colors, per translation)
- Bookmarks with optional labels
- Reading plans with daily completion tracking
- Prayer journal
- Print view (chapter + your notes, PDF-ready)
- Cross-reference chips in verse popover
- Text-to-speech playback
- PWA with offline support

---

## Stack

- **Framework:** Next.js 14 (App Router)
- **Database / Auth:** Supabase (Postgres + Row Level Security)
- **Styling:** Tailwind CSS v3
- **Bible text:** [api.bible](https://scripture.api.bible) (KJV, NKJV, NIV, CEV) + [ESV API](https://api.esv.org)
- **Deployment:** Vercel

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/alanwhitney/psalmm1199.git
cd psalmm1199
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Open the **SQL Editor** and run the contents of [`supabase-schema.sql`](./supabase-schema.sql) to create all tables and RLS policies
3. In **Authentication → URL Configuration**, add `http://localhost:3000` to the allowed redirect URLs

### 3. Get Bible API keys

**api.bible** (KJV, NKJV, NIV, CEV)
1. Create a free account at [scripture.api.bible](https://scripture.api.bible)
2. Create an app to get your API key
3. Browse the Bible library to find the translation IDs you want — KJV (`de4e12af7f28f599-02`) and NIV (`3e2eb613d45e131e-01`) are public; NKJV requires a licensed ID from your account

**ESV API** (optional)
1. Request a free key at [api.esv.org](https://api.esv.org) — remove "ESV" from `VALID_TRANSLATIONS` in `app/bible/[bookId]/[chapter]/page.tsx` if you skip this

### 4. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# api.bible
BIBLE_API_KEY=your_api_bible_key
BIBLE_API_KJV_ID=de4e12af7f28f599-02
BIBLE_API_NKJV_ID=your_nkjv_id
BIBLE_API_NIV_ID=3e2eb613d45e131e-01
BIBLE_API_CEV_ID=555fef9a6cb31151-01

# ESV (optional)
BIBLE_ESV_API_KEY=your_esv_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploying to Vercel

1. Push your fork to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.local` in the Vercel project settings (set `NEXT_PUBLIC_APP_URL` to your production URL)
4. Deploy — Vercel auto-detects Next.js

---

## Project Structure

```
app/
  bible/[bookId]/[chapter]/   # Chapter reader + print view
  bookmarks/                  # Bookmarks, notes, reading plan tabs
  journal/                    # Prayer journal
  about/                      # About page
  auth/                       # Login / signup
components/
  reader/                     # ReaderLayout, ChapterView, sidebar
lib/
  bible-api.ts                # Fetches and parses Bible text
  books.ts                    # Book metadata (ids, chapter counts)
  data/crossrefs.json         # Cross-reference index (~162k links)
scripts/
  build-crossrefs.mjs         # Rebuilds crossrefs.json from Open Bible data
supabase-schema.sql           # Full database schema with RLS policies
```

---

## License

MIT
