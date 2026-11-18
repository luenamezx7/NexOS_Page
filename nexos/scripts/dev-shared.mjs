import { execFileSync, spawn } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Both editors must serve the same checkout, env files and Next.js cache.
const currentApp = realpathSync(join(dirname(fileURLToPath(import.meta.url)), '..'));
const worktrees = execFileSync('git', ['worktree', 'list', '--porcelain', '-z'], {
  cwd: currentApp, encoding: 'utf8',
});
// Git lists the primary worktree first. Its identity is the directory, not its
// current branch: a reviewed design branch must use the same local in both IDEs.
const primary = worktrees.split('\0')[0];
if (!primary?.startsWith('worktree ')) {
  console.error('Não foi possível identificar o checkout principal compartilhado.');
  process.exit(1);
}
const app = realpathSync(join(primary.slice('worktree '.length), 'nexos'));
const next = join(app, 'node_modules/next/dist/bin/next');
if (!existsSync(next)) {
  console.error(`Instale as dependências com npm ci em: ${app}`);
  process.exit(1);
}
// An explicit port prevents Next.js from silently opening a second local on 3001.
const args = process.argv.slice(2);
if (args.some(arg => !['--webpack', '--turbopack', '--turbo'].includes(arg))) {
  console.error('O local compartilhado usa http://localhost:3000. Não altere a porta ou a origem.');
  process.exit(1);
}
console.log(`Local compartilhado: http://localhost:3000\nPasta para editar no Cursor e no Orca: ${app}`);
if (app !== currentApp) console.warn('Esta é uma worktree separada. Abra a pasta acima para editar a versão exibida.');
const child = spawn(process.execPath, ['--use-system-ca', next, 'dev', '--port', '3000', ...args], {
  cwd: app,
  stdio: 'inherit',
  env: { ...process.env, SITE_URL: 'http://localhost:3000', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000' },
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
