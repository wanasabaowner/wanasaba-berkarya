// js/dashboard-profil.js · Halaman Kelola profil
// id elemen di HTML sama persis dengan nama kolom di tabel profiles,
// jadi cukup satu daftar kolom untuk mengisi dan menyimpan form.
const KOLOM = ['full_name', 'headline', 'category', 'skills', 'bio', 'status', 'whatsapp', 'instagram', 'linkedin', 'github', 'youtube']
let ctx = null       // { user, profil } dari mulaiDashboard()
let fileBaru = null  // foto yang dipilih tapi belum diunggah

function isiForm() {
  KOLOM.forEach((k) => { document.getElementById(k).value = ctx.profil?.[k] || '' })
  document.getElementById('foto').innerHTML = gambarAtauInisial(ctx.profil?.avatar_url, ctx.profil?.full_name, 'w-full h-full')
  fileBaru = null
}

async function mulai() {
  ctx = await mulaiDashboard('profil')
  if (!ctx) return
  document.getElementById('category').innerHTML = '<option value="">Pilih kategori</option>' + opsi(KATEGORI_PROFIL)
  isiForm()
}

// Pilih foto → tampilkan pratinjau dulu; diunggah baru saat klik "Simpan".
document.getElementById('file').addEventListener('change', (e) => {
  fileBaru = e.target.files[0] || null
  if (fileBaru) document.getElementById('foto').innerHTML =
    `<img src="${URL.createObjectURL(fileBaru)}" alt="" class="w-full h-full object-cover">`
})
document.getElementById('batal').addEventListener('click', isiForm)

document.getElementById('form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const nilai = {}
  KOLOM.forEach((k) => { nilai[k] = document.getElementById(k).value.trim() || null })
  if (!nilai.full_name) return pesan('Nama lengkap wajib diisi.', 'error')
  for (const k of ['instagram', 'linkedin', 'github', 'youtube']) {
    if (nilai[k] && !safeUrl(nilai[k])) return pesan(`Tautan ${k} tidak valid.`, 'error')
    if (nilai[k]) nilai[k] = safeUrl(nilai[k])   // lengkapi "https://" bila belum ada
  }
  const tombol = document.getElementById('simpan')
  tombol.disabled = true
  tombol.textContent = 'Menyimpan...'
  try {
    if (fileBaru) nilai.avatar_url = await unggahGambar(fileBaru, ctx.user.id)
    const { error } = await supabaseClient.from('profiles').update(nilai).eq('id', ctx.user.id)
    if (error) throw error
    ctx.profil = { ...ctx.profil, ...nilai }
    isiForm()
    pesan('Perubahan tersimpan.')
  } catch (err) {
    pesan(err.message, 'error')
  }
  tombol.disabled = false
  tombol.textContent = 'Simpan perubahan'
})

mulai()