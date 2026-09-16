'use client';

import { motion, useReducedMotion, type Variants } from 'motion/react';
import { Quote } from 'lucide-react';
import { config } from '@/config';
import type { Testimonial } from '@/types';

const FLUID_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const STAGGER_PARENT: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

const RELIEF_CHILD: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.8, ease: FLUID_EASE },
  },
};

interface TestimonialCardProps {
  testimonial: Testimonial;
  reduceMotion: boolean;
}

function TestimonialCard({ testimonial, reduceMotion }: TestimonialCardProps) {
  const initials: string = testimonial.author
    .split(' ')
    .map((n: string) => n[0])
    .join('');

  return (
    <motion.article
      variants={reduceMotion ? undefined : RELIEF_CHILD}
      initial={reduceMotion ? { opacity: 0 } : undefined}
      whileInView={reduceMotion ? { opacity: 1 } : undefined}
      viewport={{ once: true, amount: 0.25 }}
      transition={reduceMotion ? { duration: 0.4 } : undefined}
      whileHover={reduceMotion ? undefined : { y: -5 }}
      className="bento-card will-change-transform flex flex-col p-7 transition-colors duration-300 hover:border-white/25 md:p-8"
      aria-label={`Depoimento de ${testimonial.author}`}
    >
      <Quote size={28} strokeWidth={1.5} className="mb-5 text-[#ff2e6a]" aria-hidden="true" />

      <blockquote className="mb-7">
        <p className="text-[15px] leading-relaxed text-white/80">
          &ldquo;{testimonial.content}&rdquo;
        </p>
      </blockquote>

      <footer className="mt-auto flex flex-row items-center gap-3.5 border-t border-white/10 pt-5">
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.05] font-mono text-xs font-semibold text-white"
          aria-hidden="true"
        >
          {initials}
        </div>
        <div className="flex min-w-0 flex-col">
          <cite className="truncate text-sm font-semibold not-italic text-white">{testimonial.author}</cite>
          <p className="truncate text-xs text-white/50">
            {testimonial.role} · {testimonial.company}
          </p>
        </div>
      </footer>
    </motion.article>
  );
}

interface TestimonialsProps {
  className?: string;
}

export function Testimonials({ className = '' }: TestimonialsProps) {
  const reduce = useReducedMotion() ?? false;

  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-title"
      className={`relative border-t border-white/10 bg-[#050505] ${className}`}
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-24 md:px-8 md:py-32">
        <motion.header
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.98 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, ease: FLUID_EASE }}
          className="mb-12 max-w-2xl will-change-transform md:mb-16"
        >
          <h2 id="testimonials-title" className="flex flex-row items-start gap-3 text-white">
            <span className="pink-marker mt-[0.28em]" aria-hidden="true" />
            Cases &amp; Depoimentos
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/70 md:text-lg">
            Resultados reais de times que confiaram na gente para construir seus produtos.
          </p>
        </motion.header>

        <motion.div
          variants={reduce ? undefined : STAGGER_PARENT}
          initial={reduce ? { opacity: 0 } : 'hidden'}
          whileInView={reduce ? { opacity: 1 } : 'show'}
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3"
          role="list"
          aria-label="Depoimentos de clientes"
        >
          {config.testimonials.map((testimonial: Testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} reduceMotion={reduce} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
