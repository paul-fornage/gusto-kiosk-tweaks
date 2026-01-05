import { build } from 'esbuild';
import { copy } from 'esbuild-plugin-copy';
import { existsSync } from 'fs';
import { rm, mkdir, readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isWatch = process.argv.includes('--watch');

// Clean and create dist directory
const distDir = join(__dirname, 'dist');
if (existsSync(distDir)) {
  await rm(distDir, { recursive: true, force: true });
}
await mkdir(distDir, { recursive: true });

const buildOptions = {
  entryPoints: [
    'src/content.ts',
    'src/background.ts',
    'src/options.ts',
  ],
  bundle: true,
  outdir: 'dist',
  format: 'iife',
  target: 'es2020',
  sourcemap: isWatch ? 'inline' : false,
  minify: !isWatch,
  plugins: [
    copy({
      resolveFrom: 'cwd',
      assets: [
        { from: 'manifest.json', to: 'dist/manifest.json' },
        { from: 'options.html', to: 'dist/options.html' },
      ],
      watch: isWatch,
    }),
  ],
};

if (isWatch) {
  const ctx = await build({
    ...buildOptions,
    logLevel: 'info',
  });

  await ctx.watch();
  console.log('👀 Watching for changes...');
} else {
  await build(buildOptions);
  console.log('✅ Build completed successfully!');
}
