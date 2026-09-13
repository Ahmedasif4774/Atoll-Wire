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
          font-family: "Archivo", sans-serif;
          font-weight: 900;
          font-size: 30px;
          letter-spacing: -0.02em;
          margin: 4px 0 6px;
          line-height: 1.3;
        }
        .info-updated {
          font-size: 13px;
          color: var(--ink-soft);
          margin-bottom: 28px;
        }
        .info-page :global(h2) {
          font-family: "Archivo", sans-serif;
          font-weight: 800;
          font-size: 19px;
          margin: 30px 0 10px;
          line-height: 1.4;
        }
        .info-page :global(p) {
          font-size: 16px;
          line-height: 1.75;
          color: var(--ink);
          margin-bottom: 14px;
        }
        .info-page :global(ul) {
          margin: 0 0 14px;
          padding-left: 22px;
        }
        .info-page :global(li) {
          font-size: 16px;
          line-height: 1.75;
          margin-bottom: 6px;
        }
      `}</style>
    </main>
  );
}
