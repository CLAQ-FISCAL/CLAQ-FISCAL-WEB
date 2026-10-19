import { build } from 'esbuild';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';

const lambdas = {
  api: 'src/api.ts',
  reminders: 'src/workers/reminders.ts',
  notifier: 'src/workers/notifier.ts',
  migrator: 'src/workers/migrator.ts',
  seed: 'src/workers/seed.ts',
};

rmSync('dist', { recursive: true, force: true });

for (const [name, entry] of Object.entries(lambdas)) {
  await build({
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    target: 'node22',
    format: 'cjs',
    outfile: `dist/lambdas/${name}/index.js`,
    external: ['@prisma/client', '.prisma', 'pg-native'],
    sourcemap: false,
    logLevel: 'warning',
    legalComments: 'none',
  });
}

// In an npm workspace the generated Prisma client is hoisted to the workspace root, so
// node_modules/.prisma is not necessarily a sibling of this script. Walk up until found.
function resolveModulesDir() {
  let dir = process.cwd();
  for (;;) {
    const candidate = join(dir, 'node_modules');
    if (existsSync(join(candidate, '.prisma'))) return candidate;
    const parent = dirname(dir);
    if (parent === dir) throw new Error('Could not locate a node_modules directory containing the generated Prisma client. Run `prisma generate` first.');
    dir = parent;
  }
}

// Ship the generated Prisma client + the rhel engine (Lambda target) with every DB-backed lambda.
// Native (windows/darwin) engines are for local dev only and are stripped from the bundle.
const modulesDir = resolveModulesDir();
for (const name of ['api', 'reminders', 'notifier']) {
  const nodeModules = join('dist', 'lambdas', name, 'node_modules');
  mkdirSync(nodeModules, { recursive: true });
  cpSync(join(modulesDir, '.prisma'), join(nodeModules, '.prisma'), { recursive: true });
  cpSync(join(modulesDir, '@prisma', 'client'), join(nodeModules, '@prisma', 'client'), { recursive: true });
  const clientDir = join(nodeModules, '.prisma', 'client');
  for (const file of readdirSync(clientDir)) {
    if (file.includes('windows') || file.includes('darwin')) rmSync(join(clientDir, file));
  }
}

cpSync('prisma/migrations', join('dist', 'lambdas', 'migrator', 'migrations'), { recursive: true });
console.log('lambdas built to dist/');
