// ── KONFIGURASI SUPABASE ─────────────────────────────────────────────────────
// Ganti dengan URL dan ANON KEY dari project Supabase kamu
// Dashboard → Settings → API
const SUPABASE_URL  = 'https://lqpcnzdssvvcayqvdjxs.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxcGNuemRzc3Z2Y2F5cXZkanhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMTgxMDIsImV4cCI6MjA5MDU5NDEwMn0.4M4okAfJWhBD6AbL71utafrFL-ZgbVxcz3ANLnG_jH4';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── AUTH HELPERS ─────────────────────────────────────────────────────────────
async function signIn(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signOut() {
  await sb.auth.signOut();
  window.location.href = 'index.html';
}

async function getSession() {
  const { data } = await sb.auth.getSession();
  return data.session;
}

async function getUser() {
  const { data } = await sb.auth.getUser();
  return data.user;
}

// Guard — panggil di awal app.html
async function requireAuth() {
  const session = await getSession();
  if (!session) {
    window.location.href = 'index.html';
    return null;
  }
  return session.user;
}

// ── SUPABASE DB HELPERS ───────────────────────────────────────────────────────
// Simpan batch orderan ke tabel `orderan`
async function saveOrderan(rows) {
  const { error } = await sb.from('orderan').upsert(rows, { onConflict: 'resi' });
  if (error) throw error;
}

// Simpan batch RTS ke tabel `rts_data`
async function saveRTS(rows) {
  const { error } = await sb.from('rts_data').upsert(rows, { onConflict: 'resi_bulan' });
  if (error) throw error;
}

// Ambil semua orderan (dengan pagination)
async function fetchOrderan(page = 0, limit = 500) {
  const from = page * limit;
  const { data, error } = await sb.from('orderan').select('*').range(from, from + limit - 1);
  if (error) throw error;
  return data;
}

// Ambil semua RTS
async function fetchRTS() {
  const { data, error } = await sb.from('rts_data').select('*');
  if (error) throw error;
  return data;
}

// Hapus semua orderan (untuk reset harian)
async function clearOrderan() {
  const user = await getUser();
  const { error } = await sb.from('orderan').delete().neq('id', 0);
  if (error) throw error;
}
