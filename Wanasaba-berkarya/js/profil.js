// =====================================================================
//  js/profil.js  ·  LANGKAH 5b — Profil publik (profil.html?id=...)
// =====================================================================
const $isi = document.getElementById('isi')

function pesan(teks) { $isi.innerHTML = `<p class="text-black/60">${esc(teks)}</p>` }

// Satu kartu karya. Tautannya bergantung pada jenis karya.
function kartuKarya(k) {
  const gambar = safeUrl(k.cover_image)
  const tujuan = k.work_type === 'video' ? [safeUrl(k.video_url), 'Tonton video']
               : k.work_type === 'link'  ? [safeUrl(k.project_url), 'Buka proyek']
               : [gambar, 'Lihat gambar']
  return `
  <article>
    <div class="aspect-[3/2] rounded-md overflow-hidden bg-mist">
      ${gambar ? `<img src="${esc(gambar)}" alt="${esc(k.title)}" class="w-full h-full object-cover">` : ''}
    </div>
    <p class="mt-4 text-xs tracking-widest text-black/50">${esc(k.category || '')}</p>
    <h3 class="text-xl font-bold mt-1">${esc(k.title)}</h3>
    <p class="text-black/60 mt-2">${esc(k.description)}</p>
    ${tujuan[0] ? `<a href="${esc(tujuan[0])}" target="_blank" rel="noopener" class="inline-block mt-3 text-sm font-semibold text-pine">${tujuan[1]} →</a>` : ''}
  </article>`
}

async function muatProfil() {
  const id = new URLSearchParams(location.search).get('id')
  if (!id) return pesan('Profil tidak ditemukan.')

  // Profil + karya terbit diambil bersamaan (RLS sudah menyaring draf).
  const [prof, karya] = await Promise.all([
    supabaseClient.from('profiles').select('*').eq('id', id).maybeSingle(),
    supabaseClient.from('portfolios').select('*').eq('user_id', id)
      .eq('status', 'terbit').order('updated_at', { ascending: false }),
  ])
  if (prof.error || !prof.data) return pesan('Profil tidak ditemukan.')
  const p = prof.data
  document.title = `${p.full_name} · Wanasaba Berkarya`

  const foto = safeUrl(p.avatar_url)
  const wa = waLink(p.whatsapp)
  const sosial = [['Instagram', p.instagram], ['LinkedIn', p.linkedin], ['GitHub', p.github], ['YouTube', p.youtube]]
    .map(([nama, u]) => [nama, safeUrl(u)]).filter(([, u]) => u)
  const chips = daftarKeahlian(p.skills).map((s) =>
    `<span class="text-xs bg-mist text-pine rounded-full px-3 py-1">${esc(s)}</span>`).join('')

  $isi.innerHTML = `
  <section class="grid lg:grid-cols-[240px_1fr_340px] gap-10">
    <div>
      <div class="aspect-[4/5] rounded-md overflow-hidden bg-mist grid place-items-center">
        ${foto ? `<img src="${esc(foto)}" alt="Foto ${esc(p.full_name)}" class="w-full h-full object-cover">`
               : `<span class="text-6xl font-bold text-pine/40">${inisial(p.full_name)}</span>`}
      </div>
      <p class="mt-3 text-sm text-black/60">📍 Desa Wanasaba</p>
    </div>

    <div>
      <p class="text-sm text-pine flex items-center gap-2"><i class="w-2 h-2 rounded-full bg-pine"></i>${esc(p.status)}</p>
      <h1 class="text-5xl font-bold tracking-tight mt-3">${esc(p.full_name)}</h1>
      <p class="text-xl mt-3">${esc(p.headline)}</p>
      <p class="mt-5 text-black/60 leading-relaxed whitespace-pre-line">${esc(p.bio)}</p>
      <div class="mt-5 flex flex-wrap gap-2">${chips}</div>
    </div>

    <aside class="bg-white border border-black/10 rounded-md p-6 h-fit">
      <h2 class="text-lg font-bold">Ada cerita untuk dikerjakan?</h2>
      <p class="text-sm text-black/60 mt-2">Ceritakan kebutuhan, waktu, dan gambaran proyekmu langsung ke ${esc(p.full_name.split(' ')[0])}.</p>
      ${wa ? `<a href="${esc(wa)}?text=${encodeURIComponent('Halo ' + p.full_name + ', saya lihat profilmu di Wanasaba Berkarya.')}" target="_blank" rel="noopener"
                class="block text-center mt-4 bg-pine text-white font-medium rounded-md py-3">Hubungi via WhatsApp</a>`
           : `<p class="mt-4 text-sm text-black/50">Kreator ini belum menampilkan nomor WhatsApp.</p>`}
      <ul class="mt-5 pt-4 border-t border-black/10 space-y-3 text-sm">
        ${sosial.map(([nama, u]) => `<li><a href="${esc(u)}" target="_blank" rel="noopener" class="flex justify-between font-medium">${nama}<span>↗</span></a></li>`).join('')}
      </ul>
    </aside>
  </section>

  <section class="mt-14 pt-10 border-t border-black/10">
    <p class="text-xs tracking-widest font-medium text-pine">Portofolio pilihan</p>
    <h2 class="text-3xl font-bold tracking-tight mt-2">Karya terbaru</h2>
    <div class="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
      ${karya.data && karya.data.length ? karya.data.map(kartuKarya).join('')
        : '<p class="text-black/60">Belum ada karya yang diterbitkan.</p>'}
    </div>
  </section>`
}

muatProfil()
