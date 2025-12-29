import{i as C,a as R,t as k,g as F,f as g,u as _,S as m,I as r,b as x,c as w}from"./errorBoundary-i6H9MPxW.js";import{g as T,a as M,b as H,c as P}from"./api-BIACRTEG.js";C();R();const f=document.getElementById("loading-state"),h=document.getElementById("detail-content"),E=document.getElementById("error-state"),p=document.getElementById("error-message"),S=document.getElementById("theme-toggle"),D=document.getElementById("repo-name"),N=document.getElementById("repo-description"),c=document.getElementById("favorite-btn");document.getElementById("favorite-text");const j=document.getElementById("github-link"),q=document.getElementById("stat-stars"),A=document.getElementById("stat-forks"),O=document.getElementById("stat-watchers"),W=document.getElementById("stat-issues"),$=document.getElementById("readme-content"),L=document.getElementById("language-chart"),z=document.getElementById("language-legend"),I=document.getElementById("activity-timeline"),G=document.getElementById("repo-info");let a=null;const u=e=>{switch(f.classList.add("hidden"),h.classList.add("hidden"),E.classList.add("hidden"),e){case"loading":f.classList.remove("hidden");break;case"content":h.classList.remove("hidden");break;case"error":E.classList.remove("hidden");break}},U=e=>{const n=Object.values(e).reduce((t,d)=>t+d,0);if(n===0){L.innerHTML='<p class="text-sm text-muted">No language data available</p>';return}const o=40,s=2*Math.PI*o;let i=0;const l=Object.entries(e).sort((t,d)=>d[1]-t[1]).slice(0,6).map(([t,d])=>{const v=d/n,y=s*v,b={lang:t,percentage:v,offset:i,dashLength:y,color:w(t)};return i+=y,b});L.innerHTML=`
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
  `,z.innerHTML=l.map(t=>`
    <div class="language-legend-item">
      <span class="language-legend-name">
        <span class="language-dot" style="--lang-color: ${t.color}"></span>
        ${t.lang}
      </span>
      <span class="language-legend-percent">${(t.percentage*100).toFixed(1)}%</span>
    </div>
  `).join("")},J=e=>{switch(e){case"PushEvent":return r.push;case"PullRequestEvent":return r.pullRequest;case"IssuesEvent":return r.issue;case"WatchEvent":return r.star;default:return r.activity}},K=e=>{switch(e.type){case"PushEvent":const n=e.payload.commits?.length||0;return`${e.actor.login} pushed ${n} commit${n!==1?"s":""}`;case"PullRequestEvent":return`${e.actor.login} ${e.payload.action} a pull request`;case"IssuesEvent":return`${e.actor.login} ${e.payload.action} an issue`;case"WatchEvent":return`${e.actor.login} starred this repository`;case"ForkEvent":return`${e.actor.login} forked this repository`;case"CreateEvent":return`${e.actor.login} created ${e.payload.ref_type} ${e.payload.ref||""}`;default:return`${e.actor.login} performed ${e.type.replace("Event","")}`}},Q=e=>{if(!e||e.length===0){I.innerHTML='<p class="text-sm text-muted">No recent activity</p>';return}I.innerHTML=e.slice(0,5).map(n=>`
    <div class="activity-item">
      <div class="activity-icon">${J(n.type)}</div>
      <div class="activity-content">
        <p class="activity-title">${K(n)}</p>
        <p class="activity-meta">${x(n.created_at)}</p>
      </div>
    </div>
  `).join("")},V=e=>{G.innerHTML=`
    <div style="display: flex; flex-direction: column; gap: 8px; font-size: var(--text-sm);">
      ${e.language?`<div><strong>Language:</strong> ${e.language}</div>`:""}
      <div><strong>Created:</strong> ${new Date(e.created_at).toLocaleDateString()}</div>
      <div><strong>Last push:</strong> ${x(e.pushed_at)}</div>
      ${e.license?.name?`<div><strong>License:</strong> ${e.license.name}</div>`:""}
      ${e.homepage?`<div><strong>Homepage:</strong> <a href="${e.homepage}" target="_blank" rel="noopener">${e.homepage}</a></div>`:""}
    </div>
  `},B=()=>{if(!a)return;const e=m.isFavorite(a.id);c.innerHTML=`
    ${e?r.star:r.starOutline}
    <span id="favorite-text">${e?"Remove from Favorites":"Add to Favorites"}</span>
  `,e?(c.classList.add("btn--primary"),c.classList.remove("btn--secondary")):(c.classList.remove("btn--primary"),c.classList.add("btn--secondary"))},X=async()=>{const e=F("repo");if(!e){p.textContent="No repository specified",u("error");return}const[n,o]=e.split("/");if(!n||!o){p.textContent="Invalid repository format",u("error");return}u("loading");try{const[s,i,l,t]=await Promise.allSettled([T(n,o),M(n,o),H(n,o),P(n,o)]);if(s.status==="rejected")throw new Error(s.reason?.message||"Failed to load repository");a=s.value.data,document.title=`${a.full_name} - GitHub Explorer`,D.textContent=a.full_name,N.textContent=a.description||"No description available",j.href=a.html_url,q.textContent=g(a.stargazers_count),A.textContent=g(a.forks_count),O.textContent=g(a.subscribers_count),W.textContent=g(a.open_issues_count),B(),V(a),i.status==="fulfilled"&&i.value.data?.decodedContent?$.textContent=i.value.data.decodedContent:$.textContent="No README available",l.status==="fulfilled"&&U(l.value.data),t.status==="fulfilled"&&Q(t.value.data),s.value.rateLimit&&_(s.value.rateLimit),u("content")}catch(s){p.textContent=s.message,u("error")}};c.addEventListener("click",()=>{if(!a)return;m.isFavorite(a.id)?m.removeFavorite(a.id):m.addFavorite(a),B()});S.addEventListener("click",k);X();
