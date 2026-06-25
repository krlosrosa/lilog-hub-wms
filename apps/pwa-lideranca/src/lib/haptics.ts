function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

export function hapticLight(): void {
  vibrate(10);
}

export function hapticMedium(): void {
  vibrate(25);
}

export function hapticError(): void {
  vibrate([40, 30, 40]);
}
