// js/dashboard-karya.js · Halaman Karya saya
const JENIS = { foto: 'Seri foto', video: 'Video', link: 'Tautan proyek' }
let ctx = null
let semua = []       // semua karya milik kreator yang login
let tab = 'semua'    // 'semua' | 'terbit' | 'draf'
let cari = ''

function tanggal(iso) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function gambar() {
  const hitung = (s) => semua.filter((k) => s === 'semua' || k.status === s).length
  document.getElementById('tab').innerHTML = [['semua', 'Semua'], ['terbit', 'Terbit'], ['draf', 'Draf']]
    .map(([k, label]) => `<button data-tab="${k}" class="pb-2 ${tab === k ? 'text-pine font-medium border-b-2 border-pine' : ''}">${label} (${hitung(k)})</button>`)
    .join('')

  const tampil = semua.filter((k) => (tab === 'semua' || k.status === tab) && k.title.toLowerCase().includes(cari))
  document.getElementById('daftar').innerHTML = tampil.length ? tampil.map((k) => `
    <div class="p-4 flex flex-wrap items-center gap-4">
      ${gambarAtauInisial(k.cover_image, k.title, 'w-24 h-16 rounded shrink-0')}
      <div class="flex-1 min-w-[10rem]">
        <p class="font-semibold">${esc(k.title)}</p>
        <p class="text-sm text-black/50">${JENIS[k.work_type] || ''}${k.status === 'draf' ? ' · Belum tampil di profil' : ''}</p>
      </div>
      <span class="text-sm w-24">${esc(k.category || '-')}</span>
      <span class="text-xs rounded-full px-3 py-1 ${k.status === 'terbit' ? 'bg-mist text-pine' : 'bg-black/5 text-black/50'}">${k.status === 'terbit' ? 'Terbit' : 'Draf'}</span>
      <span class="text-sm text-black/50 w-28">${tanggal(k.updated_at)}</span>
      <a href="tambah-karya.html?id=${encodeURIComponent(k.id)}" class="text-sm font-medium text-pine">Edit</a>
      <button data-hapus="${esc(k.id)}" class="text-sm text-red-800">Hapus</button>
    </div>`).join('')
    : '<p class="p-8 text-center text-black/50">Belum ada karya di sini.</p>'
}

async function mulai() {
  ctx = await mulaiDashboard('karya')
  if (!ctx) return
  // PENTING: .eq('user_id', ...) wajib. Karya TERBIT milik orang lain juga
  // boleh dibaca publik (policy RLS), jadi tanpa filter ini mereka ikut muncul.
  const { data, error } = await supabaseClient.from('portfolios').select('*')
    .eq('user_id', ctx.user.id).order('updated_at', { ascending: false })
  if (error) pesan('Gagal memuat karya: ' + error.message, 'error')
  semua = data || []
  gambar()
}

document.getElementById('tab').addEventListener('click', (e) => {
  const b = e.target.closest('[data-tab]')
  if (b) { tab = b.dataset.tab; gambar() }
})
document.getElementById('cari').addEventListener('input', (e) => {
  cari = e.target.value.trim().toLowerCase()
  gambar()
})
document.getElementById('daftar').addEventListener('click', async (e) => {
  const b = e.target.closest('[data-hapus]')
  if (!b || !confirm('Hapus karya ini? Tindakan ini tidak bisa dibatalkan.')) return
  const { error } = await supabaseClient.from('portfolios').delete().eq('id', b.dataset.hapus).eq('user_id', ctx.user.id)
  if (error) return pesan('Gagal menghapus: ' + error.message, 'error')
  semua = semua.filter((k) => k.id !== b.dataset.hapus)
  gambar()
  pesan('Karya dihapus.')
})

mulai()