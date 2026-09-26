'use client';

import * as React from 'react';

type Toast = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

const toastQueue: Toast[] = [];
let totalToastCount = 0;

const toast = (config: Toast) => {
  const id = `${totalToastCount++}-${Date.now()}`;
  const duration = 5000; // 5 seconds

  const timeout = setTimeout(() => {
    // Toast auto-removed after duration
  }, duration);

  return () => {
    clearTimeout(timeout);
  };
};

export { toast };