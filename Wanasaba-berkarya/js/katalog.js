// =====================================================================
//  js/katalog.js  ·  LANGKAH 5a — Katalog talenta (index.html)
// =====================================================================
const PER_HALAMAN = 6

// "kata" = potongan teks yang dicocokkan ke kolom category (daftar bidang yang
// dipilih kreator, dipisah koma, mis. 'Fotografi, Video, Tata rias').
// Bidang tulisan sendiri yang tidak punya chip tampil di dropdown "Bidang lain".
const BIDANG = [
  { label: 'Semua bidang', kata: '' },
  { label: 'Fotografi', kata: 'foto' },
  { label: 'Desain', kata: 'desain' },
  { label: 'Video', kata: 'video' },
  { label: 'Penulisan', kata: 'nulis' },   // 'nulis' cocok dgn Penulisan/Penulis/Menulis; 'tulis' TIDAK cocok dgn 'Penulisan'
  { label: 'Kerajinan', kata: 'kerajinan' },
  { label: 'Teknologi', kata: 'teknologi' },
  { label: 'Musik & seni', kata: 'musik' },
]

// Keadaan halaman saat ini. Setiap kali berubah, kita panggil muatTalenta().
const state = { kata: '', bidang: '', halaman: 1 }

const $grid = document.getElementById('grid')
let bidangLain = []   // bidang tulisan sendiri kreator (di luar daftar standar)

function gambarChip() {
  document.getElementById('chips').innerHTML = BIDANG.map((b) => {
    const aktif = b.kata === state.bidang
    return `<button data-kata="${b.kata}" class="px-4 py-2 rounded-full text-sm border ${
      aktif ? 'bg-pine text-white border-pine' : 'border-black/20 text-black/60 hover:border-pine'}">${esc(b.label)}</button>`
  }).join('') + pilihanLain()
}

function pilihanLain() {
  if (!bidangLain.length) return ''
  const aktif = bidangLain.includes(state.bidang)
  return `<select id="bidang-lain" aria-label="Bidang lain" class="px-4 py-2 rounded-full text-sm border bg-transparent ${aktif ? 'border-pine text-pine font-medium' : 'border-black/20 text-black/60'}">
    <option value="">Bidang lain…</option>${bidangLain.map((b) => `<option value="${esc(b)}" ${b === state.bidang ? 'selected' : ''}>${esc(b)}</option>`).join('')}</select>`
}

// Kumpulkan bidang yang tidak punya chip sendiri, urut dari yang paling banyak dipakai.
async function muatBidangLain() {
  const { data } = await supabaseClient.from('profiles').select('category')
    .not('headline', 'is', null).neq('headline', '').neq('full_name', '').limit(1000)
  const hitung = new Map()
  for (const r of data || []) {
    for (const b of (r.category || '').split(',').map((t) => t.trim()).filter(Boolean)) {
      if (BIDANG.some((s) => s.kata && b.toLowerCase().includes(s.kata))) continue   // sudah punya chip
      const k = b.toLowerCase()
      hitung.set(k, { nama: hitung.get(k)?.nama || b, n: (hitung.get(k)?.n || 0) + 1 })
    }
  }
  bidangLain = [...hitung.values()].sort((a, b) => b.n - a.n).slice(0, 30).map((x) => x.nama)
  gambarChip()
}

function kartu(p) {
  const foto = safeUrl(p.avatar_url)
  const keahlian = daftarKeahlian(p.skills).slice(0, 3).join(' · ')
  const bidang = (p.category || '').split(',').map((t) => t.trim()).filter(Boolean)   // bisa lebih dari satu
  return `
  <article class="flex flex-col">
    <div class="aspect-[5/3] rounded-md overflow-hidden bg-mist grid place-items-center">
      ${foto ? `<img src="${esc(foto)}" alt="Foto ${esc(p.full_name)}" class="w-full h-full object-cover">`
             : `<span class="text-5xl font-bold text-pine/40">${inisial(p.full_name)}</span>`}
    </div>
    <div class="mt-4 flex items-start justify-between gap-3">
      <h2 class="text-xl font-bold">${esc(p.full_name)}</h2>
      ${bidang.length ? `<span title="${esc(bidang.join(', '))}" class="shrink-0 text-xs bg-mist text-pine rounded-full px-3 py-1">${esc(bidang[0])}${bidang.length > 1 ? ` +${bidang.length - 1}` : ''}</span>` : ''}
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

let permintaan = 0   // nomor permintaan terbaru; hasil permintaan lama diabaikan
async function muatTalenta() {
  const nomor = ++permintaan
  $grid.innerHTML = ''
  document.getElementById('info').textContent = 'Memuat...'

  const dari = (state.halaman - 1) * PER_HALAMAN
  let q = supabaseClient
    .from('profiles')
    .select('id, full_name, headline, category, skills, avatar_url, status', { count: 'exact' })
    .not('headline', 'is', null)   // sembunyikan profil yang belum dilengkapi
    .neq('headline', '')
    .neq('full_name', '')
    .eq('is_hidden', false)   // profil yang disembunyikan pemiliknya
    .order('created_at', { ascending: false })
    .range(dari, dari + PER_HALAMAN - 1)

  // Chip/dropdown bidang: cocokkan ke daftar bidang yang dipilih kreator
  const kb = bersihkan(state.bidang)
  if (kb) q = q.ilike('category', `%${kb}%`)
  // Kotak cari: tiap kata dicari sendiri (semua kata harus cocok) di nama, headline, kategori, keahlian.
  // Dulu kategori tidak ikut dicari, jadi mengetik "kerajinan" atau "penulisan" tidak menemukan siapa pun.
  for (const kata of bersihkan(state.kata).split(/\s+/).filter(Boolean).slice(0, 5))
    q = q.or(`full_name.ilike.%${kata}%,headline.ilike.%${kata}%,category.ilike.%${kata}%,skills.ilike.%${kata}%`)

  const { data, count, error } = await q
  if (nomor !== permintaan) return   // sudah ada permintaan yang lebih baru
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
  state.kata = document.getElementById('cari').value   // samakan dengan yang tampil di kotak cari
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

document.getElementById('chips').addEventListener('change', (e) => {   // dropdown "Bidang lain"
  if (e.target.id !== 'bidang-lain') return
  state.bidang = e.target.value
  state.kata = document.getElementById('cari').value
  state.halaman = 1
  gambarChip()
  muatTalenta()
})

gambarChip()
muatTalenta()
muatBidangLain()
