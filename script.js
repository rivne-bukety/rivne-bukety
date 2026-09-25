(()=>{
  const $=s=>document.querySelector(s);
  const products=window.DEFAULT_PRODUCTS||[];
  const imageExt=/\.(jpe?g|png|webp|gif|avif)$/i;
  const esc=x=>String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

  function repo(){
    const host=location.hostname;
    const parts=location.pathname.split('/').filter(Boolean);
    if(!host.endsWith('.github.io')) return null;
    const owner=host.split('.')[0];
    const name=parts[0]||'';
    return owner&&name?{owner,name}:null;
  }

  async function githubFiles(folder, test){
    const r=repo(); if(!r) return [];
    const url=`https://api.github.com/repos/${encodeURIComponent(r.owner)}/${encodeURIComponent(r.name)}/contents/${folder}?ref=main`;
    try{
      const res=await fetch(url,{headers:{Accept:'application/vnd.github+json'}});
      if(!res.ok) return [];
      const data=await res.json();
      if(!Array.isArray(data)) return [];
      return data.filter(x=>x.type==='file'&&test(x.name)).sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true,sensitivity:'base'})).map(x=>x.download_url);
    }catch(e){return []}
  }

  async function numbered(folder){
    const out=[];
    const ext=['jpg','jpeg','png','webp','gif','avif'];
    const list=[];
    for(let n=1;n<=60;n++) for(const e of ext) list.push(`${folder}/${n}.${e}`);
    const found=await Promise.all(list.map(src=>new Promise(resolve=>{const i=new Image();i.onload=()=>resolve(src);i.onerror=()=>resolve(null);i.src=src+'?v='+Date.now()})));
    return found.filter(Boolean);
  }

  async function getImages(p){
    const api=await githubFiles(p.folder,n=>imageExt.test(n));
    return api.length?api:numbered(p.folder);
  }

  async function render(){
    const g=$('#portfolioGrid'); if(!g)return;
    g.innerHTML=products.map(p=>`<article class="portfolioCard categoryCard" data-id="${esc(p.id)}" tabindex="0" role="button"><div class="photo categoryCover" id="cover-${esc(p.id)}"><div class="placeholder">✿</div></div><div class="cardBody"><h3>${esc(p.category)}</h3><p>${esc(p.desc)}</p><span class="categoryMore">Дивитися більше →</span></div></article>`).join('');
    for(const p of products){const a=await getImages(p),c=$('#cover-'+p.id);if(a.length)c.innerHTML=`<img src="${esc(a[0])}" alt="${esc(p.category)}">`}
    document.querySelectorAll('.categoryCard').forEach(c=>{const f=()=>openCategory(c.dataset.id);c.onclick=f;c.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();f()}}});
  }

  async function openCategory(id){
    const p=products.find(x=>x.id===id),m=$('#categoryModal'),t=$('#categoryModalTitle'),g=$('#categoryGallery');
    if(!p||!m)return;
    t.textContent=p.category;g.innerHTML='<div class="galleryLoading">Завантаження фото…</div>';m.hidden=false;document.body.classList.add('modalOpen');
    const a=await getImages(p);
    if(!a.length){g.innerHTML=`<div class="galleryEmpty">📷 Фото ще не додані.<br><small>Додайте фото прямо у папку <b>${esc(p.folder)}</b> на GitHub.</small></div>`;return}
    g.innerHTML=a.map((x,i)=>`<button class="galleryItem" type="button" data-src="${esc(x)}"><img src="${esc(x)}" alt="${esc(p.category)} — фото ${i+1}" loading="lazy"></button>`).join('');
    g.querySelectorAll('.galleryItem').forEach(b=>b.onclick=()=>{const l=document.createElement('div');l.className='photoLightbox';l.innerHTML=`<button class="photoLightboxClose">×</button><img src="${esc(b.dataset.src)}" alt="">`;document.body.appendChild(l);l.onclick=e=>{if(e.target===l||e.target.classList.contains('photoLightboxClose'))l.remove()}});
  }

  document.addEventListener('click',e=>{if(e.target.closest('[data-close-category]')){$('#categoryModal').hidden=true;document.body.classList.remove('modalOpen')}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){const m=$('#categoryModal');if(m){m.hidden=true;document.body.classList.remove('modalOpen')}document.querySelector('.photoLightbox')?.remove()}});

  // Music: automatically find ANY .mp3 inside assets/music on GitHub.
  const audio=$('#music'),btn=$('#musicBtn'),picker=$('#musicFilePicker');let playing=false;
  async function loadGithubMusic(){
    const files=await githubFiles('assets/music',n=>/\.mp3$/i.test(n));
    if(files.length&&audio){audio.src=files[0];audio.load();return true} return false;
  }
  async function startMusic(){
    if(!audio)return false;
    try{await audio.play();playing=true;if(btn)btn.textContent='♫ Вимкнути';return true}catch(e){return false}
  }
  if(btn)btn.addEventListener('click',async()=>{
    if(playing){audio.pause();playing=false;btn.textContent='♫ Музика';return}
    await loadGithubMusic();
    const ok=await startMusic();
    if(!ok&&picker)picker.click();
  });
  if(picker)picker.addEventListener('change',()=>{const f=picker.files?.[0];if(!f||!audio)return;if(!/\.mp3$/i.test(f.name)){alert('Виберіть MP3-файл.');return}audio.src=URL.createObjectURL(f);startMusic()});

  function leaves(){const layer=$('#leafLayer');if(!layer)return;layer.innerHTML='';for(let i=0;i<24;i++){const l=document.createElement('span');l.className='leaf';l.textContent=Math.random()>.5?'🍂':'🍁';l.style.left=Math.random()*100+'%';l.style.animationDelay=-Math.random()*12+'s';l.style.animationDuration=7+Math.random()*9+'s';l.style.fontSize=12+Math.random()*14+'px';layer.appendChild(l)}}
  render();leaves();const y=$('#year');if(y)y.textContent=new Date().getFullYear();
})();
