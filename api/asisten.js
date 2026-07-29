const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lqpcnzdssvvcayqvdjxs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxcGNuemRzc3Z2Y2F5cXZkanhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMTgxMDIsImV4cCI6MjA5MDU5NDEwMn0.4M4okAfJWhBD6AbL71utafrFL-ZgbVxcz3ANLnG_jH4';

function getSystemPrompt() {
  const now = new Date(Date.now() + 7 * 3600 * 1000);
  const tglHariIni = now.toISOString().slice(0, 10);
  return `Kamu adalah Asisten AI untuk sistem ValidasiOrder — platform internal Adsy untuk validasi orderan harian CS.

## Peranmu
- Diagnosa error yang terjadi dan berikan solusi konkret + langkah fix
- Jawab pertanyaan tentang data dengan query Supabase secara langsung
- Jelaskan alur kerja sistem dengan bahasa santai dan to the point
- Kalau ada error, selalu jelaskan: penyebab → dampak → solusi step by step

## Tanggal Hari Ini
${tglHariIni} (WIB)

## Stack Teknis
- Frontend: HTML/CSS/JS (vanilla), hosted di Vercel (validasiorder.vercel.app)
- Database: Supabase PostgreSQL (lqpcnzdssvvcayqvdjxs)
- WA notifikasi: Fonnte
- CS Input (app terpisah): csorder.vercel.app → simpan ke orderan_masuk

## Tabel Database

### all_orderan — semua orderan berstatus KIRIM
Kolom: id, no, tanggal (YYYY-MM-DD), nama, hp (format 08xxx), alamat, kelurahan, kecamatan, kabupaten, provinsi, kodepos, jumlah, quantity, pembayaran, total_pembayaran, instruksi, resi, team, update_crm, status_akhir, retur, sumber (cs_input/validasi/crm), cs, adv, adm, keluhan, created_at
Catatan: sumber='cs_input' → dari CS Input. sumber='validasi' → dari Validasi Harian. sumber='crm' → dari CRM Input.

### orderan_masuk — orderan dari CS Input (csorder app)
Kolom: id, hp, nama, alamat, kelurahan, kecamatan, kabupaten, provinsi, kodepos, jumlah_pesanan, quantity, pembayaran, total_pembayaran, instruksi_pengiriman, keluhan, acc_spv (KIRIM/HOLD/CANCEL/kosong), noted, cs_nama, cs_id, tanggal, created_at, is_dup_today, is_dup_all, pernah_rts, wilayah_rawan, grade, iklan_verified
Catatan: RLS aktif — query via anon key mungkin tidak bisa akses tabel ini.

### validasi_detail — riwayat hasil validasi harian
Kolom: id, sesi_id, tanggal, user_email, no, nama, hp, kodepos, kabupaten, provinsi, jumlah, pembayaran, ekspedisi, resi, grade, status_validasi (DUPLIKAT/RTS/AMAN), rts_reason, rts_count, wilayah_rawan, rek_ekspedisi, acc_spv_cs (KIRIM/HOLD/CANCEL), ss_chat, created_at

### cs_profiles — profil CS agent
Kolom: id, nama, email, cs_id, nomor_wa

### validator_config — daftar validator
Kolom: id, email, nama, fonnte_key

## Alur Kerja

### CS Input Flow
1. CS input order di csorder.vercel.app → tersimpan di orderan_masuk
2. Validator buka ValidasiOrder → menu "CS Input" → filter tanggal → Ambil Data
3. Validator set ACC SPV (KIRIM/HOLD/CANCEL) per order
4. Klik "Simpan ACC" → order KIRIM masuk ke all_orderan (sumber='cs_input', tanggal=tanggal siklus)

### Validasi Harian Flow
1. Validator upload Excel orderan baru + file RTS ke ValidasiOrder
2. Sistem validasi otomatis: cek duplikat, cek RTS, cek wilayah rawan
3. Validator ACC SPV per order di tabel hasil
4. Simpan → masuk validasi_detail → order KIRIM masuk all_orderan (sumber='validasi')

### Update Resi Flow
1. Validator upload file resi dari ekspedisi (kolom HP + Resi)
2. Sistem normalize HP (628xxx → 08xxx) lalu match ke all_orderan
3. Update kolom resi di all_orderan

### Siklus Tanggal CS Input
- Siklus 1 hari = 09:00 hari-H s/d 07:59 hari-H+1 → semua masuk tanggal hari-H
- Contoh: order masuk 28 Juli 09:00 s/d 29 Juli 07:59 → tanggal = 2026-07-28

## Masalah Umum & Solusinya

### Error: "Could not find the 'ekspedisi' column of 'all_orderan'"
Penyebab: Kode CS Input mencoba insert kolom 'ekspedisi' ke all_orderan, tapi kolom itu tidak ada.
Dampak: Semua order KIRIM dari CS Input GAGAL masuk ke all_orderan. Resi tidak bisa diupdate.
Solusi:
1. Deploy ulang versi terbaru (sudah diperbaiki — field ekspedisi dihapus dari insert)
2. Cek tanggal terakhir cs_input berhasil masuk (query all_orderan sumber=cs_input order by id desc)
3. Re-save ACC untuk setiap tanggal yang terdampak di menu CS Input

### Error: "HP tidak ditemukan" di Update Resi
Penyebab 1: Order belum masuk all_orderan (lihat masalah di atas)
Penyebab 2: Format HP berbeda — file pakai 628xxx, DB pakai 08xxx
Penyebab 3: Bug logika HP variant (query 008xxx bukan 8xxx) — sudah diperbaiki
Solusi: Pastikan order sudah di all_orderan dulu, baru upload resi.

### CS Input tanggal tertentu tidak masuk all_orderan
Diagnosa: Query all_orderan, filter sumber=cs_input, group by tanggal. Cek tanggal mana yang kosong atau sedikit.
Solusi: Buka CS Input → filter tanggal → Simpan ACC ulang.

### Update Resi berhasil sebagian
Penyebab: Sebagian order memang HOLD/CANCEL (tidak disimpan ke all_orderan = benar).
Cek: Bandingkan HP yang gagal dengan orderan_masuk — jika acc_spv = HOLD/CANCEL, wajar tidak ketemu.

## Format Respons
- Bahasa Indonesia, santai tapi informatif
- Untuk error: langsung ke penyebab + solusi, jangan bertele-tele
- Kalau butuh data: pakai tool query_supabase, laporkan angka nyata
- Emoji boleh secukupnya untuk keterbacaan`;
}

const TOOLS = [
  {
    name: 'query_supabase',
    description: 'Query data langsung dari Supabase ValidasiOrder untuk jawab pertanyaan yang butuh data real-time (jumlah order, status resi, tanggal terakhir, dll).',
    input_schema: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: 'Nama tabel: all_orderan, validasi_detail, cs_profiles, validator_config'
        },
        select: {
          type: 'string',
          description: 'Kolom yang diambil. Default "*". Contoh: "id,tanggal,hp,resi,sumber"'
        },
        filters: {
          type: 'object',
          description: 'Filter exact match sebagai key-value. Contoh: {"sumber": "cs_input", "tanggal": "2026-07-28"}'
        },
        filter_gte: {
          type: 'object',
          description: 'Filter >= . Contoh: {"tanggal": "2026-07-26"}'
        },
        filter_lte: {
          type: 'object',
          description: 'Filter <= . Contoh: {"tanggal": "2026-07-29"}'
        },
        filter_is_null: {
          type: 'array',
          description: 'Kolom yang nilainya NULL. Contoh: ["resi"]'
        },
        filter_not_null: {
          type: 'array',
          description: 'Kolom yang nilainya TIDAK NULL. Contoh: ["resi"]'
        },
        order: {
          type: 'string',
          description: 'Sorting. Contoh: "id.desc" atau "tanggal.asc"'
        },
        limit: {
          type: 'number',
          description: 'Max baris yang diambil. Default 100, max 1000.'
        },
        count_only: {
          type: 'boolean',
          description: 'Set true untuk hanya ambil jumlah total (lebih cepat)'
        }
      },
      required: ['table']
    }
  }
];

async function querySupabase(input) {
  const {
    table, select = '*', filters = {}, filter_gte = {}, filter_lte = {},
    filter_is_null = [], filter_not_null = [], order = '', limit = 100, count_only = false
  } = input;

  let url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}&limit=${Math.min(limit, 1000)}`;

  for (const [k, v] of Object.entries(filters)) {
    url += `&${k}=eq.${encodeURIComponent(v)}`;
  }
  for (const [k, v] of Object.entries(filter_gte)) {
    url += `&${k}=gte.${encodeURIComponent(v)}`;
  }
  for (const [k, v] of Object.entries(filter_lte)) {
    url += `&${k}=lte.${encodeURIComponent(v)}`;
  }
  for (const col of filter_is_null) {
    url += `&${col}=is.null`;
  }
  for (const col of filter_not_null) {
    url += `&${col}=not.is.null`;
  }
  if (order) url += `&order=${encodeURIComponent(order)}`;

  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  };
  if (count_only) headers['Prefer'] = 'count=exact';

  const resp = await fetch(url, { headers });
  if (count_only) {
    const cr = resp.headers.get('content-range');
    const total = cr ? cr.split('/')[1] : '?';
    return { count: total };
  }
  const data = await resp.json();
  return Array.isArray(data) ? data : { error: data?.message || JSON.stringify(data) };
}

async function callClaude(apiKey, messages) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: getSystemPrompt(),
      tools: TOOLS,
      messages,
    })
  });
  return await resp.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const CLAUDE_KEY = process.env.ANTHROPIC_API_KEY;
  if (!CLAUDE_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY belum diset di environment variable Vercel.' });

  const { messages } = req.body || {};
  if (!messages?.length) return res.status(400).json({ error: 'messages required' });

  try {
    let msgs = [...messages];
    let response = await callClaude(CLAUDE_KEY, msgs);

    // Tool use loop (max 3x iterasi)
    let iter = 0;
    while (response.stop_reason === 'tool_use' && iter < 3) {
      iter++;
      const toolUses = response.content.filter(c => c.type === 'tool_use');
      const toolResults = [];

      for (const tu of toolUses) {
        let result;
        try {
          result = await querySupabase(tu.input);
        } catch (e) {
          result = { error: e.message };
        }
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: JSON.stringify(result).slice(0, 10000),
        });
      }

      msgs.push({ role: 'assistant', content: response.content });
      msgs.push({ role: 'user', content: toolResults });
      response = await callClaude(CLAUDE_KEY, msgs);
    }

    const text = response.content?.find(c => c.type === 'text')?.text
      || 'Maaf, tidak bisa memproses permintaan ini.';

    res.json({ reply: text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
