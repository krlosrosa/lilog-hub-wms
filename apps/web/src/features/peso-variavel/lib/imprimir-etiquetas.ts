export function aguardarRenderImpressao(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 100);
      });
    });
  });
}

export async function dispararImpressaoEtiquetas(): Promise<void> {
  await aguardarRenderImpressao();
  window.print();
}
