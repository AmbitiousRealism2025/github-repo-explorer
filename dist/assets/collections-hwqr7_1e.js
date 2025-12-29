import{i as b,a as _,t as y,b as l,S as c,e as h,c as $}from"./errorBoundary-6mNU-65L.js";b();_();const v=document.getElementById("collections-list"),f=document.getElementById("empty-state"),w=document.getElementById("create-collection-btn"),i=document.getElementById("collection-modal"),E=document.getElementById("modal-title"),k=document.getElementById("modal-close"),L=document.getElementById("modal-cancel"),I=document.getElementById("modal-save"),g=document.getElementById("collection-name"),m=document.getElementById("collection-description"),B=document.getElementById("theme-toggle");let s=null;const p=()=>{const t=c.getCollections();if(t.length===0){v.innerHTML="",f.classList.remove("hidden");return}f.classList.add("hidden"),v.innerHTML=t.map(e=>`
    <div class="collection-card" data-id="${e.id}">
      <div class="collection-card__header">
        <h3 class="collection-card__name">${h(e.name)}</h3>
        <div class="collection-card__actions">
          <button class="btn btn--sm btn--ghost collection-edit" data-id="${e.id}" aria-label="Edit collection">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="btn btn--sm btn--ghost collection-delete" data-id="${e.id}" aria-label="Delete collection">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </button>
        </div>
      </div>
      ${e.description?`<p class="collection-card__description">${h(e.description)}</p>`:""}
      <div class="collection-card__meta">
        <span class="collection-card__count">${e.repos.length} repositories</span>
        <span class="collection-card__date">Created ${$(e.createdAt)}</span>
      </div>
      <div class="collection-card__repos">
        ${e.repos.slice(0,3).map(o=>`
          <a href="/detail.html?repo=${encodeURIComponent(o.full_name)}" class="collection-card__repo">
            ${h(o.full_name)}
          </a>
        `).join("")}
        ${e.repos.length>3?`<span class="collection-card__more">+${e.repos.length-3} more</span>`:""}
      </div>
      <div class="collection-card__footer">
        <button class="btn btn--sm btn--secondary collection-export" data-id="${e.id}">
          Export as Markdown
        </button>
        <button class="btn btn--sm btn--secondary collection-share" data-id="${e.id}">
          Copy Share Link
        </button>
      </div>
    </div>
  `).join(""),S()},S=()=>{document.querySelectorAll(".collection-edit").forEach(t=>{t.addEventListener("click",e=>{e.stopPropagation();const o=t.dataset.id,n=c.getCollections().find(a=>a.id===o);n&&(s=o,E.textContent="Edit Collection",g.value=n.name,m.value=n.description||"",i.classList.add("open"))})}),document.querySelectorAll(".collection-delete").forEach(t=>{t.addEventListener("click",e=>{e.stopPropagation(),confirm("Are you sure you want to delete this collection?")&&(c.deleteCollection(t.dataset.id),p(),l("Collection deleted","success"))})}),document.querySelectorAll(".collection-export").forEach(t=>{t.addEventListener("click",e=>{e.stopPropagation();const o=c.getCollections().find(n=>n.id===t.dataset.id);if(o){const n=M(o);navigator.clipboard.writeText(n),l("Markdown copied to clipboard","success")}})}),document.querySelectorAll(".collection-share").forEach(t=>{t.addEventListener("click",e=>{e.stopPropagation();const o=c.getCollections().find(n=>n.id===t.dataset.id);if(o){const n=btoa(JSON.stringify({name:o.name,repos:o.repos.map(d=>d.full_name)})),a=`${window.location.origin}/collections.html#import=${n}`;navigator.clipboard.writeText(a),l("Share link copied to clipboard","success")}})})},M=t=>{let e=`# ${t.name}

`;return t.description&&(e+=`${t.description}

`),e+=`## Repositories

`,t.repos.forEach(o=>{e+=`- [${o.full_name}](https://github.com/${o.full_name})`,o.description&&(e+=` - ${o.description}`),e+=`
`}),e},x=()=>{s=null,E.textContent="New Collection",g.value="",m.value="",i.classList.add("open")},u=()=>{i.classList.remove("open"),s=null},T=()=>{const t=g.value.trim();if(!t){l("Please enter a collection name","error");return}s?(c.updateCollection(s,{name:t,description:m.value.trim()}),l("Collection updated","success")):(c.createCollection(t,m.value.trim()),l("Collection created","success")),u(),p()},A=()=>{const t=window.location.hash;if(t.startsWith("#import="))try{const e=JSON.parse(atob(t.substring(8)));if(e.name&&Array.isArray(e.repos)){const o=c.getCollections().map(r=>r.name);let n=e.name,a=1;for(;o.includes(n);)n=`${e.name} (${a++})`;c.createCollection(n,`Imported collection with ${e.repos.length} repositories`);const d=c.getCollections(),C=d[d.length-1];e.repos.forEach(r=>{c.addToCollection(C.id,{full_name:r,id:r})}),window.location.hash="",l(`Imported collection "${n}"`,"success"),p()}}catch{l("Invalid import link","error")}};w.addEventListener("click",x);k.addEventListener("click",u);L.addEventListener("click",u);I.addEventListener("click",T);i.addEventListener("click",t=>{t.target===i&&u()});B.addEventListener("click",y);A();p();
