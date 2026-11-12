// =====================================================================
//  js/sandi.js · Lupa kata sandi (lupa-sandi.html) dan
//  membuat kata sandi baru (atur-sandi.html)
//  Alurnya: minta tautan → klik tautan di email → mendarat di atur-sandi.html
//  → simpan kata sandi baru. Bergantung pada `supabaseClient`.
// =====================================================================
function tampil(teks, jenis = 'error') {
  const kotak = document.getElementById('pesan')
  kotak.textContent = teks
  kotak.className = 'mt-6 rounded-md px-4 py-3 text-sm ' + (jenis === 'error' ? 'bg-red-50 text-red-800' : 'bg-mist text-pine')
}
function kunci(aktif, teks) {
  const tombol = document.getElementById('tombol')
  tombol.disabled = !aktif
  tombol.textContent = teks
}

// ---------- 1) Minta tautan lewat email ----------
const formLupa = document.getElementById('form-lupa')
if (formLupa) {
  formLupa.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = document.getElementById('email').value.trim()
    if (!email) return tampil('Isi email akunmu dulu.')
    kunci(false, 'Mengirim...')
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      // Tautan di email akan mengarah ke halaman ini. Alamat ini HARUS terdaftar
      // di Supabase → Authentication → URL Configuration → Redirect URLs.
      redirectTo: new URL('atur-sandi.html', location.href).href,
    })
    kunci(true, 'Kirim tautan')
    if (error) {
      return tampil(pesanBatas(error.message) || 'Gagal mengirim tautan: ' + error.message)
    }
    // Jawabannya sama untuk email terdaftar maupun tidak, supaya tidak membocorkan siapa yang punya akun.
    tampil('Tautan terkirim. Jika email itu terdaftar, cek kotak masuk dan folder spam.', 'sukses')
  })
}

// ---------- 2) Simpan kata sandi baru ----------
const formAtur = document.getElementById('form-atur')
if (formAtur) {
  let siap = false
  // supabase-js membaca token dari tautan email secara otomatis dan membuat
  // sesi pemulihan. Kita hanya menunggu kabarnya, lalu menampilkan form.
  supabaseClient.auth.onAuthStateChange((event, sesi) => {
    if (event === 'PASSWORD_RECOVERY' || (event === 'INITIAL_SESSION' && sesi)) {
      siap = true
      document.getElementById('status').classList.add('hidden')
      formAtur.classList.remove('hidden')
    }
  })
  // Tidak ada kabar dalam 4 detik → tautannya tidak sah atau sudah kedaluwarsa.
  setTimeout(() => {
    if (!siap) document.getElementById('status').innerHTML =
      'Tautan tidak sah atau sudah kedaluwarsa. <a href="lupa-sandi.html" class="font-semibold text-pine">Minta tautan baru</a>.'
  }, 4000)

  formAtur.addEventListener('submit', async (e) => {
    e.preventDefault()
    const sandi = document.getElementById('sandi').value
    if (sandi.length < 8) return tampil('Kata sandi minimal 8 karakter.')
    if (sandi !== document.getElementById('konfirmasi').value) return tampil('Konfirmasi kata sandi tidak sama.')
    kunci(false, 'Menyimpan...')
    const { error } = await supabaseClient.auth.updateUser({ password: sandi })
    if (error) {
      kunci(true, 'Simpan kata sandi')
      return tampil(error.message.toLowerCase().includes('different')
        ? 'Kata sandi baru harus berbeda dari yang lama.'
        : 'Gagal menyimpan kata sandi: ' + error.message)
    }
    tampil('Kata sandi baru tersimpan. Mengalihkan ke ruang kreator...', 'sukses')
    setTimeout(() => { location.href = 'dashboard-profil.html' }, 1500)
  })
}