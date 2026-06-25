'use client';

import dynamic from 'next/dynamic';

const ConstrutorView = dynamic(
  () => import('@/features/layout-cd').then((mod) => mod.ConstrutorView),
  {
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="text-sm text-muted-foreground">
          Carregando construtor...
        </span>
      </div>
    ),
    ssr: false,
  },
);

export default function LayoutCdConstrutorPage() {
  return <ConstrutorView />;
}
