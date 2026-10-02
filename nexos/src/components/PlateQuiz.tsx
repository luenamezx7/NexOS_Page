'use client';

import { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, RotateCcw } from 'lucide-react';
import { FieldGroup, FieldLegend, FieldSet } from './ui/field';
import { config } from '@/config';
import styles from './commerce/Interactions.module.css';
import { MetallicButton } from './ui/metallic-button';

const QUESTIONS = [
  { title: 'O que seu cliente precisa acessar?', options: [
    { id: 'menu', label: 'Meu cardápio', detail: 'Pedidos e escolhas mais simples' },
    { id: 'portfolio', label: 'Meu trabalho', detail: 'Portfólio, serviços e projetos' },
    { id: 'contact', label: 'Meus contatos', detail: 'WhatsApp, redes e links' },
  ] },
  { title: 'Onde a conexão vai acontecer?', options: [
    { id: 'counter', label: 'No balcão', detail: 'Um ponto de contato central' },
    { id: 'tables', label: 'Nas mesas', detail: 'Acesso em vários pontos' },
    { id: 'reception', label: 'Na recepção', detail: 'Sua marca na primeira impressão' },
  ] },
];
const DESTINATIONS: Record<string, string> = { menu: 'Cardápio conectado', portfolio: 'Portfólio sempre à mão', contact: 'Seus contatos em um toque' };
const LOCATIONS: Record<string, string> = { counter: 'balcão', tables: 'mesas', reception: 'recepção' };

export function PlateQuiz() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(['', '']);
  const interacted = useRef(false);
  // Focus after the incoming step mounts, rather than the outgoing exit frame.
  const headingRef = useCallback((element: HTMLHeadingElement | null) => {
    if (element && interacted.current) element.focus({ preventScroll: true });
  }, []);
  const question = QUESTIONS[step];
  const done = step === QUESTIONS.length;
  const recommendation = DESTINATIONS[answers[0]];
  const url = `https://wa.me/${config.whatsapp.number}?text=${encodeURIComponent(`Olá! Fiz o quiz da Placa NexOS. Quero ${recommendation?.toLowerCase()} para ${LOCATIONS[answers[1]]}. Podemos conversar?`)}`;
  const move = (next: number) => { interacted.current = true; setStep(next); };

  return (
    <aside className={styles.quiz} aria-label="Descubra como usar sua placa">
      <div className={styles.quizTop}>
        <span className={styles.mono}>Encontre seu uso ideal</span>
        <span className={styles.mono}>{done ? 'Concluído' : `0${step + 1} / 02`}</span>
      </div>
      <div className={styles.progress} aria-hidden="true"><span style={{ transform: `scaleX(${done ? 1 : (step + 1) / 3})` }} /></div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={step} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          <h3 ref={headingRef} tabIndex={-1} className={styles.quizHeading}>{done ? recommendation : question.title}</h3>
          {done ? (
            <div className={styles.result}>
              <p>{answers[1] === 'counter' ? 'No balcão' : answers[1] === 'tables' ? 'Nas mesas' : 'Na recepção'}, sua placa conecta o cliente ao {answers[0] === 'menu' ? 'cardápio' : answers[0] === 'portfolio' ? 'portfólio' : 'seu conjunto de links'} por NFC ou QR Code.</p>
              <p className={styles.resultNote}>Sugestão inicial. A personalização é alinhada com a equipe NexOS.</p>
              <a href={url} target="_blank" rel="noopener noreferrer" className={styles.resultLink}>Personalizar minha placa <ArrowRight size={16} aria-hidden="true" /></a>
              <button type="button" className={styles.reset} onClick={() => { setAnswers(['', '']); move(0); }}><RotateCcw size={14} aria-hidden="true" /> Refazer quiz</button>
            </div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); if (answers[step]) move(step + 1); }}>
              <FieldSet>
                <FieldLegend className="sr-only">{question.title}</FieldLegend>
                <FieldGroup className={styles.choices}>
                  {question.options.map(option => (
                    <label key={option.id} className={styles.choice} data-selected={answers[step] === option.id}>
                      <input type="radio" name={`plate-question-${step}`} value={option.id} checked={answers[step] === option.id} onChange={() => setAnswers(current => current.map((answer, index) => index === step ? option.id : answer))} />
                      <span><strong>{option.label}</strong><small>{option.detail}</small></span>
                      <span className={styles.choiceCheck} aria-hidden="true">{answers[step] === option.id && <Check size={14} />}</span>
                    </label>
                  ))}
                </FieldGroup>
              </FieldSet>
              <div className={styles.quizActions}>
                {step > 0 ? <button type="button" onClick={() => move(step - 1)} className={styles.back}><ArrowLeft size={14} aria-hidden="true" /> Voltar</button> : <span className={styles.mono}>Duas perguntas. Sem cadastro.</span>}
                <MetallicButton type="submit" disabled={!answers[step]} className={styles.next}>{step === 1 ? 'Ver sugestão' : 'Continuar'}<ArrowRight size={16} aria-hidden="true" /></MetallicButton>
              </div>
            </form>
          )}
        </motion.div>
      </AnimatePresence>
    </aside>
  );
}
