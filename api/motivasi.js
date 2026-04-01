export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { mood, period } = req.body;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 120,
        messages: [{
          role: 'user',
          content: `Kamu adalah teman kerja yang suportif. Berikan 1 kalimat motivasi singkat (maks 20 kata) dalam Bahasa Indonesia yang natural dan hangat untuk seseorang yang bekerja sebagai tim CS/operator validasi orderan. Mood mereka sekarang: ${mood}. Waktu: ${period}. Jangan pakai sapaan nama. Langsung motivasinya saja, tanpa tanda kutip.`
        }]
      })
    });
    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    res.status(200).json({ text });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
