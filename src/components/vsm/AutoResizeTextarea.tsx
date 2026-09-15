'use client';

import React, { useRef, useEffect, useCallback } from 'react';

export interface AutoResizeTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number;
  maxHeight?: number;
}

export const AutoResizeTextarea: React.FC<AutoResizeTextareaProps> = ({
  value,
  minRows = 1,
  maxHeight,
  className = '',
  onChange,
  onInput,
  style,
  ...props
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;

    // Reset height temporarily so scrollHeight calculates correctly when shrinking
    el.style.height = 'auto';

    let nextHeight = el.scrollHeight;
    if (maxHeight && nextHeight > maxHeight) {
      nextHeight = maxHeight;
      el.style.overflowY = 'auto';
    } else {
      el.style.overflowY = 'hidden';
    }

    el.style.height = `${nextHeight}px`;
  }, [maxHeight]);

  useEffect(() => {
    resize();
  }, [value, resize]);

  useEffect(() => {
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [resize]);

  return (
    <textarea
      ref={textareaRef}
      rows={minRows}
      value={value}
      onChange={e => {
        onChange?.(e);
        resize();
      }}
      onInput={e => {
        onInput?.(e);
        resize();
      }}
      style={style}
      className={`resize-none [field-sizing:content] ${className}`}
      {...props}
    />
  );
};
