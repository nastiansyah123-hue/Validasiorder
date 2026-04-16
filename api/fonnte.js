export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { target, message } = req.body;
  if (!target || !message) return res.status(400).json({ error: 'target and message required' });

  try {
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': 'G1tWuDNrxZXn9NWM8Uqb',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({ target, message, countryCode: '62' })
    });
    const data = await response.json();
    return res.status(200).json(data);
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
