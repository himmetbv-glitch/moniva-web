import type { ReactNode } from "react";

import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import "./auth.css";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="auth-page">
      <SiteHeader />

      <section className="au-wrap">
        <div className="au-card">
          <div className="au-head">
            <h1 className="au-title">{title}</h1>
            <p className="au-sub">{subtitle}</p>
          </div>
          {children}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
