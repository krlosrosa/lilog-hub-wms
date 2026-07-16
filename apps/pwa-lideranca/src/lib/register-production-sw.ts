import { registerSW } from 'virtual:pwa-register';

export function registerProductionServiceWorker(): void {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      if (window.confirm('Nova versão disponível. Atualizar o app agora?')) {
        void updateSW(true);
      }
    },
  });
}
