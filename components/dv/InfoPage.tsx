"use client";

export interface InfoSection {
  heading: string;
  paragraphs?: string[];
  list?: string[];
}

export default function InfoPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated?: string;
  intro?: string;
  sections: InfoSection[];
}) {
  return (
    <main>
      <div className="info-page">
        <h1>{title}</h1>
        {updated && <div className="info-updated">{updated}</div>}
        {intro && <p>{intro}</p>}
        {sections.map((s) => (
          <div key={s.heading}>
            <h2>{s.heading}</h2>
            {s.paragraphs?.map((p, i) => <p key={i}>{p}</p>)}
            {s.list && (
              <ul>
                {s.list.map((li, i) => (
                  <li key={i}>{li}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
      <style jsx>{`
        .info-page {
          max-width: 1100px;
          margin: 0 auto;
          padding: 30px 24px 60px;
        }
        .info-page :global(h1) {
          font-family: "MV Waheed", "Noto Sans Thaana", sans-serif;
          font-size: 28px;
          font-weight: 700;
          margin: 4px 0 6px;
          line-height: 1.8;
        }
        .info-updated {
          font-size: 13px;
          color: var(--ink-soft);
          margin-bottom: 28px;
        }
        .info-page :global(h2) {
          font-family: "MV Waheed", "Noto Sans Thaana", sans-serif;
          font-size: 19px;
          font-weight: 700;
          margin: 30px 0 10px;
          line-height: 1.9;
        }
        .info-page :global(p) {
          font-family: "MV Waheed", "Noto Sans Thaana", sans-serif;
          font-size: 16px;
          line-height: 2.1;
          color: var(--ink);
          margin-bottom: 14px;
        }
        .info-page :global(ul) {
          margin: 0 0 14px;
          padding-right: 22px;
        }
        .info-page :global(li) {
          font-family: "MV Waheed", "Noto Sans Thaana", sans-serif;
          font-size: 16px;
          line-height: 2.1;
          margin-bottom: 6px;
        }
      `}</style>
    </main>
  );
}
