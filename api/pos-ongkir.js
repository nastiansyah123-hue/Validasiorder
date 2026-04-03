const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { receiverzipcode, weight } = req.query;
  if (!receiverzipcode) { res.status(400).json({ error: 'receiverzipcode required' }); return; }

  const body = JSON.stringify({
    customerid      : 'LOGBOSAMPUH04563A',
    desttypeid      : '1',
    itemtypeid      : '1',
    shipperzipcode  : '55661',
    receiverzipcode : receiverzipcode,
    weight          : parseInt(weight)||100,
    length: 1, width: 1, height: 1, diameter: 0, valuegoods: 0
  });

  try {
    const data = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'www.bosampuh.id',
        path    : '/api_home/cek_ongkir',
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
            // Response is double-encoded JSON string
            const parsed = typeof raw === 'string' && raw.startsWith('"') ? JSON.parse(JSON.parse(raw)) : JSON.parse(raw);
            resolve(parsed);
          } catch(e) { reject(new Error('Parse error: ' + raw.slice(0,100))); }
        });
      });
      reqHttp.on('error', reject);
      reqHttp.write(body);
      reqHttp.end();
    });
    res.status(200).json(data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
