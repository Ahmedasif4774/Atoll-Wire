"use client";

import { useState } from "react";

interface SocialLinkCardProps {
  // Where the whole card links to (the real post/video on X or TikTok).
  url: string;
  // e.g. "@yaugoob.ali.sarey78"
  handle: string;
  // Platform badge shown beside the handle — passed in from
  // lib/homeConfig.*.ts so it matches the placeholder cards exactly.
  icon: string;
  iconBg: string;
  // The post text / video caption (optional — some posts have none).
  text?: string | null;
  // Set for TikTok: shows a small portrait preview picture with a play
  // button. (A `thumbnail` without `video` shows the picture with no play
  // button — used by the Facebook card.) `thumbnail` can be null when TikTok didn't give us one, in
  // which case a plain dark play tile is shown instead.
  video?: boolean;
  thumbnail?: string | null;
  // Small stat line (e.g. ["💬 12", "👍 340"]) shown above the call-to-action.
  // Used by the Facebook card.
  stats?: string[];
  // Short editor-written explanation of what this post/video is about
  // (already in the page's language — the Dhivehi page passes the Dhivehi
  // text, the English page the English text). Optional.
  description?: string | null;
  // Short call-to-action line at the bottom, e.g. "TikTok ↗".
  cta: string;
}

// A compact "preview" card for today's top X post or TikTok video. Unlike
// the old embed approach (X's and TikTok's own widgets), nothing here is
// loaded from X or TikTok except the little preview picture, so it stays
// small, loads instantly and can't be blocked or rate-limited by them. The
// whole card is a link — tapping it opens the real post/video on the
// platform itself.
export default function SocialLinkCard({
  url,
  handle,
  icon,
  iconBg,
  text,
  video,
  thumbnail,
  stats,
  description,
  cta,
}: SocialLinkCardProps) {
  // If the preview picture fails to load (expired link, blocked), fall
  // back to the plain play tile rather than showing a broken image.
  const [thumbFailed, setThumbFailed] = useState(false);
  const showImage = !!thumbnail && !thumbFailed;

  return (
    <a
      className="social-card"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: "block", textDecoration: "none", color: "inherit" }}
    >
      <div className="social-card-head">
        <div className="social-platform-icon" style={{ background: iconBg }}>
          {icon}
        </div>
        <div className="s-handle">{handle}</div>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        {(video || showImage) && (
          <div
            style={{
              width: 84,
              flexShrink: 0,
              aspectRatio: "9 / 12",
              borderRadius: 8,
              overflow: "hidden",
              background: "#000",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {showImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbnail as string}
                alt=""
                referrerPolicy="no-referrer"
                onError={() => setThumbFailed(true)}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
            {video && (
            <span
              style={{
                position: "absolute",
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.55)",
                color: "#fff",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ▶
            </span>
            )}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          {text && (
            <div
              dir="auto"
              style={{
                fontSize: 13,
                lineHeight: 1.6,
                color: "#0e2a47",
                marginBottom: 6,
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                wordBreak: "break-word",
              }}
            >
              {text}
            </div>
          )}
          {stats && stats.length > 0 && (
            <div style={{ display: "flex", gap: 10, fontSize: 12, color: "#52696c", marginBottom: 4 }}>
              {stats.map((st) => (
                <span key={st}>{st}</span>
              ))}
            </div>
          )}
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#52696c",
              direction: "ltr",
              unicodeBidi: "isolate",
            }}
          >
            {cta}
          </div>
        </div>
      </div>

      {description && (
        <div
          dir="auto"
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: "1px solid rgba(14, 42, 71, 0.1)",
            fontSize: 12.5,
            lineHeight: 1.7,
            color: "#52696c",
            wordBreak: "break-word",
          }}
        >
          {description}
        </div>
      )}
    </a>
  );
}
