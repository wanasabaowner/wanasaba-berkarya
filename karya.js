// js/karya.js · Galeri karya terbit dari semua kreator (karya.html)
const PER_HALAMAN = 12
const KATEGORI = ['Semua', 'Fotografi', 'Video', 'Dokumenter', 'Desain', 'Penulisan', 'Kerajinan', 'Teknologi', 'Musik & seni']
const TAUTAN = { video: 'Tonton video', link: 'Buka proyek' }
const state = { kategori: 'Semua', halaman: 0 }

const elGrid = document.getElementById('grid')
const elChips = document.getElementById('chips')
const elInfo = document.getElementById('info')
const elLagi = document.getElementById('lagi')

function gambarChips() {
  elChips.innerHTML = KATEGORI.map((k) => {
    const aktif = k === state.kategori
    return `<button data-k="${esc(k)}" class="px-4 py-2 rounded-full border text-sm ${aktif ? 'bg-pine text-white border-pine' : 'border-black/15 text-black/70'}">${esc(k)}</button>`
  }).join('')
}

function kartu(k) {
  const gambar = safeUrl(k.cover_image)
  const tujuan = k.work_type === 'video' ? safeUrl(k.video_url) : k.work_type === 'link' ? safeUrl(k.project_url) : ''
  const nama = k.profiles?.full_name || 'Kreator Wanasaba'
  return `
    <article>
      <div class="aspect-[3/2] rounded-md overflow-hidden bg-mist">${gambar ? `<img src="${esc(gambar)}" alt="${esc(k.title)}" class="w-full h-full object-cover">` : ''}</div>
      <p class="mt-3 text-sm text-black/50">${esc(k.category || '')}</p>
      <h3 class="text-xl mt-1">${esc(k.title)}</h3>
      <p class="text-sm mt-1">oleh <a href="profil.html?id=${encodeURIComponent(k.user_id)}" class="text-pine font-medium">${esc(nama)}</a></p>
      ${tujuan ? `<a href="${esc(tujuan)}" target="_blank" rel="noopener" class="inline-block mt-2 text-sm font-medium text-pine">${TAUTAN[k.work_type]}</a>` : ''}
    </article>`
}

// tambah = true → tambahkan di bawah yang sudah ada ("Tampilkan lebih banyak")
async function muat(tambah = false) {
  if (!tambah) {
    state.halaman = 0
    elGrid.innerHTML = '<p class="text-black/50 col-span-full">Memuat karya...</p>'
  }
  const dari = state.halaman * PER_HALAMAN
  // profiles(full_name) = ambil nama pembuat karya lewat relasi user_id → profiles.id
  let q = supabaseClient.from('portfolios')
    .select('id, title, category, work_type, cover_image, video_url, project_url, user_id, profiles(full_name)', { count: 'exact' })
    .eq('status', 'terbit')
  if (state.kategori !== 'Semua') q = q.eq('category', state.kategori)
  const { data, count, error } = await q.order('updated_at', { ascending: false }).range(dari, dari + PER_HALAMAN - 1)

  if (error) {
    elGrid.innerHTML = `<p class="text-red-800 col-span-full">Gagal memuat karya: ${esc(error.message)}</p>`
    return
  }
  const html = data.map(kartu).join('')
  if (tambah) elGrid.insertAdjacentHTML('beforeend', html)
  else elGrid.innerHTML = html || '<p class="text-black/50 col-span-full">Belum ada karya di kategori ini.</p>'
  elInfo.textContent = `${count} karya`
  elLagi.classList.toggle('hidden', dari + data.length >= count)
}

elChips.addEventListener('click', (e) => {
  const b = e.target.closest('[data-k]')
  if (!b) return
  state.kategori = b.dataset.k
  gambarChips()
  muat()
})
elLagi.addEventListener('click', () => { state.halaman += 1; muat(true) })

gambarChips()
muat()