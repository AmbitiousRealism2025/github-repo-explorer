import{e as $,b as _,S as m,i as M,a as H,t as T,g as R,f as y,u as A,I as p,c as I,h as N}from"./errorBoundary-Bh1k4IQJ.js";import{g as D,a as F,b as j,c as q,d as P}from"./api-Cg2usqAf.js";const W=(e,o=!1)=>{const n=[{label:"HTTPS",cmd:`git clone https://github.com/${e}.git`},{label:"SSH",cmd:`git clone git@github.com:${e}.git`},{label:"GitHub CLI",cmd:`gh repo clone ${e}`},{label:"Degit",cmd:`npx degit ${e} my-project`}];o&&n.push({label:"Dev Container",cmd:`gh cs create -r ${e}`});const s=document.createElement("div");s.className="clone-commands",s.innerHTML=`
    <div class="clone-commands__header">
      <span class="clone-commands__title">Clone</span>
    </div>
    <div class="clone-commands__tabs">
      ${n.map((c,r)=>`
        <button class="clone-commands__tab ${r===0?"active":""}" data-index="${r}">
          ${$(c.label)}
        </button>
      `).join("")}
    </div>
    <div class="clone-commands__input-wrapper">
      <input type="text" class="clone-commands__input" value="${$(n[0].cmd)}" readonly>
      <button class="clone-commands__copy" aria-label="Copy to clipboard">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>
    </div>
  `;const i=s.querySelector(".clone-commands__input"),t=s.querySelectorAll(".clone-commands__tab"),a=s.querySelector(".clone-commands__copy");return t.forEach(c=>{c.addEventListener("click",()=>{t.forEach(r=>r.classList.remove("active")),c.classList.add("active"),i.value=n[parseInt(c.dataset.index)].cmd})}),a.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(i.value),_("Copied to clipboard","success")}catch{i.select(),document.execCommand("copy"),_("Copied to clipboard","success")}}),s},G=e=>{const o=m.getNote(e),n=document.createElement("div");n.className="repo-notes",n.innerHTML=`
    <div class="repo-notes__header">
      <span class="repo-notes__title">My Notes</span>
      <span class="repo-notes__status"></span>
    </div>
    <textarea 
      class="repo-notes__textarea" 
      placeholder="Add private notes about this repository..."
      rows="4"
    >${o?$(o.content):""}</textarea>
    <div class="repo-notes__footer">
      <span class="repo-notes__hint">Notes are saved locally in your browser</span>
      <button class="repo-notes__save btn btn--sm btn--primary">Save Note</button>
    </div>
  `;const s=n.querySelector(".repo-notes__textarea"),i=n.querySelector(".repo-notes__save"),t=n.querySelector(".repo-notes__status");let a;const c=(r,d="info")=>{t.textContent=r,t.className=`repo-notes__status repo-notes__status--${d}`,clearTimeout(a),a=setTimeout(()=>{t.textContent=""},2e3)};return i.addEventListener("click",()=>{m.saveNote(e,s.value),s.value.trim()?(c("Saved","success"),_("Note saved","success")):(c("Cleared","info"),_("Note cleared","info"))}),s.addEventListener("blur",()=>{const r=m.getNote(e),d=r?r.content:"";s.value!==d&&(m.saveNote(e,s.value),c("Auto-saved","success"))}),n},O=e=>{const o=document.createElement("div");o.className="commit-heatmap";const n=Array.isArray(e)?e:[];if(n.length===0)return o.innerHTML=`
      <div class="commit-heatmap__header">
        <span class="commit-heatmap__title">Commit Activity</span>
      </div>
      <div class="commit-heatmap__empty">
        <p>Commit data not available yet. GitHub is processing stats.</p>
      </div>
    `,o;const s=Math.max(...n.flatMap(a=>a.days||[]),1),i=a=>a===0?0:a<=s*.25?1:a<=s*.5?2:a<=s*.75?3:4;let t="";return n.forEach(a=>{(a.days||[0,0,0,0,0,0,0]).forEach((r,d)=>{const u=new Date(a.week*1e3);u.setDate(u.getDate()+d);const g=i(r);t+=`<div class="commit-heatmap__cell commit-heatmap__cell--${g}" 
        title="${u.toDateString()}: ${r} commits"></div>`})}),o.innerHTML=`
    <div class="commit-heatmap__header">
      <span class="commit-heatmap__title">Commit Activity</span>
    </div>
    <div class="commit-heatmap__grid">
      <div class="commit-heatmap__cells">
        ${t}
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
  `,o},z=(e,o={})=>{const{hasReadme:n=!0,commitActivity:s=null}=o,i={maintenance:30,community:25,documentation:15,activity:20,engagement:10};let t={maintenance:0,community:0,documentation:0,activity:0,engagement:0};const a=Math.floor((Date.now()-new Date(e.pushed_at).getTime())/(1e3*60*60*24));a<=7?t.maintenance=100:a<=30?t.maintenance=80:a<=90?t.maintenance=60:a<=180?t.maintenance=40:a<=365?t.maintenance=20:t.maintenance=10;const c=e.stargazers_count||0,r=e.forks_count||0;if(c>=1e4?t.community=100:c>=1e3?t.community=80:c>=100?t.community=60:c>=10?t.community=40:t.community=20,t.documentation=n?80:20,e.license&&(t.documentation=Math.min(100,t.documentation+20)),e.homepage&&(t.documentation=Math.min(100,t.documentation+10)),e.description&&(t.documentation=Math.min(100,t.documentation+10)),s&&Array.isArray(s)&&s.length>0){const u=s.slice(-12);u.reduce((f,S)=>f+(S.total||0),0);const g=u.filter(f=>(f.total||0)>0).length;g>=10?t.activity=100:g>=6?t.activity=80:g>=3?t.activity=60:g>=1?t.activity=40:t.activity=20}else t.activity=a<=30?60:30;return r>=1e3?t.engagement=100:r>=100?t.engagement=80:r>=10?t.engagement=60:r>=1?t.engagement=40:t.engagement=20,{total:Math.round((t.maintenance*i.maintenance+t.community*i.community+t.documentation*i.documentation+t.activity*i.activity+t.engagement*i.engagement)/100),breakdown:t,weights:i}},U=e=>e>=80?{label:"Excellent",class:"excellent"}:e>=60?{label:"Good",class:"good"}:e>=40?{label:"Fair",class:"fair"}:{label:"Needs Work",class:"poor"},V=(e,o={})=>{const n=z(e,o),{label:s,class:i}=U(n.total),t=document.createElement("div");return t.className="health-score",t.innerHTML=`
    <div class="health-score__header">
      <span class="health-score__title">Repository Health</span>
    </div>
    <div class="health-score__main">
      <div class="health-score__gauge">
        <svg viewBox="0 0 120 120" class="health-score__ring">
          <circle 
            cx="60" cy="60" r="50" 
            fill="none" 
            stroke="var(--color-bg-tertiary)" 
            stroke-width="10"
          />
          <circle 
            cx="60" cy="60" r="50" 
            fill="none" 
            stroke="var(--health-score-color)" 
            stroke-width="10"
            stroke-linecap="round"
            stroke-dasharray="${n.total/100*314.159} 314.159"
            transform="rotate(-90 60 60)"
            class="health-score__progress"
          />
        </svg>
        <div class="health-score__value">
          <span class="health-score__number">${n.total}</span>
          <span class="health-score__label">${s}</span>
        </div>
      </div>
      <div class="health-score__breakdown">
        ${Object.entries(n.breakdown).map(([a,c])=>`
          <div class="health-score__metric">
            <div class="health-score__metric-header">
              <span class="health-score__metric-name">${J(a)}</span>
              <span class="health-score__metric-value">${c}%</span>
            </div>
            <div class="health-score__metric-bar">
              <div class="health-score__metric-fill" style="width: ${c}%"></div>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `,t.style.setProperty("--health-score-color",K(n.total)),t.setAttribute("data-score-class",i),t},J=e=>({maintenance:"Maintenance",community:"Community",documentation:"Documentation",activity:"Activity",engagement:"Engagement"})[e]||e,K=e=>e>=80?"var(--color-success, #10b981)":e>=60?"var(--color-accent, #14b8a6)":e>=40?"var(--color-warning, #f59e0b)":"var(--color-danger, #ef4444)";M();H();const E=document.getElementById("loading-state"),C=document.getElementById("detail-content"),x=document.getElementById("error-state"),b=document.getElementById("error-message"),Q=document.getElementById("theme-toggle"),X=document.getElementById("repo-name"),Y=document.getElementById("repo-description"),v=document.getElementById("favorite-btn");document.getElementById("favorite-text");const Z=document.getElementById("github-link"),ee=document.getElementById("stat-stars"),te=document.getElementById("stat-forks"),ae=document.getElementById("stat-watchers"),se=document.getElementById("stat-issues"),L=document.getElementById("readme-content"),k=document.getElementById("language-chart"),ne=document.getElementById("language-legend"),w=document.getElementById("activity-timeline"),oe=document.getElementById("repo-info"),ce=document.getElementById("clone-commands-container"),ie=document.getElementById("repo-notes-container"),re=document.getElementById("commit-heatmap-container"),le=document.getElementById("health-score-container");let l=null;const h=e=>{switch(E.classList.add("hidden"),C.classList.add("hidden"),x.classList.add("hidden"),e){case"loading":E.classList.remove("hidden");break;case"content":C.classList.remove("hidden");break;case"error":x.classList.remove("hidden");break}},de=e=>{const o=Object.values(e).reduce((a,c)=>a+c,0);if(o===0){k.innerHTML='<p class="text-sm text-muted">No language data available</p>';return}const n=40,s=2*Math.PI*n;let i=0;const t=Object.entries(e).sort((a,c)=>c[1]-a[1]).slice(0,6).map(([a,c])=>{const r=c/o,d=s*r,u={lang:a,percentage:r,offset:i,dashLength:d,color:N(a)};return i+=d,u});k.innerHTML=`
    <svg viewBox="0 0 100 100" class="language-chart">
      <g transform="rotate(-90 50 50)">
        ${t.map(a=>`
          <circle
            cx="50" cy="50" r="${n}"
            fill="none"
            stroke="${a.color}"
            stroke-width="16"
            stroke-dasharray="${a.dashLength} ${s-a.dashLength}"
            stroke-dashoffset="-${a.offset}"
          />
        `).join("")}
      </g>
    </svg>
  `,ne.innerHTML=t.map(a=>`
    <div class="language-legend-item">
      <span class="language-legend-name">
        <span class="language-dot" style="--lang-color: ${a.color}"></span>
        ${a.lang}
      </span>
      <span class="language-legend-percent">${(a.percentage*100).toFixed(1)}%</span>
    </div>
  `).join("")},me=e=>{switch(e){case"PushEvent":return p.push;case"PullRequestEvent":return p.pullRequest;case"IssuesEvent":return p.issue;case"WatchEvent":return p.star;default:return p.activity}},ue=e=>{switch(e.type){case"PushEvent":const o=e.payload.commits?.length||0;return`${e.actor.login} pushed ${o} commit${o!==1?"s":""}`;case"PullRequestEvent":return`${e.actor.login} ${e.payload.action} a pull request`;case"IssuesEvent":return`${e.actor.login} ${e.payload.action} an issue`;case"WatchEvent":return`${e.actor.login} starred this repository`;case"ForkEvent":return`${e.actor.login} forked this repository`;case"CreateEvent":return`${e.actor.login} created ${e.payload.ref_type} ${e.payload.ref||""}`;default:return`${e.actor.login} performed ${e.type.replace("Event","")}`}},pe=e=>{if(!e||e.length===0){w.innerHTML='<p class="text-sm text-muted">No recent activity</p>';return}w.innerHTML=e.slice(0,5).map(o=>`
    <div class="activity-item">
      <div class="activity-icon">${me(o.type)}</div>
      <div class="activity-content">
        <p class="activity-title">${ue(o)}</p>
        <p class="activity-meta">${I(o.created_at)}</p>
      </div>
    </div>
  `).join("")},ge=e=>{oe.innerHTML=`
    <div style="display: flex; flex-direction: column; gap: 8px; font-size: var(--text-sm);">
      ${e.language?`<div><strong>Language:</strong> ${e.language}</div>`:""}
      <div><strong>Created:</strong> ${new Date(e.created_at).toLocaleDateString()}</div>
      <div><strong>Last push:</strong> ${I(e.pushed_at)}</div>
      ${e.license?.name?`<div><strong>License:</strong> ${e.license.name}</div>`:""}
      ${e.homepage?`<div><strong>Homepage:</strong> <a href="${e.homepage}" target="_blank" rel="noopener">${e.homepage}</a></div>`:""}
    </div>
  `},B=()=>{if(!l)return;const e=m.isFavorite(l.id);v.innerHTML=`
    ${e?p.star:p.starOutline}
    <span id="favorite-text">${e?"Remove from Favorites":"Add to Favorites"}</span>
  `,e?(v.classList.add("btn--primary"),v.classList.remove("btn--secondary")):(v.classList.remove("btn--primary"),v.classList.add("btn--secondary"))},ve=async()=>{const e=R("repo");if(!e){b.textContent="No repository specified",h("error");return}const[o,n]=e.split("/");if(!o||!n){b.textContent="Invalid repository format",h("error");return}h("loading");try{const[s,i,t,a,c]=await Promise.allSettled([D(o,n),F(o,n),j(o,n),q(o,n),P(o,n)]);if(s.status==="rejected")throw new Error(s.reason?.message||"Failed to load repository");l=s.value.data,document.title=`${l.full_name} - GitHub Explorer`,X.textContent=l.full_name,Y.textContent=l.description||"No description available",Z.href=l.html_url,ee.textContent=y(l.stargazers_count),te.textContent=y(l.forks_count),ae.textContent=y(l.subscribers_count),se.textContent=y(l.open_issues_count),B(),ge(l),m.trackExploration(l),ce.appendChild(W(l.full_name)),ie.appendChild(G(l.full_name));const r=i.status==="fulfilled"&&i.value.data?.decodedContent,d=c.status==="fulfilled"?c.value.data:null;le.appendChild(V(l,{hasReadme:r,commitActivity:d})),c.status==="fulfilled"&&c.value.data&&re.appendChild(O(c.value.data)),r?L.textContent=i.value.data.decodedContent:L.textContent="No README available",t.status==="fulfilled"&&de(t.value.data),a.status==="fulfilled"&&pe(a.value.data),s.value.rateLimit&&A(s.value.rateLimit),h("content")}catch(s){b.textContent=s.message,h("error")}};v.addEventListener("click",()=>{if(!l)return;m.isFavorite(l.id)?m.removeFavorite(l.id):m.addFavorite(l),B()});Q.addEventListener("click",T);ve();
