'use client';

import { Suspense } from 'react';
import SuccessContent from './SuccessContent';

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-current border-t-transparent mx-auto mb-4" />
          <p>Carregando...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}