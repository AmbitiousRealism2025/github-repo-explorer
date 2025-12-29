import{i as _,a as k,t as E,b as l,s as I,g as B,f as c,c as v}from"./errorBoundary-Bh1k4IQJ.js";import{g as L}from"./api-Cg2usqAf.js";_();k();const d=document.getElementById("repo-1"),u=document.getElementById("repo-2"),p=document.getElementById("repo-3"),f=document.getElementById("repo-4"),w=document.getElementById("compare-btn"),g=document.getElementById("loading-state"),h=document.getElementById("compare-results"),b=document.getElementById("empty-state"),$=document.getElementById("compare-header"),P=document.getElementById("compare-body"),N=document.getElementById("theme-toggle"),S=[{key:"stargazers_count",label:"Stars",format:c},{key:"forks_count",label:"Forks",format:c},{key:"open_issues_count",label:"Open Issues",format:c},{key:"subscribers_count",label:"Watchers",format:c},{key:"language",label:"Primary Language",format:e=>e||"N/A"},{key:"license",label:"License",format:e=>e?.spdx_id||"None"},{key:"created_at",label:"Created",format:e=>new Date(e).toLocaleDateString()},{key:"pushed_at",label:"Last Push",format:v},{key:"size",label:"Size",format:e=>`${(e/1024).toFixed(1)} MB`},{key:"default_branch",label:"Default Branch",format:e=>e},{key:"has_wiki",label:"Wiki",format:e=>e?"Yes":"No"},{key:"has_pages",label:"GitHub Pages",format:e=>e?"Yes":"No"},{key:"archived",label:"Archived",format:e=>e?"Yes":"No"}],m=e=>{switch(g.classList.add("hidden"),h.classList.add("hidden"),b.classList.add("hidden"),e){case"loading":g.classList.remove("hidden");break;case"results":h.classList.remove("hidden");break;case"empty":b.classList.remove("hidden");break}},T=(e,t)=>{if(!["stargazers_count","forks_count","subscribers_count"].includes(t))return null;let o=0,s=e[0][t]||0;return e.forEach((r,i)=>{const n=r[t]||0;n>s&&(s=n,o=i)}),o},j=e=>{$.innerHTML=`
    <th class="compare-table__metric">Metric</th>
    ${e.map(t=>`
      <th class="compare-table__repo">
        <a href="/detail.html?repo=${encodeURIComponent(t.full_name)}" class="compare-table__repo-link">
          ${t.full_name}
        </a>
      </th>
    `).join("")}
  `,P.innerHTML=S.map(t=>{const a=T(e,t.key);return`
      <tr>
        <td class="compare-table__metric-name">${t.label}</td>
        ${e.map((o,s)=>`
          <td class="compare-table__value ${a===s?"compare-table__value--best":""}">
            ${t.format(o[t.key])}
          </td>
        `).join("")}
      </tr>
    `}).join(""),m("results")},y=async()=>{const t=[d,u,p,f].map(a=>a.value.trim()).filter(a=>a.length>0&&a.includes("/"));if(t.length<2){l("Please enter at least 2 valid repository names (owner/repo)","error");return}I({repos:t.join(",")}),m("loading");try{const a=await Promise.allSettled(t.map(r=>{const[i,n]=r.split("/");return L(i,n)})),o=a.filter(r=>r.status==="fulfilled").map(r=>r.value.data),s=a.filter(r=>r.status==="rejected").length;if(o.length<2){l("Could not fetch enough repositories for comparison","error"),m("empty");return}s>0&&l(`${s} repository(ies) could not be loaded`,"warning"),j(o)}catch(a){l(a.message,"error"),m("empty")}},C=()=>{const e=B("repos");if(e){const t=e.split(","),a=[d,u,p,f];t.forEach((o,s)=>{a[s]&&(a[s].value=o)}),y()}};w.addEventListener("click",y);N.addEventListener("click",E);[d,u,p,f].forEach(e=>{e.addEventListener("keypress",t=>{t.key==="Enter"&&y()})});C();
