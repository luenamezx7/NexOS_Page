import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MetallicSurface } from '@/components/ui/metallic-button';

export default function NotFound() {
  return <main className="page-surface flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
    <div className="absolute right-6 top-6"><ThemeToggle /></div>
    <span className="digital-label text-sm text-muted-foreground">NexOS / 404</span>
    <h1 className="brand-heading text-4xl sm:text-6xl">Página não encontrada.</h1>
    <p className="max-w-sm">Este endereço não está disponível. Volte ao site para encontrar as soluções NexOS.</p>
    <Link href="/" className="btn-primary-nex"><MetallicSurface /><span className="metallic-content inline-flex items-center gap-2"><ArrowLeft size={16} /> Voltar ao site</span></Link>
  </main>;
}
