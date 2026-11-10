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
  if (d.startsWith('620')) d = '62' + d.slice(3)   // '+62 (0)812...' → 62812...
  return 'https://wa.me/' + d
}

// Lingkaran berisi huruf pertama nama, dipakai kalau belum ada foto profil.
function inisial(nama) { return esc((nama || '?').trim().charAt(0).toUpperCase()) }

// Kalau sudah login, "Masuk" di menu atas berubah jadi "Ruang kreator" dan
// tombol "Gabung direktori" disembunyikan (halaman dashboard tidak punya tautan ini, jadi dilewati).
;(async () => {
  const masuk = document.querySelector('header a[href="masuk.html"]')
  if (!masuk || typeof supabaseClient === 'undefined') return
  const { data } = await supabaseClient.auth.getSession()
  if (!data.session) return
  masuk.href = 'dashboard-profil.html'
  masuk.textContent = 'Ruang kreator'
  document.querySelector('header a[href="daftar.html"]')?.remove()
})()
