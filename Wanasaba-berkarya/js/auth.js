// =====================================================================
//  js/auth.js  ·  LANGKAH 4 — Logika halaman masuk & daftar
// =====================================================================
//  Dipakai oleh masuk.html DAN daftar.html. Di tiap halaman hanya
//  bagian yang elemennya ada yang berjalan (lihat "if (formMasuk)" dst).
//  Bergantung pada `supabaseClient` dari js/supabase-client.js.

const HALAMAN_SETELAH_LOGIN = 'dashboard-profil.html'  // dibuat di langkah 6

// ---------- Fungsi bantu ----------

// Menampilkan pesan di kotak #pesan. jenis: 'error' (merah) atau 'sukses' (hijau).
function tampilPesan(teks, jenis = 'error') {
  const kotak = document.getElementById('pesan')
  kotak.textContent = teks
  kotak.className = 'mt-6 rounded-md px-4 py-3 text-sm ' +
    (jenis === 'error' ? 'bg-red-50 text-red-800' : 'bg-mist text-pine')
}

// Mengunci tombol saat menunggu server, supaya tidak terklik dua kali.
function setTombol(aktif, teks) {
  const tombol = document.getElementById('tombol')
  tombol.disabled = !aktif
  tombol.textContent = teks
}

// Mengubah pesan error bawaan Supabase (Inggris) menjadi bahasa Indonesia.
function terjemahError(pesan) {
  const p = (pesan || '').toLowerCase()
  if (p.includes('invalid login')) return 'Email atau kata sandi salah.'
  if (p.includes('not confirmed')) return 'Email belum dikonfirmasi. Cek kotak masuk emailmu.'
  if (p.includes('already registered')) return 'Email ini sudah terdaftar. Silakan masuk.'
  if (pesanBatas(pesan)) return pesanBatas(pesan)
  if (p.includes('password')) return 'Kata sandi belum memenuhi syarat (minimal 8 karakter).'
  return 'Terjadi kesalahan: ' + pesan
}

// Tombol "Lihat/Sembunyi" di samping kolom kata sandi.
document.querySelectorAll('[data-toggle-password]').forEach((tombol) => {
  tombol.addEventListener('click', () => {
    const input = tombol.parentElement.querySelector('input')
    const tersembunyi = input.type === 'password'
    input.type = tersembunyi ? 'text' : 'password'
    tombol.textContent = tersembunyi ? 'Sembunyi' : 'Lihat'
  })
})

// Kalau sudah login, tidak perlu melihat halaman masuk/daftar lagi.
supabaseClient.auth.getSession().then(({ data }) => {
  if (data.session) window.location.href = HALAMAN_SETELAH_LOGIN
})

// ---------- MASUK ----------
const formMasuk = document.getElementById('form-masuk')
if (formMasuk) {
  formMasuk.addEventListener('submit', async (e) => {
    e.preventDefault()  // cegah browser memuat ulang halaman
    const email = document.getElementById('email').value.trim()
    const password = document.getElementById('password').value
    if (!email || !password) return tampilPesan('Isi email dan kata sandi dulu.')

    setTombol(false, 'Memproses...')
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password })

    if (error) {
      setTombol(true, 'Masuk')
      return tampilPesan(terjemahError(error.message))
    }
    window.location.href = HALAMAN_SETELAH_LOGIN
  })
}

// ---------- DAFTAR ----------
const formDaftar = document.getElementById('form-daftar')
if (formDaftar) {
  formDaftar.addEventListener('submit', async (e) => {
    e.preventDefault()
    const nama = document.getElementById('nama').value.trim()
    const email = document.getElementById('email').value.trim()
    const password = document.getElementById('password').value
    const konfirmasi = document.getElementById('konfirmasi').value

    // Validasi di browser dulu (cepat, tanpa menghubungi server)
    if (!nama || !email) return tampilPesan('Nama lengkap dan email wajib diisi.')
    if (password.length < 8) return tampilPesan('Kata sandi minimal 8 karakter.')
    if (password !== konfirmasi) return tampilPesan('Konfirmasi kata sandi tidak sama.')
    if (!document.getElementById('setuju').checked) return tampilPesan('Centang persetujuan dulu untuk melanjutkan.')

    setTombol(false, 'Memproses...')
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      // "data" disimpan sebagai raw_user_meta_data. Trigger handle_new_user
      // (file 01-tabel.sql) membacanya untuk mengisi profiles.full_name.
      options: { data: { full_name: nama } },
    })

    if (error) {
      setTombol(true, 'Daftar sebagai kreator')
      return tampilPesan(terjemahError(error.message))
    }

    // Jika email sudah terdaftar, Supabase tidak memberi error (demi privasi)
    // tetapi daftar "identities"-nya kosong.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setTombol(true, 'Daftar sebagai kreator')
      return tampilPesan('Email ini sudah terdaftar. Silakan masuk.')
    }

    // Ada sesi → konfirmasi email nonaktif, langsung masuk ke dashboard.
    if (data.session) {
      window.location.href = HALAMAN_SETELAH_LOGIN
      return
    }
    // Tidak ada sesi → konfirmasi email aktif, minta pengguna cek email.
    formDaftar.reset()
    setTombol(true, 'Daftar sebagai kreator')
    tampilPesan('Akun dibuat. Kami mengirim tautan konfirmasi ke ' + email + '. Klik tautan itu, lalu masuk.', 'sukses')
  })
}
