/**
 * Conteúdo comercial verificado. Enquanto não houver dados e autorização, deixe vazio.
 * [PLACEHOLDER] Preencher só com nomes, resultados, preços, prazos e links confirmados.
 * Nunca usar os exemplos do briefing como prova social publicada.
 */
export const landingEvidence: {
  proof: { label: string; detail: string }[];
  cases: { title: string; challenge: string; result: string }[];
  testimonial: { quote: string; author: string; role: string } | null;
  founder: { name: string; role: string; photo: string } | null;
  linkedInUrl: string | null;
  integrationNodes: string[];
  durations: { product: string[]; service: string[] };
  plans: Record<string, { startingPrice: string; inclusions: string[] }>;
} = {
  proof: [],
  cases: [],
  testimonial: null,
  founder: null,
  linkedInUrl: null,
  integrationNodes: [],
  durations: { product: [], service: [] },
  plans: {},
};
