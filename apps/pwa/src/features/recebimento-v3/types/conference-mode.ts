export type ConferenceMode = 'online' | 'offline';

export type FinalizationStep =
  | 'validate_connection'
  | 'build_payload'
  | 'submit_conference'
  | 'upload_photos'
  | 'cleanup';

export type FinalizationProgress = {
  step: FinalizationStep;
  label: string;
  photoProgress?: {
    uploaded: number;
    total: number;
    failed: number;
  };
};

export class NetworkRequiredError extends Error {
  constructor(message = 'É necessário conexão com a internet para continuar.') {
    super(message);
    this.name = 'NetworkRequiredError';
  }
}

export class OfflineFinalizationError extends Error {
  constructor(
    message: string,
    public readonly step: FinalizationStep,
  ) {
    super(message);
    this.name = 'OfflineFinalizationError';
  }
}
