/* One array drives the stylist cards, the stylist pages and the price picker.
   To add a stylist: copy an entry, set slug + fields, copy stylists/_template.html to stylists/<slug>.html
   and set data-slug on <body>. Set placeholder:false once the content is real. */
window.SHOP={name:'Val Tereska Hair',address:'250 Bobby Jones Expressway, Martinez, GA 30907',hours:'Tue–Fri · message for hours',email:'valtereska6616@gmail.com'};
window.STYLISTS=[
 {slug:'val',name:'Val Tereska',role:'Barber · Stylist · Colorist',accent:'duo',placeholder:false,
  href:'stylists/val.html',
  tags:['Fades & tapers','Women’s cuts','Color','Vivid'],
  bio:'Val is a barber and a stylist. She does men’s cuts and fades, kids, women’s cuts, and color, from natural to full vivid. Message her on Instagram to book.',
  services:[['Men’s haircut','$27'],['Kid cut (0–13)','$22'],['Women’s haircut','$35'],['Head & beard trim','$21'],['Color','from $80'],['Vivid / split dye','from $200']],
  book:{label:'Message Val to book',url:'https://www.instagram.com/valtereskahair/'},
  ig:'valtereskahair',
  badges:['media/logo-barber.webp','media/lady-skull.webp']},
 {slug:'stylist-2',name:'Stylist name — coming soon',role:'Role',accent:'ink',placeholder:true,href:'stylists/_template.html?s=stylist-2',
  tags:['Specialty'],bio:'Bio goes here.',services:[],book:{label:'Book',url:''},ig:'',badges:[]},
 {slug:'stylist-3',name:'Stylist name — coming soon',role:'Role',accent:'ink',placeholder:true,href:'stylists/_template.html?s=stylist-3',
  tags:['Specialty'],bio:'Bio goes here.',services:[],book:{label:'Book',url:''},ig:'',badges:[]}
];
(function(){
'use strict';
var B=document.body.getAttribute('data-base')||'';
var $=function(s){return document.querySelector(s)};
function esc(t){return String(t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function pic(label){return '<div class="pic"><span>'+esc(label||'Photo coming soon')+'</span></div>'}
function card(s){
  var h='<article class="sc '+s.accent+(s.placeholder?' soon':'')+'">'+pic()+'<div class="in"><h3>'+esc(s.name)+'</h3><p class="role">'+esc(s.role)+'</p><div class="chips">'+s.tags.map(function(t){return '<span class="chip">'+esc(t)+'</span>'}).join('')+'</div><div class="btns"><a class="btn line" href="'+B+s.href+'">View profile</a></div></div></article>';
  return h;
}
var g=$('#stylistGrid');
if(g)g.innerHTML=window.STYLISTS.map(card).join('');

/* stylist subpage */
var sp=$('#stylistPage');
if(sp){
  var slug=document.body.getAttribute('data-slug');
  if(slug==='template'){slug=new URLSearchParams(location.search).get('s')||'stylist-2'}
  var s=window.STYLISTS.filter(function(x){return x.slug===slug})[0]||window.STYLISTS[1];
  document.title=(s.placeholder?'Stylist':s.name)+' · Val Tereska Hair';
  var h='<a class="back" href="'+B+'stylists/index.html">‹ All stylists</a>';
  h+='<div class="sp-head">'+pic()+'<div><h1>'+esc(s.name)+'</h1><p class="role">'+esc(s.role)+'</p><div class="bar-a"></div><p>'+esc(s.bio)+'</p>';
  if(s.badges.length)h+='<div class="badges">'+s.badges.map(function(b){return '<img src="'+B+b+'" alt="" width="84" height="84" loading="lazy">'}).join('')+'</div>';
  h+='</div></div>';
  if(s.placeholder)h+='<p class="notice">Template page. Fill this stylist in <code>data.js</code> and this page, the grid and the home page all update.</p>';
  h+='<section><h2>Specialties</h2><div class="chips" style="margin-top:14px">'+s.tags.map(function(t){return '<span class="chip">'+esc(t)+'</span>'}).join('')+'</div></section>';
  if(s.services.length)h+='<section><h2>Services</h2><ul class="sl">'+s.services.map(function(x){return '<li><span>'+esc(x[0])+'</span><b>'+esc(x[1])+'</b></li>'}).join('')+'</ul><p class="sub">Starting prices. Final price depends on the cut.</p></section>';
  h+='<section><h2>Portfolio</h2><div class="pf">'+pic()+pic()+pic()+pic()+'</div></section>';
  h+='<section><h2>Book</h2><div class="btns">';
  h+=s.book.url?'<a class="btn" href="'+esc(s.book.url)+'" rel="noopener">'+esc(s.book.label)+'</a>':'<span class="btn line" aria-disabled="true">Booking link coming soon</span>';
  h+=s.ig?'<a class="btn line" href="https://www.instagram.com/'+esc(s.ig)+'/" rel="noopener">@'+esc(s.ig)+'</a>':'';
  h+='</div><p class="sub">'+esc(window.SHOP.address)+'<br>'+esc(window.SHOP.hours)+'</p></section>';
  sp.innerHTML=h;
  sp.className='sp '+s.accent;
}

/* price picker (first stylist with services; tabs if more than one) */
var pk=$('#pk');
if(pk){
  var who=window.STYLISTS.filter(function(x){return x.services.length});
  function fill(s){
    pk.innerHTML=s.services.map(function(x){return '<li><span class="nm">'+esc(x[0])+'</span><span class="pr">'+esc(x[1])+'</span></li>'}).join('');
    var b=$('#pkBook');if(b&&s.book.url){b.href=s.book.url;b.textContent=s.book.label}
    if(window.initPicker)window.initPicker();
  }
  var tabs=$('#pkTabs');
  if(tabs&&who.length>1){
    tabs.innerHTML=who.map(function(s,i){return '<button type="button" class="tab" aria-pressed="'+(i===0)+'" data-i="'+i+'">'+esc(s.name)+'</button>'}).join('');
    tabs.addEventListener('click',function(e){var t=e.target.closest('.tab');if(!t)return;[].forEach.call(tabs.children,function(c){c.setAttribute('aria-pressed',c===t)});fill(who[+t.getAttribute('data-i')])});
  }
  fill(who[0]);
  window.__pickerReady=true;
}
})();
