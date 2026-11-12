const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const files = { '/': 'index.html', '/index.html': 'index.html', '/style.css': 'style.css', '/game.js': 'game.js' };
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };
http.createServer((req, res) => {
  const file = files[req.url.split('?')[0]];
  if (!file) { res.writeHead(404); return res.end('Not found'); }
  res.writeHead(200, { 'Content-Type': `${types[path.extname(file)]}; charset=utf-8` });
  fs.createReadStream(path.join(__dirname, file)).pipe(res);
}).listen(Number(process.env.PORT) || 3000, '0.0.0.0');
