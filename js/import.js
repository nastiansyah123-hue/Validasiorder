// ── IMPORT MODULE ─────────────────────────────────────────────────────────────
// Handles CSV & XLSX file parsing with optional range

function setupDropzone(dzId, inputId, type, onSuccess) {
  const dz = document.getElementById(dzId);
  if (!dz) return;

  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag-over'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
  dz.addEventListener('drop', e => {
    e.preventDefault();
    dz.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) processFile(file, type, onSuccess);
  });

  const input = document.getElementById(inputId);
  if (input) input.addEventListener('change', () => {
    if (input.files[0]) processFile(input.files[0], type, onSuccess);
  });
}

function processFile(file, type, onSuccess) {
  const statusEl = document.getElementById('status-' + type);
  const rangeEl  = document.getElementById(type + '-range');
  const ext = file.name.split('.').pop().toLowerCase();

  setStatus(statusEl, 'loading', `Membaca ${file.name}...`);

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      let data;
      if (ext === 'csv') {
        data = csvToArray(e.target.result);
      } else if (['xlsx','xls'].includes(ext)) {
        const wb   = XLSX.read(e.target.result, { type: 'array' });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rng  = rangeEl ? rangeEl.value.trim() : '';
        const opts = rng ? { range: rng, defval: '' } : { defval: '' };
        data = XLSX.utils.sheet_to_json(ws, opts);
      } else {
        throw new Error('Format file tidak didukung. Gunakan CSV atau XLSX.');
      }

      if (!data.length) throw new Error('File kosong atau tidak ada data.');

      setStatus(statusEl, 'ok', `✓ ${data.length.toLocaleString()} baris dimuat (${file.name})`);
      onSuccess(data, file.name);
    } catch(err) {
      setStatus(statusEl, 'err', `✗ ${err.message}`);
    }
  };
  reader.onerror = () => setStatus(statusEl, 'err', '✗ Gagal membaca file.');

  if (ext === 'csv') reader.readAsText(file, 'UTF-8');
  else reader.readAsArrayBuffer(file);
}

function setStatus(el, type, msg) {
  if (!el) return;
  el.className = 'drop-status';
  if (type === 'ok')      el.classList.add('ok');
  else if (type === 'err') el.classList.add('err');
  el.style.display = 'block';
  el.textContent = msg;
}

// ── CSV PARSER ────────────────────────────────────────────────────────────────
function csvToArray(str) {
  const lines = str.split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return [];

  const headers = smartSplitCSV(lines[0]).map(h => h.replace(/^"|"$/g,'').trim());

  return lines.slice(1).map(line => {
    const vals = smartSplitCSV(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (vals[i] || '').replace(/^"|"$/g,'').trim(); });
    return obj;
  }).filter(row => Object.values(row).some(v => v)); // skip blank rows
}

function smartSplitCSV(line) {
  const result = [];
  let cur = '', inQ = false;
  for (const c of line) {
    if (c === '"') { inQ = !inQ; }
    else if (c === ',' && !inQ) { result.push(cur); cur = ''; }
    else cur += c;
  }
  result.push(cur);
  return result;
}

// ── NORMALIZE HELPERS ─────────────────────────────────────────────────────────
function normalizeHP(hp) {
  if (!hp && hp !== 0) return '';
  let s = String(hp).trim().replace(/\D/g, '');
  if (!s) return '';
  if (s.startsWith('62')) s = '0' + s.slice(2);
  if (s.startsWith('8'))  s = '0' + s;
  return s;
}

function normalizeResi(r) {
  return String(r || '').trim().toLowerCase().replace(/\s+/g,'');
}

// ── KEY MAPPING — fleksibel terhadap variasi nama kolom ───────────────────────
function getCol(row, ...candidates) {
  for (const c of candidates) {
    const found = Object.keys(row).find(k => k.toLowerCase().replace(/\s/g,'') === c.toLowerCase().replace(/\s/g,''));
    if (found && row[found] !== undefined && row[found] !== '') return row[found];
  }
  return '';
}

function extractOrderFields(row) {
  return {
    no      : getCol(row, 'No', 'no', 'Nomor'),
    tanggal : getCol(row, 'Tanggal', 'tanggal', 'Tgl'),
    nama    : getCol(row, 'Nama', 'nama', 'NamaCustomer', 'name'),
    hp      : getCol(row, 'No telpon', 'No Telpon', 'Notelpon', 'NomorHp', 'NomorHP', 'No HP', 'NoHP', 'HP', 'Telp', 'Telepon', 'phone'),
    alamat  : getCol(row, 'Alamat', 'alamat', 'address'),
    kelurahan  : getCol(row, 'Kelurahan', 'kelurahan'),
    kecamatan  : getCol(row, 'kecamatan', 'Kecamatan'),
    kabupaten  : getCol(row, 'kabupaten', 'Kabupaten', 'Kota'),
    provinsi   : getCol(row, 'Provinsi', 'provinsi'),
    kodepos : getCol(row, 'KODEPOS', 'Kode Pos', 'KodePos', 'kodepos', 'postal', 'zip'),
    jumlah  : getCol(row, 'JumlahPesanan', 'Jumlah Pesanan', 'Jumlah', 'qty'),
    pembayaran : getCol(row, 'Pembayaran', 'pembayaran', 'payment'),
    instruksi  : getCol(row, 'InstruksiPengiriman', 'Instruksi Pengiriman', 'instruksi'),
    resi    : getCol(row, 'RESI', 'Resi', 'resi', 'no resi', 'NoResi', 'AWB'),
    team    : getCol(row, 'TEAM', 'Team', 'team'),
    updateCRM  : getCol(row, 'UpdateCRM', 'Update CRM', 'CRM'),
    statusAkhir: getCol(row, 'StatusAkhir', 'Status Akhir', 'Status', 'status'),
    retur   : getCol(row, 'RETUR', 'Retur', 'retur'),
    csa     : getCol(row, 'CS', 'CSA', 'csa', 'cs'),
    dv      : getCol(row, 'ADV', 'DV', 'adv', 'dv'),
    adm     : getCol(row, 'ADM', 'adm'),
    _raw    : row,
  };
}
