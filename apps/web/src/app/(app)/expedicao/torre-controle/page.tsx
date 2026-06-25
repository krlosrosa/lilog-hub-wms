import dynamic from 'next/dynamic';

const TorreControleExpedicaoView = dynamic(
  () =>
    import(
      '@/features/torre-controle-expedicao/views/torre-controle-expedicao-view'
    ).then((mod) => mod.TorreControleExpedicaoView),
  {
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="text-sm text-muted-foreground">
          Carregando torre de controle...
        </span>
      </div>
    ),
    ssr: false,
  },
);

export default function TorreControleExpedicaoPage() {
  return <TorreControleExpedicaoView />;
}
