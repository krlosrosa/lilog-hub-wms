import type {
  ArmazemLayoutElementoTipo,
  SaveArmazemLayoutInput,
} from '../../model/armazem-layout/armazem-layout.model.js';
import type { EnderecoStatus } from '../../model/endereco/endereco.model.js';

export const ARMAZEM_LAYOUT_REPOSITORY = 'IArmazemLayoutRepository';

export type ArmazemLayoutElementRecord = {
  id: string;
  clientKey: string;
  type: ArmazemLayoutElementoTipo;
  gx: number;
  gy: number;
  gw: number;
  gh: number;
  label: string;
  levels: number | null;
  zona: string | null;
  ordem: number;
};

export type ArmazemLayoutSlotRecord = {
  id: string;
  elementoId: string;
  elementClientKey: string;
  slotIndex: number;
  nivel: number;
  enderecoId: string | null;
};

export type ArmazemLayoutRecord = {
  id: string;
  unidadeId: string;
  nome: string;
  gridCols: number;
  gridRows: number;
  versao: number;
  publicadoEm: Date | null;
  elements: ArmazemLayoutElementRecord[];
  slots: ArmazemLayoutSlotRecord[];
  createdAt: Date;
  updatedAt: Date;
};

export type ArmazemLayoutSlotOcupacaoRecord = ArmazemLayoutSlotRecord & {
  endereco: {
    id: string;
    enderecoMascarado: string;
    zona: string;
    rua: string;
    posicao: string;
    nivel: string;
    status: EnderecoStatus;
    ocupacaoPercent: string;
  } | null;
};

export type ArmazemLayoutOcupacaoRecord = Omit<ArmazemLayoutRecord, 'slots'> & {
  slots: ArmazemLayoutSlotOcupacaoRecord[];
};

export interface IArmazemLayoutRepository {
  findByUnidadeId(unidadeId: string): Promise<ArmazemLayoutRecord | null>;
  save(input: SaveArmazemLayoutInput): Promise<ArmazemLayoutRecord>;
  findOcupacaoByUnidadeId(
    unidadeId: string,
  ): Promise<ArmazemLayoutOcupacaoRecord | null>;
  vincularSlotEndereco(
    slotId: string,
    enderecoId: string | null,
  ): Promise<ArmazemLayoutSlotRecord | null>;
}
