const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { path, ...params } = req.query;
  if (!path) { res.status(400).json({ error: 'path required' }); return; }

  const queryString = new URLSearchParams(params).toString();
  const url = `https://api-public.mengantar.com/api/${path}?${queryString}`;

  try {
    const data = await new Promise((resolve, reject) => {
      https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (resp) => {
        let body = '';
        resp.on('data', chunk => body += chunk);
        resp.on('end', () => {
          try { resolve(JSON.parse(body)); } catch(e) { reject(new Error('Invalid JSON: ' + body.slice(0,100))); }
        });
      }).on('error', reject);
    });
    res.status(200).json(data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
