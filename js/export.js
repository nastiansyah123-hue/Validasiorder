// ── EXPORT MODULE ─────────────────────────────────────────────────────────────

function buildExportRows(filteredData) {
  return filteredData.map(row => ({
    No           : row.no,
    Tanggal      : row.tanggal,
    Nama         : row.nama,
    'Nomor HP'   : row.hp,
    Alamat       : row.alamat,
    Kelurahan    : row.kelurahan,
    Kecamatan    : row.kecamatan,
    Kabupaten    : row.kabupaten,
    Provinsi     : row.provinsi,
    'Kode Pos'   : row.kodepos,
    'Jumlah Pesanan': row.jumlah,
    Pembayaran   : row.pembayaran,
    'Instruksi Pengiriman': row.instruksi,
    RESI         : row.resi,
    TEAM         : row.team,
    'Update CRM' : row.updateCRM,
    'Status Akhir': row.statusAkhir,
    RETUR        : row.retur,
    CSA          : row.csa,
    DV           : row.dv,
    ADM          : row.adm,
    // ─── Kolom validasi tambahan ───
    Status_Validasi : row._status,
    Is_Duplikat     : row._isDup ? 'YA' : 'TIDAK',
    RTS_Bulan       : row._rtsInfo ? row._rtsInfo.bulan   : '',
    RTS_Reason      : row._rtsInfo ? row._rtsInfo.reason  : '',
    RTS_Status      : row._rtsInfo ? row._rtsInfo.status  : '',
    RTS_Pihak       : row._rtsInfo ? row._rtsInfo.pihak   : '',
  }));
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
