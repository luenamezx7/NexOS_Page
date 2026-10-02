'use client';

import MetallicButton, { type MetallicButtonProps } from './metallic-button';

export default function MetallicButtonDemo(props: MetallicButtonProps) {
  return <div className="flex min-h-48 items-center justify-center bg-background p-6"><MetallicButton label="Iniciar projeto" {...props} /></div>;
}
