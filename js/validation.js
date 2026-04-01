// ── VALIDATION MODULE ─────────────────────────────────────────────────────────

const MONTHS = ['jan','feb','mar','apr','mei','jun','jul','agus','sept','okt','nov','des'];

// Cari info RTS berdasarkan nomor resi di semua kolom bulan
function findRTSInfo(resi, rtsRows) {
  if (!resi || !rtsRows || !rtsRows.length) return null;
  const resiNorm = normalizeResi(resi);

  for (const row of rtsRows) {
    const keys = Object.keys(row);
    for (const mon of MONTHS) {
      // Cari kolom RESI bulan ini (toleran variasi: "RESI Jan", "Resi jan", "resi_jan", dll)
      const resiKey = keys.find(k => {
        const kl = k.toLowerCase().replace(/[\s_-]/g,'');
        return kl.includes('resi') && kl.includes(mon);
      });
      if (!resiKey) continue;
      if (normalizeResi(row[resiKey]) !== resiNorm) continue;

      // Ambil reason & status bulan yang sama
      const reasonKey = keys.find(k => {
        const kl = k.toLowerCase().replace(/[\s_-]/g,'');
        return kl.includes('reason') && kl.includes(mon);
      });
      const statusKey = keys.find(k => {
        const kl = k.toLowerCase().replace(/[\s_-]/g,'');
        return kl.includes('status') && kl.includes(mon);
      });
      const pihakKey = keys.find(k => {
        const kl = k.toLowerCase().replace(/[\s_-]/g,'');
        return (kl.includes('pihak') || kl.includes('tertangani')) && kl.includes(mon);
      });

      return {
        bulan  : mon.charAt(0).toUpperCase() + mon.slice(1),
        reason : row[reasonKey] || '',
        status : row[statusKey] || '',
        pihak  : row[pihakKey]  || '',
        resiKey,
      };
    }
  }
  return null;
}

// Jalankan validasi lengkap
function runValidation(orderRows, rtsRows) {
  // 1. Hitung frekuensi HP
  const hpCount = {};
  orderRows.forEach(row => {
    const hp = normalizeHP(row.hp || '');
    if (hp) hpCount[hp] = (hpCount[hp] || 0) + 1;
  });

  // 2. Tandai setiap baris
  const result = orderRows.map(row => {
    const hp    = normalizeHP(row.hp || '');
    const resi  = row.resi || '';
    const isDup = hp && hpCount[hp] > 1;
    const rtsInfo = findRTSInfo(resi, rtsRows);
    return {
      ...row,
      _hp     : hp,
      _isDup  : isDup,
      _rtsInfo: rtsInfo,
      _status : isDup && rtsInfo ? 'DUPLIKAT+RTS' : isDup ? 'DUPLIKAT' : rtsInfo ? 'RTS' : 'AMAN',
    };
  });

  // 3. Summary
  const summary = {
    total   : result.length,
    duplikat: result.filter(r => r._isDup).length,
    rts     : result.filter(r => r._rtsInfo).length,
    masalah : result.filter(r => r._isDup || r._rtsInfo).length,
  };

  return { result, summary };
}

// ── FILTER & SEARCH ───────────────────────────────────────────────────────────
function applyFilters(data, filterStatus, query) {
  return data.filter(row => {
    const matchStatus =
      filterStatus === 'all'  ? true :
      filterStatus === 'dup'  ? row._isDup :
      filterStatus === 'rts'  ? !!row._rtsInfo :
      filterStatus === 'both' ? (row._isDup && !!row._rtsInfo) :
      filterStatus === 'ok'   ? (!row._isDup && !row._rtsInfo) :
      true;

    if (!matchStatus) return false;
    if (!query) return true;

    const q = query.toLowerCase();
    return (
      String(row.hp   || '').includes(q) ||
      String(row.nama || '').toLowerCase().includes(q) ||
      String(row.resi || '').toLowerCase().includes(q) ||
      String(row.kodepos || '').includes(q)
    );
  });
}
