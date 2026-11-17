const http = require('http');

const ENDPOINTS = [
  { url: 'http://localhost:3001/', name: 'Portal (3001) - Root' },
  { url: 'http://localhost:3001/employees', name: 'Portal (3001) - /employees' },
  { url: 'http://localhost:3001/employers', name: 'Portal (3001) - /employers' },
  { url: 'http://localhost:3001/entrepreneurs', name: 'Portal (3001) - /entrepreneurs' },
  { url: 'http://localhost:3001/reports', name: 'Portal (3001) - /reports' },
  { url: 'http://localhost:3002/', name: 'IBC (3002) - Root' },
  { url: 'http://localhost:3003/', name: 'BNS (3003) - Root' }
];

async function checkUrl(endpoint) {
  return new Promise((resolve) => {
    const req = http.get(endpoint.url, { timeout: 3000 }, (res) => {
      const ok = res.statusCode >= 200 && res.statusCode < 400;
      resolve({ ...endpoint, status: res.statusCode, ok });
    });
    req.on('error', (err) => {
      resolve({ ...endpoint, status: err.code || 'ERR', ok: false });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ ...endpoint, status: 'TIMEOUT', ok: false });
    });
  });
}

(async () => {
  console.log('Testing Federated Hub Endpoints...');
  let allOk = true;
  for (const ep of ENDPOINTS) {
    const res = await checkUrl(ep);
    const symbol = res.ok ? '✔' : '✖';
    console.log(`  ${symbol} [${res.status}] ${res.name} -> ${res.url}`);
    if (!res.ok) allOk = false;
  }
  if (!allOk) {
    console.error('\n⚠️ Some federated endpoints did not return 2xx/3xx. Make sure ./start.sh is running.');
  } else {
    console.log('\n✔ All endpoints healthy.');
  }
})();
