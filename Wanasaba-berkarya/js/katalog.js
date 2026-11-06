// =====================================================================
//  js/katalog.js  ·  LANGKAH 5a — Katalog talenta (index.html)
// =====================================================================
const PER_HALAMAN = 6

// "kata" = potongan teks yang dicocokkan ke kolom category & skills.
// Dibuat potongan (bukan nama persis) supaya 'foto' cocok dengan kategori
// 'Foto & video' maupun keahlian 'Fotografi'.
const BIDANG = [
  { label: 'Semua bidang', kata: '' },
  { label: 'Fotografi', kata: 'foto' },
  { label: 'Desain', kata: 'desain' },
  { label: 'Video', kata: 'video' },
  { label: 'Penulisan', kata: 'tulis' },
  { label: 'Kerajinan', kata: 'kerajinan' },
  { label: 'Teknologi', kata: 'teknologi' },
  { label: 'Musik & seni', kata: 'musik' },
]

// Keadaan halaman saat ini. Setiap kali berubah, kita panggil muatTalenta().
const state = { kata: '', bidang: '', halaman: 1 }

const $grid = document.getElementById('grid')

function gambarChip() {
  document.getElementById('chips').innerHTML = BIDANG.map((b) => {
    const aktif = b.kata === state.bidang
    return `<button data-kata="${b.kata}" class="px-4 py-2 rounded-full text-sm border ${
      aktif ? 'bg-pine text-white border-pine' : 'border-black/20 text-black/60 hover:border-pine'}">${esc(b.label)}</button>`
  }).join('')
}

function kartu(p) {
  const foto = safeUrl(p.avatar_url)
  const keahlian = daftarKeahlian(p.skills).slice(0, 3).join(' · ')
  return `
  <article class="flex flex-col">
    <div class="aspect-[5/3] rounded-md overflow-hidden bg-mist grid place-items-center">
      ${foto ? `<img src="${esc(foto)}" alt="Foto ${esc(p.full_name)}" class="w-full h-full object-cover">`
             : `<span class="text-5xl font-bold text-pine/40">${inisial(p.full_name)}</span>`}
    </div>
    <div class="mt-4 flex items-start justify-between gap-3">
      <h2 class="text-xl font-bold">${esc(p.full_name)}</h2>
      ${p.category ? `<span class="shrink-0 text-xs bg-mist text-pine rounded-full px-3 py-1">${esc(p.category)}</span>` : ''}
    </div>
    <p class="mt-1">${esc(p.headline)}</p>
    <p class="text-sm text-black/50 mt-1 min-h-[1.25rem]">${esc(keahlian)}</p>
    <div class="mt-4 flex items-center justify-between gap-3">
      <span class="text-xs text-pine flex items-center gap-2"><i class="w-2 h-2 rounded-full bg-pine"></i>${esc(p.status)}</span>
      <a href="profil.html?id=${encodeURIComponent(p.id)}" class="border border-black/20 bg-white rounded-md px-4 py-2 text-sm font-medium text-pine">Lihat Profil ↗</a>
    </div>
  </article>`
}

// Hapus karakter yang merusak sintaks filter PostgREST (koma, kurung, %, *).
const bersihkan = (t) => t.replace(/[,()%*\\]/g, ' ').trim()

async function muatTalenta() {
  $grid.innerHTML = ''
  document.getElementById('info').textContent = 'Memuat...'

  const dari = (state.halaman - 1) * PER_HALAMAN
  let q = supabaseClient
    .from('profiles')
    .select('*', { count: 'exact' })
    .not('headline', 'is', null)   // sembunyikan profil yang belum dilengkapi
    .neq('headline', '')
    .order('created_at', { ascending: false })
    .range(dari, dari + PER_HALAMAN - 1)

  if (state.bidang) q = q.or(`category.ilike.%${state.bidang}%,skills.ilike.%${state.bidang}%`)
  const k = bersihkan(state.kata)
  if (k) q = q.or(`full_name.ilike.%${k}%,headline.ilike.%${k}%,skills.ilike.%${k}%`)

  const { data, count, error } = await q
  if (error) {
    document.getElementById('info').textContent = 'Gagal memuat data: ' + error.message
    return
  }

  document.getElementById('info').textContent = `${count} talenta`
  document.getElementById('kosong').classList.toggle('hidden', count > 0)
  $grid.innerHTML = data.map(kartu).join('')

  const total = Math.max(1, Math.ceil(count / PER_HALAMAN))
  document.getElementById('halaman').innerHTML = `
    <button data-hal="${state.halaman - 1}" ${state.halaman <= 1 ? 'disabled' : ''} class="disabled:opacity-40">← Sebelumnya</button>
    <span class="text-black/60">Halaman ${state.halaman} dari ${total}</span>
    <button data-hal="${state.halaman + 1}" ${state.halaman >= total ? 'disabled' : ''} class="disabled:opacity-40 font-medium text-pine">Berikutnya →</button>`
}

// ---------- Interaksi ----------
document.getElementById('form-cari').addEventListener('submit', (e) => {
  e.preventDefault()
  state.kata = document.getElementById('cari').value
  state.halaman = 1
  muatTalenta()
})
document.getElementById('chips').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return
  state.bidang = b.dataset.kata
  state.halaman = 1
  gambarChip()
  muatTalenta()
})
document.getElementById('halaman').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b || b.disabled) return
  state.halaman = Number(b.dataset.hal)
  muatTalenta()
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

gambarChip()
muatTalenta()