// Pass-through root layout — the actual <html> is rendered by
// [locale]/layout.tsx (public, locale-aware) and admin/layout.tsx (admin, TR fixed).
// Next.js allows this multi-root pattern; each subtree owns its own <html>.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
