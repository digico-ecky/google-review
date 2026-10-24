// Memori sementara untuk menyimpan link (Mencegah Google Sheets kena limit)
const urlCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // Ingatan bertahan 5 menit (dalam milidetik)

export default async function handler(req, res) {
  // Mengambil parameter ID dari URL (contoh: ?id=er2x84)
  const { id } = req.query;


  const forceReset = req.query.reset === 'true'; // Deteksi jika kamu minta reset paksa

  // Cek apakah data masih ada di memori dan tidak sedang di-reset paksa
  if (!forceReset && id && urlCache.has(id)) {
    const cachedData = urlCache.get(id);
    if (Date.now() - cachedData.timestamp < CACHE_TTL) {
      console.log(`[CACHE HIT] Mengalihkan ID ${id} instan`);
      return res.redirect(302, cachedData.url);
    }
  }

  
  // Kalau ada yang akses tanpa ID, alihkan ke landing page kamu
  if (!id) {
    return res.redirect(302, 'https://domain-kamu.com/belum-aktif'); 
  }

  try {
    // === BAGIAN YANG HARUS KAMU EDIT ===
    const SPREADSHEET_ID = '1lBSwvTAUV-KKaLt8kOSKaTnyFC0WZ4Z94ATTCysqUIc'; 
    const SHEET_NAME = 'data'; // Ganti jika nama Sheet-mu di tab bawah berbeda
    // =====================================
    
    // Vercel membaca data dari Google Sheets
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;
    const response = await fetch(csvUrl);
    const csvText = await response.text();

    // Memecah baris data
    const rows = csvText.split('\n');
    let targetUrl = null;

    // Looping untuk mencari kode (contoh: er2x84) di Kolom A
    // Dimulai dari i = 1 untuk melewati baris Header
    for (let i = 1; i < rows.length; i++) {
      // Bersihkan tanda kutip bawaan format CSV
      const cols = rows[i].split(',').map(col => col.replace(/(^"|"$)/g, ''));
      
      const rowId = cols[0];   // Kolom A (Kode Unik)
      const rowLink = cols[1]; // Kolom B (Link Google Review)

      if (rowId === id) {
        targetUrl = rowLink;
        break; // Berhenti mencari jika sudah ketemu
      }
    }

    // Kalau ID ketemu dan Kolom B tidak kosong
    if (targetUrl && targetUrl.trim() !== '') {
      // Simpan link baru ke dalam memori Vercel beserta waktu penyimpanannya
    urlCache.set(id, {
      url: targetUrl,
      timestamp: Date.now()
    });

    // Pastikan cache bawaan Edge dinonaktifkan agar fitur reset manual bisa jalan
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    return res.redirect(302, targetUrl);
      
    } else {
      // Kalau ID tidak ditemukan atau belum ada link review (belum laku)
      return res.redirect(302, 'https://domain-kamu.com/belum-aktif'); 
    }

  } catch (error) {
    console.error(error);
    return res.status(500).send('Error membaca database dari sistem.');
  }
}
