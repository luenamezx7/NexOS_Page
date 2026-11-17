'use client';

import ArrowFillButton from './arrow-fill-button';

export default function ArrowFillButtonDemo() {
  return <div className="flex min-h-64 w-full items-center justify-center p-12">
    <ArrowFillButton btnText="Hover me" href="https://vault.hyperiux.com" onClick={event => event.preventDefault()} />
  </div>;
}
