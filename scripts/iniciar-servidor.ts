// Arquivo: scripts/iniciar-servidor.ts
// Sobe o build de producao ja na porta 4000. O adapter-node sozinho usaria 3000, que e
// justamente a porta que costuma estar ocupada por outro projeto.
// Tambem carrega o .env — `node build/index.js` puro nao le arquivo nenhum.

import 'dotenv/config';

process.env.PORT ??= '4000';
process.env.HOST ??= '0.0.0.0';
process.env.ORIGIN ??= `http://localhost:${process.env.PORT}`;

// O adapter-node corta QUALQUER corpo acima de 512 KB por padrao. Com isso, todo
// envio de video morria em 413 antes de encostar no nosso codigo — o limite de
// verdade, os 8 GB de gravar-upload.ts, nunca chegava a ser consultado. Quem manda
// no tamanho e a aplicacao, que conta os bytes enquanto grava e apaga o arquivo pela
// metade se estourar; aqui so tiramos a trava que vinha antes dela.
process.env.BODY_SIZE_LIMIT ??= 'Infinity';

console.log(`Yokira Animes em http://localhost:${process.env.PORT}`);
console.log('Para encerrar: Ctrl+C nesta janela, ou `npm run encerrar` em outra.');

await import('../build/index.js');
