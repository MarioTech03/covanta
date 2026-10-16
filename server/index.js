import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'CAMBIA_ESTA_CLAVE_ANTES_DE_PRODUCCION';
fs.mkdirSync(DATA_DIR, { recursive: true });
const initial = {
  users: [], stores: [], orders: [],
  products: [
    {id:'p1',name:'Audífonos inalámbricos',category:'Tecnología',description:'Sonido envolvente y estuche de carga.',price:69900,cost:42000,stock:25,emoji:'🎧',supplier:'Proveedor de demostración'},
    {id:'p2',name:'Mochila urbana',category:'Accesorios',description:'Diseño ligero para el día a día.',price:84900,cost:51000,stock:18,emoji:'🎒',supplier:'Proveedor de demostración'},
    {id:'p3',name:'Botella térmica',category:'Hogar',description:'Mantiene tus bebidas a la temperatura ideal.',price:45900,cost:24000,stock:40,emoji:'🧴',supplier:'Proveedor de demostración'},
    {id:'p4',name:'Lámpara de escritorio LED',category:'Hogar',description:'Iluminación ajustable para tu espacio.',price:62900,cost:36000,stock:12,emoji:'💡',supplier:'Proveedor de demostración'},
    {id:'p5',name:'Reloj minimalista',category:'Accesorios',description:'Estilo sencillo para cualquier ocasión.',price:99900,cost:61000,stock:9,emoji:'⌚',supplier:'Proveedor de demostración'},
    {id:'p6',name:'Soporte para celular',category:'Tecnología',description:'Soporte ajustable para escritorio.',price:29900,cost:12000,stock:50,emoji:'📱',supplier:'Proveedor de demostración'}
  ]
};
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
function readDB(){ return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
function writeDB(db){ fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }
function publicUser(u){ return {id:u.id,name:u.name,email:u.email,username:u.username}; }
function auth(req,res,next){
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i,'');
  try { if(!token) throw new Error('missing'); req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({error:'Inicia sesión para continuar.'}); }
}
const app = express();
app.use(cors({origin: process.env.CLIENT_ORIGIN || true}));
app.use(express.json({limit:'1mb'}));
app.get('/api/health', (_req,res)=>res.json({ok:true,app:'CoVanta API',mode:'MVP'}));
app.get('/api/products', (_req,res)=>res.json(readDB().products));
app.post('/api/auth/register', async (req,res)=>{
  const {name,email,password,username} = req.body || {};
  if(!name?.trim() || !email?.trim() || !password || password.length < 8) return res.status(400).json({error:'Escribe nombre, correo y una contraseña de al menos 8 caracteres.'});
  const db=readDB(), normalized=email.trim().toLowerCase();
  if(db.users.some(u=>u.email===normalized)) return res.status(409).json({error:'Ya existe una cuenta con ese correo.'});
  const user={id:crypto.randomUUID(),name:name.trim(),email:normalized,username:(username||name).trim(),passwordHash:await bcrypt.hash(password,12)};
  db.users.push(user); writeDB(db);
  const token=jwt.sign({id:user.id,email:user.email},JWT_SECRET,{expiresIn:'7d'});
  res.status(201).json({token,user:publicUser(user)});
});
app.post('/api/auth/login', async (req,res)=>{
  const {email,password}=req.body||{}; const db=readDB();
  const user=db.users.find(u=>u.email===String(email||'').trim().toLowerCase());
  if(!user || !(await bcrypt.compare(password||'',user.passwordHash))) return res.status(401).json({error:'Correo o contraseña incorrectos.'});
  const token=jwt.sign({id:user.id,email:user.email},JWT_SECRET,{expiresIn:'7d'});
  res.json({token,user:publicUser(user)});
});
app.get('/api/me',auth,(req,res)=>{const u=readDB().users.find(x=>x.id===req.user.id); if(!u)return res.status(404).json({error:'Cuenta no encontrada.'}); res.json(publicUser(u));});
app.get('/api/store',auth,(req,res)=>res.json(readDB().stores.find(s=>s.ownerId===req.user.id)||null));
app.post('/api/store',auth,(req,res)=>{
  const {name,description,category}=req.body||{};
  if(!name?.trim())return res.status(400).json({error:'El nombre de la tienda es obligatorio.'});
  const db=readDB(); let store=db.stores.find(s=>s.ownerId===req.user.id);
  if(store){store.name=name.trim();store.description=(description||'').trim();store.category=category||'General';}
  else {store={id:crypto.randomUUID(),ownerId:req.user.id,name:name.trim(),description:(description||'').trim(),category:category||'General',createdAt:new Date().toISOString()};db.stores.push(store);}
  writeDB(db);res.json(store);
});
app.post('/api/orders',auth,(req,res)=>{
  const {items,customerName,address,paymentMethod}=req.body||{};
  if(!Array.isArray(items)||!items.length||!customerName?.trim()||!address?.trim())return res.status(400).json({error:'Completa el carrito, el nombre y la dirección de entrega.'});
  const db=readDB(); let total=0; const orderItems=[];
  for(const item of items){const p=db.products.find(x=>x.id===item.productId);const qty=Number(item.quantity);if(!p||!Number.isInteger(qty)||qty<1||qty>p.stock)return res.status(400).json({error:'Un producto ya no está disponible en esa cantidad.'});total+=p.price*qty;orderItems.push({productId:p.id,name:p.name,price:p.price,quantity:qty,emoji:p.emoji});}
  const order={id:crypto.randomUUID(),ownerId:req.user.id,items:orderItems,total,customerName:customerName.trim(),address:address.trim(),paymentMethod:paymentMethod||'Contra entrega (demostración)',status:'Pendiente',createdAt:new Date().toISOString(),paymentStatus:'No procesado'};
  db.orders.unshift(order);writeDB(db);res.status(201).json(order);
});
app.get('/api/orders',auth,(req,res)=>res.json(readDB().orders.filter(o=>o.ownerId===req.user.id)));
app.get('/api/dashboard',auth,(req,res)=>{const db=readDB();const orders=db.orders.filter(o=>o.ownerId===req.user.id);const store=db.stores.find(s=>s.ownerId===req.user.id)||null;res.json({store,orders:orders.length,sales:orders.reduce((n,o)=>n+o.total,0),pending:orders.filter(o=>o.status==='Pendiente').length,products:db.products.length});});
app.use((err,_req,res,_next)=>{console.error(err);res.status(500).json({error:'Ocurrió un error interno.'});});
app.listen(PORT,()=>console.log(`CoVanta API disponible en http://localhost:${PORT}`));
