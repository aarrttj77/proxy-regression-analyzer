// Quick health-check — visit /.netlify/functions/wb-test in your browser
exports.handler = async function() {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ status: 'ok', message: 'Netlify function is reachable' }),
  };
};
