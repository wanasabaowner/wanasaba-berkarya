// =====================================================================
//  js/hapus-akun.js · Hapus akun sendiri, dengan konfirmasi lewat email
//  Alur: (1) kirim tautan ke email → (2) buka tautan, kembali ke halaman ini
//        → (3) ketik HAPUS → file gambar dihapus → akun dihapus.
//  Pemeriksaan "email sudah dikonfirmasi?" dilakukan DATABASE (fungsi
//  konfirmasi_hapus_valid di 04-bidang-dan-hapus-akun.sql), bukan hanya
//  tampilan, jadi tidak bisa dilewati dengan memanggil API langsung.
// =====================================================================
let ctx = null
const el = (id) => document.getElementById(id)

// Tampilkan langkah yang sesuai: sudah terkonfirmasi → langkah 2, belum → langkah 1.
async function tampilkanLangkah() {
  const { data: valid } = await supabaseClient.rpc('konfirmasi_hapus_valid')
  el('langkah-1').classList.toggle('hidden', !!valid)
  el('langkah-2').classList.toggle('hidden', !valid)
}

async function mulai() {
  ctx = await mulaiDashboard('akun')
  if (!ctx) return
  el('email-akun').textContent = ctx.user.email
  tampilkanLangkah()
}

// Langkah 1: kirim tautan masuk ke email akun ini.
// shouldCreateUser:false = jangan pernah membuat akun baru lewat jalur ini.
// Alamat tujuan HARUS terdaftar di Supabase → Authentication → URL Configuration → Redirect URLs.
el('kirim').addEventListener('click', async () => {
  el('kirim').disabled = true
  const { error } = await supabaseClient.auth.signInWithOtp({
    email: ctx.user.email,
    options: { shouldCreateUser: false, emailRedirectTo: new URL('hapus-akun.html', location.href).href },
  })
  el('kirim').disabled = false
  if (error) {
    return pesan(pesanBatas(error.message) || 'Gagal mengirim email: ' + error.message, 'error')
  }
  pesan('Email terkirim. Cek kotak masuk (dan folder spam), lalu buka tautannya.')
})

// Tombol hapus baru aktif kalau kata HAPUS diketik.
el('ketik').addEventListener('input', () => {
  el('hapus').disabled = el('ketik').value.trim().toLowerCase() !== 'hapus'
})

// Hapus SEMUA file di folder milik sendiri lewat Storage API (maks. 2000 file).
async function hapusSemuaFile(uid) {
  for (let i = 0; i < 20; i++) {
    const { data } = await supabaseClient.storage.from(BUCKET).list(uid, { limit: 100 })
    if (!data || !data.length) return
    const { error } = await supabaseClient.storage.from(BUCKET).remove(data.map((f) => `${uid}/${f.name}`))
    if (error) throw new Error('Gagal menghapus gambar: ' + error.message)
  }
}

// Langkah 3: hapus file, lalu akun.
el('hapus').addEventListener('click', async () => {
  el('hapus').disabled = true
  try {
    // Cek lagi: kalau konfirmasi sudah kedaluwarsa, berhenti SEBELUM file apa pun terhapus.
    const { data: valid } = await supabaseClient.rpc('konfirmasi_hapus_valid')
    if (!valid) { await tampilkanLangkah(); throw new Error('Konfirmasi email sudah kedaluwarsa. Minta email konfirmasi baru.') }

    await hapusSemuaFile(ctx.user.id)   // file dulu, supaya tidak ada yang yatim di Storage
    const { error } = await supabaseClient.rpc('hapus_akun_saya')
    if (error) throw error

    await supabaseClient.auth.signOut({ scope: 'local' })   // bersihkan sesi di browser ini
    pesan('Akunmu sudah dihapus. Terima kasih sudah berkarya di Wanasaba.')
    setTimeout(() => { location.href = 'index.html' }, 2500)
  } catch (err) {
    pesan(err.message, 'error')
    el('hapus').disabled = el('ketik').value.trim().toLowerCase() !== 'hapus'
  }
})

mulai()