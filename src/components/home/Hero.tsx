"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { youtubeId, type HeroData, type HeroSlide } from "@/lib/pages/home-sections";

function embedUrl(id: string) {
  const qs = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    loop: "1",
    playlist: id,
    controls: "0",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
    iv_load_policy: "3",
    disablekb: "1",
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${qs}`;
}

export function Hero({ slides, ctaPrimary, ctaSecondary, videoUrl }: HeroData) {
  const t = useTranslations();
  const fallback: HeroSlide = {
    img: "/home/hero.jpg",
    head: t("hero.fallback.head"),
    sub: t("hero.fallback.sub"),
  };
  const SLIDES = slides.length > 0 ? slides : [fallback];
  const [slide, setSlide] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const videoId = youtubeId(videoUrl);
  const s = videoId ? SLIDES[0] : (SLIDES[slide] ?? SLIDES[0]);
  const prev = () => setSlide((i) => (i - 1 + SLIDES.length) % SLIDES.length);
  const next = () => setSlide((i) => (i + 1) % SLIDES.length);

  return (
    <section className="hh-hero">
      {videoId ? (
        <>
          <Image
            src={SLIDES[0].img}
            alt=""
            fill
            priority
            sizes="100vw"
            className="hh-hero__img hh-hero__img--on"
          />
          <div className={"hh-hero__video" + (videoReady ? " hh-hero__video--on" : "")} aria-hidden>
            <iframe
              src={embedUrl(videoId)}
              title="Moniva"
              tabIndex={-1}
              allow="autoplay; encrypted-media; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              onLoad={() => setVideoReady(true)}
            />
          </div>
        </>
      ) : (
        SLIDES.map((sl, i) => (
          <Image
            key={sl.img}
            src={sl.img}
            alt=""
            fill
            priority={i === 0}
            sizes="100vw"
            className={"hh-hero__img" + (i === slide ? " hh-hero__img--on" : "")}
          />
        ))
      )}
      <div className="hh-hero__scrim" />

      {!videoId && (
        <>
          <button
            className="hh-hero__arrow hh-hero__arrow--l"
            onClick={prev}
            aria-label={t("hero.arrow.prev")}
          >
            <svg width="12" height="20" viewBox="0 0 12 20" fill="none">
              <path d="M10 2L2 10L10 18" stroke="#1B1640" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            className="hh-hero__arrow hh-hero__arrow--r"
            onClick={next}
            aria-label={t("hero.arrow.next")}
          >
            <svg width="12" height="20" viewBox="0 0 12 20" fill="none">
              <path d="M2 2L10 10L2 18" stroke="#1B1640" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}

      <div className="hh-hero__overlay">
        <h1 className="hh-hero__head">{s.head}</h1>
        <p className="hh-hero__sub">{s.sub}</p>
        <div className="hh-hero__cta">
          <Link href={ctaPrimary.href} className="hh-btn hh-btn--solid">
            {ctaPrimary.label}
          </Link>
          <Link href={ctaSecondary.href} className="hh-btn hh-btn--ghost">
            {ctaSecondary.label}
          </Link>
        </div>
      </div>

      {!videoId && (
        <div className="hh-hero__dots">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              aria-label={t("hero.dotAria", { index: i + 1 })}
              className={"hh-hero__dot" + (i === slide ? " hh-hero__dot--on" : "")}
            />
          ))}
        </div>
      )}
    </section>
  );
}
