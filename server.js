import express from "express";
import path from "path";
import crypto from "crypto";
import {fileURLToPath} from "url";
import pg from "pg";
const {Pool}=pg;
const __filename=fileURLToPath(import.meta.url),__dirname=path.dirname(__filename);
const app=express(),PORT=process.env.PORT||3000;
app.use(express.json({limit:"1mb"}));
app.use((req,res,next)=>{
 res.set("Cache-Control","no-store");
 res.set("Access-Control-Allow-Origin","*");
 res.set("Access-Control-Allow-Headers","Content-Type, Authorization");
 res.set("Access-Control-Allow-Methods","GET,POST,OPTIONS");
 if(req.method==="OPTIONS")return res.sendStatus(204);
 next();
});
app.use(express.static(path.join(__dirname,"public")));

const courses=[
{id:"ingles-a1",title:"Inglês Essencial A1",category:"Idiomas",hours:40,level:"Iniciante",cover:"https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1400&q=85",description:"Curso introdutório de inglês para comunicação cotidiana, vocabulário, compreensão e pronúncia.",modules:[
{id:"m1",title:"Fundamentos da comunicação",lessons:[
{id:"l1",title:"Apresentação e objetivos",duration:"08:42",description:"Conheça a estrutura do curso e os objetivos de aprendizagem.",quiz:{question:"Qual é o objetivo desta aula?",options:["Conhecer a estrutura do curso","Fazer a prova final","Emitir o certificado"],answer:0}},
{id:"l2",title:"Greetings: cumprimentos",duration:"12:10",description:"Vocabulário essencial para cumprimentos e apresentações."},
{id:"l3",title:"Introductions: apresentações",duration:"11:35",description:"Como dizer nome, origem e informações básicas."},
{id:"l4",title:"Basic vocabulary",duration:"14:20",description:"Palavras e expressões de uso frequente."}]},
{id:"m2",title:"Construção de frases",lessons:[
{id:"l5",title:"Verb to be",duration:"15:05",description:"Uso do verbo to be em frases afirmativas."},
{id:"l6",title:"Pronomes pessoais",duration:"10:25",description:"I, you, he, she, it, we e they."},
{id:"l7",title:"Perguntas e respostas",duration:"13:40",description:"Estruturas simples para conversação."}]},
{id:"m3",title:"Situações práticas",lessons:[
{id:"l8",title:"Daily routine",duration:"12:30",description:"Vocabulário de rotina e hábitos."},
{id:"l9",title:"Numbers, dates and time",duration:"16:00",description:"Números, datas e horários."},
{id:"l10",title:"At the store",duration:"13:15",description:"Frases úteis para compras e atendimento."}]},
{id:"m4",title:"Revisão e avaliação",lessons:[
{id:"l11",title:"Revisão geral",duration:"18:00",description:"Revisão dos principais conteúdos."},
{id:"l12",title:"Avaliação final",duration:"20:00",description:"Avaliação de conclusão.",quiz:{question:"O que libera o certificado?",options:["Conclusão e aprovação","Abrir o curso","Assistir uma aula"],answer:0}}]}]},
{id:"atendimento",title:"Atendimento ao Cliente",category:"Profissionalizantes",hours:30,level:"Básico",cover:"https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=85",description:"Comunicação profissional, relacionamento e técnicas de atendimento.",modules:[{id:"a1",title:"Fundamentos",lessons:[
{id:"a1l1",title:"O papel do atendimento",duration:"09:10",description:"Princípios do atendimento profissional."},
{id:"a1l2",title:"Comunicação clara",duration:"11:20",description:"Como ouvir, compreender e responder melhor."},
{id:"a1l3",title:"Perfil do cliente",duration:"10:15",description:"Necessidades e expectativas."}]}]},
{id:"informatica",title:"Informática Essencial",category:"Tecnologia",hours:35,level:"Iniciante",cover:"https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=85",description:"Fundamentos para uso profissional de computador, internet, arquivos e segurança digital.",modules:[{id:"i1",title:"Fundamentos digitais",lessons:[
{id:"i1l1",title:"Conhecendo o computador",duration:"10:00",description:"Conceitos essenciais."},
{id:"i1l2",title:"Arquivos e pastas",duration:"12:00",description:"Organização de documentos."},
{id:"i1l3",title:"Internet e segurança",duration:"14:00",description:"Navegação e boas práticas."}]}]}
];


// Catálogo inicial ampliado com aulas em vídeo por incorporação de fontes públicas.
courses.push(
{id:"excel-basico",title:"Excel Básico para o Trabalho",category:"Tecnologia",hours:12,level:"Iniciante",cover:"https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=85",description:"Fundamentos de planilhas, fórmulas, gráficos e organização de dados.",modules:[{id:"e1",title:"Primeiros passos",lessons:[{id:"e1l1",title:"Conhecendo o Excel",duration:"Aula em vídeo",description:"Interface, linhas, colunas e primeiros dados.",videoId:"XCaLiP2sKTM"},{id:"e1l2",title:"Fórmulas e funções",duration:"Aula prática",description:"Primeiros cálculos e funções essenciais.",videoId:"XCaLiP2sKTM"},{id:"e1l3",title:"Gráficos e organização",duration:"Aula prática",description:"Criação de gráficos simples e organização da planilha.",videoId:"XCaLiP2sKTM"}]}]},
{id:"marketing-digital",title:"Marketing Digital para Iniciantes",category:"Marketing",hours:10,level:"Iniciante",cover:"https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=85",description:"Fundamentos de presença digital, público, tráfego e conversão.",modules:[{id:"md1",title:"Fundamentos",lessons:[{id:"md1l1",title:"O que é Marketing Digital",duration:"Aula em vídeo",description:"Conceitos e oportunidades no ambiente digital.",videoId:"_Ng6mYya3D8"},{id:"md1l2",title:"Público e nicho",duration:"Aula prática",description:"Como identificar público e nicho.",videoId:"_Ng6mYya3D8"},{id:"md1l3",title:"Tráfego e conversão",duration:"Aula prática",description:"Visão geral de tráfego pago, orgânico e conversão.",videoId:"_Ng6mYya3D8"}]}]},
{id:"empreendedorismo",title:"Empreendedorismo",category:"Negócios",hours:10,level:"Básico",cover:"https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1400&q=85",description:"Mentalidade empreendedora, oportunidades, planejamento e execução.",modules:[{id:"em1",title:"Fundamentos",lessons:[{id:"em1l1",title:"Introdução ao empreendedorismo",duration:"Aula em vídeo",description:"Conceitos fundamentais e perfil empreendedor.",videoId:"swe0zFQKrO4"},{id:"em1l2",title:"Oportunidades",duration:"Aula prática",description:"Identificação de problemas e oportunidades.",videoId:"swe0zFQKrO4"},{id:"em1l3",title:"Planejamento",duration:"Aula prática",description:"Primeiros passos para transformar uma ideia em projeto.",videoId:"swe0zFQKrO4"}]}]},
{id:"powerpoint-basico",title:"PowerPoint Básico",category:"Tecnologia",hours:8,level:"Iniciante",cover:"https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1400&q=85",description:"Crie apresentações profissionais com textos, imagens e organização visual.",modules:[{id:"pp1",title:"Apresentações",lessons:[{id:"pp1l1",title:"Conhecendo o PowerPoint",duration:"Aula em vídeo",description:"Introdução à área de trabalho e aos principais recursos.",videoId:"l_oYQPyjfy0"},{id:"pp1l2",title:"Slides e elementos",duration:"Aula prática",description:"Organização de slides e elementos.",videoId:"l_oYQPyjfy0"},{id:"pp1l3",title:"Apresentação final",duration:"Aula prática",description:"Preparação e finalização de uma apresentação.",videoId:"l_oYQPyjfy0"}]}]},
{id:"atendimento-video",title:"Atendimento ao Cliente — Curso em Vídeo",category:"Profissionalizantes",hours:10,level:"Básico",cover:"https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=85",description:"Curso introdutório de atendimento com aulas em vídeo e atividades.",modules:[{id:"acv1",title:"Atendimento profissional",lessons:[{id:"acv1l1",title:"Introdução ao atendimento",duration:"Aula em vídeo",description:"Princípios do bom atendimento.",videoId:"rMq3JjGfsfQ"},{id:"acv1l2",title:"Comunicação com o cliente",duration:"Aula prática",description:"Comunicação clara e postura profissional.",videoId:"rMq3JjGfsfQ"},{id:"acv1l3",title:"Situações de atendimento",duration:"Aula prática",description:"Como conduzir situações comuns de atendimento.",videoId:"rMq3JjGfsfQ"}]}]}
);


// Trilhas adicionais para deixar o catálogo utilizável desde o primeiro lançamento.
courses.push(
{id:"espanhol-iniciante",title:"Espanhol para Iniciantes",category:"Idiomas",hours:20,level:"Iniciante",cover:"https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1400&q=85",description:"Saudações, apresentações, vocabulário e estruturas básicas para começar a conversar em espanhol.",modules:[{id:"es1",title:"Primeiros passos",lessons:[{id:"es1l1",title:"Saudações e apresentações",duration:"50 min",description:"Saludos, presentaciones e despedidas.",videoId:"Kc10Q1LKrRo",quiz:{question:"Qual expressão é usada para uma saudação?",options:["Hola","Gracias","Adiós"],answer:0}},{id:"es1l2",title:"Vocabulário essencial",duration:"40 min",description:"Palavras e expressões frequentes."},{id:"es1l3",title:"Frases do cotidiano",duration:"45 min",description:"Estruturas simples para comunicação."}]}]},
{id:"frances-iniciante",title:"Francês Básico para Iniciantes",category:"Idiomas",hours:20,level:"Iniciante",cover:"https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1400&q=85",description:"Estruturas básicas, sujeito, verbos e construção de frases em francês.",modules:[{id:"fr1",title:"Estruturas básicas",lessons:[{id:"fr1l1",title:"Estruturas básicas",duration:"Aula em vídeo",description:"Sujeito, verbos e construção de frases.",videoId:"AWAj9BVcTC0",quiz:{question:"Qual é o foco inicial da aula?",options:["Estruturas de frases","Certificado","Prova final"],answer:0}},{id:"fr1l2",title:"Sujeito e verbos",duration:"Aula prática",description:"Construção de frases simples."},{id:"fr1l3",title:"Prática guiada",duration:"Aula prática",description:"Exercícios de construção de frases."}]}]},
{id:"excel-completo",title:"Excel Prático para o Trabalho",category:"Tecnologia",hours:20,level:"Básico",cover:"https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=85",description:"Planilhas, fórmulas, organização e prática de Excel para rotina profissional.",modules:[{id:"ec1",title:"Planilhas na prática",lessons:[{id:"ec1l1",title:"Introdução ao Excel",duration:"Aula em vídeo",description:"Primeiros passos e ambiente do Excel.",videoId:"OV2x8ghwq1M",quiz:{question:"O que é uma planilha?",options:["Um espaço para organizar dados","Um navegador","Um editor de vídeo"],answer:0}},{id:"ec1l2",title:"Organização de dados",duration:"Aula prática",description:"Linhas, colunas e organização."},{id:"ec1l3",title:"Fórmulas essenciais",duration:"Aula prática",description:"Cálculos e funções iniciais."}]}]},
{id:"gestao-pessoas",title:"Gestão de Pessoas",category:"Profissionalizantes",hours:18,level:"Básico",cover:"https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1400&q=85",description:"Liderança, comunicação, equipes e desenvolvimento profissional.",modules:[{id:"gp1",title:"Fundamentos de gestão",lessons:[{id:"gp1l1",title:"Papel do gestor",duration:"Aula",description:"Responsabilidades e competências."},{id:"gp1l2",title:"Comunicação com a equipe",duration:"Aula",description:"Comunicação e alinhamento."},{id:"gp1l3",title:"Desenvolvimento de pessoas",duration:"Aula",description:"Feedback e desenvolvimento.",quiz:{question:"Qual prática ajuda no desenvolvimento da equipe?",options:["Feedback","Ignorar resultados","Evitar comunicação"],answer:0}}]}]},
{id:"marketing-pratico",title:"Marketing Digital Prático",category:"Marketing",hours:18,level:"Básico",cover:"https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?auto=format&fit=crop&w=1400&q=85",description:"Público, conteúdo, redes sociais e fundamentos de conversão.",modules:[{id:"mk1",title:"Estratégia digital",lessons:[{id:"mk1l1",title:"Público e posicionamento",duration:"Aula",description:"Definição de público e posicionamento.",videoId:"_Ng6mYya3D8"},{id:"mk1l2",title:"Conteúdo para redes",duration:"Aula",description:"Planejamento de conteúdo.",videoId:"_Ng6mYya3D8"},{id:"mk1l3",title:"Conversão",duration:"Aula",description:"Noções de conversão.",videoId:"_Ng6mYya3D8",quiz:{question:"O que vem antes de criar uma campanha?",options:["Definir o público","Ignorar o público","Publicar sem objetivo"],answer:0}}]}]},
{id:"empreendedorismo-pratico",title:"Empreendedorismo na Prática",category:"Negócios",hours:18,level:"Básico",cover:"https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1400&q=85",description:"Ideia, oportunidade, planejamento e execução de um pequeno projeto.",modules:[{id:"ep1",title:"Da ideia ao projeto",lessons:[{id:"ep1l1",title:"Ideia e oportunidade",duration:"Aula",description:"Como identificar oportunidades.",videoId:"swe0zFQKrO4"},{id:"ep1l2",title:"Planejamento",duration:"Aula",description:"Primeiros passos do projeto.",videoId:"swe0zFQKrO4"},{id:"ep1l3",title:"Execução",duration:"Aula",description:"Tirando o projeto do papel.",videoId:"swe0zFQKrO4",quiz:{question:"Qual é uma etapa essencial de um projeto?",options:["Planejamento","Improviso permanente","Não definir objetivos"],answer:0}}]}]},
{id:"comunicacao-profissional",title:"Comunicação Profissional",category:"Profissionalizantes",hours:12,level:"Básico",cover:"https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1400&q=85",description:"Comunicação clara, apresentações, escrita profissional e relacionamento.",modules:[{id:"cp1",title:"Comunicação",lessons:[{id:"cp1l1",title:"Comunicação clara",duration:"Aula",description:"Como transmitir mensagens com clareza."},{id:"cp1l2",title:"Falar em público",duration:"Aula",description:"Estrutura e segurança para apresentações."},{id:"cp1l3",title:"Comunicação escrita",duration:"Aula",description:"E-mails e textos profissionais.",quiz:{question:"Qual característica melhora uma comunicação profissional?",options:["Clareza","Confusão","Excesso de ruído"],answer:0}}]}]},
{id:"powerpoint-pratico",title:"PowerPoint para Apresentações",category:"Tecnologia",hours:12,level:"Básico",cover:"https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1400&q=85",description:"Estruture apresentações, organize slides e apresente ideias com clareza.",modules:[{id:"pt1",title:"Slides profissionais",lessons:[{id:"pt1l1",title:"Estrutura do slide",duration:"Aula",description:"Organização visual.",videoId:"l_oYQPyjfy0"},{id:"pt1l2",title:"Texto e imagens",duration:"Aula",description:"Elementos visuais.",videoId:"l_oYQPyjfy0"},{id:"pt1l3",title:"Apresentação final",duration:"Aula",description:"Revisão e apresentação.",videoId:"l_oYQPyjfy0",quiz:{question:"Uma boa apresentação deve ter:",options:["Estrutura e clareza","Texto sem organização","Informação aleatória"],answer:0}}]}]}
);

const flat=c=>c.modules.flatMap(m=>m.lessons.map(l=>({...l,module:m.title})));
const publicCourse=c=>({...c,modules:c.modules.map(m=>({...m,lessons:m.lessons.map(l=>{const {video,...rest}=l;return rest})}))});
const safeUser=u=>({id:u.id,name:u.name,email:u.email,role:u.role||"student"});
const pool=process.env.DATABASE_URL?new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}}):null;
let dbReady=false;
async function db(){
 if(!pool)return false;
 try{
  await pool.query(`
   CREATE TABLE IF NOT EXISTS students(
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    role TEXT NOT NULL DEFAULT 'student',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ALTER TABLE students ADD COLUMN IF NOT EXISTS password_hash TEXT;
   ALTER TABLE students ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'student';
   ALTER TABLE students ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
   CREATE TABLE IF NOT EXISTS progress(
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY(student_id,course_id,lesson_id)
   );
   CREATE TABLE IF NOT EXISTS lesson_state(\n    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,\n    course_id TEXT NOT NULL,\n    lesson_id TEXT NOT NULL,\n    quiz_passed BOOLEAN NOT NULL DEFAULT false,\n    completed BOOLEAN NOT NULL DEFAULT false,\n    updated_at TIMESTAMPTZ DEFAULT NOW(),\n    PRIMARY KEY(student_id,course_id,lesson_id)\n   );\n   CREATE TABLE IF NOT EXISTS notes(
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    lesson_id TEXT NOT NULL,
    note TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY(student_id,lesson_id)
   );
   CREATE TABLE IF NOT EXISTS enrollments(
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY(student_id,course_id)
   );
   CREATE TABLE IF NOT EXISTS certificates(
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id,course_id)
   );
  `);
  dbReady=true;return true;
 }catch(e){console.error("DB:",e.message);return false}
}
const demo={id:"demo",name:"Aluno Multiplay",email:"aluno@multiplay.local",role:"student"};
function hashPassword(password){
  const salt=crypto.randomBytes(16).toString("hex");
  const hash=crypto.scryptSync(password,salt,64).toString("hex");
  return `${salt}:${hash}`;
}
function verifyPassword(password,stored){
  const [salt,hash]=String(stored||"").split(":");
  if(!salt||!hash)return false;
  const derived=crypto.scryptSync(password,salt,64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash,"hex"),Buffer.from(derived,"hex"));
}
const sessions=new Map();
function session(req){const t=req.headers.authorization?.replace("Bearer ","");return t?sessions.get(t):null}
function auth(req,res,next){const s=session(req);if(!s)return res.status(401).json({error:"Faça login para continuar"});req.user=s;next()}
app.get("/api/health",async(_q,r)=>r.json({ok:true,platform:"Multiplay Educação EAD",version:"1.3.0",database:!!pool&&dbReady}));
app.get("/api/courses",(_q,r)=>r.json(courses.map(publicCourse)));
app.get("/api/courses/:id",(q,r)=>{const c=courses.find(x=>x.id===q.params.id);if(!c)return r.status(404).json({error:"Curso não encontrado"});r.json(c)});
app.post("/api/auth/login",async(q,r)=>{
 const {email,password}=q.body||{};
 if(!email||!password)return r.status(400).json({error:"Informe e-mail e senha"});
 if(email==="aluno@multiplay.local"&&password==="123456"){const token=crypto.randomUUID();sessions.set(token,demo);return r.json({token,user:demo,mode:"demo"})}
 if(!pool)return r.status(401).json({error:"Acesso de demonstração: aluno@multiplay.local / 123456"});
 const result=await pool.query("SELECT * FROM students WHERE lower(email)=lower($1)",[email]);
 const u=result.rows[0];if(!u||!u.active||!verifyPassword(password,u.password_hash))return r.status(401).json({error:"E-mail ou senha inválidos"});
 const token=crypto.randomUUID();sessions.set(token,safeUser(u));r.json({token,user:safeUser(u),mode:"database"});
});
app.post("/api/auth/register",async(q,r)=>{
 const {name,email,password}=q.body||{};if(!name||!email||!password)return r.status(400).json({error:"Preencha nome, e-mail e senha"});
 if(!pool)return r.status(503).json({error:"Cadastro será ativado quando o banco do ambiente estiver conectado."});
 await db();try{const x=await pool.query("INSERT INTO students(name,email,password_hash) VALUES($1,$2,$3) RETURNING id,name,email,role",[name,email,hashPassword(password)]);const u=x.rows[0],token=crypto.randomUUID();sessions.set(token,safeUser(u));r.json({token,user:safeUser(u)})}catch(e){r.status(409).json({error:"Este e-mail já está cadastrado."})}
});
app.get("/api/me",auth,async(req,r)=>{
 if(req.user.id==="demo")return r.json(req.user);
 const x=await pool.query("SELECT id,name,email FROM students WHERE id=$1",[req.user.id]);r.json(x.rows[0]);
});
app.get("/api/progress",auth,async(req,r)=>{
 if(req.user.id==="demo")return r.json([]);
 const x=await pool.query("SELECT course_id,lesson_id,completed_at FROM progress WHERE student_id=$1",[req.user.id]);r.json(x.rows);
});
app.post("/api/progress",auth,async(req,r)=>{
 const {courseId,lessonId,quizPassed}=req.body||{};const c=courses.find(x=>x.id===courseId),l=c&&flat(c).find(x=>x.id===lessonId);if(!c||!l)return r.status(404).json({error:"Aula não encontrada"});
 if(!quizPassed)return r.status(400).json({error:"A atividade precisa ser aprovada antes de concluir a aula."});
 if(req.user.id!=="demo"){
  const q=await pool.query("SELECT quiz_passed FROM lesson_state WHERE student_id=$1 AND course_id=$2 AND lesson_id=$3",[req.user.id,courseId,lessonId]);
  if(!q.rows[0]?.quiz_passed)return r.status(400).json({error:"A atividade desta aula ainda não foi aprovada."});
  await pool.query("INSERT INTO progress(student_id,course_id,lesson_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING",[req.user.id,courseId,lessonId]);
  await pool.query("UPDATE lesson_state SET completed=true,updated_at=NOW() WHERE student_id=$1 AND course_id=$2 AND lesson_id=$3",[req.user.id,courseId,lessonId]);
 }
 r.json({ok:true,courseId,lessonId,completed:true});
});
app.get("/api/lesson-state",auth,async(req,r)=>{
 if(req.user.id==="demo")return r.json([]);
 const x=await pool.query("SELECT course_id,lesson_id,quiz_passed,completed,updated_at FROM lesson_state WHERE student_id=$1",[req.user.id]);r.json(x.rows);
});
app.post("/api/lesson-state",auth,async(req,r)=>{
 const {courseId,lessonId,quizPassed}=req.body||{};const c=courses.find(x=>x.id===courseId),l=c&&flat(c).find(x=>x.id===lessonId);if(!c||!l)return r.status(404).json({error:"Aula não encontrada"});
 if(req.user.id==="demo")return r.json({ok:true});
 await pool.query("INSERT INTO lesson_state(student_id,course_id,lesson_id,quiz_passed,updated_at) VALUES($1,$2,$3,$4,NOW()) ON CONFLICT(student_id,course_id,lesson_id) DO UPDATE SET quiz_passed=EXCLUDED.quiz_passed,updated_at=NOW()",[req.user.id,courseId,lessonId,!!quizPassed]);
 r.json({ok:true});
});
app.get("/api/notes/:lessonId",auth,async(req,r)=>{
 if(req.user.id==="demo")return r.json({note:""});
 const x=await pool.query("SELECT note FROM notes WHERE student_id=$1 AND lesson_id=$2",[req.user.id,req.params.lessonId]);r.json({note:x.rows[0]?.note||""});
});
app.post("/api/notes/:lessonId",auth,async(req,r)=>{
 if(req.user.id==="demo")return r.json({ok:true});
 await pool.query("INSERT INTO notes(student_id,lesson_id,note) VALUES($1,$2,$3) ON CONFLICT(student_id,lesson_id) DO UPDATE SET note=EXCLUDED.note,updated_at=NOW()",[req.user.id,req.params.lessonId,String(req.body?.note||"")]);r.json({ok:true});
});
function adminOnly(req,res,next){if(req.user?.role!=="admin")return res.status(403).json({error:"Acesso administrativo necessário"});next()}
app.get("/api/my/enrollments",auth,async(req,r)=>{
  if(req.user.id==="demo")return r.json(courses.map(c=>({courseId:c.id,status:"active"})));
  const x=await pool.query("SELECT course_id,status,enrolled_at FROM enrollments WHERE student_id=$1 ORDER BY enrolled_at DESC",[req.user.id]);
  r.json(x.rows);
});
app.post("/api/my/enrollments",auth,async(req,r)=>{
  const {courseId}=req.body||{};
  if(!courses.some(c=>c.id===courseId))return r.status(404).json({error:"Curso não encontrado"});
  if(req.user.id==="demo")return r.json({ok:true,courseId,status:"active"});
  await pool.query("INSERT INTO enrollments(student_id,course_id) VALUES($1,$2) ON CONFLICT(student_id,course_id) DO UPDATE SET status='active'",[req.user.id,courseId]);
  r.json({ok:true,courseId,status:"active"});
});
app.get("/api/my/history",auth,async(req,r)=>{
 if(req.user.id==="demo")return r.json([]);
 const x=await pool.query("SELECT course_id,lesson_id,completed_at FROM progress WHERE student_id=$1 ORDER BY completed_at DESC",[req.user.id]);
 r.json(x.rows.map(v=>({...v,course:courses.find(c=>c.id===v.course_id)?.title||v.course_id,lesson:flat(courses.find(c=>c.id===v.course_id)||{modules:[]}).find(l=>l.id===v.lesson_id)?.title||v.lesson_id})));
});
app.get("/api/admin/enrollments",auth,adminOnly,async(_q,r)=>{
 const x=await pool.query("SELECT e.student_id,e.course_id,e.status,e.enrolled_at,s.name,s.email FROM enrollments e JOIN students s ON s.id=e.student_id ORDER BY e.enrolled_at DESC");
 r.json(x.rows.map(v=>({...v,course:courses.find(c=>c.id===v.course_id)?.title||v.course_id})));
});
app.get("/api/admin/certificates",auth,adminOnly,async(_q,r)=>{
 const x=await pool.query("SELECT c.id,c.course_id,c.code,c.issued_at,s.name,s.email FROM certificates c JOIN students s ON s.id=c.student_id ORDER BY c.issued_at DESC");
 r.json(x.rows.map(v=>({...v,course:courses.find(c=>c.id===v.course_id)?.title||v.course_id})));
});
app.get("/api/admin/courses",auth,adminOnly,async(_q,r)=>{
 r.json(courses.map(c=>({id:c.id,title:c.title,category:c.category,hours:c.hours,level:c.level,lessons:flat(c).length,modules:c.modules.length})));
});
app.post("/api/admin/login",async(q,r)=>{
  const {email,password}=q.body||{};
  if(!pool)return r.status(503).json({error:"Banco de dados não conectado"});
  const x=await pool.query("SELECT * FROM students WHERE lower(email)=lower($1) AND role='admin' AND active=true",[email||""]);
  const u=x.rows[0];
  if(!u||!verifyPassword(password||"",u.password_hash))return r.status(401).json({error:"Credenciais administrativas inválidas"});
  const token=crypto.randomUUID();sessions.set(token,safeUser(u));r.json({token,user:safeUser(u)});
});
app.get("/api/admin/stats",auth,adminOnly,async(_q,r)=>{
  const [students,enrollments,conclusions]=await Promise.all([
    pool.query("SELECT COUNT(*)::int AS n FROM students WHERE role='student' AND active=true"),
    pool.query("SELECT COUNT(*)::int AS n FROM enrollments WHERE status='active'"),
    pool.query("SELECT COUNT(*)::int AS n FROM certificates")
  ]);
  r.json({courses:courses.length,lessons:courses.reduce((n,c)=>n+flat(c).length,0),students:students.rows[0].n,enrollments:enrollments.rows[0].n,conclusions:conclusions.rows[0].n});
});
app.get("/api/admin/students",auth,adminOnly,async(_q,r)=>{
  const x=await pool.query("SELECT id,name,email,active,created_at FROM students WHERE role='student' ORDER BY created_at DESC");
  r.json(x.rows);
});
app.get("/api/certificates",auth,async(req,r)=>{
 if(req.user.id==="demo")return r.json([]);
 const x=await pool.query("SELECT id,course_id,issued_at,code FROM certificates WHERE student_id=$1 ORDER BY issued_at DESC",[req.user.id]);
 r.json(x.rows.map(row=>({id:row.id,courseId:row.course_id,course:courses.find(c=>c.id===row.course_id)?.title||row.course_id,date:row.issued_at,code:row.code})));
});
app.post("/api/certificates/issue",auth,async(req,r)=>{
 if(req.user.id==="demo")return r.status(400).json({error:"O certificado de demonstração não é emitido no banco"});
 const {courseId}=req.body||{},c=courses.find(x=>x.id===courseId);
 if(!c)return r.status(404).json({error:"Curso não encontrado"});
 const total=flat(c).length;
 const x=await pool.query("SELECT COUNT(*)::int AS n FROM progress WHERE student_id=$1 AND course_id=$2",[req.user.id,courseId]);
 if(Number(x.rows[0].n)<total)return r.status(400).json({error:"Conclua todas as aulas para emitir o certificado"});
 const existing=await pool.query("SELECT id,course_id,issued_at,code FROM certificates WHERE student_id=$1 AND course_id=$2",[req.user.id,courseId]);
 if(existing.rows[0])return r.json(existing.rows[0]);
 const code="MP-"+crypto.randomBytes(6).toString("hex").toUpperCase();
 const y=await pool.query("INSERT INTO certificates(student_id,course_id,code) VALUES($1,$2,$3) RETURNING id,course_id,issued_at,code",[req.user.id,courseId,code]);
 r.json(y.rows[0]);
});
await db();
app.get("/admin",(q,r)=>r.sendFile(path.join(__dirname,"public","admin.html")));
app.get("/{*splat}",(q,r)=>r.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,()=>console.log("Multiplay Educação EAD na porta "+PORT));
