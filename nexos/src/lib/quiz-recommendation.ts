import { LEAD_QUESTIONS } from './lead-quiz';

export type QuizSolution = 'plate' | 'menu' | 'site' | 'landing' | 'easychat';

export const QUIZ_SOLUTIONS: Record<QuizSolution, { title: string; reason: string; href: string; developing?: boolean }> = {
  plate: { title: 'Placa NFC + QR Code', reason: 'Um acesso rápido ao seu link pode ajudar quem já está no seu espaço a encontrar o próximo passo.', href: '/placa-nfc' },
  menu: { title: 'Cardápio digital', reason: 'Um cardápio fácil de abrir e consultar pode organizar a apresentação do que você oferece.', href: '/cardapio-digital' },
  site: { title: 'Site vitrine', reason: 'Um espaço próprio pode reunir seus serviços, trabalhos e formas de contato.', href: '/criacao-de-sites' },
  landing: { title: 'Landing page', reason: 'Uma página dedicada pode apresentar uma oferta e facilitar o contato de quem chega pela sua campanha.', href: '/landing-pages' },
  easychat: { title: 'EasyChat', reason: 'Organizar tarefas administrativas pelo WhatsApp pode liberar tempo para o atendimento. Essa solução ainda está em desenvolvimento; converse com a equipe sobre alternativas disponíveis.', href: '/#easychat', developing: true },
};

const weights: Record<string, Partial<Record<QuizSolution, number>>[]> = {
  challenge: [{ landing: 3, site: 1 }, { easychat: 4 }, { site: 3, menu: 1 }, { easychat: 4 }],
  contact: [{ plate: 3, menu: 1 }, { landing: 2, site: 1 }, { plate: 1, easychat: 1 }, { site: 2 }],
  friction: [{ site: 2, plate: 1 }, { menu: 2, site: 1 }, { menu: 2, easychat: 1 }, { plate: 2, landing: 1 }],
  presence: [{ plate: 2 }, { site: 2, landing: 1 }, { site: 2 }, { landing: 2, site: 1 }],
  goal: [{ menu: 4 }, { plate: 3 }, { plate: 2, landing: 1 }, { easychat: 4 }],
  place: [{ plate: 3, menu: 2 }, { plate: 3 }, { site: 2, landing: 2 }, { site: 1, plate: 1 }],
  priority: [{ landing: 3, plate: 1 }, { site: 3 }, { plate: 2, menu: 1 }, { easychat: 4 }],
  timing: [{}, {}, {}, {}],
};

/** An initial suggestion, not a diagnosis. Answers stay in the browser until the visitor opts in. */
export function recommendQuizSolution(answers: readonly number[]): QuizSolution {
  const scores: Record<QuizSolution, number> = { plate: 0, menu: 0, site: 0, landing: 0, easychat: 0 };
  LEAD_QUESTIONS.forEach((question, index) => {
    const choice = answers[index];
    const points = Number.isInteger(choice) ? weights[question.id]?.[choice] : undefined;
    if (points) for (const [solution, score] of Object.entries(points)) scores[solution as QuizSolution] += score;
  });
  return (Object.keys(scores) as QuizSolution[]).reduce((best, candidate) => scores[candidate] > scores[best] ? candidate : best, 'site');
}
