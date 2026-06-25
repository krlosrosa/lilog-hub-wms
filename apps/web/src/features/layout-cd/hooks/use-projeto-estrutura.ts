'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { MOCK_TEMPLATES } from '@/features/layout-cd/mocks/layout-cd.mock';
import type { ProjectTemplate } from '@/features/layout-cd/types/layout-cd.schema';

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function useProjetoEstrutura() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );

  const templates: ProjectTemplate[] = MOCK_TEMPLATES;

  const startFromScratch = useCallback(async () => {
    setIsLoading(true);
    await delay(400);
    setIsLoading(false);
    router.push('/layout-cd/construtor');
  }, [router]);

  const importCad = useCallback(async () => {
    setIsLoading(true);
    await delay(600);
    setIsLoading(false);
    return { success: true as const, message: 'Selecione um arquivo CAD ou PDF' };
  }, []);

  const selectTemplate = useCallback(
    async (templateId: string) => {
      setSelectedTemplateId(templateId);
      setIsLoading(true);
      await delay(500);
      setIsLoading(false);
      router.push('/layout-cd/construtor');
    },
    [router],
  );

  const openArmazem = useCallback(() => {
    router.push('/layout-cd/armazem');
  }, [router]);

  return {
    isLoading,
    templates,
    selectedTemplateId,
    startFromScratch,
    importCad,
    selectTemplate,
    openArmazem,
  };
}
