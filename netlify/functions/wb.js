exports.handler = async function(event) {
  const path = event.queryStringParameters?.path || '';
  const query = event.queryStringParameters?.query || '';
  if (!path) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing path parameter' }) };
  }
  const url = `https://api.worldbank.org/v2/${path}?${query}`;
  try {
    const response = await fetch(url);
    const data = await response.text();
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
      body: data,
    };
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Failed to fetch from World Bank API', detail: err.message }),
    };
  }
};
