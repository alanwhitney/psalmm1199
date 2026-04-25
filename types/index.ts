// Bible types
export type Translation = "KJV" | "NKJV" | "NIV" | "ESV";

export interface Book {
  id: string;
  name: string;
  abbreviation: string;
  testament: "OT" | "NT";
  chapters: number;
}

export interface Verse {
  number: number;
  text: string;
}

export interface Chapter {
  book: string;
  bookId: string;
  chapter: number;
  translation: Translation;
  verses: Verse[];
}

// User / Auth types
export interface UserProfile {
  id: string;
  email: string;
  created_at: string;
}

// Bookmark types
export interface Bookmark {
  id: string;
  user_id: string;
  book_id: string;
  book_name: string;
  chapter: number;
  verse?: number;
  translation: Translation;
  label?: string;
  created_at: string;
}

// Note types
export interface Note {
  id: string;
  user_id: string;
  book_id: string;
  book_name: string;
  chapter: number;
  translation: Translation;
  content: string;
  created_at: string;
  updated_at: string;
}

// Navigation
export interface BibleLocation {
  bookId: string;
  chapter: number;
  translation: Translation;
}
