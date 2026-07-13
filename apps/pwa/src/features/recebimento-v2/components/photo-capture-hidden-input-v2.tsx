import type { ChangeEventHandler, RefObject } from 'react';

interface PhotoCaptureHiddenInputV2Props {
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: ChangeEventHandler<HTMLInputElement>;
}

export function PhotoCaptureHiddenInputV2({
  inputRef,
  onChange,
}: PhotoCaptureHiddenInputV2Props) {
  return (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      capture="environment"
      className="hidden"
      onChange={onChange}
      aria-hidden
    />
  );
}
