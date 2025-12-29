import{e as f,b as y,S as d,i as w,a as S,t as T,g as H,f as h,u as R,I as u,c as I,h as M}from"./errorBoundary-6mNU-65L.js";import{g as N,a as D,b as F,c as q,d as A}from"./api-B86XjMPz.js";const P=(e,s=!1)=>{const n=[{label:"HTTPS",cmd:`git clone https://github.com/${e}.git`},{label:"SSH",cmd:`git clone git@github.com:${e}.git`},{label:"GitHub CLI",cmd:`gh repo clone ${e}`},{label:"Degit",cmd:`npx degit ${e} my-project`}];s&&n.push({label:"Dev Container",cmd:`gh cs create -r ${e}`});const a=document.createElement("div");a.className="clone-commands",a.innerHTML=`
    <div class="clone-commands__header">
      <span class="clone-commands__title">Clone</span>
    </div>
    <div class="clone-commands__tabs">
      ${n.map((o,i)=>`
        <button class="clone-commands__tab ${i===0?"active":""}" data-index="${i}">
          ${f(o.label)}
        </button>
      `).join("")}
    </div>
    <div class="clone-commands__input-wrapper">
      <input type="text" class="clone-commands__input" value="${f(n[0].cmd)}" readonly>
      <button class="clone-commands__copy" aria-label="Copy to clipboard">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>
    </div>
  `;const l=a.querySelector(".clone-commands__input"),r=a.querySelectorAll(".clone-commands__tab"),t=a.querySelector(".clone-commands__copy");return r.forEach(o=>{o.addEventListener("click",()=>{r.forEach(i=>i.classList.remove("active")),o.classList.add("active"),l.value=n[parseInt(o.dataset.index)].cmd})}),t.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(l.value),y("Copied to clipboard","success")}catch{l.select(),document.execCommand("copy"),y("Copied to clipboard","success")}}),a},j=e=>{const s=d.getNote(e),n=document.createElement("div");n.className="repo-notes",n.innerHTML=`
    <div class="repo-notes__header">
      <span class="repo-notes__title">My Notes</span>
      <span class="repo-notes__status"></span>
    </div>
    <textarea 
      class="repo-notes__textarea" 
      placeholder="Add private notes about this repository..."
      rows="4"
    >${s?f(s.content):""}</textarea>
    <div class="repo-notes__footer">
      <span class="repo-notes__hint">Notes are saved locally in your browser</span>
      <button class="repo-notes__save btn btn--sm btn--primary">Save Note</button>
    </div>
  `;const a=n.querySelector(".repo-notes__textarea"),l=n.querySelector(".repo-notes__save"),r=n.querySelector(".repo-notes__status");let t;const o=(i,m="info")=>{r.textContent=i,r.className=`repo-notes__status repo-notes__status--${m}`,clearTimeout(t),t=setTimeout(()=>{r.textContent=""},2e3)};return l.addEventListener("click",()=>{d.saveNote(e,a.value),a.value.trim()?(o("Saved","success"),y("Note saved","success")):(o("Cleared","info"),y("Note cleared","info"))}),a.addEventListener("blur",()=>{const i=d.getNote(e),m=i?i.content:"";a.value!==m&&(d.saveNote(e,a.value),o("Auto-saved","success"))}),n},O=e=>{const s=document.createElement("div");s.className="commit-heatmap";const n=e||[],a=Math.max(...n.flatMap(t=>t.days||[]),1),l=t=>t===0?0:t<=a*.25?1:t<=a*.5?2:t<=a*.75?3:4;let r="";return n.forEach(t=>{(t.days||[0,0,0,0,0,0,0]).forEach((i,m)=>{const g=new Date(t.week*1e3);g.setDate(g.getDate()+m);const k=l(i);r+=`<div class="commit-heatmap__cell commit-heatmap__cell--${k}" 
        title="${g.toDateString()}: ${i} commits"></div>`})}),s.innerHTML=`
    <div class="commit-heatmap__header">
      <span class="commit-heatmap__title">Commit Activity</span>
    </div>
    <div class="commit-heatmap__grid">
      <div class="commit-heatmap__cells">
        ${r}
      </div>
    </div>
    <div class="commit-heatmap__legend">
      <span>Less</span>
      <div class="commit-heatmap__cell commit-heatmap__cell--0"></div>
      <div class="commit-heatmap__cell commit-heatmap__cell--1"></div>
      <div class="commit-heatmap__cell commit-heatmap__cell--2"></div>
      <div class="commit-heatmap__cell commit-heatmap__cell--3"></div>
      <div class="commit-heatmap__cell commit-heatmap__cell--4"></div>
      <span>More</span>
    </div>
  `,s};w();S();const E=document.getElementById("loading-state"),$=document.getElementById("detail-content"),b=document.getElementById("error-state"),_=document.getElementById("error-message"),W=document.getElementById("theme-toggle"),z=document.getElementById("repo-name"),G=document.getElementById("repo-description"),p=document.getElementById("favorite-btn");document.getElementById("favorite-text");const U=document.getElementById("github-link"),V=document.getElementById("stat-stars"),J=document.getElementById("stat-forks"),K=document.getElementById("stat-watchers"),Q=document.getElementById("stat-issues"),L=document.getElementById("readme-content"),x=document.getElementById("language-chart"),X=document.getElementById("language-legend"),C=document.getElementById("activity-timeline"),Y=document.getElementById("repo-info"),Z=document.getElementById("clone-commands-container"),ee=document.getElementById("repo-notes-container"),te=document.getElementById("commit-heatmap-container");let c=null;const v=e=>{switch(E.classList.add("hidden"),$.classList.add("hidden"),b.classList.add("hidden"),e){case"loading":E.classList.remove("hidden");break;case"content":$.classList.remove("hidden");break;case"error":b.classList.remove("hidden");break}},ae=e=>{const s=Object.values(e).reduce((t,o)=>t+o,0);if(s===0){x.innerHTML='<p class="text-sm text-muted">No language data available</p>';return}const n=40,a=2*Math.PI*n;let l=0;const r=Object.entries(e).sort((t,o)=>o[1]-t[1]).slice(0,6).map(([t,o])=>{const i=o/s,m=a*i,g={lang:t,percentage:i,offset:l,dashLength:m,color:M(t)};return l+=m,g});x.innerHTML=`
    <svg viewBox="0 0 100 100" class="language-chart">
      <g transform="rotate(-90 50 50)">
        ${r.map(t=>`
          <circle
            cx="50" cy="50" r="${n}"
            fill="none"
            stroke="${t.color}"
            stroke-width="16"
            stroke-dasharray="${t.dashLength} ${a-t.dashLength}"
            stroke-dashoffset="-${t.offset}"
          />
        `).join("")}
      </g>
    </svg>
  `,X.innerHTML=r.map(t=>`
    <div class="language-legend-item">
      <span class="language-legend-name">
        <span class="language-dot" style="--lang-color: ${t.color}"></span>
        ${t.lang}
      </span>
      <span class="language-legend-percent">${(t.percentage*100).toFixed(1)}%</span>
    </div>
  `).join("")},se=e=>{switch(e){case"PushEvent":return u.push;case"PullRequestEvent":return u.pullRequest;case"IssuesEvent":return u.issue;case"WatchEvent":return u.star;default:return u.activity}},ne=e=>{switch(e.type){case"PushEvent":const s=e.payload.commits?.length||0;return`${e.actor.login} pushed ${s} commit${s!==1?"s":""}`;case"PullRequestEvent":return`${e.actor.login} ${e.payload.action} a pull request`;case"IssuesEvent":return`${e.actor.login} ${e.payload.action} an issue`;case"WatchEvent":return`${e.actor.login} starred this repository`;case"ForkEvent":return`${e.actor.login} forked this repository`;case"CreateEvent":return`${e.actor.login} created ${e.payload.ref_type} ${e.payload.ref||""}`;default:return`${e.actor.login} performed ${e.type.replace("Event","")}`}},oe=e=>{if(!e||e.length===0){C.innerHTML='<p class="text-sm text-muted">No recent activity</p>';return}C.innerHTML=e.slice(0,5).map(s=>`
    <div class="activity-item">
      <div class="activity-icon">${se(s.type)}</div>
      <div class="activity-content">
        <p class="activity-title">${ne(s)}</p>
        <p class="activity-meta">${I(s.created_at)}</p>
      </div>
    </div>
  `).join("")},ce=e=>{Y.innerHTML=`
    <div style="display: flex; flex-direction: column; gap: 8px; font-size: var(--text-sm);">
      ${e.language?`<div><strong>Language:</strong> ${e.language}</div>`:""}
      <div><strong>Created:</strong> ${new Date(e.created_at).toLocaleDateString()}</div>
      <div><strong>Last push:</strong> ${I(e.pushed_at)}</div>
      ${e.license?.name?`<div><strong>License:</strong> ${e.license.name}</div>`:""}
      ${e.homepage?`<div><strong>Homepage:</strong> <a href="${e.homepage}" target="_blank" rel="noopener">${e.homepage}</a></div>`:""}
    </div>
  `},B=()=>{if(!c)return;const e=d.isFavorite(c.id);p.innerHTML=`
    ${e?u.star:u.starOutline}
    <span id="favorite-text">${e?"Remove from Favorites":"Add to Favorites"}</span>
  `,e?(p.classList.add("btn--primary"),p.classList.remove("btn--secondary")):(p.classList.remove("btn--primary"),p.classList.add("btn--secondary"))},re=async()=>{const e=H("repo");if(!e){_.textContent="No repository specified",v("error");return}const[s,n]=e.split("/");if(!s||!n){_.textContent="Invalid repository format",v("error");return}v("loading");try{const[a,l,r,t,o]=await Promise.allSettled([N(s,n),D(s,n),F(s,n),q(s,n),A(s,n)]);if(a.status==="rejected")throw new Error(a.reason?.message||"Failed to load repository");c=a.value.data,document.title=`${c.full_name} - GitHub Explorer`,z.textContent=c.full_name,G.textContent=c.description||"No description available",U.href=c.html_url,V.textContent=h(c.stargazers_count),J.textContent=h(c.forks_count),K.textContent=h(c.subscribers_count),Q.textContent=h(c.open_issues_count),B(),ce(c),d.trackExploration(c),Z.appendChild(P(c.full_name)),ee.appendChild(j(c.full_name)),o.status==="fulfilled"&&o.value.data&&te.appendChild(O(o.value.data)),l.status==="fulfilled"&&l.value.data?.decodedContent?L.textContent=l.value.data.decodedContent:L.textContent="No README available",r.status==="fulfilled"&&ae(r.value.data),t.status==="fulfilled"&&oe(t.value.data),a.value.rateLimit&&R(a.value.rateLimit),v("content")}catch(a){_.textContent=a.message,v("error")}};p.addEventListener("click",()=>{if(!c)return;d.isFavorite(c.id)?d.removeFavorite(c.id):d.addFavorite(c),B()});W.addEventListener("click",T);re();
