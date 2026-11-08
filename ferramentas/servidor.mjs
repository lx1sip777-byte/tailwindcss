// Servidor local: entrega a pasta do projeto em /, o Three.js em /three/, o motor em /motor/
// e os pacotes npm (fontes etc.) em /pacotes/.
// Como comando: node ferramentas/servidor.mjs projetos/teste  → abre a prévia em http://localhost:5173
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json', '.hdr': 'application/octet-stream', '.ktx2': 'image/ktx2',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf',
  '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4',
};

export function iniciarServidor(pastaProjeto, porta = 0) {
  const raizes = [
    ['/three/', path.join(AQUI, 'node_modules', 'three')],
    ['/motor/', path.join(AQUI, 'motor')],
    ['/pacotes/', path.join(AQUI, 'node_modules')], // fontes (@fontsource) e outras libs
    ['/', path.resolve(pastaProjeto)],
  ];
  const servidor = http.createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    for (const [prefixo, raiz] of raizes) {
      if (!url.startsWith(prefixo)) continue;
      let arquivo = path.join(raiz, url.slice(prefixo.length));
      if (!arquivo.startsWith(raiz)) break; // nada fora da raiz
      if (fs.existsSync(arquivo) && fs.statSync(arquivo).isDirectory()) arquivo = path.join(arquivo, 'index.html');
      if (!fs.existsSync(arquivo)) continue;
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arquivo).toLowerCase()] || 'application/octet-stream' });
      fs.createReadStream(arquivo).pipe(res);
      return;
    }
    res.writeHead(404).end('não encontrado: ' + url);
  });
  return new Promise((ok) => servidor.listen(porta, '127.0.0.1', () => {
    ok({ url: `http://127.0.0.1:${servidor.address().port}/`, fechar: () => servidor.close() });
  }));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const projeto = process.argv[2];
  if (!projeto) { console.error('uso: node ferramentas/servidor.mjs projetos/<nome> [porta]'); process.exit(1); }
  const { url } = await iniciarServidor(projeto, Number(process.argv[3] || 5173));
  console.log(`prévia: ${url}?play   (quadro fixo: ${url}?t=2.5)`);
}
