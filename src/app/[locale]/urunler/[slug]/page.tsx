import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import "./detail.css";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Link } from "@/i18n/navigation";
import {
  getProductDetail,
  getRelatedProducts,
} from "@/lib/products/queries";
import { getCatalogLabels } from "@/lib/pages/catalog-content";
import { toDbLocale } from "@/lib/i18n-runtime";
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
  const locale = toDbLocale(await getLocale());
  const product = await getProductDetail(slug, locale);
  if (!product) notFound();

  const [related, labels, t] = await Promise.all([
    getRelatedProducts(product.categoryId, product.id, locale),
    getCatalogLabels(locale),
    getTranslations(),
  ]);
  const { detail, card } = labels;

  const datasheetHref =
    (product.documents.find((d) => d.locale === "TR") ?? product.documents[0])
      ?.fileUrl ?? undefined;

  const facts: [string, string][] = [];
  if (product.material) facts.push([t("product.detail.facts.material"), product.material]);
  if (product.category) facts.push([t("product.detail.facts.category"), product.category]);
  facts.push([
    t("product.detail.facts.typeLabel"),
    product.partType === "OEM"
      ? t("product.detail.facts.typeOem")
      : t("product.detail.facts.typeAftermarket"),
  ]);

  const descHeading = detail.descHeading ?? t("product.detail.descHeadingFallback");
  const hasKit = product.kitComponents.length > 0;
  const hasUsed = product.usedInKits.length > 0;
  const anchors: [string, string, number | null][] = [
    [descHeading, "#aciklama", null],
    [detail.specsHeading, "#ozellikler", product.specs.length],
    ...(hasKit
      ? [[t("product.detail.kit.heading"), "#kit-icerigi", product.kitComponents.length] as [string, string, number]]
      : []),
    ...(hasUsed
      ? [[t("product.detail.usedIn.heading"), "#kullanilan", product.usedInKits.length] as [string, string, number]]
      : []),
    [detail.docsHeading, "#dokumanlar", product.documents.length],
    [t("product.detail.cross.anchorLabel"), "#cross", product.crossRefs.length],
    [detail.relatedHeading, "#benzer", related.length],
  ];

  return (
    <>
      <SiteHeader />
      <div className="pdet">
        {/* Breadcrumb */}
        <div className="pd-crumb">
          <Link href="/">{t("crumb.home")}</Link>
          <span className="sep">›</span>
          <Link href="/urunler">{t("crumb.products")}</Link>
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
                <span className="pd-badge oem">{t("product.badges.oem")}</span>
              ) : product.isFeatured ? (
                <span className="pd-badge featured">
                  {t("product.badges.featured")}
                </span>
              ) : null}
            </div>

            <div className="pd-partno">
              <span className="lbl">{t("product.detail.partNoLabel")}</span>
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
                <div className="pd-empty">
                  {t("product.detail.empty.description")}
                </div>
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
                    <div className="pd-empty">
                      {t("product.detail.empty.specs")}
                    </div>
                  )}
                </div>

                <div id="cross">
                  <div className="pd-xref-head">
                    <span className="t">{t("product.detail.cross.heading")}</span>
                    {product.crossRefs.length > 0 && (
                      <CrossRefExport
                        sku={product.sku}
                        crossRefs={product.crossRefs}
                      />
                    )}
                  </div>
                  {product.crossRefs.length > 0 ? (
                    <div className="pd-xref">
                      <div className="xh">
                        <span className="xref-num">
                          {t("product.detail.cross.oemColumn")}
                        </span>
                        <span className="xref-brand">
                          {t("product.detail.cross.manufacturerColumn")}
                        </span>
                      </div>
                      {product.crossRefs.map((c, i) => (
                        <div className="xr" key={i}>
                          <span className="xref-num">{c.oemNumber}</span>
                          <span className="xref-brand">{c.manufacturer ?? "—"}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="pd-empty">
                      {t("product.detail.empty.cross")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Kit İçeriği */}
          {hasKit && (
            <div className="pd-section" id="kit-icerigi">
              <div className="pd-section-head">
                <h2>{t("product.detail.kit.heading")}</h2>
                <span className="cnt">{product.kitComponents.length}</span>
              </div>
              <div className="pd-section-body">
                <div className="pd-xref">
                  <div className="xh">
                    <span className="xref-num">{t("product.detail.kit.partNo")}</span>
                    <span className="xref-brand">
                      {t("product.detail.kit.description")}
                    </span>
                    <span className="xref-brand">{t("product.detail.kit.size")}</span>
                    <span className="xref-brand">{t("product.detail.kit.qty")}</span>
                  </div>
                  {product.kitComponents.map((c) => (
                    <div className="xr" key={c.sku}>
                      <span className="xref-num">
                        <Link href={`/urunler/${c.slug}`}>{c.sku}</Link>
                      </span>
                      <span className="xref-brand">{c.name}</span>
                      <span className="xref-brand">{c.dimension ?? "—"}</span>
                      <span className="xref-brand">{c.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Kullanıldığı Kitler */}
          {hasUsed && (
            <div className="pd-section" id="kullanilan">
              <div className="pd-section-head">
                <h2>{t("product.detail.usedIn.heading")}</h2>
                <span className="cnt">{product.usedInKits.length}</span>
              </div>
              <div className="pd-section-body">
                <div className="pd-xref">
                  <div className="xh">
                    <span className="xref-num">
                      {t("product.detail.usedIn.kitNo")}
                    </span>
                    <span className="xref-brand">
                      {t("product.detail.usedIn.kitName")}
                    </span>
                    <span className="xref-brand">
                      {t("product.detail.usedIn.qtyFromThis")}
                    </span>
                  </div>
                  {product.usedInKits.map((u) => (
                    <div className="xr" key={u.sku}>
                      <span className="xref-num">
                        <Link href={`/urunler/${u.slug}`}>{u.sku}</Link>
                      </span>
                      <span className="xref-brand">{u.name}</span>
                      <span className="xref-brand">{u.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

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
                      <span className="di">{t("product.detail.docs.type")}</span>
                      <div className="dn">
                        <b>{d.fileName ?? `${product.sku} Datasheet`}</b>
                        <small>
                          {t("product.detail.docs.labelFmt", { locale: d.locale })}
                        </small>
                      </div>
                      <span className="dsize">{fmtSize(d.fileSize)}</span>
                      <a className="ddl" href={d.fileUrl} download>
                        {t("product.detail.docs.download")}
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pd-empty">{t("product.detail.empty.docs")}</div>
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
