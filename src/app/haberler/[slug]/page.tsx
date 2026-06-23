import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getNewsBySlug } from "@/lib/news/queries";
import "../haberler.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getNewsBySlug(slug);
  if (!post) return { title: "Haber bulunamadı — Moniva" };
  return {
    title: `${post.title} — Moniva`,
    description: post.excerpt || undefined,
  };
}

export default async function HaberDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getNewsBySlug(slug);
  if (!post) notFound();

  return (
    <>
      <SiteHeader />
      <main className="news-page">
        <article className="nw-article">
          <nav className="nw-acrumb">
            <Link href="/">Ana Sayfa</Link>
            <span>›</span>
            <Link href="/haberler">Haberler</Link>
            <span>›</span>
            <span className="nw-acrumb__cur">{post.title}</span>
          </nav>

          <div className="nw-adate">{post.dateLabel}</div>
          <h1 className="nw-atitle">{post.title}</h1>
          {post.excerpt && <p className="nw-aexcerpt">{post.excerpt}</p>}

          {post.coverImage && (
            <div className="nw-acover">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                sizes="(max-width: 900px) 100vw, 860px"
                style={{ objectFit: "cover" }}
                priority
              />
            </div>
          )}

          <div className="nw-abody">
            {post.paragraphs.length > 0 ? (
              post.paragraphs.map((p, i) => <p key={i}>{p}</p>)
            ) : (
              <p className="nw-amuted">Bu haberin içeriği henüz eklenmemiş.</p>
            )}
          </div>

          <div className="nw-aback">
            <Link href="/haberler" className="nw-backlink">
              ◀ Tüm haberlere dön
            </Link>
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
