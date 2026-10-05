import { createClient } from "@/lib/supabase/client";
import { nextChapterPosition } from "@/lib/books";
import { Bookmark } from "@/types";

/**
 * Move a bookmark to the following chapter (crossing into the next book at a book's end).
 * Leaves sorted_at alone so the bookmark keeps its place in the user's manual order.
 * Returns the updated bookmark, or null if it's already at Revelation 22 or the update failed.
 */
export async function advanceBookmark(bookmark: Bookmark): Promise<Bookmark | null> {
  const next = nextChapterPosition(bookmark.book_id, bookmark.chapter);
  if (!next) return null;
  const { error } = await createClient()
    .from("bookmarks")
    .update({ book_id: next.bookId, book_name: next.bookName, chapter: next.chapter })
    .eq("id", bookmark.id);
  if (error) return null;
  return { ...bookmark, book_id: next.bookId, book_name: next.bookName, chapter: next.chapter, updated_at: new Date().toISOString() };
}
