(function(){
var USERS={'1111':{name:'Cashier',role:'cashier'},'2222':{name:'Barista',role:'barista'},'0000':{name:'Owner',role:'owner'}};
var TABS={cashier:['pos','queue'],barista:['queue'],owner:['pos','queue','sales','inventory']};
var LBL={pos:'Order',queue:'Order queue',sales:'Sales',inventory:'Inventory'};
var DEF=[['Espresso','Coffee',80,40],['Americano','Coffee',90,40],['Cafe Latte','Coffee',110,35],['Spanish Latte','Coffee',120,35],['Caramel Macchiato','Coffee',130,30],['Iced Mocha','Coffee',125,30],['Matcha Latte','Non-coffee',130,25],['Milk Tea','Non-coffee',100,30],['Choco Milk','Non-coffee',95,25],['Croffle','Food',95,20],['Cookies','Food',50,30],['Banana Bread','Food',65,12]];
var S=load();
function load(){var s=null;try{s=JSON.parse(localStorage.getItem('gk_state'))}catch(e){}
 return s||{items:DEF.map(function(d,i){return{id:i,name:d[0],cat:d[1],price:d[2],stock:d[3],low:10}}),orders:[],next:1}}
function save(){try{localStorage.setItem('gk_state',JSON.stringify(S))}catch(e){}}
function today(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function day(o){var d=new Date(o.time);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function hm(o){return new Date(o.time).toLocaleTimeString('en-PH',{hour:'2-digit',minute:'2-digit'})}
function no(n){return String(n).padStart(3,'0')}
function peso(n){return '₱'+Number(n).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2})}
function esc(t){return String(t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function toast(m){var t=document.getElementById('toast');t.textContent=m;t.style.display='block';clearTimeout(toast.h);toast.h=setTimeout(function(){t.style.display='none'},2500)}
var user=null,tab='pos',cat='All',cart={},tender='',type='Dine-in',app=document.getElementById('app');
function item(id){return S.items.filter(function(i){return i.id==id})[0]}
function total(){var t=0;for(var k in cart)t+=item(k).price*cart[k];return t}
function canPay(){var t=total();return t>0&&tender!==''&&parseFloat(tender)>=t}

function loginView(msg){
 app.innerHTML='<div class="login"><h1>Gunita Kopi</h1><p>POS and Digital Order Management</p><div class="panel"><label for="pin">Enter staff PIN</label><input id="pin" type="password" inputmode="numeric" autocomplete="off"><p class="err">'+(msg||'')+'</p><button class="pri" id="go">Sign in</button></div></div>';
 var p=document.getElementById('pin');p.focus();
 function go(){var u=USERS[p.value];if(!u)return loginView('PIN not recognized. Try again.');user=u;tab=TABS[u.role][0];render()}
 document.getElementById('go').onclick=go;p.onkeydown=function(e){if(e.key==='Enter')go()}}

function render(){
 if(!user)return loginView();
 var h='<header><h1>Gunita Kopi</h1><span>'+user.name+'</span><button id="out">Sign out</button></header><nav>';
 TABS[user.role].forEach(function(t){h+='<button data-t="'+t+'" class="'+(t===tab?'on':'')+'">'+LBL[t]+(t==='queue'?' ('+S.orders.filter(function(o){return o.status!=='done'}).length+')':'')+'</button>'});
 app.innerHTML=h+'</nav><main>'+(tab==='pos'?posV():tab==='queue'?queueV():tab==='sales'?salesV():invV())+'</main>';
 document.getElementById('out').onclick=function(){user=null;cart={};tender='';render()};
 app.querySelectorAll('nav button').forEach(function(b){b.onclick=function(){tab=b.dataset.t;render()}});
 bind()}

function posV(){
 var cats=['All'].concat(S.items.map(function(i){return i.cat}).filter(function(c,i,a){return a.indexOf(c)===i}));
 var h='<div class="grid"><div><div class="cats">'+cats.map(function(c){return '<button data-c="'+c+'" class="'+(c===cat?'on':'')+'">'+c+'</button>'}).join('')+'</div><div class="menu">';
 S.items.filter(function(i){return cat==='All'||i.cat===cat}).forEach(function(i){
  h+='<button class="item'+(i.stock<=0?' out':'')+'" data-add="'+i.id+'"'+(i.stock<=0?' disabled':'')+'><b>'+esc(i.name)+'</b><span>'+peso(i.price)+'</span><span>'+(i.stock<=0?'Sold out':i.stock+' left')+'</span></button>'});
 h+='</div></div><div class="panel"><h2>Current order</h2>';
 var keys=Object.keys(cart);
 if(!keys.length)h+='<p style="color:var(--mut)">No items yet. Tap a product to add it.</p>';
 keys.forEach(function(k){var i=item(k);h+='<div class="row"><span>'+esc(i.name)+'<br><small>'+peso(i.price*cart[k])+'</small></span><span class="qty"><button data-dec="'+k+'" aria-label="Remove one">−</button> '+cart[k]+' <button data-inc="'+k+'" aria-label="Add one">+</button></span></div>'});
 h+='<div class="tot">Total '+peso(total())+'</div><div class="cats"><button data-ty="Dine-in" class="'+(type==='Dine-in'?'on':'')+'">Dine-in</button><button data-ty="Take-out" class="'+(type==='Take-out'?'on':'')+'">Take-out</button></div>'
  +'<label for="tn">Cash received</label><input id="tn" type="number" min="0" step="1" value="'+esc(tender)+'">'
  +'<div class="tot">Change <span id="chg"></span></div>'
  +'<button class="pri" id="pay" style="width:100%"'+(canPay()?'':' disabled')+'>Complete order</button><button id="clr" style="width:100%;margin-top:6px">Clear</button></div></div>';
 return h}

function chgText(){var el=document.getElementById('chg');if(!el)return;var c=(parseFloat(tender)||0)-total();
 el.textContent=tender===''?'—':c<0?'Short '+peso(-c):peso(c);el.className=tender!==''&&c<0?'neg':'chg'}

function queueV(){
 var o=S.orders.filter(function(o){return o.status!=='done'});
 if(!o.length)return '<div class="panel"><h2>Order queue</h2><p style="color:var(--mut)">No pending orders. New orders appear here after payment.</p></div>';
 return '<div class="tickets">'+o.map(function(x){
  return '<div class="panel tk '+(x.status==='ready'?'ready':'')+'"><h2>#'+no(x.no)+' <span class="tag">'+x.type+'</span></h2>'
  +x.lines.map(function(l){return '<div class="row"><span>'+l.q+' × '+esc(l.n)+'</span></div>'}).join('')
  +'<p><small>'+hm(x)+' · '+(x.status==='ready'?'Ready for pickup':'Preparing')+'</small></p>'
  +(x.status==='new'?'<button class="pri" data-st="'+x.no+'|ready">Mark ready</button>':'<button class="pri" data-st="'+x.no+'|done">Served</button>')+'</div>'}).join('')+'</div>'}

function salesV(){
 var d=today(),os=S.orders.filter(function(o){return day(o)===d});
 var rev=os.reduce(function(a,o){return a+o.total},0),cnt={};
 os.forEach(function(o){o.lines.forEach(function(l){cnt[l.n]=(cnt[l.n]||0)+l.q})});
 var top=Object.keys(cnt).sort(function(a,b){return cnt[b]-cnt[a]});
 var h='<div class="stats"><div class="panel"><b>'+peso(rev)+'</b><span>Sales today</span></div><div class="panel"><b>'+os.length+'</b><span>Orders today</span></div><div class="panel"><b>'+(os.length?peso(rev/os.length):'₱0.00')+'</b><span>Average order</span></div><div class="panel"><b>'+(top[0]?esc(top[0]):'—')+'</b><span>Best seller</span></div></div>';
 h+='<div class="panel"><h2>Daily sales record ('+d+')</h2><div class="wrap"><table><tr><th>Order</th><th>Time</th><th>Items</th><th>Total</th><th>Cash</th><th>Change</th></tr>';
 os.slice().reverse().forEach(function(o){h+='<tr><td>#'+no(o.no)+'</td><td>'+hm(o)+'</td><td>'+o.lines.map(function(l){return l.q+' '+esc(l.n)}).join(', ')+'</td><td>'+peso(o.total)+'</td><td>'+peso(o.cash)+'</td><td>'+peso(o.cash-o.total)+'</td></tr>'});
 if(!os.length)h+='<tr><td colspan="6" style="color:var(--mut)">No sales recorded yet today.</td></tr>';
 return h+'</table></div><p><button id="eod">Download end-of-day summary</button> <button id="rst">Reset demo data</button></p></div>'}

function invV(){
 var low=S.items.filter(function(i){return i.stock<=i.low});
 var h=low.length?'<div class="panel" style="border-color:var(--bad);margin-bottom:16px"><h2 class="low">Low stock: '+low.length+' item'+(low.length>1?'s':'')+'</h2>'+low.map(function(i){return esc(i.name)+' ('+i.stock+' left)'}).join(', ')+'</div>':'';
 h+='<div class="panel"><h2>Inventory</h2><div class="wrap"><table><tr><th>Product</th><th>Price (₱)</th><th>Stock</th><th>Alert at</th><th>Restock</th></tr>';
 S.items.forEach(function(i){h+='<tr><td>'+esc(i.name)+'</td><td><input type="number" min="0" style="width:90px" data-pr="'+i.id+'" value="'+i.price+'" aria-label="Price of '+esc(i.name)+'"></td><td class="'+(i.stock<=i.low?'low':'')+'">'+i.stock+'</td><td>'+i.low+'</td><td><button data-rs="'+i.id+'">+10</button></td></tr>'});
 return h+'</table></div></div>'}

function bind(){
 var q=function(s,f){app.querySelectorAll(s).forEach(f)};
 q('[data-c]',function(b){b.onclick=function(){cat=b.dataset.c;render()}});
 q('[data-ty]',function(b){b.onclick=function(){type=b.dataset.ty;render()}});
 q('[data-add],[data-inc]',function(b){b.onclick=function(){var id=b.dataset.add||b.dataset.inc,i=item(id);if((cart[id]||0)>=i.stock)return toast('Only '+i.stock+' '+i.name+' in stock');cart[id]=(cart[id]||0)+1;render()}});
 q('[data-dec]',function(b){b.onclick=function(){var id=b.dataset.dec;if(--cart[id]<=0)delete cart[id];render()}});
 var tn=document.getElementById('tn');
 if(tn){chgText();tn.oninput=function(){tender=tn.value;chgText();document.getElementById('pay').disabled=!canPay()}}
 var c=document.getElementById('clr');if(c)c.onclick=function(){cart={};tender='';render()};
 var p=document.getElementById('pay');if(p)p.onclick=pay;
 q('[data-st]',function(b){b.onclick=function(){var a=b.dataset.st.split('|');S.orders.forEach(function(o){if(o.no==a[0])o.status=a[1]});save();render()}});
 q('[data-pr]',function(b){b.onchange=function(){item(b.dataset.pr).price=Math.max(0,parseFloat(b.value)||0);save();toast('Price updated')}});
 q('[data-rs]',function(b){b.onclick=function(){item(b.dataset.rs).stock+=10;save();render();toast('Stock added')}});
 var e=document.getElementById('eod');if(e)e.onclick=eod;
 var r=document.getElementById('rst');if(r)r.onclick=function(){if(confirm('Delete all orders and restore default stock?')){try{localStorage.removeItem('gk_state')}catch(x){}S=load();render()}}}

function pay(){
 if(!canPay())return;
 var t=total(),cash=parseFloat(tender);
 var lines=Object.keys(cart).map(function(k){var i=item(k);i.stock-=cart[k];return{n:i.name,q:cart[k],p:i.price}});
 var o={no:S.next++,time:new Date().toISOString(),type:type,lines:lines,total:t,cash:cash,status:'new'};
 S.orders.push(o);save();cart={};tender='';
 var warn=S.items.filter(function(i){return i.stock<=i.low}).length;
 toast('Order #'+no(o.no)+' sent to queue. Change '+peso(cash-t)+(warn?' · '+warn+' low-stock item(s)':''));
 render()}

function eod(){
 var d=today(),os=S.orders.filter(function(o){return day(o)===d}),rev=os.reduce(function(a,o){return a+o.total},0);
 var t='GUNITA KOPI - END OF DAY SUMMARY\nDate: '+d+'\nOrders: '+os.length+'\nTotal sales: '+peso(rev)+'\n\n';
 os.forEach(function(o){t+='#'+no(o.no)+'  '+o.lines.map(function(l){return l.q+' '+l.n}).join(', ')+'  '+peso(o.total)+'\n'});
 t+='\nLow stock: '+(S.items.filter(function(i){return i.stock<=i.low}).map(function(i){return i.name+' ('+i.stock+')'}).join(', ')||'none')+'\n';
 var a=document.createElement('a');a.href='data:text/plain;charset=utf-8,'+encodeURIComponent(t);a.download='gunita-kopi-'+d+'.txt';document.body.appendChild(a);a.click();a.remove()}

render();
})();
