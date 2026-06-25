/** Docas disponíveis no pátio (alinhado ao total de 20 docas na lista de demandas). */
export const AVAILABLE_DOCKS = Array.from({ length: 20 }, (_, index) => {
  const number = String(index + 1).padStart(2, '0');
  return `Doca ${number}`;
}) as readonly string[];

export const DOCK_SELECT_OPTIONS = AVAILABLE_DOCKS.map((dock) => ({
  value: dock,
  label: dock,
}));
