import { describe, expect, it } from 'vitest';

import {
  areTemperaturasBauCompletas,
  countTemperaturasPreenchidas,
} from './temperatura-bau-v2';

describe('temperatura-bau-v2', () => {
  it('counts only required etapas with valid temperature', () => {
    expect(
      countTemperaturasPreenchidas([
        { etapa: 'inicio', temperatura: -18 },
        { etapa: 'meio', temperatura: -17.5 },
      ]),
    ).toBe(2);
  });

  it('requires all three etapas to be complete', () => {
    expect(
      areTemperaturasBauCompletas([
        { etapa: 'inicio', temperatura: -18 },
        { etapa: 'meio', temperatura: -17.5 },
        { etapa: 'fim', temperatura: -18.2 },
      ]),
    ).toBe(true);

    expect(
      areTemperaturasBauCompletas([
        { etapa: 'inicio', temperatura: -18 },
        { etapa: 'fim', temperatura: -18.2 },
      ]),
    ).toBe(false);
  });
});
