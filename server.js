const http=require('http'),fs=require('fs'),path=require('path'),{WebSocketServer}=require('ws');
const PUB=path.join(__dirname,'public'),PORT=process.env.PORT||3000;
const MIME={'.html':'text/html;charset=utf-8','.js':'text/javascript'};
const srv=http.createServer((q,r)=>{
  let u='/';try{u=decodeURIComponent(q.url.split('?')[0])}catch{}
  const f=path.join(PUB,u==='/'?'index.html':u);
  if(!f.startsWith(PUB)){r.writeHead(403);return r.end()}
  fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);return r.end('404')}r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'text/plain'});r.end(d)});
});
const wss=new WebSocketServer({server:srv,maxPayload:16384});
const rooms=new Map(),COL=['#ff5555','#55aaff','#ffd24d','#66dd77','#c277ff'];let nid=1;
const send=(c,o)=>c.readyState===1&&c.send(JSON.stringify(o));
const bc=(r,o)=>r.ps.forEach((_,c)=>send(c,o));
const sum=a=>a.reduce((x,y)=>x+y,0),seed=()=>Math.random()*1e9|0;
const cost=(k,l)=>[60,50,40,80][k]*2**l,carCap=r=>6+6*r.up[3];
const st=r=>({t:'st',money:r.money,up:r.up,day:r.day,seed:r.seed,tc:r.trunk.length,tv:sum(r.trunk),taken:[...r.taken],opened:[...r.opened]});
function join(c,r,name,code){
  const used=[...r.ps.values()].map(p=>p.col);
  c.r=r;c.id=nid++;
  r.ps.set(c,{id:c.id,name:String(name||'').slice(0,8)||'ななし',x:150,y:400,col:COL.find(x=>!used.includes(x))});
  send(c,{t:'joined',id:c.id,code});bc(r,st(r));
}
wss.on('connection',c=>{
  c.on('message',raw=>{
    let m;try{m=JSON.parse(raw)}catch{return}
    const r=c.r;
    if(!r){
      if(m.t==='create'){
        if(rooms.size>=200)return send(c,{t:'err',m:'サーバーが混雑中です'});
        let code;do{code=Array.from({length:4},()=>'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.random()*24|0]).join('')}while(rooms.has(code));
        const nr={code,seed:seed(),day:1,money:0,up:[0,0,0,0],trunk:[],taken:new Set(),opened:new Set(),ps:new Map()};
        rooms.set(code,nr);join(c,nr,m.name,code);
      }else if(m.t==='join'){
        const code=String(m.code||'').toUpperCase(),jr=rooms.get(code);
        if(!jr)return send(c,{t:'err',m:'ルームが見つかりません'});
        if(jr.ps.size>=5)return send(c,{t:'err',m:'満員です（最大5人）'});
        join(c,jr,m.name,code);
      }
      return;
    }
    const p=r.ps.get(c);
    switch(m.t){
      case'pos':if(Number.isFinite(m.x)&&Number.isFinite(m.y)){p.x=Math.max(0,Math.min(1400,m.x));p.y=Math.max(0,Math.min(800,m.y))}break;
      case'take':if(typeof m.id==='string'&&/^[0-3]_[0-7]$/.test(m.id)&&r.opened.has(+m.id[0])&&!r.taken.has(m.id)){r.taken.add(m.id);send(c,{t:'got',id:m.id});bc(r,st(r))}break;
      case'open':if([0,1,2,3].includes(m.h)){r.opened.add(m.h);bc(r,st(r))}break;
      case'load':{const v=(Array.isArray(m.v)?m.v:[]).filter(Number.isFinite),n=Math.max(0,Math.min(v.length,carCap(r)-r.trunk.length));r.trunk.push(...v.slice(0,n));send(c,{t:'loaded',n});bc(r,st(r));break}
      case'sell':r.money+=sum(r.trunk);r.trunk=[];bc(r,st(r));break;
      case'buy':{const k=m.k,l=r.up[k];if(l<5&&r.money>=cost(k,l)){r.money-=cost(k,l);r.up[k]++;bc(r,st(r))}break}
      case'newday':r.day++;r.seed=seed();r.taken.clear();r.opened.clear();bc(r,st(r));break;
      case'save':send(c,{t:'save',d:{money:r.money,up:r.up,day:r.day,trunk:r.trunk}});break;
      case'loadsave':{const d=m.d||{};
        if(Number.isFinite(d.money)&&Array.isArray(d.up)&&d.up.length===4&&d.up.every(x=>Number.isInteger(x)&&x>=0&&x<=5)){
          r.money=Math.max(0,d.money|0);r.up=d.up;r.day=Math.max(1,d.day|0);
          r.trunk=(Array.isArray(d.trunk)?d.trunk:[]).filter(Number.isFinite).slice(0,carCap(r));
          r.seed=seed();r.taken.clear();r.opened.clear();bc(r,st(r));
        }break}
    }
  });
  c.on('close',()=>{const r=c.r;if(!r)return;r.ps.delete(c);if(!r.ps.size)rooms.delete(r.code);else bc(r,st(r))});
  c.on('error',()=>{});
});
setInterval(()=>rooms.forEach(r=>bc(r,{t:'p',l:[...r.ps.values()].map(p=>[p.id,p.name,p.x|0,p.y|0,p.col])})),100);
setInterval(()=>wss.clients.forEach(c=>c.ping()),25000);
srv.listen(PORT,()=>console.log('http://localhost:'+PORT));
