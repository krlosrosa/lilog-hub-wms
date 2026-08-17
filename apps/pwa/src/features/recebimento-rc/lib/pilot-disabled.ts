import { toast } from 'sonner';

export function notifyPilotDisabled(feature: string) {
  toast.message('Fora do piloto RC', {
    description: `${feature} ainda não está disponível nesta versão.`,
  });
}
