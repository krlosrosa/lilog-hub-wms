import { Injectable } from '@nestjs/common';

import { RavexVeiculoClient } from '../../../infra/clients/ravex/ravex-veiculo.client.js';

@Injectable()
export class ListTiposVeiculoRavexUseCase {
  constructor(private readonly ravexVeiculoClient: RavexVeiculoClient) {}

  async execute() {
    const tipos = await this.ravexVeiculoClient.listTiposVeiculo();

    return tipos.map((tipo) => ({
      id: tipo.id,
      nome: tipo.nome ?? '',
      peso: tipo.peso ?? 0,
      cubagem: tipo.cubagem ?? 0,
      tara: tipo.tara ?? 0,
    }));
  }
}
