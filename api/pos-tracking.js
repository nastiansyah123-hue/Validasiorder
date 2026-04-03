const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { resi } = req.query;
  if (!resi) { res.status(400).json({ error: 'resi required' }); return; }

  const body = JSON.stringify({ kode_booking: resi });

  try {
    const data = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'www.bosampuh.id',
        path    : '/api_home/lacak_kiriman',
        method  : 'POST',
        headers : {
          'Content-Type'  : 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'User-Agent'    : 'Mozilla/5.0',
          'Referer'       : 'https://www.bosampuh.id/',
          'Origin'        : 'https://www.bosampuh.id'
        }
      };
      const reqHttp = https.request(options, (resp) => {
        let raw = '';
        resp.on('data', chunk => raw += chunk);
        resp.on('end', () => {
          try {
            const parsed = typeof raw === 'string' && raw.startsWith('"') 
              ? JSON.parse(JSON.parse(raw)) 
              : JSON.parse(raw);
            resolve(parsed);
          } catch(e) { reject(new Error('Parse error: ' + raw.slice(0,100))); }
        });
      });
      reqHttp.on('error', reject);
      reqHttp.write(body);
      reqHttp.end();
    });
    res.status(200).json({ success: true, data });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
}
