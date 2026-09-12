"use client";

import Image from "next/image";
import Link from "next/link";


export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col justify-between selection:bg-white selection:text-black">
      {/* Header / Navbar */}
      <header className="w-full mx-auto px-16 py-1 flex justify-start items-center border-b border-neutral-800">
    

      <Image 
  src="/logo_nexOS.png" 
  alt="NexOS Logo" 
  width={150} 
  height={40} 
  priority
  className="w-50 h-35 object-contain [image-rendering:pixelated] scale-x-145 scale-y-75 origin-left"
   
/>

    <nav className="flex items-center gap-6 ml-auto">
          <Link href="#features" className="text-sm text-neutral-400 hover:text-white transition-colors">
            Recursos
          </Link>
          <Link href="#about" className="text-sm text-neutral-400 hover:text-white transition-colors">
            Sobre
          </Link>
          <Link 
            href="#docs" 
            className="text-xs uppercase tracking-wider px-4 py-2 border border-white hover:bg-white hover:text-black transition-all"
          >
            Acessar
          </Link>
          <div className="flex gap-4">
          
        </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="w-full max-w-5xl mx-auto px-6 py-24 flex flex-col items-center text-center">
        <div className="inline-block px-3 py-1 mb-6 text-xs uppercase tracking-widest border border-neutral-800 bg-neutral-950 text-neutral-400">
          O Futuro dos Sistemas Operacionais
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 max-w-4xl leading-tight">
          Sua infraestrutura de software em um único ecossistema.
        </h1>

        <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mb-10 leading-relaxed">
          O <strong className="text-white">NexOS</strong> entrega performance máxima, interface minimalista e arquitetura SEO-friendly para aplicações escaláveis.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link 
            href="#get-started" 
            className="px-8 py-3 bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-colors"
          >
            Começar Agora
          </Link>
          <Link 
            href="#features" 
            className="px-8 py-3 border border-neutral-800 text-neutral-300 font-semibold text-sm hover:border-neutral-500 transition-colors"
          >
            Ver Documentação
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full mx-auto px-20 py-6 border-t border-neutral-800 flex flex-col sm:flex-row justify-between items-center text-xs text-neutral-500 gap-4">
        <p>© {new Date().getFullYear()} NexOS. Todos os direitos reservados.</p>
        <div className="flex gap-4">
          <Link href="#" className="hover:text-white transition-colors">Privacidade</Link>
          <Link href="#" className="hover:text-white transition-colors">Termos</Link>
          <Link href="#" className="hover:text-white transition-colors">GitHub</Link>
        </div>
      </footer>
    </div>
  );
}
