// =====================================================================
//  js/util.js  ·  Fungsi bantu yang dipakai beberapa halaman
// =====================================================================

// esc(): mengubah karakter berbahaya (< > & " ') jadi teks biasa.
// WAJIB dipakai untuk setiap data buatan pengguna yang dimasukkan ke innerHTML,
// supaya orang tidak bisa menyisipkan kode jahat lewat nama/bio-nya.
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

// safeUrl(): hanya meloloskan alamat http/https. Alamat tanpa "https://"
// (mis. "instagram.com/rizal") dilengkapi otomatis. Selain itu → '' (ditolak).
function safeUrl(u) {
  if (!u) return ''
  try {
    const x = new URL(/^https?:\/\//i.test(u.trim()) ? u.trim() : 'https://' + u.trim())
    return ['http:', 'https:'].includes(x.protocol) ? x.href : ''
  } catch { return '' }
}

// 'Fotografi, video' → ['Fotografi', 'video']
function daftarKeahlian(teks) {
  return (teks || '').split(',').map((s) => s.trim()).filter(Boolean)
}

// Nomor WhatsApp apa pun ('0812-3456', '+62 812...') → https://wa.me/62812...
function waLink(nomor) {
  let d = (nomor || '').replace(/\D/g, '')
  if (!d) return ''
  if (d.startsWith('0')) d = '62' + d.slice(1)
  else if (d.startsWith('8')) d = '62' + d
  return 'https://wa.me/' + d
}

// Lingkaran berisi huruf pertama nama, dipakai kalau belum ada foto profil.
function inisial(nama) { return esc((nama || '?').trim().charAt(0).toUpperCase()) }