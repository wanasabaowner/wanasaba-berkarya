// js/tambah-karya.js · Tambah karya baru, atau edit kalau ada ?id=... di alamat
const idEdit = new URLSearchParams(location.search).get('id')
const JENIS = { foto: 'Foto', video: 'Video', link: 'Link proyek' }
let ctx = null
let jenis = 'foto'
let coverLama = ''   // URL sampul yang sudah tersimpan (mode edit)
let fileBaru = null  // gambar baru yang dipilih, belum diunggah

const val = (id) => document.getElementById(id).value.trim()

// Teks dan kolom form mengikuti jenis karya. Dulu semua jenis memakai tulisan
// "Pilih gambar" dan menampilkan dua kolom tautan sekaligus, sehingga memilih
// "Video" terasa seperti harus mengunggah foto.
const TEKS = {
  foto:  { judul: 'Gambar sampul / preview *', tombol: 'Pilih gambar', ganti: 'Ganti gambar',
           hint: 'JPG atau PNG, maks. 5 MB. Disarankan rasio 3:2.' },
  video: { judul: 'Sampul video (gambar pratinjau) *', tombol: 'Pilih gambar sampul', ganti: 'Ganti gambar sampul',
           hint: 'Ini gambar pratinjau yang tampil di profil, bukan file video. JPG atau PNG, maks. 5 MB.' },
  link:  { judul: 'Gambar pratinjau proyek *', tombol: 'Pilih gambar pratinjau', ganti: 'Ganti gambar pratinjau',
           hint: 'JPG atau PNG, maks. 5 MB. Disarankan rasio 3:2.' },
}
function terapkanJenis() {
  const t = TEKS[jenis] || TEKS.foto
  document.getElementById('lbl-sampul').textContent = t.judul
  document.getElementById('txt-file').textContent = (fileBaru || coverLama) ? t.ganti : t.tombol
  document.getElementById('hint-sampul').textContent = t.hint
  document.getElementById('box-video').classList.toggle('hidden', jenis !== 'video')
  document.getElementById('box-proyek').classList.toggle('hidden', jenis !== 'link')
}

// Kategori "Lainnya (tulis sendiri)": kolom teks muncul, dan nilainya yang disimpan.
function tampilKategoriLain() {
  document.getElementById('category_lain').classList.toggle('hidden', val('category') !== '__lain')
}
function kategoriDipilih() {
  const v = val('category')
  return v === '__lain' ? (val('category_lain').slice(0, 30) || null) : (v || null)
}

function gambarJenis() {
  document.getElementById('jenis').innerHTML = Object.entries(JENIS).map(([k, label]) =>
    `<button type="button" data-jenis="${k}" class="border rounded-md py-3 ${jenis === k ? 'bg-mist border-pine text-pine font-medium' : 'border-black/15'}">${label}</button>`).join('')
  terapkanJenis()
}

function gambarSampul() {
  const sumber = fileBaru ? URL.createObjectURL(fileBaru) : safeUrl(coverLama)
  document.getElementById('sampul').innerHTML = sumber
    ? `<img src="${esc(sumber)}" alt="" class="w-full h-full object-cover">`
    : '<div class="w-full h-full bg-mist grid place-items-center text-xs text-black/40">Belum ada gambar</div>'
  terapkanJenis()
}

async function mulai() {
  ctx = await mulaiDashboard('karya')
  if (!ctx) return
  document.getElementById('category').innerHTML = '<option value="">Pilih kategori</option>' + opsi(KATEGORI_KARYA) + '<option value="__lain">Lainnya (tulis sendiri)…</option>'
  if (idEdit) {
    document.getElementById('judul-halaman').textContent = 'Edit karya'
    // .eq('user_id') = hanya karya milik sendiri yang bisa diedit
    const { data: k } = await supabaseClient.from('portfolios').select('*')
      .eq('id', idEdit).eq('user_id', ctx.user.id).maybeSingle()
    if (!k) return pesan('Karya tidak ditemukan.', 'error')
    ;['title', 'description', 'video_url', 'project_url'].forEach((f) => { document.getElementById(f).value = k[f] || '' })
    // Kategori di luar daftar (tulisan sendiri) → pilih "Lainnya" dan isi kolomnya
    if (k.category && !KATEGORI_KARYA.includes(k.category)) {
      document.getElementById('category').value = '__lain'
      document.getElementById('category_lain').value = k.category
    } else document.getElementById('category').value = k.category || ''
    tampilKategoriLain()
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
document.getElementById('category').addEventListener('change', tampilKategoriLain)
document.getElementById('file').addEventListener('change', (e) => {
  fileBaru = e.target.files[0] || null
  gambarSampul()
})

// status: 'draf' (tidak tampil di publik) atau 'terbit' (tampil di profil publik)
async function simpan(status) {
  const data = {
    title: val('title'), description: val('description') || null, category: kategoriDipilih(),
    // tautan yang tidak relevan dengan jenis karya dikosongkan agar data tidak berisi sisa
    work_type: jenis, video_url: jenis === 'video' ? (val('video_url') || null) : null,
    project_url: jenis === 'link' ? (val('project_url') || null) : null, status,
  }
  if (!data.title) return pesan('Judul karya wajib diisi.', 'error')
  if (val('category') === '__lain' && !data.category) return pesan('Tulis kategori karyamu di kolom yang muncul di bawah pilihan kategori.', 'error')
  if (status === 'terbit' && (!data.description || !data.category || !(fileBaru || coverLama)))
    return pesan('Untuk menerbitkan, lengkapi deskripsi, kategori, dan gambar sampul.', 'error')
  if (status === 'terbit' && ((jenis === 'video' && !data.video_url) || (jenis === 'link' && !data.project_url)))
    return pesan(jenis === 'video' ? 'Karya video perlu link video sebelum diterbitkan.' : 'Karya jenis link perlu link proyek sebelum diterbitkan.', 'error')
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
    if (idEdit && fileBaru) await hapusFileLama(coverLama)   // sampul lama sudah diganti
    location.href = 'dashboard-karya.html'
  } catch (err) {
    pesan(err.message, 'error')
    tombol.forEach((t) => { t.disabled = false })
  }
}
document.getElementById('draf').addEventListener('click', () => simpan('draf'))
document.getElementById('terbit').addEventListener('click', () => simpan('terbit'))

mulai()
