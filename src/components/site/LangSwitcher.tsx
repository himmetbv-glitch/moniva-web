"use client";

import { useState } from "react";

import { LANGS, ACTIVE_LANG } from "./lang-items";

export function LangSwitcher() {
  const [open, setOpen] = useState(false);
  const active = ACTIVE_LANG;

  return (
    <div className="sh-lang">
      <button
        type="button"
        className={`sh-lang-btn${open ? " open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <svg viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3" />
          <ellipse cx="7" cy="7" rx="2.8" ry="6" stroke="currentColor" strokeWidth="1.3" />
          <line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        <span className="code">{active}</span>
        <svg
          viewBox="0 0 10 10"
          fill="none"
          style={{ width: 10, height: 10, transform: open ? "rotate(180deg)" : "none" }}
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="sh-lang-menu" role="listbox">
          {LANGS.map((l) =>
            l.ready ? (
              <button
                key={l.code}
                type="button"
                className={active === l.code ? "active" : ""}
                onClick={() => setOpen(false)}
              >
                <span className="lname">{l.label}</span>
                <span className="lcode">{l.code}</span>
              </button>
            ) : (
              <span key={l.code} className="lang-soon" title="Yakında">
                <span className="lname">{l.label}</span>
                <span className="lcode">Yakında</span>
              </span>
            ),
          )}
        </div>
      )}
    </div>
  );
}
