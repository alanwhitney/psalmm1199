import { notFound } from "next/navigation";
import { fetchChapter } from "@/lib/bible-api";
import { BOOK_BY_ID } from "@/lib/books";
import { Translation, Note } from "@/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { WJ_OPEN, WJ_CLOSE, stripWj } from "@/lib/bible-api";
import PrintTrigger from "./PrintTrigger";

interface PageProps {
  params: Promise<{ bookId: string; chapter: string }>;
  searchParams: Promise<{ t?: string }>;
}

function renderWjSegments(text: string): React.ReactNode {
  if (!text.includes(WJ_OPEN)) return text;
  const parts: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < text.length) {
    const open = text.indexOf(WJ_OPEN, i);
    if (open === -1) { parts.push(text.slice(i)); break; }
    if (open > i) parts.push(text.slice(i, open));
    const close = text.indexOf(WJ_CLOSE, open + 1);
    if (close === -1) { parts.push(<span key={key++} style={{ color: "#b91c1c" }}>{text.slice(open + 1)}</span>); break; }
    parts.push(<span key={key++} style={{ color: "#b91c1c" }}>{text.slice(open + 1, close)}</span>);
    i = close + 1;
  }
  return <>{parts}</>;
}

export default async function PrintPage({ params, searchParams }: PageProps) {
  const { bookId, chapter: chapterStr } = await params;
  const { t } = await searchParams;

  const book = BOOK_BY_ID[bookId.toUpperCase()];
  if (!book) return notFound();

  const chapterNum = parseInt(chapterStr, 10);
  if (isNaN(chapterNum) || chapterNum < 1 || chapterNum > book.chapters) return notFound();

  const VALID_TRANSLATIONS: Translation[] = ["KJV", "NKJV", "NIV", "ESV", "CEV"];
  const translation: Translation = VALID_TRANSLATIONS.includes(t as Translation) ? (t as Translation) : "NKJV";

  let chapterData;
  try {
    chapterData = await fetchChapter(bookId.toUpperCase(), chapterNum, translation);
  } catch {
    chapterData = null;
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let notes: Note[] = [];
  if (user) {
    const { data } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .eq("book_id", book.id)
      .eq("chapter", chapterNum)
      .order("verse", { ascending: true });
    notes = (data ?? []) as Note[];
  }

  const notesByVerse = Object.fromEntries(notes.map(n => [n.verse, n.content]));
  const title = `${book.name} ${chapterNum} (${translation})`;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title} — Psalm 119:9</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.7;
            color: #1a1a1a;
            background: #fff;
            padding: 2cm 2.5cm;
            max-width: 800px;
            margin: 0 auto;
          }
          .screen-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #ddd;
          }
          .back-link {
            font-family: system-ui, sans-serif;
            font-size: 13px;
            color: #666;
            text-decoration: none;
          }
          .back-link:hover { color: #333; }
          .print-btn {
            font-family: system-ui, sans-serif;
            font-size: 13px;
            padding: 6px 16px;
            border: 1px solid #bfa040;
            border-radius: 6px;
            background: transparent;
            color: #8a6d20;
            cursor: pointer;
          }
          h1 {
            font-size: 22pt;
            font-weight: normal;
            margin-bottom: 0.25rem;
          }
          .translation-label {
            font-family: system-ui, sans-serif;
            font-size: 10pt;
            color: #888;
            margin-bottom: 2rem;
            display: block;
          }
          .verse {
            margin-bottom: 0.6rem;
          }
          .verse-num {
            font-size: 8pt;
            vertical-align: super;
            font-family: system-ui, sans-serif;
            color: #888;
            margin-right: 2px;
            line-height: 1;
          }
          .note {
            margin: 0.4rem 0 1rem 1.5rem;
            padding: 0.5rem 0.75rem;
            border-left: 2px solid #c9a84c;
            font-size: 10.5pt;
            color: #444;
            font-style: italic;
            line-height: 1.6;
            white-space: pre-wrap;
          }
          .note-label {
            display: block;
            font-family: system-ui, sans-serif;
            font-size: 9pt;
            font-style: normal;
            color: #999;
            margin-bottom: 2px;
          }
          .footer {
            margin-top: 3rem;
            padding-top: 1rem;
            border-top: 1px solid #eee;
            font-family: system-ui, sans-serif;
            font-size: 9pt;
            color: #bbb;
            text-align: center;
          }
          @media print {
            .screen-header { display: none; }
            body { padding: 0; }
            .footer { color: #ccc; }
          }
        `}</style>
      </head>
      <body>
        <div className="screen-header">
          <a href={`/bible/${book.id}/${chapterNum}?t=${translation}`} className="back-link">
            ← {book.name} {chapterNum}
          </a>
          <PrintTrigger />
        </div>

        <h1>{book.name} {chapterNum}</h1>
        <span className="translation-label">{translation}</span>

        {chapterData ? (
          <div>
            {chapterData.verses.map((verse) => {
              const note = notesByVerse[verse.number];
              return (
                <div key={verse.number} className="verse">
                  <span className="verse-num">{verse.number}</span>
                  {renderWjSegments(verse.text)}
                  {note && (
                    <div className="note">
                      <span className="note-label">Note (v.{verse.number})</span>
                      {note}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: "#888", fontStyle: "italic" }}>Chapter text unavailable.</p>
        )}

        <div className="footer">psalm119.app · {title}</div>
      </body>
    </html>
  );
}

export async function generateMetadata({ params, searchParams }: PageProps) {
  const { bookId, chapter } = await params;
  const { t } = await searchParams;
  const book = BOOK_BY_ID[bookId?.toUpperCase()];
  if (!book) return {};
  return { title: `Print — ${book.name} ${chapter} (${t ?? "NKJV"}) — Psalm 119:9` };
}
