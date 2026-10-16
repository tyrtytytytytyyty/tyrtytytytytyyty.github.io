(function(){
'use strict';
var RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var $=function(s,r){return (r||document).querySelector(s)};
var clamp=function(v,a,b){return Math.max(a,Math.min(b,v))};

/* ---------- reveal on scroll ---------- */
(function(){
  var els=[].slice.call(document.querySelectorAll('.rv'));
  if(RM||!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in')});return}
  els.forEach(function(e,i){  });
  var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target)}})},{threshold:.15,rootMargin:'0px 0px -6% 0px'});
  els.forEach(function(e){io.observe(e)});
})();

/* ---------- 3D logo (stacked layers, CSS 3D) ---------- */
(function(){
  var stage=$('#stage'),rig=$('#rig'),front=$('.layer.front');
  if(!stage||!rig||!front)return;
  var N=10,GAP=2.2;
  front.style.transform='translateZ(0)';
  for(var i=1;i<N;i++){
    var c=front.cloneNode(false);
    c.className='layer';c.removeAttribute('fetchpriority');c.alt='';c.setAttribute('aria-hidden','true');
    c.style.transform='translateZ('+(-i*GAP)+'px)';
    c.style.filter='brightness('+(0.78-0.5*(i/(N-1))).toFixed(2)+')';
    rig.appendChild(c);
  }
  if(RM){rig.style.transform='rotateX(6deg) rotateY(-10deg)';return}

  var tx=0,ty=0,cx=0,cy=0,oriOn=false,base=null,px=0,py=0,visible=true,t0=performance.now();
  function onOri(e){
    if(e.beta==null||e.gamma==null)return;
    if(!base)base={b:e.beta,g:e.gamma};
    oriOn=true;
    ty=clamp((e.gamma-base.g)*0.45,-16,16);
    tx=clamp(-(e.beta-base.b)*0.45,-14,14);
  }
  function enableOri(){
    if(typeof DeviceOrientationEvent==='undefined')return;
    if(typeof DeviceOrientationEvent.requestPermission==='function'){
      var go=function(){DeviceOrientationEvent.requestPermission().then(function(r){if(r==='granted')addEventListener('deviceorientation',onOri)}).catch(function(){});};
      addEventListener('touchend',go,{once:true});
    }else addEventListener('deviceorientation',onOri);
  }
  enableOri();
  stage.addEventListener('pointermove',function(e){
    if(e.pointerType==='touch'&&oriOn)return;
    var r=stage.getBoundingClientRect();
    py=clamp(((e.clientX-r.left)/r.width-.5)*2,-1,1);px=clamp(((e.clientY-r.top)/r.height-.5)*2,-1,1);
  });
  stage.addEventListener('pointerleave',function(){px=py=0});

  var last=performance.now();
  function frame(now){
    requestAnimationFrame(frame);
    if(!visible)return;
    var dt=Math.min(.05,(now-last)/1000);last=now;
    var t=(now-t0)/1000;
    if(!oriOn){
      var sc=clamp(scrollY/400,0,1);
      ty=py*12+Math.sin(t*.7)*7;
      tx=-px*9+Math.cos(t*.55)*3.5+sc*8;
    }
    cx+=(tx-cx)*Math.min(1,dt*6);cy+=(ty-cy)*Math.min(1,dt*6);
    rig.style.transform='rotateX('+cx.toFixed(2)+'deg) rotateY('+cy.toFixed(2)+'deg)';
  }
  if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;last=performance.now()}).observe(stage);
  document.addEventListener('visibilitychange',function(){last=performance.now()});
  requestAnimationFrame(frame);
})();

/* ---------- before/after slider ---------- */
(function(){
  var win=$('#baWin'),track=$('#baTrack');if(!win)return;
  var pairs=[].slice.call(track.children),n=pairs.length,cur=0,dotsEl=$('#baDots'),dots=[];
  pairs.forEach(function(p,i){
    var b=document.createElement('button');b.type='button';b.className='dot';b.setAttribute('aria-label','Pair '+(i+1));
    b.addEventListener('click',function(){go(i)});dotsEl.appendChild(b);dots.push(b);
    var bar=$('.bar',p);
    setP(p,50);
    bar.addEventListener('pointerdown',function(e){
      e.stopPropagation();bar.setPointerCapture(e.pointerId);
      var mv=function(ev){var r=win.getBoundingClientRect();setP(p,clamp((ev.clientX-r.left)/r.width*100,0,100))};
      var up=function(){bar.removeEventListener('pointermove',mv);bar.removeEventListener('pointerup',up);bar.removeEventListener('pointercancel',up)};
      bar.addEventListener('pointermove',mv);bar.addEventListener('pointerup',up);bar.addEventListener('pointercancel',up);
      mv(e);
    });
    bar.addEventListener('keydown',function(e){
      var v=getP(p);
      if(e.key==='ArrowLeft'){setP(p,clamp(v-5,0,100));e.preventDefault()}
      if(e.key==='ArrowRight'){setP(p,clamp(v+5,0,100));e.preventDefault()}
    });
  });
  function getP(p){return parseFloat(p.style.getPropertyValue('--p'))||50}
  function setP(p,v){p.style.setProperty('--p',v+'%');$('.bar',p).setAttribute('aria-valuenow',Math.round(v))}
  function go(i){
    cur=(i+n)%n;track.style.transform='translateX('+(-cur*100)+'%)';
    dots.forEach(function(d,k){d.classList.toggle('on',k===cur)});
    pairs.forEach(function(p,k){$('.bar',p).tabIndex=k===cur?0:-1});
  }
  $('#baPrev').addEventListener('click',function(){go(cur-1)});
  $('#baNext').addEventListener('click',function(){go(cur+1)});
  /* swipe to change pair (anywhere except the divider handle) */
  var sx=0,sy=0,dx=0,active=false,locked=false,tt=0;
  win.addEventListener('pointerdown',function(e){
    if(e.target.closest('.bar'))return;
    active=true;locked=false;sx=e.clientX;sy=e.clientY;dx=0;tt=e.timeStamp;
    track.classList.add('drag');win.setPointerCapture(e.pointerId);
  });
  win.addEventListener('pointermove',function(e){
    if(!active)return;dx=e.clientX-sx;
    if(!locked&&Math.abs(e.clientY-sy)>Math.abs(dx)+6&&Math.abs(dx)<8){return}
    locked=true;
    var w=win.offsetWidth,off=-cur*w+dx;
    track.style.transform='translateX('+off+'px)';
  });
  function end(e){
    if(!active)return;active=false;track.classList.remove('drag');
    var w=win.offsetWidth,v=dx/Math.max(1,e.timeStamp-tt);
    if(dx<-w*.2||v<-.45)go(cur+1);else if(dx>w*.2||v>.45)go(cur-1);else go(cur);
  }
  win.addEventListener('pointerup',end);win.addEventListener('pointercancel',end);
  go(0);
})();

/* ---------- wheel carousel ---------- */
(function(){
  var wheel=$('#wheel');if(!wheel)return;
  var tiles=[].slice.call(wheel.children),n=tiles.length,pos=0,W=wheel.offsetWidth,raf=0;
  var vel=0,drag=false,lx=0,lt=0,moved=0,mode='idle',target=0,lastT=0;
  function render(){
    var step=W*.36;
    for(var i=0;i<n;i++){
      var d=i-pos;d=d-n*Math.round(d/n);
      var a=Math.abs(d),s=Math.max(.5,1-.26*a),x=Math.sign(d)*step*Math.pow(a,.82);
      var o=a<=1?1-.42*a:Math.max(0,.58-.58*(a-1));
      var t=tiles[i];
      t.style.transform='translate3d('+x.toFixed(1)+'px,0,0) scale('+s.toFixed(3)+')';
      t.style.opacity=o.toFixed(2);
      t.style.zIndex=String(100-Math.round(a*10));
      t.style.visibility=o<=0?'hidden':'visible';
    }
  }
  function tick(now){
    var dt=Math.min(.05,(now-lastT)/1000||.016);lastT=now;
    if(mode==='coast'){
      pos+=vel*dt;vel*=Math.exp(-2.8*dt);
      if(Math.abs(vel)<.6){mode='snap';target=Math.round(pos+vel*.25)}
    }else if(mode==='snap'){
      pos+=(target-pos)*(1-Math.exp(-11*dt));
      if(Math.abs(target-pos)<.002){pos=target;mode='idle'}
    }
    render();
    if(mode!=='idle'||drag)raf=requestAnimationFrame(tick);else raf=0;
  }
  function kick(){if(!raf){lastT=performance.now();raf=requestAnimationFrame(tick)}}
  wheel.addEventListener('pointerdown',function(e){
    drag=true;moved=0;lx=e.clientX;lt=e.timeStamp;vel=0;mode='idle';wheel.classList.add('grab');wheel.setPointerCapture(e.pointerId);
  });
  wheel.addEventListener('pointermove',function(e){
    if(!drag)return;
    var dx=e.clientX-lx,dtm=Math.max(1,e.timeStamp-lt);moved+=Math.abs(dx);
    var di=-dx/(W*.36);pos+=di;
    var inst=di/(dtm/1000);vel=vel*.6+inst*.4;
    lx=e.clientX;lt=e.timeStamp;kick();
  });
  function up(e){
    if(!drag)return;drag=false;wheel.classList.remove('grab');
    if(moved<6){ /* tap: snap to tapped tile */
      var el=document.elementFromPoint(e.clientX,e.clientY),t=el&&el.closest&&el.closest('.wt'),i=tiles.indexOf(t);
      if(i>=0){var d=i-pos;d=d-n*Math.round(d/n);target=pos+d;mode='snap'}else{target=Math.round(pos);mode='snap'}
    }else if(e.timeStamp-lt>90||Math.abs(vel)<.8){target=Math.round(pos);mode='snap'}
    else mode='coast';
    kick();
  }
  wheel.addEventListener('pointerup',up);wheel.addEventListener('pointercancel',up);
  wheel.tabIndex=0;
  wheel.addEventListener('keydown',function(e){
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'){target=Math.round(pos)+(e.key==='ArrowRight'?1:-1);mode='snap';kick();e.preventDefault()}
  });
  addEventListener('resize',function(){W=wheel.offsetWidth;render()});
  render();
})();
/* ---------- services picker (vertical wheel) ---------- */
(function(){
  var pk=$('#pk');if(!pk)return;
  var items=[].slice.call(pk.children),H=72,raf=0;
  function paint(){
    raf=0;var c=pk.scrollTop+pk.clientHeight/2;
    items.forEach(function(li){
      var d=((li.offsetTop+H/2)-c)/H;
      var a=Math.min(Math.abs(d),3),sg=d<0?-1:1;
      li.style.transform='rotateX('+(-sg*a*24).toFixed(1)+'deg) scale('+(1.1-.2*a).toFixed(3)+')';
      li.style.opacity=Math.max(.12,1-.38*a).toFixed(2);
    });
  }
  function q(){if(!raf)raf=requestAnimationFrame(paint)}
  pk.addEventListener('scroll',q,{passive:true});
  items.forEach(function(li,i){li.addEventListener('click',function(){pk.scrollTo({top:i*H,behavior:'smooth'})})});
  addEventListener('resize',q);
  paint();
})();
})();
