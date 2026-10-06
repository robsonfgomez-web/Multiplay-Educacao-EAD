const API_BASE="https://multiplay-educacao-ead.onrender.com";
document.documentElement.classList.toggle("capacitor-app",!!window.Capacitor);
const app=document.getElementById("app"),modal=document.getElementById("modal");
const state={
 courses:[],course:null,lesson:null,
 done:JSON.parse(localStorage.getItem("mp_done")||"{}"),
 quizPassed:JSON.parse(localStorage.getItem("mp_quiz_passed")||"{}"),
 notes:{},user:JSON.parse(localStorage.getItem("mp_user")||"null"),
 enrollments:JSON.parse(localStorage.getItem("mp_enrollments")||"[]"),
 history:[],
 token:localStorage.getItem("mp_token")||"",page:"home"
};
const esc=s=>String(s??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
const lessons=c=>c?.modules?.flatMap(m=>m.lessons.map(l=>({...l,module:m.title})))||[];
const pct=c=>{const a=lessons(c);return a.length?Math.round(a.filter(x=>state.done[c.id+"_"+x.id]).length/a.length*100):0};
const key=()=>state.course.id+"_"+state.lesson.id;
const isLocalUser=()=>!!state.user?.local;
const localToken=()=>state.user?.local?state.token:"";
const localAccountKey=(email)=>"mp_local_account_"+String(email||"").trim().toLowerCase();
async function api(url,opt={}){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),7000);
 opt.signal=opt.signal||controller.signal;
 opt.headers={...(opt.headers||{}),...(state.token?{Authorization:"Bearer "+state.token}:{})};
 let r;try{r=await fetch(API_BASE+url,opt)}finally{clearTimeout(timer)}
 const d=await r.json().catch(()=>({}));
 if(!r.ok)throw Error(d.error||"Não foi possível concluir a operação");
 return d;
}
async function init(){
 const authBuild="1.4.0";
 if(localStorage.getItem("mp_auth_gate_version")!==authBuild){
  localStorage.removeItem("mp_token");
  localStorage.removeItem("mp_user");
  localStorage.setItem("mp_auth_gate_version",authBuild);
  state.user=null;state.token="";
 }
 try{const r=await fetch("/courses.json",{cache:"no-store"});state.courses=await r.json()}catch(_){app.innerHTML='<section class="section"><div class="empty">Carregando a plataforma...</div></section>';return}
 if(!state.user){login();return}
 home()}
 try{const c=new AbortController(),t=setTimeout(()=>c.abort(),6000),r=await fetch(API_BASE+"/api/courses",{signal:c.signal,cache:"no-store"});clearTimeout(t);if(r.ok){const d=await r.json();if(Array.isArray(d)&&d.length){state.courses=d;if(state.user)home()}}}catch(_){}
 if(state.token&&!isLocalUser()){
  try{const p=await api("/api/progress");p.forEach(x=>state.done[x.course_id+"_"+x.lesson_id]=true);localStorage.setItem("mp_done",JSON.stringify(state.done))}catch(_){}
  try{const q=await api("/api/lesson-state");q.forEach(x=>state.quizPassed[x.course_id+"_"+x.lesson_id]=!!x.quiz_passed);localStorage.setItem("mp_quiz_passed",JSON.stringify(state.quizPassed))}catch(_){}
  try{const e=await api("/api/my/enrollments");state.enrollments=e.map(x=>x.courseId||x.course_id);localStorage.setItem("mp_enrollments",JSON.stringify(state.enrollments))}catch(_){}
  try{state.history=await api("/api/my/history")}catch(_){state.history=[]}
 }
 updateAccount();
}
function updateAccount(){
 const b=document.getElementById("profileNav"),label=document.getElementById("profileNavLabel");
 if(b){b.onclick=state.user?profile:login;b.classList.toggle("is-user",!!state.user)}
 if(label)label.textContent=state.user?"Perfil":"Entrar";
 document.querySelectorAll(".bottom-item[data-page]").forEach(x=>x.classList.toggle("active",x.dataset.page===state.page));
}
function card(c){
 const p=pct(c),n=lessons(c).length;
 return '<article class="card"><img class="cover" src="'+esc(c.cover)+'" alt=""><div class="card-body"><span class="pill">'+esc(c.category)+'</span><h3>'+esc(c.title)+'</h3><p class="muted">'+esc(c.description)+'</p><div class="meta"><span>'+c.hours+'h</span><span>'+n+' aulas</span><span>'+esc(c.level)+'</span></div><div class="progress" style="margin-top:12px"><i style="width:'+p+'%"></i></div><small class="muted">'+p+'% concluído</small><div style="margin-top:14px"><button class="btn" data-course="'+esc(c.id)+'">'+(p?"Continuar":"Abrir curso")+'</button></div></div></article>'
}
function home(){
 state.page="home";
 const userName=state.user?.name?.split(" ")[0]||"Aluno";
 const languageCourses=state.courses.filter(c=>c.category==="Idiomas");
 const languageCards=languageCourses.slice(0,6).map(c=>'<article class="portal-course portal-language" data-course="'+esc(c.id)+'"><img src="'+esc(c.cover)+'" alt=""><div class="portal-course-name">'+esc(c.title.replace(/^Curso de /i,""))+'</div><span>Básico ao Avançado</span></article>').join("");
 const usedCats=[];
 state.courses.forEach(c=>{if(c.category!=="Idiomas"&&!usedCats.includes(c.category))usedCats.push(c.category)});
 const categoryCards=usedCats.slice(0,6).map(cat=>{const c=state.courses.find(x=>x.category===cat);return '<article class="portal-course category-course" data-course="'+esc(c.id)+'"><img src="'+esc(c.cover)+'" alt=""><div class="portal-course-name">'+esc(cat)+'</div><span>'+esc(c.level||"Básico")+'</span></article>'}).join("");
 const inProgress=state.courses.filter(c=>pct(c)>0).length;
 const completed=state.courses.filter(c=>pct(c)===100).length;
 app.innerHTML='<div class="portal"><section class="portal-top"><div class="portal-brand"><span class="portal-mark">▶</span><div><b>MULTIPLAY</b><span>EDUCAÇÃO</span></div><em>Portal do Estudante</em></div><div class="portal-user"><div class="avatar">'+(userName[0]||"A").toUpperCase()+'</div><div><strong>Olá, '+esc(userName)+'</strong><small>'+(state.user?"Aluno":"Visitante")+'</small></div><span>⌄</span></div></section><section class="portal-hero"><div class="portal-hero-copy"><small>PORTAL DO ESTUDANTE</small><h1>Olá, '+esc(userName)+' 👋</h1><p>Continue sua jornada na Multiplay Educação</p><div class="portal-actions"><button class="btn" data-page="my">▷ CONTINUAR ESTUDANDO</button><button class="portal-dark-btn" data-profile-nav>♙ MEU PERFIL</button></div></div><div class="portal-hero-art"><div class="art-circle"></div><div class="art-laptop">▰</div><div class="art-badge">MULTIPLAY</div></div></section><section class="portal-section"><h2>🚀 Acesso rápido</h2><div class="quick-grid"><button data-page="my"><span>▤</span><b>Meus cursos</b><small>'+inProgress+' curso'+(inProgress===1?"":"s")+' em progresso</small></button><button data-category="Idiomas"><span>◎</span><b>Idiomas</b><small>'+languageCourses.length+' curso'+(languageCourses.length===1?"":"s")+' disponíveis</small></button><button data-page="certs"><span>♜</span><b>Certificados</b><small>'+completed+' certificado'+(completed===1?"":"s")+' emitido'+(completed===1?"":"s")+'</small></button><button data-page="catalog"><span>⌕</span><b>Pesquisar</b><small>Explorar catálogo</small></button></div></section><section class="portal-section"><div class="portal-section-title"><h2>◎ Idiomas <b>GRATUITO</b></h2><button class="portal-see-more" data-category="Idiomas">Ver todos →</button></div><div class="portal-course-row">'+(languageCards||'<div class="empty">Os cursos de idiomas aparecerão aqui.</div>')+'</div></section><section class="portal-section"><div class="portal-section-title"><h2>Outras categorias <span>▦</span></h2><button class="portal-see-more" data-page="catalog">Ver catálogo →</button></div><div class="portal-course-row">'+(categoryCards||'<div class="empty">Catálogo em expansão.</div>')+'</div></section></div>';
 bind();
}function catalog(category=""){
 state.page="catalog";
 app.innerHTML='<section class="section"><div class="section-title"><div><button class="outline catalog-back" data-page="home">← Início</button><h1>Catálogo de cursos</h1><p class="muted">Pesquise por curso, área ou nível.</p></div><button class="outline filter-reset" id="resetFilters">Limpar filtros</button></div><div class="catalog-tools"><input class="field" id="q" placeholder="Buscar curso..." value=""><select class="field" id="cat"><option value="">Todas as áreas</option>'+[...new Set(state.courses.map(c=>c.category))].sort((a,b)=>a.localeCompare(b,"pt-BR")).map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join("")+'</select><select class="field" id="level"><option value="">Todos os níveis</option><option>Iniciante</option><option>Básico</option><option>Intermediário</option><option>Avançado</option></select></div><div class="catalog-summary" id="catalogSummary"></div><div class="grid" id="grid"></div></section>';
 const q=document.getElementById("q"),cat=document.getElementById("cat"),level=document.getElementById("level");cat.value=category;
 const render=()=>{const s=q.value.trim().toLowerCase(),c=cat.value,l=level.value;const items=state.courses.filter(x=>(!s||(x.title+" "+x.category+" "+x.description).toLowerCase().includes(s))&&(!c||x.category===c)&&(!l||x.level===l)).sort((a,b)=>a.title.localeCompare(b.title,"pt-BR"));document.getElementById("catalogSummary").textContent=items.length+" curso"+(items.length===1?"":"s")+" encontrado"+(items.length===1?"":"s");document.getElementById("grid").innerHTML=items.map(card).join("")||'<div class="empty"><h3>Nenhum curso encontrado</h3><p>Altere os filtros ou toque em “Limpar filtros” para ver o catálogo completo.</p></div>';bind()};
 [q,cat,level].forEach(x=>x.oninput=x.onchange=render);
 document.getElementById("resetFilters").onclick=()=>{q.value="";cat.value="";level.value="";render()};
 render();
}
function my(){
 state.page="my";
 const ids=new Set([...state.enrollments,...state.courses.filter(c=>pct(c)>0).map(c=>c.id)]);
 const list=state.courses.filter(c=>ids.has(c.id));
 app.innerHTML='<section class="section"><div class="section-title"><div><h1>Meus cursos</h1><p class="muted">Cursos matriculados e em andamento.</p></div></div>'+ (list.length?'<div class="grid">'+list.map(card).join("")+'</div>':'<div class="empty"><h3>Você ainda não tem cursos aqui.</h3><p>Escolha uma formação no catálogo para começar.</p><button class="btn" data-page="catalog">Explorar cursos</button></div>')+'</section>';
 bind();
}
function library(){
 state.page="library";
 const books=[
  {title:"Comunicação Profissional",type:"E-book",cover:"https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=700&q=85",text:"Comunicação profissional envolve clareza, objetividade, escuta ativa e adaptação da mensagem ao público. Use este material como leitura complementar às aulas da Multiplay."},
  {title:"Aprender e Ensinar",type:"Livro",cover:"https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=700&q=85",text:"Estudar melhor depende de rotina, revisão, prática e organização. Divida o conteúdo em etapas e registre dúvidas durante o estudo."},
  {title:"English Practice",type:"E-book",cover:"https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=700&q=85",text:"Practice English with simple phrases, vocabulary review and short daily exercises. Repeat, read aloud and build confidence gradually."},
  {title:"Gestão e Carreira",type:"Audiobook",cover:"https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=700&q=85",text:"Planeje sua carreira, desenvolva competências e transforme objetivos profissionais em ações concretas."}
 ];
 const render=(type="Todos")=>{
  const items=type==="Todos"?books:books.filter(b=>b.type===type);
  app.innerHTML='<section class="section"><div class="section-title"><div><h1>Biblioteca Multiplay</h1><p class="muted">Materiais complementares para estudar dentro da plataforma.</p></div></div><div class="library-tabs"><button class="'+(type==="Todos"?"btn":"outline")+'" data-libtab="Todos">Todos</button><button class="'+(type==="E-book"?"btn":"outline")+'" data-libtab="E-book">E-books</button><button class="'+(type==="Livro"?"btn":"outline")+'" data-libtab="Livro">Livros</button><button class="'+(type==="Audiobook"?"btn":"outline")+'" data-libtab="Audiobook">Audiobooks</button></div><div class="books">'+items.map((x,i)=>'<article class="book"><img src="'+x.cover+'" alt=""><div class="card-body"><span class="pill">'+x.type+'</span><h3>'+esc(x.title)+'</h3><p class="muted">Material complementar para seus estudos.</p><button class="outline" data-book="'+i+'" data-book-type="'+x.type+'">Abrir material</button></div></article>').join("")+'</div><div id="reader" class="reader" hidden></div></section>';
  document.querySelectorAll("[data-libtab]").forEach(b=>b.onclick=()=>render(b.dataset.libtab));
  document.querySelectorAll("[data-book]").forEach(b=>b.onclick=()=>openMaterial(books.find(x=>x.type===b.dataset.bookType&&items.indexOf(x)>=0)||books.find(x=>x.type===b.dataset.bookType)));
 };
 render();
}
function openMaterial(book){
 const reader=document.getElementById("reader");if(!reader)return;
 reader.hidden=false;
 const audio=book.type==="Audiobook"?'<button class="btn" id="speak">▶ Ouvir este material</button><button class="outline" id="stopSpeak">■ Parar</button>':"";
 reader.innerHTML='<div class="reader-card"><div class="section-title"><div><span class="pill">'+esc(book.type)+'</span><h2>'+esc(book.title)+'</h2></div><button class="outline" id="closeReader">Fechar</button></div><div class="reader-content"><p>'+esc(book.text)+'</p><p>'+esc(book.text)+'</p></div>'+audio+'</div>';
 document.getElementById("closeReader").onclick=()=>{reader.hidden=true;if("speechSynthesis" in window)speechSynthesis.cancel()};
 if(book.type==="Audiobook"&&"speechSynthesis" in window){
  document.getElementById("speak").onclick=()=>speechSynthesis.speak(new SpeechSynthesisUtterance(book.text+" "+book.text));
  document.getElementById("stopSpeak").onclick=()=>speechSynthesis.cancel();
 }
 reader.scrollIntoView({behavior:"smooth",block:"start"});
}function historyPage(){
 state.page="history";
 const rows=state.history.length?state.history:state.courses.flatMap(c=>lessons(c).filter(l=>state.done[c.id+"_"+l.id]).map(l=>({course:c.title,lesson:l.title,completed_at:null})));
 app.innerHTML='<section class="section"><div class="section-title"><div><h1>Histórico</h1><p class="muted">Acompanhe as aulas que você já concluiu.</p></div></div>'+(rows.length?'<div class="history-list">'+rows.map(x=>'<article class="history-item"><div><b>'+esc(x.course||"Curso")+'</b><p class="muted">'+esc(x.lesson||"Aula concluída")+'</p></div><span class="pill">Concluída</span></article>').join("")+'</div>':'<div class="empty">Seu histórico aparecerá aqui depois que você concluir as primeiras aulas.</div>')+'</section>';
 bind();
}
function store(){
 state.page="store";
 app.innerHTML='<section class="section"><div class="section-title"><div><h1>Loja Multiplay</h1><p class="muted">Formações e planos preparados para a próxima etapa da plataforma.</p></div></div><div class="plans"><article class="plan"><span class="pill">BÁSICO</span><h2>Plano Básico</h2><strong>Grátis</strong><p class="muted">Acesso aos cursos liberados para teste.</p><button class="btn" data-page="catalog">Começar</button></article><article class="plan featured"><span class="pill">PREMIUM</span><h2>Multiplay Premium</h2><strong>Em breve</strong><p class="muted">Cursos premium, biblioteca completa e benefícios exclusivos.</p><button class="btn" disabled>Em breve</button></article><article class="plan"><span class="pill">IDIOMAS</span><h2>Clube de Idiomas</h2><strong>Em breve</strong><p class="muted">Inglês, espanhol e novos idiomas em trilhas completas.</p><button class="btn" disabled>Em breve</button></article></div><div class="empty" style="margin-top:20px">Pagamento online e liberação automática serão conectados na etapa comercial, sem ativar cobrança enquanto as credenciais não estiverem configuradas.</div></section>';
 bind();
}
function certs(){
 state.page="certs";const done=state.courses.filter(c=>pct(c)===100);
 app.innerHTML='<section class="section"><h1>Certificados</h1><p class="muted">Conclua todas as aulas e atividades para liberar o certificado.</p>'+(done.length?'<div class="grid">'+done.map(c=>'<article class="card"><div class="card-body"><span class="pill">CONCLUÍDO</span><h3>'+esc(c.title)+'</h3><button class="btn" data-cert="'+esc(c.id)+'">Emitir certificado</button></div></article>').join("")+'</div>':'<div class="empty">Nenhum certificado disponível ainda.</div>')+'</section>';bind();
}
async function certificate(c){
 const name=state.user?.name||"Aluno Multiplay";
 if(state.token&&!isLocalUser()&&state.user?.id!=="demo")try{await api("/api/certificates/issue",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({courseId:c.id})})}catch(e){return alert(e.message)}
 app.innerHTML='<section class="section"><div class="cert"><div class="cert-inner"><p>MULTIPLAY EDUCAÇÃO</p><h1>Certificado de Conclusão</h1><p>Certificamos que</p><h2>'+esc(name)+'</h2><p>concluiu o curso</p><h2>'+esc(c.title)+'</h2><p>Carga horária: '+c.hours+' horas</p><p>'+new Date().toLocaleDateString("pt-BR")+'</p><button class="btn" onclick="window.print()">Imprimir / salvar PDF</button></div></div></section>';
}
async function openCourse(id){
 const localCourse=state.courses.find(c=>c.id===id);
 if(!localCourse)return alert("Curso indisponível no momento");
 state.course=localCourse;
 state.lesson=lessons(localCourse)[0];
 if(!state.enrollments.includes(id)){state.enrollments.push(id);localStorage.setItem("mp_enrollments",JSON.stringify(state.enrollments))}
 course();
 try{
  const remote=await api("/api/courses/"+encodeURIComponent(id));
  if(remote&&remote.id&&Array.isArray(remote.modules)&&remote.modules.length){
   state.course=remote;
   const currentId=state.lesson?.id;
   state.lesson=lessons(remote).find(x=>x.id===currentId)||lessons(remote)[0];
   course();
  }
 }catch(_){}
 if(state.user&&state.token&&!isLocalUser())api("/api/my/enrollments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({courseId:id})}).catch(()=>{});
}
function lessonIndex(){return lessons(state.course).findIndex(x=>x.id===state.lesson.id)}
function quizFor(l){return l.quiz||{question:"Qual foi o principal objetivo desta aula?",options:["Aprender e praticar o conteúdo apresentado","Pular o conteúdo","Emitir o certificado sem estudar"],answer:0}}
function unlocked(l){const all=lessons(state.course),i=all.findIndex(x=>x.id===l.id);if(i<=0)return true;const prev=all[i-1],k=state.course.id+"_"+prev.id;return !!state.done[k]&&!!state.quizPassed[k]}
function course(){
 const c=state.course,l=lessons(c),p=pct(c);
 app.innerHTML='<section class="section"><div class="course-nav"><button class="outline" data-course-back>← Retornar</button><button class="outline" data-exit-course>↩ Cursos</button></div><div class="course-head"><img class="course-cover" src="'+esc(c.cover)+'" alt=""><div><span class="pill">'+esc(c.category)+'</span><h1>'+esc(c.title)+'</h1><p class="muted">'+esc(c.description)+'</p><div class="meta"><span>'+c.hours+' horas</span><span>'+l.length+' aulas</span><span>'+p+'% concluído</span></div><div class="progress" style="margin-top:12px"><i style="width:'+p+'%"></i></div></div></div><div class="classroom"><div><div class="player" id="player"></div><div class="tabs"><button class="active" data-tab="content">Conteúdo</button><button data-tab="quiz">Atividade</button><button data-tab="notes">Anotações</button></div><div class="tabbody" id="tabbody"></div></div><aside class="lessons" id="lessons"></aside></div></section>';
 renderLessons();renderPlayer();renderTab();bind();
}
function renderLessons(){document.getElementById("lessons").innerHTML=state.course.modules.map(m=>'<div class="module">'+esc(m.title)+'</div>'+m.lessons.map(l=>{const d=state.done[state.course.id+"_"+l.id],u=unlocked(l);return '<button class="lesson '+(d?"done ":"")+(state.lesson.id===l.id?"selected ":"")+(u?"":"locked")+'" data-lesson="'+esc(l.id)+'" '+(u?"":"aria-disabled=true")+'><span class="check">'+(d?"✓":"○")+'</span><span><b>'+esc(l.title)+'</b><small class="muted">'+esc(l.duration)+(u?"":" · bloqueada")+'</small></span></button>'}).join("")).join("")}
function renderPlayer(){
 const l=state.lesson,k=state.course.id+"_"+l.id,passed=!!state.quizPassed[k],done=!!state.done[k],i=lessonIndex(),all=lessons(state.course);
 const fallback={"ingles-a1":"S45kHeWnT0M","atendimento":"rMq3JjGfsfQ","informatica":"yPh-n6EeC1I"};
 const vid=l.videoId||fallback[state.course.id];
 const media=vid?'<div class="video-wrap"><iframe src="https://www.youtube-nocookie.com/embed/'+encodeURIComponent(vid)+'?rel=0" title="'+esc(l.title)+'" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>':'<div class="placeholder"><div><b>'+esc(l.title)+'</b><p>Vídeo desta aula ainda será associado. O conteúdo e a atividade estão disponíveis.</p></div></div>';
 const next=i<all.length-1?'<button class="outline lesson-nav-btn" data-next-lesson '+(done&&passed?"":"disabled")+'>Próxima aula →</button>':"";
 const prev=i>0?'<button class="outline lesson-nav-btn" data-prev-lesson>← Aula anterior</button>':"";
 const status=done?"Aula concluída ✓":passed?"Atividade aprovada ✓":"Faça a atividade e acerte a resposta para liberar a conclusão.";
 document.getElementById("player").innerHTML=media+'<div class="player-info"><h2>'+esc(l.title)+'</h2><p class="muted">'+esc(l.description)+'</p><button class="btn" id="complete" '+(done||!passed?"disabled":"")+'>'+(done?"Aula concluída ✓":passed?"Marcar aula como concluída":"Faça a atividade primeiro")+'</button><p class="muted">'+status+'</p><div class="lesson-nav">'+prev+next+"</div></div>";
}
async function renderTab(kind="content"){
 const l=state.lesson,b=document.getElementById("tabbody");
 if(kind==="notes"){
  let note=state.notes[l.id]||"";
  if(state.token&&!isLocalUser())try{note=(await api("/api/notes/"+encodeURIComponent(l.id))).note||"";state.notes[l.id]=note}catch(_){}
  b.innerHTML='<textarea class="field" id="notes" style="min-height:160px" placeholder="Escreva suas anotações...">'+esc(note)+'</textarea><button class="btn" id="saveNote">Salvar anotação</button>';
  document.getElementById("saveNote").onclick=async()=>{const v=document.getElementById("notes").value;state.notes[l.id]=v;localStorage.setItem("note_"+l.id,v);if(state.token&&!isLocalUser())try{await api("/api/notes/"+encodeURIComponent(l.id),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({note:v})})}catch(_){}document.getElementById("saveNote").textContent="Salvo ✓"};
 }else if(kind==="quiz"){
  const q=quizFor(l),passed=!!state.quizPassed[state.course.id+"_"+l.id];
  b.innerHTML='<div class="activity-box"><span class="pill">ATIVIDADE DA AULA</span><h3>'+esc(q.question)+'</h3>'+q.options.map((x,i)=>'<label class="activity-option"><input type="radio" name="q" value="'+i+'"> '+esc(x)+'</label>').join("")+'<button class="btn" id="check">Corrigir atividade</button><p id="result" class="muted">'+(passed?"Atividade aprovada ✓":"")+"</p></div>";
  document.getElementById("check").onclick=async()=>{const v=document.querySelector("input[name=q]:checked"),result=document.getElementById("result");if(!v){result.textContent="Selecione uma resposta.";return}if(+v.value!==q.answer){result.textContent="Resposta incorreta. Tente novamente.";return}state.quizPassed[state.course.id+"_"+l.id]=true;localStorage.setItem("mp_quiz_passed",JSON.stringify(state.quizPassed));if(state.token&&!isLocalUser()&&state.user?.id!=="demo")api("/api/lesson-state",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({courseId:state.course.id,lessonId:l.id,quizPassed:true})}).catch(()=>{});result.textContent="Resposta correta ✓ Agora marque a aula como concluída.";renderPlayer();renderLessons()};
 }else b.innerHTML='<h3>'+esc(l.title)+'</h3><p>'+esc(l.description)+'</p><p class="muted">Assista à aula, faça a atividade e acerte a resposta. Depois marque a aula como concluída para liberar a próxima.</p>';
}
function login(){
 modal.classList.add("show");modal.innerHTML='<div class="modal-box"><h2>Área do aluno</h2><p class="muted">Entre ou crie sua conta.</p><div class="auth-tabs"><button class="btn" id="tabLogin">Entrar</button><button class="outline" id="tabRegister">Criar conta</button></div><div id="authBody"></div></div>';
 const body=document.getElementById("authBody");
 const saveSession=(d)=>{state.token=d.token;state.user=d.user;localStorage.setItem("mp_token",state.token);localStorage.setItem("mp_user",JSON.stringify(state.user));location.reload()};
 const renderLogin=()=>{
  body.innerHTML='<input class="field" id="email" placeholder="E-mail" autocomplete="email"><input class="field" id="password" type="password" placeholder="Senha" autocomplete="current-password"><button class="btn" id="doLogin" style="width:100%">Entrar</button><p class="muted small">Para testar: aluno@multiplay.local / 123456</p><p id="authError" class="error"></p>';
  document.getElementById("doLogin").onclick=async()=>{
   const ev=document.getElementById("email").value.trim().toLowerCase(),pw=document.getElementById("password").value;
   try{
    const d=await api("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:ev,password:pw})});saveSession(d);
   }catch(e){
    if(ev==="aluno@multiplay.local"&&pw==="123456")saveSession({token:"demo-local",user:{id:"demo",name:"Aluno Multiplay",email:ev,role:"student"}});
    else{const raw=localStorage.getItem(localAccountKey(ev));if(raw){const acc=JSON.parse(raw);if(acc.password===pw)saveSession({token:"local-"+crypto.randomUUID(),user:{id:acc.id,name:acc.name,email:acc.email,role:"student",local:true}});else document.getElementById("authError").textContent="E-mail ou senha inválidos";}else document.getElementById("authError").textContent=e.message||"E-mail ou senha inválidos";}
   }
  };
 };
 const renderRegister=()=>{
  body.innerHTML='<input class="field" id="regName" placeholder="Nome completo" autocomplete="name"><input class="field" id="regEmail" placeholder="E-mail" autocomplete="email"><input class="field" id="regPassword" type="password" placeholder="Senha" autocomplete="new-password"><button class="btn" id="doRegister" style="width:100%">Criar conta</button><p class="muted small">Se o servidor estiver indisponível, a conta de teste será salva neste aparelho.</p><p id="authError" class="error"></p>';
  document.getElementById("doRegister").onclick=async()=>{
   const name=document.getElementById("regName").value.trim(),emailValue=document.getElementById("regEmail").value.trim().toLowerCase(),password=document.getElementById("regPassword").value;
   if(name.length<3||!emailValue.includes("@")||password.length<6){document.getElementById("authError").textContent="Informe nome, e-mail válido e senha com pelo menos 6 caracteres.";return}
   try{
    const d=await api("/api/auth/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,email:emailValue,password})});saveSession(d);
   }catch(e){
    const acc={id:"local-"+crypto.randomUUID(),name,email:emailValue,password};localStorage.setItem(localAccountKey(emailValue),JSON.stringify(acc));saveSession({token:"local-"+crypto.randomUUID(),user:{id:acc.id,name:acc.name,email:acc.email,role:"student",local:true}});
   }
  };
 };
 document.getElementById("tabLogin").onclick=renderLogin;document.getElementById("tabRegister").onclick=renderRegister;renderLogin();
}
function profile(){
 modal.classList.add("show");modal.innerHTML='<div class="modal-box"><h2>'+esc(state.user.name)+'</h2><p class="muted">'+esc(state.user.email)+'</p><div class="profile-actions"><button class="btn" id="myProfile">Meus estudos</button><button class="outline" id="logout">Sair</button></div></div>';
 document.getElementById("myProfile").onclick=()=>{modal.classList.remove("show");my()};document.getElementById("logout").onclick=()=>{localStorage.removeItem("mp_token");localStorage.removeItem("mp_user");location.reload()};
}
function bind(){
 document.querySelectorAll("[data-page]").forEach(x=>x.onclick=()=>{const p=x.dataset.page;if(p==="home")home();else if(p==="catalog")catalog();else if(p==="my")my();else if(p==="library")library();else if(p==="history")historyPage();else if(p==="certs")certs();else if(p==="store")store()});
 document.querySelectorAll("[data-profile-nav]").forEach(x=>x.onclick=()=>{state.user?profile():login()});
 document.querySelectorAll("[data-category]").forEach(x=>x.onclick=()=>catalog(x.dataset.category));
 document.querySelectorAll("[data-course]").forEach(x=>x.onclick=()=>openCourse(x.dataset.course));
 document.querySelectorAll("[data-lesson]").forEach(x=>x.onclick=()=>{const t=lessons(state.course).find(l=>l.id===x.dataset.lesson);if(!t)return;if(!unlocked(t)){alert("Aula bloqueada. Conclua a aula anterior e acerte a atividade antes de avançar.");return}state.lesson=t;course()});
 document.querySelectorAll("[data-tab]").forEach(x=>x.onclick=()=>{document.querySelectorAll("[data-tab]").forEach(b=>b.classList.remove("active"));x.classList.add("active");renderTab(x.dataset.tab)});
 document.querySelectorAll("[data-cert]").forEach(x=>x.onclick=()=>certificate(state.courses.find(c=>c.id===x.dataset.cert)));
 document.querySelectorAll("[data-exit-course]").forEach(x=>x.onclick=catalog);
 document.querySelectorAll("[data-course-back]").forEach(x=>x.onclick=()=>{const i=lessonIndex();if(i>0){state.lesson=lessons(state.course)[i-1];course()}else catalog()});
 document.querySelectorAll("[data-book]").forEach(x=>x.onclick=()=>alert("Material: "+x.dataset.book+"\nA biblioteca digital está sendo ampliada nesta versão."));
 const prev=document.querySelector("[data-prev-lesson]");if(prev)prev.onclick=()=>{const a=lessons(state.course),i=lessonIndex();if(i>0){state.lesson=a[i-1];course()}};
 const next=document.querySelector("[data-next-lesson]");if(next)next.onclick=()=>{const a=lessons(state.course),i=lessonIndex(),k=key();if(!state.done[k]||!state.quizPassed[k])return alert("Conclua a aula e faça a atividade corretamente antes de avançar.");if(i<a.length-1){state.lesson=a[i+1];course()}};
 const c=document.getElementById("complete");if(c)c.onclick=async()=>{const k=key();if(!state.quizPassed[k])return alert("Você precisa fazer a atividade e acertar a resposta antes de concluir esta aula.");if(state.done[k])return;try{if(state.token&&!isLocalUser()&&state.user?.id!=="demo")await api("/api/progress",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({courseId:state.course.id,lessonId:state.lesson.id,quizPassed:true})});state.done[k]=true;localStorage.setItem("mp_done",JSON.stringify(state.done));course()}catch(e){alert(e.message)}};
 document.querySelectorAll("[data-history]").forEach(x=>x.onclick=historyPage);
 updateAccount();
}
init().catch(e=>{app.innerHTML='<section class="section"><div class="empty">Não foi possível carregar a plataforma.</div></section>'});
