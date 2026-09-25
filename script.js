const $ = (s) => document.querySelector(s);
const clone = (x) => JSON.parse(JSON.stringify(x));

let products = JSON.parse(localStorage.getItem("rb_products") || "null") || clone(window.DEFAULT_PRODUCTS);

function money(v){ return `${Number(v || 0).toLocaleString("uk-UA")} ${SITE_SETTINGS.currency}`; }

function escapeHtml(s){
  return String(s ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

const EXTENSIONS = ["jpg","jpeg","png","webp","JPG","JPEG","PNG","WEBP"];

function imageCandidates(product){
  if(product.folder){
    const list=[];
    for(let n=1;n<=12;n++) for(const ext of EXTENSIONS) list.push(`${product.folder}/${n}.${ext}`);
    return list;
  }
  return product.image ? [product.image] : [];
}

function githubRepo(){
  const host=location.hostname;
  const parts=location.pathname.split('/').filter(Boolean);
  if(host.endsWith('.github.io')){
    const owner=host.split('.')[0];
    const repo=parts[0] || '';
    if(owner && repo) return {owner,repo};
  }
  return null;
}

async function githubFolderImages(folder){
  const repo=githubRepo();
  if(!repo) return [];
  const url=`https://api.github.com/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}/contents/${folder}`;
  try{
    const r=await fetch(url,{headers:{Accept:'application/vnd.github+json'}});
    if(!r.ok) return [];
    const files=await r.json();
    return files.filter(f=>f.type==='file' && /\\.(jpe?g|png|webp)$/i.test(f.name))
      .sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}))
      .map(f=>f.download_url || f.html_url);
  }catch(e){ return []; }
}

function probeImages(candidates){
  return Promise.all(candidates.map(src=>new Promise(resolve=>{
    const img=new Image();
    img.onload=()=>resolve(src);
    img.onerror=()=>resolve(null);
    img.src=src;
  }))).then(x=>x.filter(Boolean));
}

async function getImages(product){
  // On GitHub Pages, read the actual contents of each folder.
  const githubImages=await githubFolderImages(product.folder);
  if(githubImages.length) return githubImages;
  // When opened locally, keep the simple 1.jpg ... 12.webp fallback.
  return probeImages(imageCandidates(product));
}

async function render(){
  const portfolio=$("#portfolioGrid");
  portfolio.innerHTML = products.map(p => `
    <article class="portfolioCard">
      <div class="photo photoGallery" id="gallery-${escapeHtml(p.id)}">
        <div class="placeholder">✿</div>
      </div>
      <div class="cardBody">
        <h3>${escapeHtml(p.category)}</h3>
        <p>${escapeHtml(p.desc)}</p>
      </div>
    </article>`).join("");

  for(const p of products){
    const found=await getImages(p);
    const box=document.getElementById("gallery-"+p.id);
    if(!box) continue;
    if(found.length){
      box.innerHTML=found.map((src,i)=>`
        <img class="galleryImage ${i===0?'active':''}" src="${escapeHtml(src)}" alt="${escapeHtml(p.category)}"
             onerror="this.remove()">`).join("");
      if(found.length>1){
        let index=0;
        const imgs=[...box.querySelectorAll(".galleryImage")];
        setInterval(()=>{
          imgs[index]?.classList.remove("active");
          index=(index+1)%imgs.length;
          imgs[index]?.classList.add("active");
        },3000);
      }
    }
  }
}

const audio=$("#music");
let playing=false;

async function playMusic(){
  audio.volume=0.65;
  try{
    await audio.play();
    playing=true;
    $("#musicBtn").textContent="♫ Вимкнути";
    return true;
  }catch(e){
    return false;
  }
}

$("#musicBtn").onclick=async ()=>{
  if(playing){
    audio.pause();
    playing=false;
    $("#musicBtn").textContent="♫ Музика";
    return;
  }
  const ok=await playMusic();
  if(!ok){
    $("#musicFilePicker").click();
  }
};

$("#musicFilePicker").addEventListener("change",()=>{
  const file=$("#musicFilePicker").files[0];
  if(!file) return;
  if(!file.type.includes("audio") && !file.name.toLowerCase().endsWith(".mp3")){
    alert("Виберіть MP3-файл.");
    return;
  }
  const url=URL.createObjectURL(file);
  audio.src=url;
  playMusic();
});

function makeLeaves(){
  const layer=$("#leafLayer");
  const glyphs=["❧","❦","✿","❀"];
  for(let i=0;i<24;i++){
    const el=document.createElement("span");
    el.className="leaf";
    el.textContent=glyphs[i%glyphs.length];
    el.style.left=(Math.random()*100)+"%";
    el.style.animationDuration=(8+Math.random()*12)+"s";
    el.style.animationDelay=(-Math.random()*15)+"s";
    el.style.fontSize=(12+Math.random()*14)+"px";
    layer.appendChild(el);
  }
}
$("#logoImg").src=SITE_SETTINGS.logo;
$("#year").textContent=new Date().getFullYear();
render(); makeLeaves();
