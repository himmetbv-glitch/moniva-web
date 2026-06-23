"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  deleteCatalogueType,
  moveCatalogueType,
  upsertCatalogueType,
} from "@/lib/actions/admin-catalogue-type";
import type { AdminCatalogueTypeRow } from "@/lib/admin/catalogue-types";

function TypeRow({
  t,
  isFirst,
  isLast,
  onError,
}: {
  t: AdminCatalogueTypeRow;
  isFirst: boolean;
  isLast: boolean;
  onError: (m: string | null) => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState(t.name);
  const [color, setColor] = useState(t.color);
  const dirty = name !== t.name || color !== t.color;

  const save = () =>
    start(async () => {
      onError(null);
      const res = await upsertCatalogueType({ id: t.id, name, color });
      if (!res.ok) onError(res.error ?? "Kaydedilemedi.");
      else router.refresh();
    });

  const move = (dir: "up" | "down") =>
    start(async () => {
      const fd = new FormData();
      fd.set("id", t.id);
      fd.set("dir", dir);
      await moveCatalogueType(fd);
      router.refresh();
    });

  const remove = () => {
    if (!confirm(`"${t.name}" türünü silmek istediğinize emin misiniz?`)) return;
    start(async () => {
      onError(null);
      const fd = new FormData();
      fd.set("id", t.id);
      const res = await deleteCatalogueType(fd);
      if (!res.ok) onError(res.error ?? "Silinemedi.");
      else router.refresh();
    });
  };

  return (
    <tr>
      <td style={{ width: 48 }}>
        <div className="pl-ord">
          <form action={() => move("up")}>
            <button type="submit" className="pl-ord__btn" disabled={pending || isFirst} aria-label="Yukarı">▲</button>
          </form>
          <form action={() => move("down")}>
            <button type="submit" className="pl-ord__btn" disabled={pending || isLast} aria-label="Aşağı">▼</button>
          </form>
        </div>
      </td>
      <td style={{ width: 64 }}>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="ct-color"
          aria-label="Renk"
        />
      </td>
      <td>
        <input value={name} onChange={(e) => setName(e.target.value)} className="ct-name" />
        <div className="ad-mono ad-muted" style={{ fontSize: 11, marginTop: 2 }}>/{t.slug}</div>
      </td>
      <td className="ad-num ad-muted">{t.catalogueCount}</td>
      <td style={{ textAlign: "right" }}>
        <div className="ad-rowact" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="ad-linkbtn" disabled={pending || !dirty} onClick={save}>
            {pending ? "…" : "Kaydet"}
          </button>
          <button
            type="button"
            className="ad-linkbtn ad-linkbtn--danger"
            disabled={pending || t.catalogueCount > 0}
            title={t.catalogueCount > 0 ? "Bu türde katalog var" : undefined}
            onClick={remove}
          >
            Sil
          </button>
        </div>
      </td>
    </tr>
  );
}

export function CatalogueTypeManager({ types }: { types: AdminCatalogueTypeRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#4F3D8C");

  const add = () =>
    start(async () => {
      setError(null);
      const res = await upsertCatalogueType({ name: newName, color: newColor });
      if (!res.ok) setError(res.error ?? "Eklenemedi.");
      else {
        setNewName("");
        setNewColor("#4F3D8C");
        router.refresh();
      }
    });

  return (
    <div className="ad-card ad-card--flush">
      {error && <div className="pe-error" style={{ margin: 16 }}>{error}</div>}
      <table className="ad-table">
        <thead>
          <tr>
            <th style={{ width: 48 }}>Sıra</th>
            <th style={{ width: 64 }}>Renk</th>
            <th>Tür adı</th>
            <th className="ad-num">Katalog</th>
            <th style={{ textAlign: "right" }}>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {types.map((t, i) => (
            <TypeRow
              key={t.id}
              t={t}
              isFirst={i === 0}
              isLast={i === types.length - 1}
              onError={setError}
            />
          ))}
          <tr>
            <td />
            <td>
              <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="ct-color" aria-label="Yeni renk" />
            </td>
            <td>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="ct-name"
                placeholder="Yeni tür adı…"
                onKeyDown={(e) => { if (e.key === "Enter" && newName.trim()) add(); }}
              />
            </td>
            <td className="ad-num ad-muted">—</td>
            <td style={{ textAlign: "right" }}>
              <button type="button" className="ad-btn ad-btn--primary ad-btn--sm" disabled={pending || newName.trim().length < 2} onClick={add}>
                + Ekle
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
