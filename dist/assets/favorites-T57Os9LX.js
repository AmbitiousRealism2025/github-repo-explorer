import{i as m,t as g,S as c,s as p,I as s,b as u,f as o,c as f}from"./common-B1Um71dy.js";m();const n=document.getElementById("repo-grid"),r=document.getElementById("favorites-section"),_=document.getElementById("results-count"),d=document.getElementById("empty-state"),h=document.getElementById("theme-toggle"),v=e=>{const t=document.createElement("article");return t.className="repo-card",t.dataset.repoId=e.id,t.innerHTML=`
    <header class="repo-card__header">
      <a href="/detail.html?repo=${encodeURIComponent(e.full_name)}" class="repo-card__name">${e.full_name}</a>
      <button class="repo-card__favorite active" aria-label="Remove from favorites" data-id="${e.id}">
        ${s.star}
      </button>
    </header>
    <p class="repo-card__description">${e.description||"No description available"}</p>
    <footer class="repo-card__footer">
      ${e.language?`
        <span class="repo-card__language">
          <span class="language-dot" style="--lang-color: ${u(e.language)}"></span>
          ${e.language}
        </span>
      `:""}
      <span class="repo-card__stat">
        ${s.star}
        ${o(e.stargazers_count)}
      </span>
      <span class="repo-card__stat">
        ${s.fork}
        ${o(e.forks_count)}
      </span>
      <span class="repo-card__updated">Added ${f(new Date(e.addedAt).toISOString())}</span>
    </footer>
  `,t},i=()=>{const e=c.getFavorites();if(e.length===0){r.classList.add("hidden"),d.classList.remove("hidden");return}d.classList.add("hidden"),r.classList.remove("hidden"),_.innerHTML=`<strong>${e.length}</strong> saved ${e.length===1?"repository":"repositories"}`,n.innerHTML="";const t=document.createDocumentFragment();e.sort((a,l)=>l.addedAt-a.addedAt).forEach(a=>{t.appendChild(v(a))}),n.appendChild(t)},$=e=>{const t=e.target.closest(".repo-card__favorite");if(!t)return;const a=parseInt(t.dataset.id);c.removeFavorite(a),p("Removed from favorites","info"),i()};n.addEventListener("click",$);h.addEventListener("click",g);i();
