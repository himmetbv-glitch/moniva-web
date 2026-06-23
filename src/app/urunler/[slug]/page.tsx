import Link from "next/link";
import { notFound } from "next/navigation";

import "./detail.css";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import {
  getProductDetail,
  getRelatedProducts,
} from "@/lib/products/queries";
import { getCatalogLabels } from "@/lib/pages/catalog-content";
import { ProductCard } from "../ProductCard";
import { DetailGallery } from "./DetailGallery";
import { DetailQuoteAction } from "./DetailQuoteAction";
import { CrossRefExport } from "./CrossRefExport";

export const dynamic = "force-dynamic";

function prettyKey(k: string): string {
  return k.replace(/_/g, " ");
}
function fmtSize(bytes: number | null): string {
  if (!bytes) return "";
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductDetail(slug);
  if (!product) notFound();

  const [related, labels] = await Promise.all([
    getRelatedProducts(product.categoryId, product.id),
    getCatalogLabels(),
  ]);
  const { detail, card } = labels;

  const datasheetHref =
    (product.documents.find((d) => d.locale === "TR") ?? product.documents[0])
      ?.fileUrl ?? undefined;

  const facts: [string, string][] = [];
  if (product.material) facts.push(["Malzeme", product.material]);
  if (product.category) facts.push(["Kategori", product.category]);
  facts.push(["Tip", product.partType === "OEM" ? "OEM Orijinal" : "Aftermarket"]);

  const descHeading = detail.descHeading ?? "Ürün Açıklaması";
  const anchors: [string, string, number | null][] = [
    [descHeading, "#aciklama", null],
    [detail.specsHeading, "#ozellikler", product.specs.length],
    [detail.docsHeading, "#dokumanlar", product.documents.length],
    ["Cross-References", "#cross", product.crossRefs.length],
    [detail.relatedHeading, "#benzer", related.length],
  ];

  return (
    <>
      <SiteHeader />
      <div className="pdet">
        {/* Breadcrumb */}
        <div className="pd-crumb">
          <Link href="/">Ana Sayfa</Link>
          <span className="sep">›</span>
          <Link href="/urunler">Ürünler</Link>
          {product.category && product.categorySlug && (
            <>
              <span className="sep">›</span>
              <Link href={`/urunler?kategori=${product.categorySlug}`}>
                {product.category}
              </Link>
            </>
          )}
          <span className="sep">›</span>
          <b>{product.name}</b>
        </div>

        {/* Top block */}
        <div className="pd-top">
          <DetailGallery
            images={product.images}
            label={product.category ?? "MONIVA"}
            datasheetHref={datasheetHref}
          />

          <div className="pd-center">
            <div className="pd-titlerow">
              <h1 className="pd-title">{product.name}</h1>
              {product.partType === "OEM" ? (
                <span className="pd-badge oem">OEM</span>
              ) : product.isFeatured ? (
                <span className="pd-badge featured">ÖNE ÇIKAN</span>
              ) : null}
            </div>

            <div className="pd-partno">
              <span className="lbl">Parça No:</span>
              <span className="val">{product.sku}</span>
            </div>

            {product.shortDesc && <p className="pd-desc">{product.shortDesc}</p>}

            <div className="pd-facts">
              {facts.map(([k, v]) => (
                <div className="pd-fact" key={k}>
                  <span className="fk">{k}</span>
                  <span className="fv">{v}</span>
                </div>
              ))}
            </div>

            <div className="pd-anchors">
              {anchors.map(([label, href, count]) => (
                <Link href={href} key={href}>
                  <span className="al">
                    <span className="arr">›</span>
                    {label}
                  </span>
                  {count != null && <span className="ac">{count}</span>}
                </Link>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className="pd-side">
            <div className="pd-quickinfo">
              <div className="qi-head">{detail.quickHeading}</div>
              {detail.rows.map((r) => (
                <div className="qi-row" key={r.label}>
                  <span>{r.label}</span>
                  <b>{r.value}</b>
                </div>
              ))}
            </div>

            <div className="pd-quote-tag">
              <span className="dot" />
              <span>{card.quoteText}</span>
            </div>

            <DetailQuoteAction
              productId={product.id}
              addLabel={detail.addLabel}
              addedLabel={detail.addedLabel}
            />
          </div>
        </div>

        {/* Sections */}
        <div className="pd-sections">
          {/* Açıklama */}
          <div className="pd-section" id="aciklama">
            <div className="pd-section-head">
              <h2>{descHeading}</h2>
            </div>
            <div className="pd-section-body">
              {product.description ? (
                <p className="pd-prose">{product.description}</p>
              ) : (
                <div className="pd-empty">Açıklama girilmemiş.</div>
              )}
            </div>
          </div>

          {/* Technical specs + cross-refs */}
          <div className="pd-section" id="ozellikler">
            <div className="pd-section-head">
              <h2>{detail.specsHeading}</h2>
              <span className="cnt">{product.specs.length}</span>
            </div>
            <div className="pd-section-body">
              <div className="pd-cols">
                <div>
                  {product.specs.length > 0 ? (
                    <div className="pd-spec">
                      {product.specs.map((s, i) => (
                        <div className="sr" key={i}>
                          <span className="sk">{prettyKey(s.key)}</span>
                          <span className="sv">
                            {s.value}
                            {s.unit ? ` ${s.unit}` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="pd-empty">Teknik özellik girilmemiş.</div>
                  )}
                </div>

                <div id="cross">
                  <div className="pd-xref-head">
                    <span className="t">Cross-References (OEM)</span>
                    {product.crossRefs.length > 0 && (
                      <CrossRefExport sku={product.sku} crossRefs={product.crossRefs} />
                    )}
                  </div>
                  {product.crossRefs.length > 0 ? (
                    <div className="pd-xref">
                      <div className="xh">
                        <span className="xref-num">OEM Numarası</span>
                        <span className="xref-brand">Üretici</span>
                      </div>
                      {product.crossRefs.map((c, i) => (
                        <div className="xr" key={i}>
                          <span className="xref-num">{c.oemNumber}</span>
                          <span className="xref-brand">{c.manufacturer ?? "—"}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="pd-empty">OEM çapraz referans yok.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="pd-section" id="dokumanlar">
            <div className="pd-section-head">
              <h2>{detail.docsHeading}</h2>
              <span className="cnt">{product.documents.length}</span>
            </div>
            <div className="pd-section-body">
              {product.documents.length > 0 ? (
                <div className="pd-docs">
                  {product.documents.map((d, i) => (
                    <div className="pd-doc" key={i}>
                      <span className="di">PDF</span>
                      <div className="dn">
                        <b>{d.fileName ?? `${product.sku} Datasheet`}</b>
                        <small>Datasheet · {d.locale}</small>
                      </div>
                      <span className="dsize">{fmtSize(d.fileSize)}</span>
                      <a className="ddl" href={d.fileUrl} download>
                        ↓ İndir
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pd-empty">Bu ürün için doküman bulunmuyor.</div>
              )}
            </div>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <div className="pd-section pd-related" id="benzer">
              <h2>{detail.relatedHeading}</h2>
              <div className="pgrid">
                {related.map((p) => (
                  <ProductCard key={p.id} p={p} labels={card} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
