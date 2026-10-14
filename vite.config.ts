import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { createDevApiMiddleware } from './server/devApi';

export default defineConfig(({mode}) => ({
  plugins: [react(), {
    name: 'studio-local-api',
    configureServer(server) {
      const env=loadEnv(mode,process.cwd(),'');
      for(const [key,value] of Object.entries(env))if(process.env[key]===undefined)process.env[key]=value;
      server.middlewares.use(createDevApiMiddleware(async (file) => {
        const module = await server.ssrLoadModule(file);
        return { default: module.default };
      }));
    }
  }],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
}));
