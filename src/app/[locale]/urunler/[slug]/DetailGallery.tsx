"use client";

import { useCallback, useEffect, useState } from "react";

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
  const [zoom, setZoom] = useState(false);
  const has = images.length > 0;
  const multi = images.length > 1;

  const step = useCallback(
    (dir: 1 | -1) => setActive((i) => (i + dir + images.length) % images.length),
    [images.length],
  );

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(false);
      else if (e.key === "ArrowRight" && multi) step(1);
      else if (e.key === "ArrowLeft" && multi) step(-1);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [zoom, multi, step]);

  return (
    <div className="pd-gallery">
      <div className="pd-main">
        {has ? (
          <img
            src={images[active].url}
            alt={images[active].alt ?? label}
            className="pd-zoomable"
            onClick={() => setZoom(true)}
            title="Büyütmek için tıklayın"
          />
        ) : (
          <>
            <span className="ph" />
            <span className="ph-label">{label}</span>
          </>
        )}
        {has && <span className="pd-zoom-hint" aria-hidden>⤢</span>}
      </div>

      {has && multi && (
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

      {zoom && has && (
        <div className="pd-lightbox" onClick={() => setZoom(false)} role="dialog" aria-modal="true">
          <button className="pd-lb-close" aria-label="Kapat" onClick={() => setZoom(false)}>
            ✕
          </button>
          {multi && (
            <button
              className="pd-lb-nav prev"
              aria-label="Önceki"
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
            >
              ‹
            </button>
          )}
          <img
            className="pd-lb-img"
            src={images[active].url}
            alt={images[active].alt ?? label}
            onClick={(e) => e.stopPropagation()}
          />
          {multi && (
            <button
              className="pd-lb-nav next"
              aria-label="Sonraki"
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
            >
              ›
            </button>
          )}
          {multi && (
            <span className="pd-lb-count" onClick={(e) => e.stopPropagation()}>
              {active + 1} / {images.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
