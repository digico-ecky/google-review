export default async function handler(req, res) {
  // Mengambil parameter ID dari URL (contoh: ?id=er2x84)
  const { id } = req.query;

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
      // Fitur andalan Vercel: CACHE 1 Jam (3600 detik)
      // Supaya aman dari limit Google dan loadingnya secepat kilat!
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
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
