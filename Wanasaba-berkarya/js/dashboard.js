// =====================================================================
//  js/dashboard.js  ·  LANGKAH 6 — Fungsi bersama semua halaman dashboard
//  Urutan <script>: supabase lib → supabase-client → util → dashboard → halaman
// =====================================================================
const KATEGORI_PROFIL = ['Foto & video', 'Desain', 'Kerajinan', 'Penulisan', 'Teknologi', 'Musik & seni']
const KATEGORI_KARYA = ['Fotografi', 'Video', 'Dokumenter', 'Desain', 'Penulisan', 'Kerajinan', 'Teknologi', 'Musik & seni']

// Daftar → <option> untuk <select>
const opsi = (daftar) => daftar.map((k) => `<option>${esc(k)}</option>`).join('')

// Kotak pesan di atas form (elemen #pesan ada di tiap halaman)
function pesan(teks, jenis = 'sukses') {
  const el = document.getElementById('pesan')
  el.textContent = teks
  el.className = 'mb-6 rounded-md px-4 py-3 text-sm ' + (jenis === 'error' ? 'bg-red-50 text-red-800' : 'bg-mist text-pine')
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

// Gambar profil/karya, atau huruf pertama nama kalau belum ada foto.
function gambarAtauInisial(url, nama, kelas) {
  const u = safeUrl(url)
  return u ? `<img src="${esc(u)}" alt="" class="${kelas} object-cover">`
           : `<div class="${kelas} bg-mist text-pine text-2xl font-semibold grid place-items-center">${inisial(nama)}</div>`
}

// Dipanggil pertama kali di tiap halaman dashboard:
// 1) cek sudah login (kalau belum → masuk.html)  2) ambil profil
// 3) bangun header + sidebar, lalu pindahkan <main id="isi"> ke dalamnya.
async function mulaiDashboard(aktif) {
  const { data } = await supabaseClient.auth.getSession()
  if (!data.session) { location.href = 'masuk.html'; return null }
  const user = data.session.user
  const { data: profil } = await supabaseClient.from('profiles').select('*').eq('id', user.id).maybeSingle()

  const menu = (href, kunci, teks) =>
    `<a href="${href}" class="block px-4 py-3 rounded-md ${aktif === kunci ? 'bg-mist text-pine font-medium' : ''}">${teks}</a>`
  document.getElementById('shell').innerHTML = `
    <header class="border-b border-black/10"><div class="px-6 h-20 flex items-center justify-between">
      <a href="index.html" class="flex items-center gap-3"><span class="bg-pine text-white font-bold w-10 h-10 rounded-md grid place-items-center">w.</span><span class="text-lg">Wanasaba Berkarya</span></a>
      <a href="profil.html?id=${encodeURIComponent(user.id)}" class="text-sm font-medium text-pine">Lihat profil publik ↗</a></div></header>
    <div class="md:flex">
      <aside class="md:w-64 md:min-h-screen border-b md:border-b-0 md:border-r border-black/10 p-6 flex flex-col gap-1">
        <p class="text-xs tracking-widest text-pine uppercase">Ruang kreator</p>
        <p class="text-xl font-semibold mb-3">${esc(profil?.full_name || user.email)}</p>
        ${menu('dashboard-profil.html', 'profil', 'Kelola profil')}${menu('dashboard-karya.html', 'karya', 'Karya saya')}
        <button id="keluar" class="text-left px-4 py-3 text-sm text-black/50 mt-4">Keluar dari akun</button>
      </aside>
      <div id="slot" class="flex-1 p-6 md:p-12 max-w-5xl"></div>
    </div>`
  const isi = document.getElementById('isi')
  document.getElementById('slot').appendChild(isi)
  isi.classList.remove('hidden')
  document.getElementById('keluar').onclick = async () => {
    await supabaseClient.auth.signOut()
    location.href = 'index.html'
  }
  return { user, profil }
}

// Unggah gambar ke Storage lalu kembalikan URL publiknya.
// Path-nya "<id-user>/<waktu>.jpg": folder berisi id sendiri,
// cocok dengan policy Storage di 02-keamanan.sql.
async function unggahGambar(file, userId) {
  if (!['image/jpeg', 'image/png'].includes(file.type)) throw new Error('File harus berformat JPG atau PNG.')
  if (file.size > 5 * 1024 * 1024) throw new Error('Ukuran file maksimal 5 MB.')
  const path = `${userId}/${Date.now()}.${file.type === 'image/png' ? 'png' : 'jpg'}`
  const { error } = await supabaseClient.storage.from(BUCKET).upload(path, file, { contentType: file.type })
  if (error) throw new Error('Gagal mengunggah gambar: ' + error.message)
  return supabaseClient.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

// Hapus file lama di Storage berdasarkan URL publiknya, supaya kuota 1 GB
// tidak habis oleh gambar yang sudah tidak dipakai. Gagal pun tidak masalah
// (hanya pembersihan), jadi error diabaikan.
async function hapusFileLama(url) {
  try {
    const penanda = `/object/public/${BUCKET}/`
    const i = (url || '').indexOf(penanda)
    if (i === -1) return
    const path = decodeURIComponent(url.slice(i + penanda.length).split('?')[0])
    await supabaseClient.storage.from(BUCKET).remove([path])
  } catch (e) { /* abaikan */ }
}
