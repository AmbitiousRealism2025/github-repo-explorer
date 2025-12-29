import{D as v,S as c,I as d,j as f,k as _,c as b,f as g,b as $,l as h}from"./errorBoundary-i6H9MPxW.js";const F=(a,e={})=>{const{dateField:t="updated_at",datePrefix:s="Updated",showRemoveOnly:n=!1}=e,o=c.isFavorite(a.id),i=document.createElement("article");i.className="repo-card",i.dataset.repoId=a.id;const l=_(a.full_name),r=_(a.description)||"No description available",u=JSON.stringify({id:a.id,full_name:a.full_name,description:a.description,html_url:a.html_url,stargazers_count:a.stargazers_count,forks_count:a.forks_count,language:a.language,updated_at:a.updated_at}).replace(/'/g,"&#39;");let p;t==="addedAt"&&a.addedAt?p=new Date(a.addedAt).toISOString():p=a[t];const m=n?`<button class="repo-card__favorite active" aria-label="Remove from favorites" data-id="${a.id}">
        ${d.star}
      </button>`:`<button class="repo-card__favorite ${o?"active":""}" 
        aria-label="${o?"Remove from":"Add to"} favorites" 
        data-repo='${u}'>
        ${o?d.star:d.starOutline}
      </button>`;return i.innerHTML=`
    <header class="repo-card__header">
      <a href="/detail.html?repo=${encodeURIComponent(a.full_name)}" class="repo-card__name">${l}</a>
      ${m}
    </header>
    <p class="repo-card__description">${r}</p>
    <footer class="repo-card__footer">
      ${a.language?`
        <span class="repo-card__language">
          <span class="language-dot" style="--lang-color: ${b(a.language)}"></span>
          ${_(a.language)}
        </span>
      `:""}
      <span class="repo-card__stat">
        ${d.star}
        ${g(a.stargazers_count)}
      </span>
      <span class="repo-card__stat">
        ${d.fork}
        ${g(a.forks_count)}
      </span>
      <span class="repo-card__updated">${s} ${$(p)}</span>
    </footer>
  `,i},A=(a,e,t={})=>{a.innerHTML="";const s=document.createDocumentFragment();e.forEach(n=>{s.appendChild(F(n,t))}),a.appendChild(s)},L=(a,e,t,s=v)=>{const n=Math.min(Math.ceil(t/s),h);if(n<=1){a.innerHTML="";return}let o="";o+=`<button class="pagination__btn" ${e===1?"disabled":""} data-page="${e-1}">Prev</button>`;const i=Math.max(1,e-2),l=Math.min(n,e+2);i>1&&(o+='<button class="pagination__btn" data-page="1">1</button>',i>2&&(o+='<span class="pagination__ellipsis">...</span>'));for(let r=i;r<=l;r++)o+=`<button class="pagination__btn ${r===e?"active":""}" data-page="${r}">${r}</button>`;l<n&&(l<n-1&&(o+='<span class="pagination__ellipsis">...</span>'),o+=`<button class="pagination__btn" data-page="${n}">${n}</button>`),o+=`<button class="pagination__btn" ${e===n?"disabled":""} data-page="${e+1}">Next</button>`,a.innerHTML=o},R=(a,e)=>{const t=a.target.closest(".repo-card__favorite");if(!t)return;const s=JSON.parse(t.dataset.repo);c.isFavorite(s.id)?(c.removeFavorite(s.id),t.classList.remove("active"),t.innerHTML=d.starOutline,f("Removed from favorites","info")):(c.addFavorite(s),t.classList.add("active"),t.innerHTML=d.star,f("Added to favorites","success"))},T=(a,e)=>{const t=a.target.closest(".repo-card__favorite");if(!t)return;const s=parseInt(t.dataset.id);c.removeFavorite(s),f("Removed from favorites","info"),e&&e(s)},D=(a,e)=>{const t=a.target.closest(".pagination__btn");if(!t||t.disabled||!t.dataset.page)return;const s=parseInt(t.dataset.page);e(s),window.scrollTo({top:0,behavior:"smooth"})};export{D as a,L as b,T as c,R as h,A as r};
