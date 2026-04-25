import Link from "next/link";
import { BookOpen, ArrowLeft } from "lucide-react";
import { cookies } from "next/headers";
import { lastPositionUrl } from "@/lib/last-position";

export const metadata = {
  title: "About — Psalm 119:9",
};

export default async function AboutPage() {
  const cookieStore = await cookies();
  const backHref = lastPositionUrl(cookieStore.get("last_position")?.value);
  return (
    <div className="min-h-screen bg-surface text-ink-primary">
      {/* Header */}
      <header className="bg-surface-raised border-b border-b-line-subtle px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={backHref} className="flex items-center gap-1.5 no-underline text-ink-muted text-[13px]">
            <ArrowLeft size={15} /> Back to reading
          </Link>
          <div className="w-px h-4 bg-line-subtle" />
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-gold" />
            <span className="text-[13px] font-semibold text-ink-primary">Psalm 119:9</span>
          </div>
        </div>
      </header>

      <div className="max-w-[640px] mx-auto py-[60px] px-6">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-surface-raised border border-line-subtle flex items-center justify-center">
            <BookOpen size={28} className="text-gold" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-[28px] font-light text-ink-primary text-center mb-2 font-reading">
          Psalm 119:9
        </h1>
        <p className="text-xs text-ink-muted text-center uppercase tracking-[0.12em] font-semibold mb-3">
          Bible Reader
        </p>

        {/* Gold divider */}
        <div className="h-px w-20 mx-auto mb-10 bg-gradient-to-r from-transparent via-gold-muted to-transparent" />

        {/* Name verse */}
        <div className="bg-surface-raised border border-line-subtle border-l-[3px] border-l-gold rounded-xl px-6 py-5 mb-8">
          <p className="text-[15px] text-ink-primary font-reading leading-[1.8] mb-2 italic">
            "Wherewithal shall a young man cleanse his way? By taking heed thereto according to thy word."
          </p>
          <p className="text-xs text-gold font-semibold m-0">— Psalm 119:9 (KJV)</p>
        </div>

        {/* About sections */}
        {[
          {
            heading: "What is this?",
            body: "Psalm 119:9 is a clean, focused Bible reading app built to make daily scripture reading simple and distraction-free. Read the Bible in multiple translations, bookmark your place, take notes on any chapter, and follow structured reading plans."
          },
          {
            heading: "Translations",
            body: "Currently available in King James Version (KJV), New King James Version (NKJV), New International Version (NIV), and English Standard Version (ESV). KJV text is in the public domain. NKJV and NIV text is provided through the API.Bible service. ESV text is provided through the Crossway ESV API."
          },
          {
            heading: "Features",
            body: "Read any chapter across all 66 books of the Bible. Save multiple bookmarks with custom labels. Attach notes to any chapter. Follow reading plans including Bible in a Year, New Testament in 90 Days, Psalms & Proverbs in 30 Days, and Chronological Bible in a Year. Search the full Bible or within a chapter. Tap any verse to copy or share it."
          },
          {
            heading: "Your data",
            body: "Bookmarks, notes, and reading plan progress are stored securely in your account. No data is sold or shared with third parties. You can delete your account and all associated data at any time."
          },
          {
            heading: "About us",
            body: "This is a simple tool created by Alan Whitney in South West East Corinth in Central Maine. It's free, it's simple. Enjoy. God Bless."
          },
        ].map(({ heading, body }) => (
          <div key={heading} className="mb-7">
            <h2 className="text-[13px] font-bold text-gold uppercase tracking-[0.08em] mb-2">
              {heading}
            </h2>
            <p className="text-sm text-ink-secondary leading-[1.8] m-0">
              {body}
            </p>
          </div>
        ))}

        {/* Scripture Credits */}
        <div className="mt-10 mb-2">
          <h2 className="text-[13px] font-bold text-gold uppercase tracking-[0.08em] mb-4">
            Scripture Credits
          </h2>
          <div className="flex flex-col gap-3 text-[12px] text-ink-muted leading-[1.7]">
            <p className="m-0">
              Scripture quotations marked <span className="text-ink-secondary font-semibold">ESV</span> are from the ESV® Bible (The Holy Bible, English Standard Version®), copyright © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.
            </p>
            <p className="m-0">
              Scripture quotations marked <span className="text-ink-secondary font-semibold">NKJV</span> are taken from the New King James Version®. Copyright © 1982 by Thomas Nelson. Used by permission. All rights reserved.
            </p>
            <p className="m-0">
              Scripture quotations marked <span className="text-ink-secondary font-semibold">NIV</span> are taken from the Holy Bible, New International Version®, NIV®. Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.™ Used by permission of Zondervan. All rights reserved worldwide.
            </p>
            <p className="m-0">
              Scripture quotations marked <span className="text-ink-secondary font-semibold">KJV</span> are from the King James Version, which is in the public domain.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-line-subtle my-8" />

        {/* CTA */}
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href={backHref} className="px-6 py-[10px] bg-gold text-surface font-bold text-[13px] rounded-lg no-underline">
            Start Reading
          </Link>
          <Link href="/auth/signup" className="px-6 py-[10px] bg-surface-raised border border-line-subtle text-ink-primary text-[13px] rounded-lg no-underline">
            Create Account
          </Link>
        </div>

        <p className="text-center text-[11px] text-ink-muted mt-12">
          psalm1199.com
        </p>
      </div>
    </div>
  );
}
