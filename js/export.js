// ── EXPORT MODULE ─────────────────────────────────────────────────────────────

function buildExportRows(filteredData) {
  return filteredData.map(row => {
    const r = row._raw || {};
    // Kolom Retur ADSY
    const returADSY = row._rtsInfo
      ? (row._rtsInfo.reason || row._rtsInfo.status || 'RTS')
      : (row._isRetur ? 'Pernah RTS (no reason)' : '');
    // Kolom Duplikat All Team
    const dupAllTeam = row._isDup && row._matches && row._matches.length
      ? row._matches.slice(0,3).map(m=>(m.nama||'')+(m.tanggal?' ('+m.tanggal+')':'')).join(' | ')
      : '';

    return {
      Tanggal                  : r['Tanggal']||r['tanggal']||'',
      No                       : r['No']||r['no']||'',
      Nama                     : r['Nama']||r['nama']||'',
      'No telpon'              : r['No telpon']||r['No Telpon']||row.hp||'',
      Alamat                   : r['Alamat']||r['alamat']||'',
      Kelurahan                : r['Kelurahan']||r['kelurahan']||'',
      Kecamatan                : r['Kecamatan']||r['kecamatan']||'',
      Kabupaten                : r['Kabupaten']||r['kabupaten']||'',
      Provinsi                 : r['Provinsi']||r['provinsi']||'',
      'Kode Pos'               : r['Kode Pos']||r['KODE POS']||r['kodepos']||'',
      'Jumlah Pesanan'         : r['Jumlah Pesanan']||'',
      Quantity                 : r['Quantity']||r['qty']||'',
      Pembayaran               : r['Pembayaran']||r['pembayaran']||'',
      'Total Pembayaran'       : r['Total Pembayaran']||'',
      'Instruksi Pengiriman'   : r['Instruksi Pengiriman']||r['instruksi']||'',
      Keterangan               : r['Keterangan']||'',
      'Rincian Pembayaran'     : r['Rincian Pembayaran']||'',
      Keluhan                  : r['Keluhan']||'',
      'Real Ongkir'            : r['Real Ongkir']||'',
      'Pengecekkan Ongkir'     : r['Pengecekkan Ongkir']||'',
      'Retur ADSY'             : returADSY,
      'Wilayah Rawan'          : r['Wilayah Rawan']||'',
      GradeRekomendasi         : r['GradeRekomendasi']||r['Grade']||'',
      Ekspedisi                : r['Ekspedisi']||r[' Ekspedisi']||'',
      'Kirim SS Chat Customer' : r['Kirim SS Chat Customer']||'',
      'Duplikat Team'          : r['Duplikat Team']||'',
      'Duplikat All Team'      : dupAllTeam,
      'ACC SPV CS'             : r['ACC SPV CS']||'',
      'ACC SPV OP'             : r['ACC SPV OP']||'',
    };
  });
}

function today() {
  return new Date().toISOString().slice(0,10).replace(/-/g,'');
}

// Export ke CSV (UTF-8 BOM agar Excel terbaca)
function exportCSV(filteredData) {
  if (!filteredData.length) { showToast('Tidak ada data untuk diexport.', 'error'); return; }
  const rows = buildExportRows(filteredData);
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map(r => headers.map(h => `"${String(r[h]||'').replace(/"/g,'""')}"`).join(','))
  ];
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  triggerDownload(blob, `validasi_order_${today()}.csv`);
  showToast('CSV berhasil diexport.', 'success');
}

// Export ke XLSX
function exportXLSX(filteredData) {
  if (!filteredData.length) { showToast('Tidak ada data untuk diexport.', 'error'); return; }
  const rows = buildExportRows(filteredData);
  const ws = XLSX.utils.json_to_sheet(rows);

  // Highlight header row
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let C = range.s.c; C <= range.e.c; C++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!ws[addr]) continue;
    ws[addr].s = { font: { bold: true }, fill: { fgColor: { rgb: 'E6F1FB' } } };
  }

  // Warna merah muda untuk baris duplikat / RTS
  filteredData.forEach((row, i) => {
    if (!row._isDup && !row._rtsInfo) return;
    const color = row._isDup && row._rtsInfo ? 'FBEAF0' : row._isDup ? 'FBEAF0' : 'FAEEDA';
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: i + 1, c: C });
      if (!ws[addr]) ws[addr] = { v: '' };
      ws[addr].s = { fill: { fgColor: { rgb: color } } };
    }
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Validasi');
  XLSX.writeFile(wb, `validasi_order_${today()}.xlsx`);
  showToast('XLSX berhasil diexport.', 'success');
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  let wrap = document.getElementById('toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'toast-wrap';
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}
