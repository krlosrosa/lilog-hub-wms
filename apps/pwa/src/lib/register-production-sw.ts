import { toast } from 'sonner';
import { registerSW } from 'virtual:pwa-register';

export function registerProductionServiceWorker(): void {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      toast('Nova versão disponível', {
        description: 'Toque para atualizar o app com as últimas alterações.',
        duration: Infinity,
        action: {
          label: 'Atualizar',
          onClick: () => {
            void updateSW(true);
          },
        },
      });
    },
  });
}
