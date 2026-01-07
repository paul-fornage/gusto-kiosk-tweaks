import { build } from 'esbuild';
import { copy } from 'esbuild-plugin-copy';
import { existsSync, createWriteStream } from 'fs';
import { rm, mkdir, readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import archiver from "archiver";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isWatch = process.argv.includes('--watch');

const browsers = ['chrome', 'firefox'];

async function buildBrowser(browser) {
  const distDir = join(__dirname, 'dist', browser);
  const unzippedDistDir = join(distDir, 'unzipped');

  // Clean and create dist directory
  if (existsSync(distDir)) {
    await rm(distDir, { recursive: true, force: true });
  }
  await mkdir(unzippedDistDir, { recursive: true });

  // Handle Manifest
  const manifestContent = await readFile(join(__dirname, 'manifest.json'), 'utf-8');
  const manifest = JSON.parse(manifestContent);

  if (browser === 'chrome') {
    delete manifest.browser_specific_settings;
    if (manifest.background && manifest.background.scripts) {
      delete manifest.background.scripts;
    }
  } else if (browser === 'firefox') {
    if (manifest.background && manifest.background.service_worker) {
      delete manifest.background.service_worker;
    }
  }

  await writeFile(join(unzippedDistDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  const buildOptions = {
    entryPoints: [
      'src/content.ts',
      'src/background.ts',
      'src/options.ts',
    ],
    bundle: true,
    outdir: unzippedDistDir,
    format: 'iife',
    target: 'es2020',
    sourcemap: isWatch ? 'inline' : false,
    minify: !isWatch,
    plugins: [
      copy({
        resolveFrom: 'cwd',
        assets: [
          // Manifest is handled manually now
          { from: 'options.html', to: join(unzippedDistDir, 'options.html') },
          { from: 'icon16.png', to: join(unzippedDistDir, 'icon16.png') },
          { from: 'icon48.png', to: join(unzippedDistDir, 'icon48.png') },
          { from: 'icon128.png', to: join(unzippedDistDir, 'icon128.png') },
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
    console.log(`👀 Watching for changes (${browser})...`);
  } else {
    await build(buildOptions);
    console.log(`✅ Build completed successfully for ${browser}!`);

    // Zipping logic
    console.log(`📦 Zipping ${browser} extension...`);
    const zipFileName = `gusto-tweaks-${browser}.zip`;
    const output = createWriteStream(join(distDir, zipFileName));
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', function () {
      console.log(`🔒 Zip created for ${browser}: ${archive.pointer()} total bytes`);
    });

    archive.on('warning', function (err) {
      if (err.code === 'ENOENT') {
        console.warn(err);
      } else {
        throw err;
      }
    });

    archive.on('error', function (err) {
      throw err;
    });

    archive.pipe(output);
    archive.directory(unzippedDistDir, false);
    await archive.finalize();
  }
}

await Promise.all(browsers.map(buildBrowser));