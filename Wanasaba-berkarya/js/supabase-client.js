// =====================================================================
//  js/supabase-client.js  ·  Wanasaba Berkarya
//  LANGKAH 3 — Menyambungkan website ke Supabase
// =====================================================================
//  File ini dimuat di SEMUA halaman. Tugasnya hanya satu: membuat
//  "supabaseClient", objek penghubung untuk login, membaca/menulis
//  database, dan mengunggah file. Halaman lain tinggal memakainya.
//
//  URUTAN <script> di setiap halaman HARUS begini (library dulu, baru file ini):
//    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//    <script src="js/supabase-client.js"></script>
// =====================================================================

// 1) Ganti dua nilai ini dengan milikmu sendiri.
//    Lokasinya: Supabase → Project Settings → API Keys.
//    Pakai PUBLISHABLE key (awalan sb_publishable_...).
//    JANGAN PERNAH menaruh secret key / service_role di file ini,
//    karena file ini dikirim ke browser dan bisa dibaca siapa saja.
const SUPABASE_URL = 'https://biciaghuqjdfmvupwisq.supabase.co'
const SUPABASE_KEY = 'sb_publishable_7Js8D1jXybclHgAEwnGIdA_38byscsL'

// 2) Library dari CDN menyediakan objek global bernama "supabase".
//    createClient() membuat penghubung ke proyek kita.
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

// 3) Nama bucket Storage yang dibuat di file 02-keamanan.sql.
const BUCKET = 'wanasaba-files'

// 4) Tes koneksi: hanya untuk mengecek, boleh dihapus nanti.
//    Menghitung jumlah baris di tabel profiles tanpa mengambil datanya.
//    "async/await" = tunggu jawaban dari server dulu, baru lanjut ke baris berikutnya.
async function tesKoneksi() {
  const { count, error } = await supabaseClient
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('❌ Gagal terhubung:', error.message)
    return
  }
  console.log('✅ Terhubung ke Supabase! Jumlah profil saat ini:', count)
}

// Menerjemahkan galat "batas permintaan" Supabase. Ada TIGA jenis batas dengan
// waktu tunggu yang berbeda, jadi pesannya dibedakan (dulu semuanya "beberapa menit").
function pesanBatas(msg) {
  const p = String(msg || '').toLowerCase()
  if (p.includes('email rate limit'))
    return 'Batas pengiriman email tercapai. Layanan email bawaan hanya mengizinkan beberapa email per jam untuk SELURUH situs, jadi bukan salahmu. Coba lagi sekitar satu jam lagi, atau minta pengelola memasang email sendiri.'
  if (/after \d+ second/.test(p))
    return 'Tunggu sekitar satu menit sebelum meminta lagi.'
  if (p.includes('rate limit'))
    return 'Terlalu banyak percobaan dari perangkat ini. Tunggu beberapa menit, lalu coba lagi.'
  return ''
}
