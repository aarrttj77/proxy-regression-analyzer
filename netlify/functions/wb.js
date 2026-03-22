const https = require('https');

// In-memory cache for the indicator list (persists for the lifetime of the function instance)
let indicatorCache = null;
let indicatorCacheTime = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function getAllIndicators() {
  const now = Date.now();
  if (indicatorCache && (now - indicatorCacheTime) < CACHE_TTL) {
    return indicatorCache;
  }
  // Fetch all WDI indicators in one call (there are ~1400 in source=2)
  const url = 'https://api.worldbank.org/v2/indicator?format=json&source=2&per_page=5000';
  const { body } = await httpsGet(url);
  const parsed = JSON.parse(body);
  const items = (Array.isArray(parsed) && parsed[1]) || [];
  indicatorCache = items;
  indicatorCacheTime = now;
  return items;
}

exports.handler = async function(event) {
  const params = event.queryStringParameters || {};
  const path = params.path || '';
  const query = params.query || '';
  const search = params.search || '';

  // Special route: indicator search — filter locally for accurate results
  if (path === 'indicator/search') {
    try {
      const all = await getAllIndicators();
      const term = search.toLowerCase().trim();
      const matches = all.filter(ind => {
        if (!ind || !ind.name) return false;
        return (
          ind.name.toLowerCase().includes(term) ||
          (ind.id && ind.id.toLowerCase().includes(term)) ||
          (ind.sourceNote && ind.sourceNote.toLowerCase().includes(term))
        );
      }).slice(0, 40);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=300',
        },
        body: JSON.stringify([{ total: matches.length }, matches]),
      };
    } catch (err) {
      return {
        statusCode: 502,
        body: JSON.stringify({ error: 'Search failed', detail: err.message }),
      };
    }
  }

  // General proxy for all other WB API calls (fetching indicator data by country etc.)
  if (!path) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing path parameter' }) };
  }

  const url = `https://api.worldbank.org/v2/${path}?${query}`;
  try {
    const { status, body } = await httpsGet(url);
    return {
      statusCode: status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
      body,
    };
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Proxy failed', detail: err.message }),
    };
  }
};
