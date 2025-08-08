import { rmSync, mkdirSync, cpSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import Babel from '@babel/standalone';

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });

cpSync('public', 'dist', { recursive: true });
// transpile JS sources to strip JSX for browser compatibility
function transpileDir(srcDir, destDir) {
  mkdirSync(destDir, { recursive: true });
  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      transpileDir(srcPath, destPath);
    } else if (entry.name.endsWith('.js')) {
      const code = readFileSync(srcPath, 'utf8');
      const out = Babel.transform(code, { presets: ['react'] }).code;
      writeFileSync(destPath, out);
    } else {
      cpSync(srcPath, destPath);
    }
  }
}
transpileDir('js', 'dist/js');
cpSync('css', 'dist/css', { recursive: true });
cpSync('images', 'dist/images', { recursive: true });
cpSync('sounds', 'dist/sounds', { recursive: true });

const env = (process.env.CONFIG_ENV || 'dev').toLowerCase();
const cfg = `config/${env}.js`;
if (existsSync(cfg)) {
  cpSync(cfg, 'dist/config.js');
}

// bundle external dependencies for static hosting
mkdirSync('dist/vendor', { recursive: true });
cpSync('node_modules/@babel/standalone/babel.min.js', 'dist/vendor/babel.min.js');
cpSync('node_modules/react/umd/react.development.js', 'dist/vendor/react.development.js');
cpSync('node_modules/react-dom/umd/react-dom.development.js', 'dist/vendor/react-dom.development.js');
cpSync('node_modules/@remix-run/router/dist/router.umd.js', 'dist/vendor/router.umd.js');
cpSync('node_modules/react-router/dist/umd/react-router.development.js', 'dist/vendor/react-router.development.js');
cpSync(
  'node_modules/react-router-dom/dist/umd/react-router-dom.development.js',
  'dist/vendor/react-router-dom.development.js'
);
cpSync('node_modules/keycloak-js/lib/keycloak.js', 'dist/vendor/keycloak.js');
cpSync('node_modules/@fortawesome/fontawesome-free/css', 'dist/vendor/fontawesome/css', {
  recursive: true,
});
cpSync('node_modules/@fortawesome/fontawesome-free/webfonts', 'dist/vendor/fontawesome/webfonts', {
  recursive: true,
});
cpSync('node_modules/flag-icons/css', 'dist/vendor/flag-icons/css', {
  recursive: true,
});
cpSync('node_modules/flag-icons/flags', 'dist/vendor/flag-icons/flags', {
  recursive: true,
});
cpSync('node_modules/@fontsource/mouse-memoirs', 'dist/vendor/mouse-memoirs', {
  recursive: true,
});

let version = '';
const tag = process.env.GIT_TAG || process.env.TAG;
if (tag) {
  version = tag;
} else {
  const branch = process.env.GIT_BRANCH || process.env.BRANCH_NAME || 'dev';
  const pr = process.env.PR_NUMBER || process.env.PULL_REQUEST_NUMBER;
  version = pr ? `${branch}.${pr}` : branch;
}
writeFileSync('dist/version.txt', version);

const swPath = 'dist/service-worker.js';
if (existsSync(swPath)) {
  const sw = readFileSync(swPath, 'utf8').replace(/__VERSION__/g, version);
  writeFileSync(swPath, sw);
}
