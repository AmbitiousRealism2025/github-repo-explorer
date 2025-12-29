import{D as $,S as r,I as l,b as p,e as _,h as C,f as v,c as S,j as y}from"./errorBoundary-Bh1k4IQJ.js";const A=(t,o={})=>{const{dateField:e="updated_at",datePrefix:a="Updated",showRemoveOnly:n=!1,showCollectionButton:c=!0}=o,s=r.isFavorite(t.id),i=document.createElement("article");i.className="repo-card",i.dataset.repoId=t.id;const d=_(t.full_name),b=_(t.description)||"No description available",g=JSON.stringify({id:t.id,full_name:t.full_name,description:t.description,html_url:t.html_url,stargazers_count:t.stargazers_count,forks_count:t.forks_count,language:t.language,updated_at:t.updated_at}).replace(/'/g,"&#39;");let f;e==="addedAt"&&t.addedAt?f=new Date(t.addedAt).toISOString():f=t[e];const h=n?`<button class="repo-card__favorite active" aria-label="Remove from favorites" data-id="${t.id}">
        ${l.star}
      </button>`:`<button class="repo-card__favorite ${s?"active":""}" 
        aria-label="${s?"Remove from":"Add to"} favorites" 
        data-repo='${g}'>
        ${s?l.star:l.starOutline}
      </button>`,k=c?`<div class="repo-card__collection-wrapper">
        <button class="repo-card__collection" aria-label="Add to collection" data-repo='${g}'>
          ${l.folderPlus}
        </button>
        <div class="collection-picker" aria-hidden="true">
          <div class="collection-picker__header">Add to Collection</div>
          <div class="collection-picker__list"></div>
          <div class="collection-picker__create">
            <input type="text" class="collection-picker__input" placeholder="New collection name..." maxlength="50">
            <button class="collection-picker__add-btn" aria-label="Create collection">${l.plus}</button>
          </div>
        </div>
      </div>`:"";return i.innerHTML=`
    <header class="repo-card__header">
      <a href="/detail.html?repo=${encodeURIComponent(t.full_name)}" class="repo-card__name">${d}</a>
      <div class="repo-card__actions">
        ${k}
        ${h}
      </div>
    </header>
    <p class="repo-card__description">${b}</p>
    <footer class="repo-card__footer">
      ${t.language?`
        <span class="repo-card__language">
          <span class="language-dot" style="--lang-color: ${C(t.language)}"></span>
          ${_(t.language)}
        </span>
      `:""}
      <span class="repo-card__stat">
        ${l.star}
        ${v(t.stargazers_count)}
      </span>
      <span class="repo-card__stat">
        ${l.fork}
        ${v(t.forks_count)}
      </span>
      <span class="repo-card__updated">${a} ${S(f)}</span>
    </footer>
  `,i},q=(t,o,e={})=>{t.innerHTML="";const a=document.createDocumentFragment();o.forEach(n=>{a.appendChild(A(n,e))}),t.appendChild(a)},I=(t,o,e,a=$)=>{const n=Math.min(Math.ceil(e/a),y);if(n<=1){t.innerHTML="";return}let c="";c+=`<button class="pagination__btn" ${o===1?"disabled":""} data-page="${o-1}">Prev</button>`;const s=Math.max(1,o-2),i=Math.min(n,o+2);s>1&&(c+='<button class="pagination__btn" data-page="1">1</button>',s>2&&(c+='<span class="pagination__ellipsis">...</span>'));for(let d=s;d<=i;d++)c+=`<button class="pagination__btn ${d===o?"active":""}" data-page="${d}">${d}</button>`;i<n&&(i<n-1&&(c+='<span class="pagination__ellipsis">...</span>'),c+=`<button class="pagination__btn" data-page="${n}">${n}</button>`),c+=`<button class="pagination__btn" ${o===n?"disabled":""} data-page="${o+1}">Next</button>`,t.innerHTML=c},N=(t,o)=>{const e=t.target.closest(".repo-card__favorite");if(!e)return;const a=JSON.parse(e.dataset.repo);r.isFavorite(a.id)?(r.removeFavorite(a.id),e.classList.remove("active"),e.innerHTML=l.starOutline,p("Removed from favorites","info")):(r.addFavorite(a),e.classList.add("active"),e.innerHTML=l.star,p("Added to favorites","success"))},D=(t,o)=>{const e=t.target.closest(".repo-card__favorite");if(!e)return;const a=parseInt(e.dataset.id);r.removeFavorite(a),p("Removed from favorites","info"),o&&o(a)},H=(t,o)=>{const e=t.target.closest(".pagination__btn");if(!e||e.disabled||!e.dataset.page)return;const a=parseInt(e.dataset.page);o(a),window.scrollTo({top:0,behavior:"smooth"})},m=(t,o)=>{const e=t.querySelector(".collection-picker__list"),a=r.getCollections();if(a.length===0){e.innerHTML='<div class="collection-picker__empty">No collections yet</div>';return}e.innerHTML=a.map(n=>{const c=n.repos.some(s=>s.id===o);return`
      <button class="collection-picker__item ${c?"collection-picker__item--active":""}" 
              data-collection-id="${n.id}"
              ${c?"disabled":""}>
        ${l.folder}
        <span class="collection-picker__item-name">${_(n.name)}</span>
        ${c?`<span class="collection-picker__item-check">${l.check}</span>`:""}
      </button>
    `}).join("")},L=()=>{document.querySelectorAll(".collection-picker.open").forEach(t=>{t.classList.remove("open"),t.setAttribute("aria-hidden","true")})},E=(t,o)=>{L();const e=t.querySelector(".collection-picker");m(e,o),e.classList.add("open"),e.setAttribute("aria-hidden","false");const a=e.querySelector(".collection-picker__input");a&&a.focus()},u=t=>{t.classList.remove("open"),t.setAttribute("aria-hidden","true");const o=t.querySelector(".collection-picker__input");o&&(o.value="")},T=(t,o,e)=>{const a=JSON.parse(t.dataset.repo);o.classList.contains("open")?u(o):E(e,a.id)},w=(t,o,e,a)=>{const n=t.dataset.collectionId,c=o.querySelector(".repo-card__collection"),s=JSON.parse(c.dataset.repo);r.addToCollection(n,s);const i=r.getCollections().find(d=>d.id===n);p(`Added to "${i?.name}"`,"success"),m(e,s.id)},F=(t,o,e)=>{const a=t.querySelector(".collection-picker__input"),n=a.value.trim();if(!n)return;const c=o.querySelector(".repo-card__collection"),s=JSON.parse(c.dataset.repo),i=r.createCollection(n);r.addToCollection(i.id,s),p(`Created "${n}" and added repo`,"success"),a.value="",m(t,s.id)},B=(t,o)=>{const e=t.target.closest(".repo-card__collection-wrapper");if(!e)return;const a=t.target.closest(".repo-card__collection"),n=e.querySelector(".collection-picker");if(a){T(a,n,e);return}const c=t.target.closest(".collection-picker__item");if(c&&!c.disabled){w(c,e,n);return}t.target.closest(".collection-picker__add-btn")&&F(n,e)},O=t=>{if(t.key==="Enter"){const o=t.target.closest(".collection-picker__input");o&&o.parentElement.querySelector(".collection-picker__add-btn")?.click()}if(t.key==="Escape"){const o=t.target.closest(".collection-picker");o&&u(o)}},R=()=>{document.addEventListener("click",t=>{t.target.closest(".repo-card__collection-wrapper")||document.querySelectorAll(".collection-picker.open").forEach(u)}),document.addEventListener("keydown",t=>{t.key==="Escape"&&document.querySelectorAll(".collection-picker.open").forEach(u)})};export{B as a,O as b,H as c,I as d,D as e,N as h,R as i,q as r};
