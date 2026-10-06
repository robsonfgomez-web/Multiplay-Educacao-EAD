import express from "express";
import path from "path";
import crypto from "crypto";
import {fileURLToPath} from "url";
import pg from "pg";
const {Pool}=pg;
const __filename=fileURLToPath(import.meta.url),__dirname=path.dirname(__filename);
const app=express(),PORT=process.env.PORT||3000;
app.use(express.json({limit:"1mb"}));
app.use((req,res,next)=>{res.set("Cache-Control","no-store");next()});
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
   CREATE TABLE IF NOT EXISTS notes(
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
 const {courseId,lessonId}=req.body||{};const c=courses.find(x=>x.id===courseId),l=c&&flat(c).find(x=>x.id===lessonId);if(!c||!l)return r.status(404).json({error:"Aula não encontrada"});
 if(req.user.id!=="demo")await pool.query("INSERT INTO progress(student_id,course_id,lesson_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING",[req.user.id,courseId,lessonId]);
 r.json({ok:true,courseId,lessonId});
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
