import { Module } from '@nestjs/common';

import { RavexHttpClient } from '../clients/ravex/ravex-http.client.js';
import { RavexVeiculoClient } from '../clients/ravex/ravex-veiculo.client.js';
import { RavexViagemClient } from '../clients/ravex/ravex-viagem.client.js';

@Module({
  providers: [RavexHttpClient, RavexVeiculoClient, RavexViagemClient],
  exports: [RavexHttpClient, RavexVeiculoClient, RavexViagemClient],
})
export class RavexModule {}
