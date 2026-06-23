"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  deleteProductImage,
  moveProductImage,
  setMainProductImage,
  type ImageActionResult,
} from "@/lib/actions/admin-product-image";

export type EditorImage = {
  id: string;
  url: string;
  alt: string | null;
  isMain: boolean;
  order: number;
};

export function ProductImages({
  productId,
  images,
}: {
  productId: string;
  images: EditorImage[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const busy = uploading || pending;

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setErr(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(`/api/admin/products/${productId}/images`, {
          method: "POST",
          body: fd,
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          setErr(j.error ?? "Yükleme başarısız.");
          break;
        }
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    }
  }

  function run(action: Promise<ImageActionResult>) {
    setErr(null);
    start(async () => {
      const r = await action;
      if (!r.ok) setErr(r.error);
      router.refresh();
    });
  }

  return (
    <div className="mv-card iq-pad">
      <div className="pe-sectitle">Görseller</div>

      <div
        className={"pe-drop" + (dragOver ? " pe-drop--over" : "")}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          uploadFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={(e) => uploadFiles(e.target.files)}
        />
        <div className="pe-drop__title">
          {busy ? "Yükleniyor…" : "Görselleri buraya sürükleyin veya tıklayın"}
        </div>
        <div className="pe-drop__hint">JPEG · PNG · WebP · maks. 8 MB</div>
      </div>

      {err && <div className="pe-img-err">{err}</div>}

      {images.length === 0 ? (
        <div className="pe-ph">Henüz görsel yok. İlk görseli yükleyin — ilk yüklenen otomatik kapak olur.</div>
      ) : (
        <div className="pe-imggrid">
          {images.map((img, i) => (
            <div key={img.id} className={"pe-imgcard" + (img.isMain ? " pe-imgcard--main" : "")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.alt ?? ""} className="pe-imgthumb" />
              {img.isMain && <span className="pe-imgbadge">Kapak</span>}
              <div className="pe-imgbar">
                <button
                  type="button"
                  title="Sola al"
                  disabled={busy || i === 0}
                  onClick={() => run(moveProductImage(img.id, "up"))}
                >
                  ◀
                </button>
                <button
                  type="button"
                  title="Sağa al"
                  disabled={busy || i === images.length - 1}
                  onClick={() => run(moveProductImage(img.id, "down"))}
                >
                  ▶
                </button>
                {!img.isMain && (
                  <button
                    type="button"
                    title="Kapak yap"
                    disabled={busy}
                    onClick={() => run(setMainProductImage(img.id))}
                  >
                    ★
                  </button>
                )}
                <button
                  type="button"
                  className="pe-imgdel"
                  title="Sil"
                  disabled={busy}
                  onClick={() => run(deleteProductImage(img.id))}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
