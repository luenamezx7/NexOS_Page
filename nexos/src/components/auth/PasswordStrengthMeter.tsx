'use client';

import { evaluatePassword } from '@/lib/auth/password-strength';

const BAR_COLORS = [
  'bg-red-500/30',
  'bg-red-500',
  'bg-amber-500',
  'bg-lime-500',
  'bg-emerald-500',
] as const;

export function PasswordStrengthMeter({ password, id }: { password: string; id?: string }) {
  if (!password) return null;
  const { score, label, requirements } = evaluatePassword(password);
  return (
    <div id={id} className="space-y-2" aria-live="polite">
      <div className="flex gap-1" role="presentation">
        {BAR_COLORS.map((color, index) => (
          <span
            key={color}
            className={`h-1.5 flex-1 rounded-full transition-colors ${index < score || (score === 4 && index < 4) ? color : 'bg-ink/10'}`}
          />
        ))}
      </div>
      <p className="text-xs text-ink/70">
        Força da senha: <span className="font-medium text-ink">{label}</span>
      </p>
      <ul className="grid gap-1 text-xs text-ink/70 sm:grid-cols-2">
        {requirements.map((req) => (
          <li key={req.id} className={req.met ? 'text-emerald-600 dark:text-emerald-400' : undefined}>
            <span aria-hidden="true">{req.met ? '✓' : '○'}</span> {req.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
