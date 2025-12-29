import{i as v,t as $,f as l,u as L,S as i,I as s,s as p,b as y,c as E}from"./common-B1Um71dy.js";import{d as I}from"./api-Yir0XPV8.js";v();const h=document.getElementById("language-filter"),g=document.getElementById("repo-grid"),_=document.getElementById("results-section"),k=document.getElementById("results-count"),f=document.getElementById("loading-state"),b=document.getElementById("error-state"),T=document.getElementById("error-message"),u=document.getElementById("pagination"),M=document.getElementById("theme-toggle"),B=document.getElementById("retry-btn");let n=1,m=0;const C=t=>{const e=i.isFavorite(t.id),a=document.createElement("article");return a.className="repo-card",a.dataset.repoId=t.id,a.innerHTML=`
    <header class="repo-card__header">
      <a href="/detail.html?repo=${encodeURIComponent(t.full_name)}" class="repo-card__name">${t.full_name}</a>
      <button class="repo-card__favorite ${e?"active":""}" aria-label="${e?"Remove from":"Add to"} favorites" data-repo='${JSON.stringify({id:t.id,full_name:t.full_name,description:t.description,html_url:t.html_url,stargazers_count:t.stargazers_count,forks_count:t.forks_count,language:t.language,updated_at:t.updated_at}).replace(/'/g,"&#39;")}'>
        ${e?s.star:s.starOutline}
      </button>
    </header>
    <p class="repo-card__description">${t.description||"No description available"}</p>
    <footer class="repo-card__footer">
      ${t.language?`
        <span class="repo-card__language">
          <span class="language-dot" style="--lang-color: ${y(t.language)}"></span>
          ${t.language}
        </span>
      `:""}
      <span class="repo-card__stat">
        ${s.star}
        ${l(t.stargazers_count)}
      </span>
      <span class="repo-card__stat">
        ${s.fork}
        ${l(t.forks_count)}
      </span>
      <span class="repo-card__updated">Created ${E(t.created_at)}</span>
    </footer>
  `,a},F=t=>{g.innerHTML="";const e=document.createDocumentFragment();t.forEach(a=>{e.appendChild(C(a))}),g.appendChild(e)},R=()=>{const t=Math.min(Math.ceil(m/30),34);if(t<=1){u.innerHTML="";return}let e="";e+=`<button class="pagination__btn" ${n===1?"disabled":""} data-page="${n-1}">Prev</button>`;const a=Math.max(1,n-2),r=Math.min(t,n+2);a>1&&(e+='<button class="pagination__btn" data-page="1">1</button>',a>2&&(e+='<span class="pagination__btn" style="border: none;">...</span>'));for(let o=a;o<=r;o++)e+=`<button class="pagination__btn ${o===n?"active":""}" data-page="${o}">${o}</button>`;r<t&&(r<t-1&&(e+='<span class="pagination__btn" style="border: none;">...</span>'),e+=`<button class="pagination__btn" data-page="${t}">${t}</button>`),e+=`<button class="pagination__btn" ${n===t?"disabled":""} data-page="${n+1}">Next</button>`,u.innerHTML=e},c=t=>{switch(f.classList.add("hidden"),b.classList.add("hidden"),_.classList.add("hidden"),t){case"loading":f.classList.remove("hidden");break;case"error":b.classList.remove("hidden");break;case"results":_.classList.remove("hidden");break}},d=async(t=1)=>{n=t,c("loading");try{const e=await I({language:h.value,page:t});m=Math.min(e.data.total_count,1e3),k.innerHTML=`<strong>${l(m)}</strong> trending repositories this week`,F(e.data.items),R(),c("results"),e.rateLimit&&L(e.rateLimit)}catch(e){T.textContent=e.message,c("error")}},S=t=>{const e=t.target.closest(".repo-card__favorite");if(!e)return;const a=JSON.parse(e.dataset.repo);i.isFavorite(a.id)?(i.removeFavorite(a.id),e.classList.remove("active"),e.innerHTML=s.starOutline,p("Removed from favorites","info")):(i.addFavorite(a),e.classList.add("active"),e.innerHTML=s.star,p("Added to favorites","success"))},w=t=>{const e=t.target.closest(".pagination__btn");if(!e||e.disabled||!e.dataset.page)return;const a=parseInt(e.dataset.page);d(a),window.scrollTo({top:0,behavior:"smooth"})};h.addEventListener("change",()=>d(1));g.addEventListener("click",S);u.addEventListener("click",w);B?.addEventListener("click",()=>d(n));M.addEventListener("click",$);d();
