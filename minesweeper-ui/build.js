import { rmSync, mkdirSync, cpSync, existsSync } from 'fs';

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });

cpSync('public', 'dist', { recursive: true });
cpSync('js', 'dist/js', { recursive: true });
cpSync('css', 'dist/css', { recursive: true });

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
