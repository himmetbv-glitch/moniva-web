"use client";

import { useState } from "react";

export function DetailGallery({
  images,
  label,
  datasheetHref,
}: {
  images: { url: string; alt: string | null }[];
  label: string;
  datasheetHref?: string;
}) {
  const [active, setActive] = useState(0);
  const has = images.length > 0;

  return (
    <div className="pd-gallery">
      <div className="pd-main">
        {has ? (
          <img src={images[active].url} alt={images[active].alt ?? label} />
        ) : (
          <>
            <span className="ph" />
            <span className="ph-label">{label}</span>
          </>
        )}
      </div>

      {has && images.length > 1 && (
        <div className="pd-thumbs">
          {images.map((im, i) => (
            <button
              key={i}
              className={`pd-thumb${i === active ? " active" : ""}`}
              onClick={() => setActive(i)}
              aria-label={`Görsel ${i + 1}`}
            >
              <img src={im.url} alt="" />
            </button>
          ))}
        </div>
      )}

      <div className="pd-gactions">
        {datasheetHref ? (
          <a className="primary" href={datasheetHref} download>
            ▤ Datasheet (PDF)
          </a>
        ) : (
          <button className="primary disabled" disabled>
            ▤ Datasheet yok
          </button>
        )}
        <button className="ghost" onClick={() => window.print()}>
          ⎙ Yazdır
        </button>
      </div>
    </div>
  );
}
