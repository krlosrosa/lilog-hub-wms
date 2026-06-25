'use client';

import QRCode from 'react-qr-code';

import { cn } from '@lilog/ui';

type MapaSeparacaoQrProps = {
  value: string;
  label?: string;
  size?: number;
  className?: string;
  variant?: 'default' | 'inline';
};

export function MapaSeparacaoQr({
  value,
  label,
  size = 72,
  className,
  variant = 'default',
}: MapaSeparacaoQrProps) {
  const qr = (
    <QRCode
      value={value}
      size={size}
      bgColor="#FFFFFF"
      fgColor="#000000"
      level="M"
      title={label ?? value}
    />
  );

  if (variant === 'inline') {
    return (
      <span
        className={cn(
          'inline-block align-middle leading-none',
          className,
        )}
      >
        <span className="inline-block rounded-sm border border-outline-variant bg-white p-0.5">
          {qr}
        </span>
      </span>
    );
  }

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className="rounded-sm border border-outline-variant bg-white p-1">
        {qr}
      </div>
      {label && (
        <span className="max-w-[88px] text-center text-[9px] font-mono text-muted-foreground">
          {label}
        </span>
      )}
    </div>
  );
}
