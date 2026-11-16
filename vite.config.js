import { defineConfig } from 'vite';
import injectHTML from 'vite-plugin-html-inject';
import { resolve } from 'path';
import fs from 'fs';

const poemFiles = fs
  .readdirSync(resolve(import.meta.dirname, 'poems'))
  .filter((file) => file.endsWith('.html'))
  .reduce((entries, file) => {
    const name = file.replace('.html', '');
    entries[name] = resolve(import.meta.dirname, 'poems', file);
    return entries;
  }, {});

// Custom plugin to serve 404.html in local dev & preview, matching GitHub Pages
const html404Plugin = () => ({
  name: 'html-404-fallback',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const urlPath = req.url.split('?')[0];
      const filePath = resolve(import.meta.dirname, urlPath.slice(1));
      const isHtmlRoute = !urlPath.includes('.') || urlPath.endsWith('.html');
      const isMissing = !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory();

      if (isHtmlRoute && urlPath !== '/' && isMissing) {
        const notFoundHtml = fs.readFileSync(resolve(import.meta.dirname, '404.html'), 'utf-8');
        const transformedHtml = await server.transformIndexHtml(req.url, notFoundHtml);
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/html');
        return res.end(transformedHtml);
      }
      next();
    });
  },
  configurePreviewServer(server) {
    server.middlewares.use((req, res, next) => {
      const urlPath = req.url.split('?')[0];
      const distPath = resolve(import.meta.dirname, 'dist', urlPath.slice(1));
      const isHtmlRoute = !urlPath.includes('.') || urlPath.endsWith('.html');
      const isMissing = !fs.existsSync(distPath) || fs.statSync(distPath).isDirectory();

      if (isHtmlRoute && urlPath !== '/' && isMissing) {
        const notFoundHtml = fs.readFileSync(resolve(import.meta.dirname, 'dist/404.html'), 'utf-8');
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/html');
        return res.end(notFoundHtml);
      }
      next();
    });
  },
});

export default defineConfig({
  base: './',
  appType: 'mpa',
  plugins: [injectHTML(), html404Plugin()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        dedication: resolve(import.meta.dirname, 'dedication.html'),
        toc: resolve(import.meta.dirname, 'toc.html'),
        about: resolve(import.meta.dirname, 'about.html'),
        notFound: resolve(import.meta.dirname, '404.html'),
        ...poemFiles,
      },
    },
  },
});
