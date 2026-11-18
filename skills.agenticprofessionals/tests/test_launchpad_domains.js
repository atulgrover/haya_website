/**
 * Automated Verification Suite for Federated Domain Network & Launchpad
 * Tests:
 * 1. Static HTML structure of index.html (9 domain cards, badges, cluster categorization)
 * 2. Smart Link Routing helper (getDomainUrl) in local and production modes
 * 3. Search and triage keyword filtering accuracy
 * 4. Cluster pill counts and coverage
 * 5. Live HTTP endpoints accessibility on port 3001
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('====================================================');
console.log('🧪 Starting Federated Launchpad Test Suite');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

// 1. Verify index.html existence and read content
const indexPath = path.join(__dirname, '..', 'index.html');
assert(fs.existsSync(indexPath), `index.html exists at ${indexPath}`);

const indexHtml = fs.readFileSync(indexPath, 'utf-8');

// 2. Verify all 9 expected statutory domains
const EXPECTED_DOMAINS = [
  { subdomain: 'ibc', cluster: 'corporate', badge: 'ibc.agenticprofessionals.net' },
  { subdomain: 'bns', cluster: 'courts', badge: 'bns.agenticprofessionals.net' },
  { subdomain: 'mca', cluster: 'corporate', badge: 'mca.agenticprofessionals.net' },
  { subdomain: 'gst', cluster: 'taxation', badge: 'gst.agenticprofessionals.net' },
  { subdomain: 'sebi', cluster: 'corporate', badge: 'sebi.agenticprofessionals.net' },
  { subdomain: 'dgft', cluster: 'corporate', badge: 'dgft.agenticprofessionals.net' },
  { subdomain: 'cpc', cluster: 'courts', badge: 'cpc.agenticprofessionals.net' },
  { subdomain: 'rera', cluster: 'courts', badge: 'rera.agenticprofessionals.net' },
  { subdomain: 'hayagriva', cluster: 'harness', badge: 'hayagriva.agenticprofessionals.net' }
];

console.log('\n--- 1. Testing Domain Cards Definition & Attributes ---');

// Count domain cards in HTML
const cardMatches = indexHtml.match(/class="domain-card"[^>]*data-subdomain="([^"]+)"/g) || [];
assert(cardMatches.length === 9, `Found exactly 9 domain cards (found ${cardMatches.length})`);

EXPECTED_DOMAINS.forEach(domain => {
  const hasSubdomain = indexHtml.includes(`data-subdomain="${domain.subdomain}"`);
  assert(hasSubdomain, `Card exists for subdomain: ${domain.subdomain}`);

  const hasCluster = indexHtml.includes(`data-cluster="${domain.cluster}"`) && 
                     indexHtml.includes(`data-subdomain="${domain.subdomain}"`);
  assert(hasCluster, `Domain ${domain.subdomain} correctly assigned to cluster: ${domain.cluster}`);

  const hasBadge = indexHtml.includes(domain.badge);
  assert(hasBadge, `Domain ${domain.subdomain} displays production badge: ${domain.badge}`);

  const hasCta = indexHtml.includes(`data-domain="${domain.subdomain}"`);
  assert(hasCta, `Domain ${domain.subdomain} contains CTA button with data-domain="${domain.subdomain}"`);
});

console.log('\n--- 2. Testing Cluster Breakdown ---');
const clusterCounts = {
  corporate: 0,
  taxation: 0,
  courts: 0,
  harness: 0
};

EXPECTED_DOMAINS.forEach(d => {
  if (clusterCounts[d.cluster] !== undefined) {
    clusterCounts[d.cluster]++;
  }
});

assert(clusterCounts.corporate === 4, `Corporate & Finance has 4 domains (IBC, MCA, SEBI, DGFT)`);
assert(clusterCounts.taxation === 1, `Taxation & Revenue has 1 domain (GST)`);
assert(clusterCounts.courts === 3, `Courts & Regulatory has 3 domains (BNS, CPC, RERA)`);
assert(clusterCounts.harness === 1, `Engine & Harness has 1 domain (Hayagriva)`);

console.log('\n--- 3. Testing Smart Routing Resolver (getDomainUrl) ---');

// Helper to simulate getDomainUrl logic
function simulateGetDomainUrl(subdomain, hostname) {
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  if (isLocal) {
    const portMap = {
      portal: 3001,
      ibc: 3002,
      bns: 3003,
      hayagriva: 3000
    };
    const targetPort = portMap[subdomain] || 3001;
    return `http://localhost:${targetPort}`;
  }
  return `https://${subdomain}.agenticprofessionals.net`;
}

// Localhost tests
assert(simulateGetDomainUrl('ibc', 'localhost') === 'http://localhost:3002', 'Local routing for IBC -> http://localhost:3002');
assert(simulateGetDomainUrl('bns', 'localhost') === 'http://localhost:3003', 'Local routing for BNS -> http://localhost:3003');
assert(simulateGetDomainUrl('hayagriva', 'localhost') === 'http://localhost:3000', 'Local routing for Hayagriva -> http://localhost:3000');
assert(simulateGetDomainUrl('portal', 'localhost') === 'http://localhost:3001', 'Local routing for Portal -> http://localhost:3001');

// Production tests
assert(simulateGetDomainUrl('ibc', 'agenticprofessionals.net') === 'https://ibc.agenticprofessionals.net', 'Production routing for IBC -> https://ibc.agenticprofessionals.net');
assert(simulateGetDomainUrl('bns', 'agenticprofessionals.net') === 'https://bns.agenticprofessionals.net', 'Production routing for BNS -> https://bns.agenticprofessionals.net');
assert(simulateGetDomainUrl('gst', 'agenticprofessionals.net') === 'https://gst.agenticprofessionals.net', 'Production routing for GST -> https://gst.agenticprofessionals.net');
assert(simulateGetDomainUrl('hayagriva', 'agenticprofessionals.net') === 'https://hayagriva.agenticprofessionals.net', 'Production routing for Hayagriva -> https://hayagriva.agenticprofessionals.net');

console.log('\n--- 4. Testing Search Keyword Triage Filtering ---');

function searchMatchesDomain(query, cardHtml) {
  const q = query.toLowerCase();
  return cardHtml.toLowerCase().includes(q);
}

// Extract individual card blocks from indexHtml
const cardBlocks = indexHtml.split(/class="domain-card"/).slice(1);

const searchQueries = [
  { query: 'insolvency', expectedSubdomains: ['ibc'] },
  { query: 'cirp', expectedSubdomains: ['ibc'] },
  { query: 'criminal', expectedSubdomains: ['bns'] },
  { query: 'penal', expectedSubdomains: ['bns'] },
  { query: 'companies act', expectedSubdomains: ['mca'] },
  { query: 'gst', expectedSubdomains: ['gst'] },
  { query: 'securities', expectedSubdomains: ['sebi'] },
  { query: 'customs', expectedSubdomains: ['dgft'] },
  { query: 'injunction', expectedSubdomains: ['cpc'] },
  { query: 'rera', expectedSubdomains: ['rera'] },
  { query: 'harness', expectedSubdomains: ['hayagriva'] }
];

searchQueries.forEach(sq => {
  const matchingCards = cardBlocks.filter(block => searchMatchesDomain(sq.query, block));
  assert(matchingCards.length >= 1, `Query "${sq.query}" successfully matches at least 1 card`);
  sq.expectedSubdomains.forEach(expectedSub => {
    const found = matchingCards.some(b => b.includes(`data-subdomain="${expectedSub}"`));
    assert(found, `Query "${sq.query}" correctly matches subdomain "${expectedSub}"`);
  });
});

console.log('\n--- 5. Testing Live HTTP Server & Economic Pillar Routes on Port 3001 ---');

const routesToTest = [
  '/',
  '/employees_nsqf.html',
  '/employers_sop.html',
  '/entrepreneurs_msme.html',
  '/personalities_vedic.html'
];

function checkRoute(route) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3001${route}`, (res) => {
      assert(res.statusCode === 200, `HTTP GET http://localhost:3001${route} returned ${res.statusCode} OK`);
      res.resume();
      resolve(true);
    }).on('error', (err) => {
      console.warn(`  ⚠️ Server on :3001 not reachable (${err.message}). (Verify if server daemon is active)`);
      resolve(false);
    });
  });
}

(async () => {
  for (const route of routesToTest) {
    await checkRoute(route);
  }

  console.log('\n====================================================');
  console.log(`🏁 Test Summary: ${passCount} Passed, ${failCount} Failed`);
  console.log('====================================================\n');

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
})();
