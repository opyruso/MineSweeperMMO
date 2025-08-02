import { rmSync, mkdirSync, cpSync } from 'fs';

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
cpSync('public', 'dist', { recursive: true });
cpSync('js', 'dist/js', { recursive: true });
cpSync('css', 'dist/css', { recursive: true });
