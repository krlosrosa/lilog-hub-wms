import type { ReactNode } from 'react';

export default function ImprimirMapasLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="print-layout">{children}</div>;
}
