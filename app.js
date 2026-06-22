const $ = (id)=>document.getElementById(id);
let currentStep = 1, currentFilter = "all", composerType = "story";

const defaultTasks = [
  {group:"🌱 Sağlıklı Bir Nazmi", text:"Su iç", done:false},
  {group:"📖 Hikâyem", text:"Günün hikâyesini yaz", done:false},
  {group:"🚭 Değişim", text:"Tetikleyicileri not et", done:false}
];

const seed = {
  onboarded:false,
  profile:{name:"Nazmi Karabaş", title:"Makina Mühendisi", future:"Sağlıklı, sigarasız, güçlü, meraklı, öğrenen, iyi bir dost."},
  chapters:[{name:"Yeniden Başlangıç", desc:"İlk sayfaların yazıldığı dönem.", start:"2026-06-22"}],
  entries:[{
    id:1,type:"milestone",title:"Bir Dostun Doğuşu",
    body:"Bugün bir uygulama tasarlamadık. Bir dost tasarladık. Henüz ortada ekranlar yoktu. Henüz ortada kod yoktu. Ama bir fikir doğdu. Ve bazı fikirler, doğdukları günün çok ötesine ulaşır.",
    mood:"💙 Duygusal", song:"", tags:"DOST, Kurucu Hikâye", date:"2026-06-22T22:00:00", chapter:"Yeniden Başlangıç", museum:true
  }],
  tasks: defaultTasks,
  capsules:[],
  smokes:[]
};
function getData(){ return JSON.parse(localStorage.getItem("dostData") || JSON.stringify(seed)); }
function saveData(d){ localStorage.setItem("dostData", JSON.stringify(d)); }

window.onload = () => {
  setTimeout(()=> $("splash").classList.add("hide"), 1200);
  const d=getData();
  if(d.onboarded){ $("onboarding").classList.remove("active"); $("home").classList.add("active"); }
  else { $("onboarding").classList.add("active"); }
  renderAll();
  if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});
};

function nextStep(){
  const d=getData();
  if(currentStep < 4){
    document.querySelector(`.step[data-step="${currentStep}"]`).classList.remove("active");
    currentStep++;
    document.querySelector(`.step[data-step="${currentStep}"]`).classList.add("active");
    $("backBtn").style.display = "inline-block";
    if(currentStep===4) $("nextBtn").textContent="DOST'a Başla";
  } else {
    const mem=$("firstMemory").value.trim();
    const future=$("futureSelf").value.trim();
    const letter=$("firstLetter").value.trim();
    const chapter=$("firstChapter").value.trim() || "Yeniden Başlangıç";
    d.onboarded=true;
    d.profile.future = future || [...document.querySelectorAll("#identityChips button.active")].map(b=>b.textContent).join(", ") || d.profile.future;
    d.chapters[0].name = chapter;
    d.entries.push({id:Date.now(),type:"story",title:"İlk Anım",body:mem || "DOST yolculuğumun ilk taşı.",mood:"💙 Duygusal",song:"",tags:"İlk Anı",date:new Date().toISOString(),chapter, museum:false});
    if(letter) d.capsules.push({id:Date.now()+1,title:"1 yıl sonraki kendime",body:letter,date:new Date().toISOString(),openDate:addYear(),opened:false});
    saveData(d);
    $("onboarding").classList.remove("active"); $("home").classList.add("active"); renderAll();
  }
}
function prevStep(){
  if(currentStep>1){
    document.querySelector(`.step[data-step="${currentStep}"]`).classList.remove("active");
    currentStep--;
    document.querySelector(`.step[data-step="${currentStep}"]`).classList.add("active");
    $("nextBtn").textContent="Devam Et";
    if(currentStep===1) $("backBtn").style.display = "none";
  }
}
document.addEventListener("click", e=>{
  if(e.target.closest("#identityChips button")) e.target.classList.toggle("active");
});

function openTab(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  $(id).classList.add("active");
  document.querySelectorAll(".tabbar button").forEach(b=>b.classList.remove("active"));
  const map={home:0,stories:1,longing:2,tasks:3,me:4};
  if(map[id]!==undefined) document.querySelectorAll(".tabbar button")[map[id]].classList.add("active");
  renderAll();
}
function renderAll(){ renderHome(); renderStories(); renderLonging(); renderTasks(); renderMe(); renderChapters(); renderCapsules(); renderSmoke(); }

function formatDate(s){ return new Date(s).toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric"}); }
function monthKey(s){ return new Date(s).toLocaleDateString("tr-TR",{month:"long",year:"numeric"}); }
function addYear(){ let d=new Date(); d.setFullYear(d.getFullYear()+1); return d.toISOString(); }

function renderHome(){
  const d=getData(), ch=d.chapters[d.chapters.length-1];
  $("todayText").textContent = new Date().toLocaleDateString("tr-TR",{weekday:"long",day:"numeric",month:"long"});
  $("currentChapterName").textContent=ch.name; $("currentChapterDesc").textContent=ch.desc || "Henüz yazılmakta olan bölüm.";
  const last=[...d.entries].sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
  $("lastStory").innerHTML = last ? `<b>${last.title}</b><p>${last.body.slice(0,120)}...</p>` : "Henüz hikâye yok.";
  $("homeTasks").innerHTML = d.tasks.slice(0,3).map((t,i)=>`<div class="task ${t.done?'done':''}" onclick="toggleTask(${i})"><span>${t.text}</span><b>${t.done?'✓':'○'}</b></div>`).join("");
  $("futureSelfText").textContent = d.profile.future;
}
function setFilter(f){ currentFilter=f; document.querySelectorAll(".filters button").forEach(b=>b.classList.remove("active")); document.querySelector(`[data-filter="${f}"]`)?.classList.add("active"); renderStories(); }
function renderStories(){
  const d=getData(), q=($("searchInput")?.value||"").toLowerCase();
  let entries=[...d.entries].sort((a,b)=>new Date(b.date)-new Date(a.date));
  if(currentFilter!=="all") entries=entries.filter(e=>e.type===currentFilter);
  if(q) entries=entries.filter(e=>(e.title+e.body+e.tags+e.chapter).toLowerCase().includes(q));
  let html="", lastMonth="";
  entries.forEach(e=>{
    const m=monthKey(e.date);
    if(m!==lastMonth){ html+=`<div class="timeline-month">${m}</div>`; lastMonth=m; }
    html+=`<article class="story-item"><div class="story-meta">${e.chapter || "Bölüm"} · ${formatDate(e.date)} · ${e.mood||""}</div><h3>${e.title}</h3><p>${e.body}</p><div class="story-meta">${e.tags||""}${e.song? " · 🎵 "+e.song:""}</div></article>`;
  });
  $("storyList").innerHTML=html || `<div class="empty">Henüz kayıt yok.</div>`;
}
function renderLonging(){
  const d=getData();
  const first=d.entries[0];
  $("memoryToday").innerHTML = first ? `<b>${first.title}</b><p>${first.body.slice(0,170)}...</p><small>${formatDate(first.date)}</small>` : "Geçmişten bir anı henüz yok.";
  const museum=d.entries.filter(e=>e.museum).slice(0,4);
  $("museumPreview").innerHTML = museum.map(e=>`<div class="story-item"><b>${e.title}</b><p>${e.body.slice(0,80)}...</p></div>`).join("") || "Müze ilk eserini bekliyor.";
}
function renderTasks(){
  const d=getData();
  const groups={};
  d.tasks.forEach((t,i)=>{ if(!groups[t.group]) groups[t.group]=[]; groups[t.group].push({...t,i}); });
  $("taskGroups").innerHTML = Object.entries(groups).map(([g,items])=>`<div class="group-title">${g}</div>${items.map(t=>`<div class="task ${t.done?'done':''}" onclick="toggleTask(${t.i})"><span>${t.text}</span><b>${t.done?'✓':'○'}</b></div>`).join("")}`).join("");
}
function toggleTask(i){ const d=getData(); d.tasks[i].done=!d.tasks[i].done; saveData(d); renderAll(); }
function addCustomTask(){ const text=prompt("Görev adı"); if(!text)return; const d=getData(); d.tasks.push({group:"📖 Hikâyem",text,done:false}); saveData(d); renderAll(); }

function renderMe(){ const d=getData(); $("futureSelfText").textContent=d.profile.future; }
function renderChapters(){
  const d=getData();
  $("chapterList").innerHTML=d.chapters.map((c,i)=>`<div class="chapter-item"><small>${i===d.chapters.length-1?'Mevcut Bölüm':'Geçmiş Bölüm'}</small><h2>${c.name}</h2><p>${c.desc||"Henüz yazılmakta olan bölüm."}</p></div>`).join("");
}
function newChapter(){ const name=prompt("Yeni bölüm adı"); if(!name)return; const d=getData(); d.chapters.push({name,desc:"Henüz yazılmamış bir bölüm.",start:new Date().toISOString()}); saveData(d); renderAll(); }

function openCapsule(){ openTab("capsule"); }
function renderCapsules(){
  const d=getData();
  $("capsuleList").innerHTML=d.capsules.map(c=>`<div class="capsule"><b>${c.title}</b><p>${c.body}</p><small>Açılış: ${formatDate(c.openDate)}</small></div>`).join("") || `<div class="empty">Henüz kapsül yok.</div>`;
}
function openChangeLog(){ openTab("change"); }

function openComposer(type){ composerType=type; $("composerTitle").textContent = type==="letter" ? "Mektup Yaz" : type==="milestone" ? "Dönüm Noktası" : "Hikâye Yaz"; $("composer").classList.add("active"); }
function closeComposer(){ $("composer").classList.remove("active"); }
function saveEntry(){
  const d=getData(); const ch=d.chapters[d.chapters.length-1]?.name;
  const title=$("entryTitle").value.trim() || (composerType==="letter"?"Gelecekteki Kendime":"Yeni Hikâye");
  const body=$("entryBody").value.trim();
  if(!body){ alert("Bir satır da olsa yazalım koç."); return; }
  if(composerType==="letter"){
    d.capsules.push({id:Date.now(),title,body,date:new Date().toISOString(),openDate:addYear(),opened:false});
    d.entries.push({id:Date.now()+2,type:"letter",title,body:"Bir zaman kapsülü oluşturuldu.",mood:$("entryMood").value,song:$("entrySong").value,tags:$("entryTags").value,date:new Date().toISOString(),chapter:ch,museum:false});
  } else {
    d.entries.push({id:Date.now(),type:composerType,title,body,mood:$("entryMood").value,song:$("entrySong").value,tags:$("entryTags").value,date:new Date().toISOString(),chapter:ch,museum:composerType==="milestone"});
  }
  saveData(d);
  ["entryTitle","entryBody","entrySong","entryTags"].forEach(id=>$(id).value="");
  closeComposer(); renderAll(); openTab("stories");
}

function openSmokeForm(){ $("smokeSheet").classList.add("active"); $("smokeTime").value = new Date().toTimeString().slice(0,5); }
function closeSmokeForm(){ $("smokeSheet").classList.remove("active"); }
function saveSmoke(){
  const d=getData(); d.smokes.push({id:Date.now(),time:$("smokeTime").value,reason:$("smokeReason").value,note:$("smokeNote").value,date:new Date().toISOString()});
  saveData(d); $("smokeNote").value=""; closeSmokeForm(); renderAll();
}
function renderSmoke(){
  const d=getData();
  $("smokeList").innerHTML=d.smokes.slice(-8).reverse().map(s=>`<div class="story-item"><b>${s.time} · ${s.reason}</b><p>${s.note||"Not yok."}</p></div>`).join("") || `<div class="empty">Henüz kayıt yok.</div>`;
}
