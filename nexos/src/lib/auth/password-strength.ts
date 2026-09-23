export interface PasswordRequirement {
  id: string;
  label: string;
  met: boolean;
}

export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  acceptable: boolean;
  requirements: PasswordRequirement[];
}

const STRENGTH_LABELS = ['Muito fraca', 'Fraca', 'Razoável', 'Forte', 'Excelente'] as const;

export function evaluatePassword(password: string): PasswordStrengthResult {
  const requirements: PasswordRequirement[] = [
    { id: 'length', label: 'Pelo menos 12 caracteres', met: password.length >= 12 },
    { id: 'lower', label: 'Uma letra minúscula', met: /[a-z]/.test(password) },
    { id: 'upper', label: 'Uma letra maiúscula', met: /[A-Z]/.test(password) },
    { id: 'number', label: 'Um número', met: /\d/.test(password) },
    { id: 'symbol', label: 'Um símbolo (ex.: !@#$%)', met: /[^\w\s]/.test(password) },
  ];
  const metCount = requirements.filter((r) => r.met).length;
  const acceptable = metCount === requirements.length;
  const score: PasswordStrengthResult['score'] = !password
    ? 0
    : acceptable
      ? 4
      : metCount >= 4
        ? 3
        : metCount === 3
          ? 2
          : metCount === 2
            ? 1
            : 0;
  return { score, label: STRENGTH_LABELS[score], acceptable, requirements };
}
