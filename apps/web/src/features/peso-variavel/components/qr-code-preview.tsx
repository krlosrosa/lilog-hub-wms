'use client';

import QRCode from 'react-qr-code';

import { cn } from '@lilog/ui';

export type QrCodePreviewProps = {
  value: string;
  className?: string;
  title?: string;
  qrSize?: number;
};

export function QrCodePreview({
  value,
  className,
  title,
  qrSize,
}: QrCodePreviewProps) {
  const size = qrSize ?? 256;
  const fixedSize = qrSize !== undefined;

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-sm border border-outline-variant bg-white p-0.5',
        !fixedSize && 'h-full self-stretch',
        className,
      )}
      role="img"
      aria-label={title ?? `QR code ${value}`}
    >
      <QRCode
        value={value}
        size={size}
        bgColor="#FFFFFF"
        fgColor="#000000"
        level="M"
        title={title ?? value}
        className={fixedSize ? undefined : '!h-full !w-auto'}
        style={fixedSize ? undefined : { height: '100%', width: 'auto' }}
      />
    </div>
  );
}
