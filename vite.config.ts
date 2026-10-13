import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({mode}) => ({
  plugins: [react(), {
    name: 'studio-local-photo-api',
    configureServer(server) {
      const env=loadEnv(mode,process.cwd(),'');
      for(const [key,value] of Object.entries(env))if(process.env[key]===undefined)process.env[key]=value;
      server.middlewares.use('/api/photos',async(req,res)=>{
        try{
          const {default:handler}=await server.ssrLoadModule('/api/photos.ts');
          const url=new URL(req.url||'/', 'http://localhost');
          (req as any).query=Object.fromEntries(url.searchParams);
          let body='';for await(const chunk of req){body+=chunk;if(body.length>1024){res.statusCode=413;res.end();return;}}
          (req as any).body=body?JSON.parse(body):{};
          (res as any).status=(code:number)=>{res.statusCode=code;return res;};
          (res as any).json=(value:unknown)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));};
          await handler(req,res);
        }catch{res.statusCode=503;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({error:'Libreria fotografica non disponibile.'}));}
      });
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
