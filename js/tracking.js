const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { tracking_number, courier } = req.query;
  if (!tracking_number || !courier) {
    res.status(400).json({ error: 'tracking_number and courier required' });
    return;
  }

  const url = `https://app.mengantar.com/api/order/getPublic?tracking_number=${encodeURIComponent(tracking_number)}&courier=${encodeURIComponent(courier)}`;

  try {
    const data = await new Promise((resolve, reject) => {
      https.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Referer': 'https://www.mengantar.com/',
          'Origin': 'https://www.mengantar.com'
        }
      }, (resp) => {
        let body = '';
        resp.on('data', chunk => body += chunk);
        resp.on('end', () => {
          try { resolve(JSON.parse(body)); }
          catch(e) { reject(new Error('Invalid JSON')); }
        });
      }).on('error', reject);
    });
    res.status(200).json(data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
