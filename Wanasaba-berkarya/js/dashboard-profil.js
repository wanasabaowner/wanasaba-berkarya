// js/dashboard-profil.js · Halaman Kelola profil
// id elemen di HTML sama persis dengan nama kolom di tabel profiles,
// jadi cukup satu daftar kolom untuk mengisi dan menyimpan form.
const KOLOM = ['full_name', 'headline', 'skills', 'bio', 'status', 'whatsapp', 'instagram', 'linkedin', 'github', 'youtube']
let ctx = null       // { user, profil } dari mulaiDashboard()
let fileBaru = null  // foto yang dipilih tapi belum diunggah

function isiForm() {
  document.getElementById('is_hidden').checked = !!ctx.profil?.is_hidden
  KOLOM.forEach((k) => {
    const el = document.getElementById(k)
    const nilai = ctx.profil?.[k] || ''
    // Nilai yang belum ada di daftar pilihan (mis. diisi manual lewat Table Editor)
    // ditambahkan dulu; kalau tidak, dropdown tampak kosong dan nilainya TERHAPUS saat disimpan.
    if (el.tagName === 'SELECT' && nilai && ![...el.options].some((o) => o.value === nilai))
      el.insertAdjacentHTML('beforeend', `<option>${esc(nilai)}</option>`)
    el.value = nilai
  })
  document.getElementById('foto').innerHTML = gambarAtauInisial(ctx.profil?.avatar_url, ctx.profil?.full_name, 'w-full h-full')
  fileBaru = null
  isiBidang()
  pratinjau()
}

// Kartu pratinjau mengikuti isi form setiap kali ada ketikan atau foto baru.
function pratinjau() {
  const v = (id) => document.getElementById(id).value.trim()
  document.getElementById('pv-foto').innerHTML = document.getElementById('foto').innerHTML
  document.getElementById('pv-nama').textContent = v('full_name') || 'Nama lengkap'
  document.getElementById('pv-headline').textContent = v('headline') || 'Headline kamu'
  const kategori = document.getElementById('pv-kategori')
  const bidang = ambilBidang().join(', ')
  kategori.textContent = bidang
  kategori.classList.toggle('hidden', !bidang)
  document.getElementById('pv-status').textContent = '● ' + v('status')
}

const BIDANG_STANDAR = ['Fotografi', 'Video', 'Desain', 'Penulisan', 'Kerajinan', 'Teknologi', 'Musik & seni']

// Gabungan kotak yang dicentang + isian "bidang lain" → daftar rapi tanpa duplikat
// (besar/kecil huruf dianggap sama), tiap bidang maksimal 30 karakter.
function ambilBidang() {
  const dicentang = [...document.querySelectorAll('#bidang input:checked')].map((c) => c.value)
  const lain = document.getElementById('bidang_lain').value.split(',').map((t) => t.trim().slice(0, 30))
  const hasil = []
  for (const b of [...dicentang, ...lain]) if (b && !hasil.some((h) => h.toLowerCase() === b.toLowerCase())) hasil.push(b)
  return hasil
}

// Kebalikannya: isi centang + kolom "bidang lain" dari data tersimpan.
function isiBidang() {
  const kotak = [...document.querySelectorAll('#bidang input')]
  kotak.forEach((c) => { c.checked = false })
  const lain = []
  for (const b of (ctx.profil?.category || '').split(',').map((t) => t.trim()).filter(Boolean)
    .flatMap((t) => (t.toLowerCase() === 'foto & video' ? ['Fotografi', 'Video'] : [t]))) {   // data lama
    const cocok = kotak.find((c) => c.value.toLowerCase() === b.toLowerCase())
    if (cocok) cocok.checked = true
    else lain.push(b)
  }
  document.getElementById('bidang_lain').value = lain.join(', ')
}

async function mulai() {
  ctx = await mulaiDashboard('profil')
  if (!ctx) return
  document.getElementById('bidang').innerHTML = BIDANG_STANDAR.map((b) =>
    `<label class="flex items-center gap-2"><input type="checkbox" value="${esc(b)}" class="accent-pine w-4 h-4">${esc(b)}</label>`).join('')
  isiForm()
}

// Pilih foto → tampilkan pratinjau dulu; diunggah baru saat klik "Simpan".
document.getElementById('file').addEventListener('change', (e) => {
  fileBaru = e.target.files[0] || null
  if (fileBaru) document.getElementById('foto').innerHTML =
    `<img src="${URL.createObjectURL(fileBaru)}" alt="" class="w-full h-full object-cover">`
})
document.getElementById('batal').addEventListener('click', isiForm)
// 'input' = ketikan, 'change' = pilihan dropdown/foto (naik dari elemen ke form)
document.getElementById('form').addEventListener('input', pratinjau)
document.getElementById('form').addEventListener('change', pratinjau)

document.getElementById('form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const nilai = {}
  KOLOM.forEach((k) => { nilai[k] = document.getElementById(k).value.trim() || null })
  if (!nilai.full_name) return pesan('Nama lengkap wajib diisi.', 'error')
  nilai.status = nilai.status || 'Terbuka untuk proyek'   // kolom ini tidak boleh kosong di database
  nilai.is_hidden = document.getElementById('is_hidden').checked
  const bidang = ambilBidang()
  if (!bidang.length) return pesan('Pilih atau tulis minimal satu bidang.', 'error')
  if (bidang.length > 5) return pesan('Maksimal 5 bidang. Kurangi dulu beberapa.', 'error')
  nilai.category = bidang.join(', ')   // disimpan sebagai teks dipisah koma
  for (const k of ['instagram', 'linkedin', 'github', 'youtube']) {
    if (nilai[k] && !safeUrl(nilai[k])) return pesan(`Tautan ${k} tidak valid.`, 'error')
    if (nilai[k]) nilai[k] = safeUrl(nilai[k])   // lengkapi "https://" bila belum ada
  }
  const tombol = document.getElementById('simpan')
  tombol.disabled = true
  tombol.textContent = 'Menyimpan...'
  try {
    const avatarLama = ctx.profil?.avatar_url
    if (fileBaru) nilai.avatar_url = await unggahGambar(fileBaru, ctx.user.id)
    const { error } = await supabaseClient.from('profiles').upsert({ id: ctx.user.id, ...nilai })   // ubah bila profil ada, buat bila hilang (tidak ada lagi 'tersimpan' palsu)
    if (error) throw error
    if (fileBaru) await hapusFileLama(avatarLama)   // foto lama sudah tidak dipakai
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
