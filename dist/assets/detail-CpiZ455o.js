import{i as C,t as R,g as k,f as u,u as F,S as m,I as r,c as x,b as _}from"./common-B1Um71dy.js";import{g as w,a as T,b as M,c as H}from"./api-Yir0XPV8.js";C();const f=document.getElementById("loading-state"),h=document.getElementById("detail-content"),E=document.getElementById("error-state"),p=document.getElementById("error-message"),P=document.getElementById("theme-toggle"),S=document.getElementById("repo-name"),D=document.getElementById("repo-description"),c=document.getElementById("favorite-btn");document.getElementById("favorite-text");const N=document.getElementById("github-link"),j=document.getElementById("stat-stars"),q=document.getElementById("stat-forks"),A=document.getElementById("stat-watchers"),O=document.getElementById("stat-issues"),$=document.getElementById("readme-content"),L=document.getElementById("language-chart"),W=document.getElementById("language-legend"),I=document.getElementById("activity-timeline"),z=document.getElementById("repo-info");let a=null;const g=e=>{switch(f.classList.add("hidden"),h.classList.add("hidden"),E.classList.add("hidden"),e){case"loading":f.classList.remove("hidden");break;case"content":h.classList.remove("hidden");break;case"error":E.classList.remove("hidden");break}},G=e=>{const n=Object.values(e).reduce((t,d)=>t+d,0);if(n===0){L.innerHTML='<p class="text-sm text-muted">No language data available</p>';return}const o=40,s=2*Math.PI*o;let i=0;const l=Object.entries(e).sort((t,d)=>d[1]-t[1]).slice(0,6).map(([t,d])=>{const v=d/n,y=s*v,B={lang:t,percentage:v,offset:i,dashLength:y,color:_(t)};return i+=y,B});L.innerHTML=`
    <svg viewBox="0 0 100 100" class="language-chart">
      <g transform="rotate(-90 50 50)">
        ${l.map(t=>`
          <circle
            cx="50" cy="50" r="${o}"
            fill="none"
            stroke="${t.color}"
            stroke-width="16"
            stroke-dasharray="${t.dashLength} ${s-t.dashLength}"
            stroke-dashoffset="-${t.offset}"
          />
        `).join("")}
      </g>
    </svg>
  `,W.innerHTML=l.map(t=>`
    <div class="language-legend-item">
      <span class="language-legend-name">
        <span class="language-dot" style="--lang-color: ${t.color}"></span>
        ${t.lang}
      </span>
      <span class="language-legend-percent">${(t.percentage*100).toFixed(1)}%</span>
    </div>
  `).join("")},U=e=>{switch(e){case"PushEvent":return r.push;case"PullRequestEvent":return r.pullRequest;case"IssuesEvent":return r.issue;case"WatchEvent":return r.star;default:return r.activity}},J=e=>{switch(e.type){case"PushEvent":const n=e.payload.commits?.length||0;return`${e.actor.login} pushed ${n} commit${n!==1?"s":""}`;case"PullRequestEvent":return`${e.actor.login} ${e.payload.action} a pull request`;case"IssuesEvent":return`${e.actor.login} ${e.payload.action} an issue`;case"WatchEvent":return`${e.actor.login} starred this repository`;case"ForkEvent":return`${e.actor.login} forked this repository`;case"CreateEvent":return`${e.actor.login} created ${e.payload.ref_type} ${e.payload.ref||""}`;default:return`${e.actor.login} performed ${e.type.replace("Event","")}`}},K=e=>{if(!e||e.length===0){I.innerHTML='<p class="text-sm text-muted">No recent activity</p>';return}I.innerHTML=e.slice(0,5).map(n=>`
    <div class="activity-item">
      <div class="activity-icon">${U(n.type)}</div>
      <div class="activity-content">
        <p class="activity-title">${J(n)}</p>
        <p class="activity-meta">${x(n.created_at)}</p>
      </div>
    </div>
  `).join("")},Q=e=>{z.innerHTML=`
    <div style="display: flex; flex-direction: column; gap: 8px; font-size: var(--text-sm);">
      ${e.language?`<div><strong>Language:</strong> ${e.language}</div>`:""}
      <div><strong>Created:</strong> ${new Date(e.created_at).toLocaleDateString()}</div>
      <div><strong>Last push:</strong> ${x(e.pushed_at)}</div>
      ${e.license?.name?`<div><strong>License:</strong> ${e.license.name}</div>`:""}
      ${e.homepage?`<div><strong>Homepage:</strong> <a href="${e.homepage}" target="_blank" rel="noopener">${e.homepage}</a></div>`:""}
    </div>
  `},b=()=>{if(!a)return;const e=m.isFavorite(a.id);c.innerHTML=`
    ${e?r.star:r.starOutline}
    <span id="favorite-text">${e?"Remove from Favorites":"Add to Favorites"}</span>
  `,e?(c.classList.add("btn--primary"),c.classList.remove("btn--secondary")):(c.classList.remove("btn--primary"),c.classList.add("btn--secondary"))},V=async()=>{const e=k("repo");if(!e){p.textContent="No repository specified",g("error");return}const[n,o]=e.split("/");if(!n||!o){p.textContent="Invalid repository format",g("error");return}g("loading");try{const[s,i,l,t]=await Promise.allSettled([w(n,o),T(n,o),M(n,o),H(n,o)]);if(s.status==="rejected")throw new Error(s.reason?.message||"Failed to load repository");a=s.value.data,document.title=`${a.full_name} - GitHub Explorer`,S.textContent=a.full_name,D.textContent=a.description||"No description available",N.href=a.html_url,j.textContent=u(a.stargazers_count),q.textContent=u(a.forks_count),A.textContent=u(a.subscribers_count),O.textContent=u(a.open_issues_count),b(),Q(a),i.status==="fulfilled"&&i.value.data?.decodedContent?$.textContent=i.value.data.decodedContent:$.textContent="No README available",l.status==="fulfilled"&&G(l.value.data),t.status==="fulfilled"&&K(t.value.data),s.value.rateLimit&&F(s.value.rateLimit),g("content")}catch(s){p.textContent=s.message,g("error")}};c.addEventListener("click",()=>{if(!a)return;m.isFavorite(a.id)?m.removeFavorite(a.id):m.addFavorite(a),b()});P.addEventListener("click",R);V();
