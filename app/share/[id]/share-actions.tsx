"use client";

import { useState } from "react";

export function ShareActions({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/share/${id}`
      : `/share/${id}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    "Just crushed my push-up session! 💪"
  )}&url=${encodeURIComponent(shareUrl)}`;

  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    shareUrl
  )}`;

  const btnClass =
    "px-6 py-2 border border-white/20 text-white font-mono text-xs uppercase tracking-[0.2em] hover:bg-white/10 transition-colors";

  return (
    <div className="flex items-center gap-3 flex-wrap justify-center">
      <button onClick={copyLink} className={btnClass}>
        {copied ? "COPIED!" : "COPY LINK"}
      </button>
      <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className={btnClass}>
        TWITTER
      </a>
      <a href={linkedInUrl} target="_blank" rel="noopener noreferrer" className={btnClass}>
        LINKEDIN
      </a>
    </div>
  );
}
