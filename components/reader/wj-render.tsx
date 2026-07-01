import { ReactNode } from "react";
import { WJ_OPEN, WJ_CLOSE } from "@/lib/bible-api";

// Convert WJ sentinel markers embedded in verse text into React spans that
// can be styled red via the `.red-letter .wj` CSS rule.
export function renderWjText(text: string): ReactNode {
  if (!text.includes(WJ_OPEN)) return text;
  const parts: ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < text.length) {
    const open = text.indexOf(WJ_OPEN, i);
    if (open === -1) { parts.push(text.slice(i)); break; }
    if (open > i) parts.push(text.slice(i, open));
    const close = text.indexOf(WJ_CLOSE, open + 1);
    if (close === -1) { parts.push(<span key={key++} className="wj">{text.slice(open + 1)}</span>); break; }
    parts.push(<span key={key++} className="wj">{text.slice(open + 1, close)}</span>);
    i = close + 1;
  }
  return <>{parts}</>;
}
