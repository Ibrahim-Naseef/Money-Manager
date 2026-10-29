import {neon} from '@neondatabase/serverless';
const sql=neon(process.env.DATABASE_URL);
let ready;
const init=()=>ready||=sql`create table if not exists items(id bigserial primary key,tbl text not null,data jsonb not null default '{}'::jsonb)`;
export default async function handler(req,res){
  try{
    if(process.env.APP_PIN&&req.headers['x-pin']!==process.env.APP_PIN)return res.status(401).json({error:'pin'});
    await init();
    if(req.method==='GET'){const r=await sql`select id,tbl,data from items order by id`;return res.json(r.map(x=>({...x.data,id:+x.id,_t:x.tbl})))}
    const {op,t,id,ids,data}=req.body||{};
    if(op==='add'){const [r]=await sql`insert into items(tbl,data) values(${t},${JSON.stringify(data)}::jsonb) returning id`;return res.json({id:+r.id})}
    if(op==='set'){await sql`update items set data=data||${JSON.stringify(data)}::jsonb where id=${id}`;return res.json({ok:1})}
    if(op==='del'){await sql`delete from items where id=any(${ids}::bigint[])`;return res.json({ok:1})}
    res.status(400).json({error:'bad op'});
  }catch(e){console.error(e);res.status(500).json({error:'db'})}
}
