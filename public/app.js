const API_BASE="https://multiplay-educacao-ead.onrender.com";
const app=document.getElementById("app"),modal=document.getElementById("modal");
const state={
 courses:[],course:null,lesson:null,
 done:JSON.parse(localStorage.getItem("mp_done")||"{}"),
 quizPassed:JSON.parse(localStorage.getItem("mp_quiz_passed")||"{}"),
 notes:{},user:JSON.parse(localStorage.getItem("mp_user")||"null"),
 token:localStorage.getItem("mp_token")||"",page:"home"
};
const esc=s=>String(s??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
const lessons=c=>c?.modules?.flatMap(m=>m.lessons.map(l=>({...l,module:m.title})))||[];
const pct=c=>{const a=lessons(c);return a.length?Math.round(a.filter(x=>state.done[c.id+"_"+x.id]).length/a.length*100):0};
const key=()=>state.course.id+"_"+state.lesson.id;
async function api(url,opt={}){
 opt.headers={...(opt.headers||{}),...(state.token?{Authorization:"Bearer "+state.token}:{})};
 const r=await fetch(API_BASE+url,opt),d=await r.json().catch(()=>({}));
 if(!r.ok)throw Error(d.error||"Não foi possível concluir a operação");
 return d;
}
async function init(){
 try{const r=await fetch("/courses.json",{cache:"no-store"});state.courses=await r.json();home()}catch(_){app.innerHTML='<section class="section"><div class="empty">Carregando a plataforma...</div></section>'}
 try{const c=new AbortController(),t=setTimeout(()=>c.abort(),6000),r=await fetch(API_BASE+"/api/courses",{signal:c.signal,cache:"no-store"});clearTimeout(t);if(r.ok){const d=await r.json();if(Array.isArray(d)&&d.length){state.courses=d;home()}}}catch(_){}
 if(state.token){
  try{const p=await api("/api/progress");p.forEach(x=>state.done[x.course_id+"_"+x.lesson_id]=true);localStorage.setItem("mp_done",JSON.stringify(state.done))}catch(_){}
  try{const q=await api("/api/lesson-state");q.forEach(x=>state.quizPassed[x.course_id+"_"+x.lesson_id]=!!x.quiz_passed);localStorage.setItem("mp_quiz_passed",JSON.stringify(state.quizPassed))}catch(_){}
 }
 updateAccount();
}
function updateAccount(){const b=document.getElementById("loginBtn");if(b){b.textContent=state.user?state.user.name.split(" ")[0]:"Entrar";b.onclick=state.user?profile:login}}
function card(c){
 const p=pct(c),n=lessons(c).length;
 return '<article class="card"><img class="cover" src="'+esc(c.cover)+'" alt=""><div class="card-body"><span class="pill">'+esc(c.category)+'</span><h3>'+esc(c.title)+'</h3><p class="muted">'+esc(c.description)+'</p><div class="meta"><span>'+c.hours+'h</span><span>'+n+' aulas</span><span>'+esc(c.level)+'</span></div><div class="progress" style="margin-top:12px"><i style="width:'+p+'%"></i></div><small class="muted">'+p+'% concluído</small><div style="margin-top:14px"><button class="btn" data-course="'+esc(c.id)+'">'+(p?"Continuar":"Abrir curso")+'</button></div></div></article>'
}
function home(){
 state.page="home";
 const cats=[...new Set(state.courses.map(c=>c.category))];
 app.innerHTML='<section class="hero"><div class="hero-copy"><span class="eyebrow">MULTIPLAY EDUCAÇÃO · EAD</span><h1>Aprenda no seu ritmo. Evolua na sua carreira.</h1><p>Cursos online, aulas por módulos, atividades, progresso, certificados e biblioteca em uma única plataforma.</p><div class="hero-actions"><button class="btn" data-page="catalog">Explorar cursos</button><button class="outline" data-page="my">Meus estudos</button></div></div></section><section class="section"><div class="section-title"><div><h2>Cursos em destaque</h2><p class="muted">Idiomas, tecnologia, negócios, marketing e formação profissional.</p></div><button class="outline" data-page="catalog">Ver catálogo completo →</button></div><div class="grid">'+state.courses.slice(0,6).map(card).join("")+'</div><div class="category-strip">'+cats.map(x=>'<button class="category-chip" data-category="'+esc(x)+'">'+esc(x)+'</button>').join("")+'</div></section>';
 bind();
}
function catalog(category=""){
 state.page="catalog";
 app.innerHTML='<section class="section"><div class="section-title"><div><h1>Catálogo de cursos</h1><p class="muted">Pesquise por curso, área ou nível.</p></div></div><div class="catalog-tools"><input class="field" id="q" placeholder="Buscar curso..." value=""><select class="field" id="cat"><option value="">Todas as áreas</option>'+[...new Set(state.courses.map(c=>c.category))].sort((a,b)=>a.localeCompare(b,"pt-BR")).map(x=>'<option>'+esc(x)+'</option>').join("")+'</select><select class="field" id="level"><option value="">Todos os níveis</option><option>Iniciante</option><option>Básico</option><option>Intermediário</option><option>Avançado</option></select></div><div class="grid" id="grid"></div></section>';
 const q=document.getElementById("q"),cat=document.getElementById("cat"),level=document.getElementById("level");cat.value=category;
 const render=()=>{const s=q.value.toLowerCase(),c=cat.value,l=level.value;document.getElementById("grid").innerHTML=state.courses.filter(x=>(!s||(x.title+" "+x.category+" "+x.description).toLowerCase().includes(s))&&(!c||x.category===c)&&(!l||x.level===l)).sort((a,b)=>a.title.localeCompare(b.title,"pt-BR")).map(card).join("")||'<div class="empty">Nenhum curso encontrado.</div>';bind()};
 [q,cat,level].forEach(x=>x.oninput=x.onchange=render);render();
}
function my(){
 state.page="my";const list=state.courses.filter(c=>pct(c)>0);
 app.innerHTML='<section class="section"><div class="section-title"><div><h1>Meus cursos</h1><p class="muted">Continue exatamente de onde parou.</p></div></div>'+ (list.length?'<div class="grid">'+list.map(card).join("")+'</div>':'<div class="empty"><h3>Você ainda não iniciou um curso.</h3><p>Escolha uma formação no catálogo para começar.</p><button class="btn" data-page="catalog">Explorar cursos</button></div>')+'</section>';
 bind();
}
function library(){
 state.page="library";
 const books=[
 ["Comunicação Profissional","Leitura complementar","https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=700&q=85"],
 ["Aprender e Ensinar","Metodologias de estudo","https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=700&q=85"],
 ["English Practice","Idiomas","https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=700&q=85"],
 ["Gestão e Carreira","Desenvolvimento profissional","https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=700&q=85"]
 ];
 app.innerHTML='<section class="section"><div class="section-title"><div><h1>Biblioteca Multiplay</h1><p class="muted">Livros, e-books e materiais complementares.</p></div></div><div class="library-tabs"><button class="btn">E-books</button><button class="outline">Livros</button><button class="outline">Audiobooks</button></div><div class="books">'+books.map(x=>'<article class="book"><img src="'+x[2]+'"><div class="card-body"><span class="pill">'+x[1]+'</span><h3>'+x[0]+'</h3><p class="muted">Material complementar para seus estudos.</p><button class="outline" data-book="'+esc(x[0])+'">Abrir material</button></div></article>').join("")+'</div></section>';bind();
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
 if(state.token&&state.user?.id!=="demo")try{await api("/api/certificates/issue",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({courseId:c.id})})}catch(e){return alert(e.message)}
 app.innerHTML='<section class="section"><div class="cert"><div class="cert-inner"><p>MULTIPLAY EDUCAÇÃO</p><h1>Certificado de Conclusão</h1><p>Certificamos que</p><h2>'+esc(name)+'</h2><p>concluiu o curso</p><h2>'+esc(c.title)+'</h2><p>Carga horária: '+c.hours+' horas</p><p>'+new Date().toLocaleDateString("pt-BR")+'</p><button class="btn" onclick="window.print()">Imprimir / salvar PDF</button></div></div></section>';
}
async function openCourse(id){
 try{state.course=await api("/api/courses/"+id)}catch(_){state.course=state.courses.find(c=>c.id===id)}
 if(!state.course)return alert("Curso indisponível no momento");
 state.lesson=lessons(state.course)[0];
 if(state.user&&state.token)try{await api("/api/my/enrollments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({courseId:id})})}catch(_){}
 course();
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
  if(state.token)try{note=(await api("/api/notes/"+encodeURIComponent(l.id))).note||"";state.notes[l.id]=note}catch(_){}
  b.innerHTML='<textarea class="field" id="notes" style="min-height:160px" placeholder="Escreva suas anotações...">'+esc(note)+'</textarea><button class="btn" id="saveNote">Salvar anotação</button>';
  document.getElementById("saveNote").onclick=async()=>{const v=document.getElementById("notes").value;state.notes[l.id]=v;localStorage.setItem("note_"+l.id,v);if(state.token)try{await api("/api/notes/"+encodeURIComponent(l.id),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({note:v})})}catch(_){}document.getElementById("saveNote").textContent="Salvo ✓"};
 }else if(kind==="quiz"){
  const q=quizFor(l),passed=!!state.quizPassed[state.course.id+"_"+l.id];
  b.innerHTML='<div class="activity-box"><span class="pill">ATIVIDADE DA AULA</span><h3>'+esc(q.question)+'</h3>'+q.options.map((x,i)=>'<label class="activity-option"><input type="radio" name="q" value="'+i+'"> '+esc(x)+'</label>').join("")+'<button class="btn" id="check">Corrigir atividade</button><p id="result" class="muted">'+(passed?"Atividade aprovada ✓":"")+"</p></div>";
  document.getElementById("check").onclick=async()=>{const v=document.querySelector("input[name=q]:checked"),result=document.getElementById("result");if(!v){result.textContent="Selecione uma resposta.";return}if(+v.value!==q.answer){result.textContent="Resposta incorreta. Tente novamente.";return}state.quizPassed[state.course.id+"_"+l.id]=true;localStorage.setItem("mp_quiz_passed",JSON.stringify(state.quizPassed));if(state.token&&state.user?.id!=="demo")api("/api/lesson-state",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({courseId:state.course.id,lessonId:l.id,quizPassed:true})}).catch(()=>{});result.textContent="Resposta correta ✓ Agora marque a aula como concluída.";renderPlayer();renderLessons()};
 }else b.innerHTML='<h3>'+esc(l.title)+'</h3><p>'+esc(l.description)+'</p><p class="muted">Assista à aula, faça a atividade e acerte a resposta. Depois marque a aula como concluída para liberar a próxima.</p>';
}
function login(){
 modal.classList.add("show");modal.innerHTML='<div class="modal-box"><h2>Área do aluno</h2><p class="muted">Entre ou crie sua conta.</p><div class="auth-tabs"><button class="btn" id="tabLogin">Entrar</button><button class="outline" id="tabRegister">Criar conta</button></div><div id="authBody"></div></div>';
 const body=document.getElementById("authBody");
 const renderLogin=()=>{body.innerHTML='<input class="field" id="email" placeholder="E-mail" value="aluno@multiplay.local"><input class="field" id="password" type="password" placeholder="Senha" value="123456"><button class="btn" id="doLogin" style="width:100%">Entrar</button><p class="muted small">Demonstração: aluno@multiplay.local / 123456</p><p id="authError" class="error"></p>';document.getElementById("doLogin").onclick=async()=>{try{let d;try{d=await api("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:email.value,password:password.value})})}catch(_){if(email.value==="aluno@multiplay.local"&&password.value==="123456")d={token:"demo-local",user:{id:"demo",name:"Aluno Multiplay",email:"aluno@multiplay.local",role:"student"}};else throw new Error("E-mail ou senha inválidos")}state.token=d.token;state.user=d.user;localStorage.setItem("mp_token",state.token);localStorage.setItem("mp_user",JSON.stringify(state.user));location.reload()}catch(e){document.getElementById("authError").textContent=e.message}}};
 const renderRegister=()=>{body.innerHTML='<input class="field" id="regName" placeholder="Nome completo"><input class="field" id="regEmail" placeholder="E-mail"><input class="field" id="regPassword" type="password" placeholder="Senha"><button class="btn" id="doRegister" style="width:100%">Criar conta</button><p id="authError" class="error"></p>';document.getElementById("doRegister").onclick=async()=>{try{const d=await api("/api/auth/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:regName.value,email:regEmail.value,password:regPassword.value})});state.token=d.token;state.user=d.user;localStorage.setItem("mp_token",state.token);localStorage.setItem("mp_user",JSON.stringify(state.user));location.reload()}catch(e){document.getElementById("authError").textContent=e.message}}};
 document.getElementById("tabLogin").onclick=renderLogin;document.getElementById("tabRegister").onclick=renderRegister;renderLogin();
}
function profile(){
 modal.classList.add("show");modal.innerHTML='<div class="modal-box"><h2>'+esc(state.user.name)+'</h2><p class="muted">'+esc(state.user.email)+'</p><div class="profile-actions"><button class="btn" id="myProfile">Meus estudos</button><button class="outline" id="logout">Sair</button></div></div>';
 document.getElementById("myProfile").onclick=()=>{modal.classList.remove("show");my()};document.getElementById("logout").onclick=()=>{localStorage.removeItem("mp_token");localStorage.removeItem("mp_user");location.reload()};
}
function bind(){
 document.querySelectorAll("[data-page]").forEach(x=>x.onclick=()=>{const p=x.dataset.page;if(p==="home")home();else if(p==="catalog")catalog();else if(p==="my")my();else if(p==="library")library();else if(p==="certs")certs();else if(p==="store")store()});
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
 const c=document.getElementById("complete");if(c)c.onclick=async()=>{const k=key();if(!state.quizPassed[k])return alert("Você precisa fazer a atividade e acertar a resposta antes de concluir esta aula.");if(state.done[k])return;try{if(state.token&&state.user?.id!=="demo")await api("/api/progress",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({courseId:state.course.id,lessonId:state.lesson.id,quizPassed:true})});state.done[k]=true;localStorage.setItem("mp_done",JSON.stringify(state.done));course()}catch(e){alert(e.message)}};
 updateAccount();
}
init().catch(e=>{app.innerHTML='<section class="section"><div class="empty">Não foi possível carregar a plataforma.</div></section>'});
