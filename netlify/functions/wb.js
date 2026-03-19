const https = require('https');

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

exports.handler = async function(event) {
  const path = event.queryStringParameters?.path || '';
  const query = event.queryStringParameters?.query || '';

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
