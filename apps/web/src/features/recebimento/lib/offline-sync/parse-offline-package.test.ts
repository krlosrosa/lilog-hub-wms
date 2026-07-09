import { describe, expect, it } from 'vitest';

import { encodeCompactQrPayload, extractCompactQrCandidates } from './compact-codec';
import { mergeBulkOfflineScans } from './parse-offline-package';

const CHUNK_2 = `KLS2ÇN4IgbiBcCMA0IEsAmUQE4BsBTALAQzQDMBjEePAF1QCYAGajAWloHZm0AVaADkgFZoMHADpu0NAC0yIAM6lIILACclAeyUzpAV1QBVAHKMAygFETAEWa1o0rADsoAbVCqoAZngAbVAGFVdwmUEJQACDFpraxxaNBCACmj6agFraABKW1QAeiUsYiwAIwQAW3sKVRksiLQsPD40NEY8bmbGHCxCakY0bmIkRj4camg+bgLiPALqNCyECntNeGLUAAUAeSMOaQAHKFBttSQtcoBJFAVwyOhotGkARy08OwpkPCQsACU8wteoaHD4Fo7K93gBZLBIX4KAzSTyqeZffJFJCuBSJajJaCpaRgPCeEFYGj0PiMLGk6AcCKQKkRYQRWhSeAHT7fIqlZ6qM6oaBIJAsFgMRp4HB9Nq0QaMbiEArcJosLDYYhoFjYPh8aTvYpPJBchQ8vkCjBCkX9aISqUyuUKvLK1XqgC+TIQTgAukylK74B7qfB5NAWNw3BhqG5WDgxB5ZKhlGoPY6XFAcF5UAAZErbPChPC4pQIPAyEL6-mCpomsXm6WyvDyxW2rBqzIKHKskplCpVGK1epClqy9qdbq9fqDYajcaTaZZbOZvOLEDLBTmEwpkwcEw7PYgZmIn7s07nEBFw3G0VmnCSytW2sq+vq+Ca7W6w+84tG0un8Xni1Vms2m8Nx0t2dSBHDdLdvVAr0oFoX0-gDIMQzDMQkyjBQY3UEB7TA4C4BABxIDce0gA`;

const CHUNK_3 = `KLS2ÇN4IgbiBcCMA0IEsAmUQE4BsBTALAQzQDMBjEePAF1QCYAGajAWloHZm0AVaADkgFZoMHADpu0NAC0yIAM6lIILACclAeyUzpAV1QBVAHKMAygFETAEWa1o0rADsoAbVCqofeABtUAQTB4lCHgABNBISCwsDGiMeDjESIw4tHw4jNyEAEbcMSxY2MRoLNh8fEF4fgF4jNAs3ADMGNTURXVo1KkZAI4AXjgA7rS2qAD0SljEWBkIALb2FKoyw7S0aFh4fGjReNzbiViE1Ixo3PGMKdTQfNwZxHgZ1GjD5f6BmvDTqAAKAPJGHNIABygoABaiQWnmAEkUAoMMtoNYkmhpB5VBQsKgkvRqAJrDZ4BQEADXApCAgZAhbtI7JQtGNunhUPMKHgvPBbloZIzSeo7OMsEh1NJOlo8HZCUg8EgsABhPAIAAeeE0kGo8BFYolUqwujsyG1Kto8ABAAs0aoZaotOKoGqQGMAR5Kf5Pv48BxVIKVYRWTIsMaxgAlflTWbi1TQ1ChcKRDBbOIJJIpNKZbJ4XL5QrFPjSaXTMVISMKaMRKIxBOJZKpdJZHJ5cZZrAlEAAX2NCCcOFgfAAugGnKAO5AuyASe4QIRUABrDwyI7YfBEYiMBDo6Z8RiEc0iABWAIA5tIqAoZnh91hhnusIf4EpUM9KowRVgtAKYhVAtVag0mi02h0en6QY20HNx4DHeBJwUGc50wXACBIFc1w3Ld5j4YQ9xvEBj0QfNz0vAFr2kO8FAfT9n1fBIyKqGp6kaZoMFadpGC6XoBlbPt7SgI0QHkWifzqVgcDEccVUUFQhRA0coAwTxUBMOwJhUfwgmIVQ7EIZQACvFMCEIwlLONy1OJNq1TOtMyKJsc3gDEFFGEMZjmBYlhWNYNi2HZshwfZDmOU5zkua5bnuR57CUpR-GkD4FE+XR-mNYEQFBLBgwmUNnKLEAS1jeMTKrFNa3TesCis5t4DzAsspystYny5MazTDMGzKnM22SodHE40EnE4kieL479GkElhhOgWTZFQZQ1DvFtOKHO0HEgOoWyAA`;

const CORRUPT_CHUNK_1 = `KLS2ÇN4IgbiBcCMA0IEsAmUQE4BsBTALAQzQDMBjEePAF1QCYAGajAWloHZm0AVaADkgFZoMHADpu0NAC0ygFE6lEWa1o0rADsoAbVCqocEABtUAYQAWWYgBrDwQZCgACaCQkFhYGNEY8HGIkRhxaPhxGbkIAI25ElixsYjQWbD4+W1QAeiUArFyEAFt7ClUZGtpaNCw8PjQEvG5htKxCakY0bhTGTOpoPm5c4jxc6jQa4n8gkLDpZtQABV0OaQAHKFAkVVWASRQFPlyAZhfiONzGFkIkJhxqDgNwWHAFMW4BQ+mhhmhaNhpPUZOdVHYZHgwFgPA8oNR4B48MR6qgMDgXtIHDwmucopAICgIVGaSCgELUrAALzwUAoSi0WHgqhuSgVSpVijCSooWiU8sgiuV8ExSEJeFckEIeA8MiwAF94OdfKp2t5VFo7FRIC8XfUAEoNJqtH2qHEKKIxOIYIbJVAOxeKLBNpFJZHL5QrFAJZrCVEDOkDnBBOOB4l4AXQDTlAnZgqrc8EIqGCMim2HwRGIjGFVOgjEI7tU0GEACtzgBzCmoFp4XdYGo7rD7+AahTbALBUIURil2Px2ZJmup+uZ8rNviMAlElgrawaOuKjiOIATgoU4zrmBAkZ8rIrmMAUNLGRAHgouKmiOIAqCGOU4z5PtAkIZxhWRMUVimuNu24HgoR4nme5wXoiqC3rsD5PtEZZxhWb7Vimdbg2pQ-p8jC5PSq4BL4eA3MBoF+uB7hQSAMGYHPExuWSRUcmtZphmjaMYSDLFUOKigtOo3Er9aeK¨)PybgsNwLwYNQLysDgYjuOKigqOo3EgNaeKeKgACC+p2ggcpKOEAp2IQy0aFd2M0CB4MIGDDg41jpMszqKsyUIYxG0HRD0fQDEMIwFDg4yTNMszzIsyyrOsmxLmiNRZdYuU9AcqumCYAfRYJgctrYFxXGO2QbFWG7TFs+OmVu+NGGfRTYtrm+aFgtZEvpRibUQZX7GdmwHtsOji2ec15XVeUAOWpTkuW5HksF50Ahb5yhqBqNnwMOj0OH6jpAA`;

describe('extractCompactQrCandidates', () => {
  it('separa múltiplos QRs colados no mesmo bip', () => {
    const bulk = `${CORRUPT_CHUNK_1}${CHUNK_2}${CHUNK_3}`;
    const parts = extractCompactQrCandidates(bulk);
    expect(parts.length).toBe(3);
  });
});

describe('mergeBulkOfflineScans', () => {
  it('reconhece chunks 2 e 3 sem montar pacote sem a parte 1', () => {
    const result = mergeBulkOfflineScans({
      raw: `${CHUNK_2}${CHUNK_3}`,
      currentPackage: null,
      chunks: [],
    });

    expect(result.package).toBeNull();
    expect(result.chunks).toHaveLength(2);
    expect(result.chunks.map((chunk) => chunk.i)).toEqual([1, 2]);
    expect(result.message).toContain('Falta rebipar QR(s): 1');
  });

  it('informa falha do QR 1 e mantém partes 2 e 3', () => {
    const result = mergeBulkOfflineScans({
      raw: `${CORRUPT_CHUNK_1}${CHUNK_2}${CHUNK_3}`,
      currentPackage: null,
      chunks: [],
    });

    expect(result.package).toBeNull();
    expect(result.chunks).toHaveLength(2);
    expect(result.chunks.map((chunk) => chunk.i)).toEqual([1, 2]);
    expect(result.errors.some((error) => error.startsWith('QR 1/3'))).toBe(true);
    expect(result.message).toContain('Falta rebipar QR(s): 1');
  });
});

describe('encode/decode roundtrip', () => {
  it('aceita sufixo repetido do leitor', () => {
    const encoded = encodeCompactQrPayload({
      v: 1,
      id: 'abc',
      at: '2026-07-09T00:00:00.000Z',
      sc: 'errors',
      i: 0,
      n: 1,
      en: [],
    });
    const noisy = `${encoded.replace('KLS2:', 'KLS2Ç')}LIXO`;
    const result = mergeBulkOfflineScans({
      raw: noisy,
      currentPackage: null,
      chunks: [],
    });
    expect(result.package).not.toBeNull();
  });
});
