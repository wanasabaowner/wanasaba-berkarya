// js/tambah-karya.js · Tambah karya baru, atau edit kalau ada ?id=... di alamat
const idEdit = new URLSearchParams(location.search).get('id')
const JENIS = { foto: 'Foto', video: 'Video', link: 'Link proyek' }
let ctx = null
let jenis = 'foto'
let coverLama = ''   // URL sampul yang sudah tersimpan (mode edit)
let fileBaru = null  // gambar baru yang dipilih, belum diunggah

const val = (id) => document.getElementById(id).value.trim()

function gambarJenis() {
  document.getElementById('jenis').innerHTML = Object.entries(JENIS).map(([k, label]) =>
    `<button type="button" data-jenis="${k}" class="border rounded-md py-3 ${jenis === k ? 'bg-mist border-pine text-pine font-medium' : 'border-black/15'}">${label}</button>`).join('')
}

function gambarSampul() {
  const sumber = fileBaru ? URL.createObjectURL(fileBaru) : safeUrl(coverLama)
  document.getElementById('sampul').innerHTML = sumber
    ? `<img src="${esc(sumber)}" alt="" class="w-full h-full object-cover">`
    : '<div class="w-full h-full bg-mist grid place-items-center text-xs text-black/40">Belum ada gambar</div>'
}

async function mulai() {
  ctx = await mulaiDashboard('karya')
  if (!ctx) return
  document.getElementById('category').innerHTML = '<option value="">Pilih kategori</option>' + opsi(KATEGORI_KARYA)
  if (idEdit) {
    document.getElementById('judul-halaman').textContent = 'Edit karya'
    // .eq('user_id') = hanya karya milik sendiri yang bisa diedit
    const { data: k } = await supabaseClient.from('portfolios').select('*')
      .eq('id', idEdit).eq('user_id', ctx.user.id).maybeSingle()
    if (!k) return pesan('Karya tidak ditemukan.', 'error')
    ;['title', 'description', 'category', 'video_url', 'project_url'].forEach((f) => { document.getElementById(f).value = k[f] || '' })
    jenis = k.work_type
    coverLama = k.cover_image || ''
  }
  gambarJenis()
  gambarSampul()
}

document.getElementById('jenis').addEventListener('click', (e) => {
  const b = e.target.closest('[data-jenis]')
  if (b) { jenis = b.dataset.jenis; gambarJenis() }
})
document.getElementById('file').addEventListener('change', (e) => {
  fileBaru = e.target.files[0] || null
  gambarSampul()
})

// status: 'draf' (tidak tampil di publik) atau 'terbit' (tampil di profil publik)
async function simpan(status) {
  const data = {
    title: val('title'), description: val('description') || null, category: val('category') || null,
    work_type: jenis, video_url: val('video_url') || null, project_url: val('project_url') || null, status,
  }
  if (!data.title) return pesan('Judul karya wajib diisi.', 'error')
  if (status === 'terbit' && (!data.description || !data.category || !(fileBaru || coverLama)))
    return pesan('Untuk menerbitkan, lengkapi deskripsi, kategori, dan gambar sampul.', 'error')
  for (const k of ['video_url', 'project_url']) {
    if (!data[k]) continue
    data[k] = safeUrl(data[k])
    if (!data[k]) return pesan('Tautan tidak valid. Pakai alamat yang diawali https://', 'error')
  }

  const tombol = [document.getElementById('draf'), document.getElementById('terbit')]
  tombol.forEach((t) => { t.disabled = true })
  try {
    data.cover_image = fileBaru ? await unggahGambar(fileBaru, ctx.user.id) : (coverLama || null)
    const { error } = idEdit
      ? await supabaseClient.from('portfolios').update(data).eq('id', idEdit).eq('user_id', ctx.user.id)
      : await supabaseClient.from('portfolios').insert({ ...data, user_id: ctx.user.id })
    if (error) throw error
    location.href = 'dashboard-karya.html'
  } catch (err) {
    pesan(err.message, 'error')
    tombol.forEach((t) => { t.disabled = false })
  }
}
document.getElementById('draf').addEventListener('click', () => simpan('draf'))
document.getElementById('terbit').addEventListener('click', () => simpan('terbit'))

mulai()