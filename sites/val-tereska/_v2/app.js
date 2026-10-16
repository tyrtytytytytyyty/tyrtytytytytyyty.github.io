(function(){
'use strict';
var RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var $=function(s,r){return (r||document).querySelector(s)};
var clamp=function(v,a,b){return Math.max(a,Math.min(b,v))};

/* ---------- reveal on scroll ---------- */
(function(){
  var els=[].slice.call(document.querySelectorAll('.rv'));
  if(RM||!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in')});return}
  els.forEach(function(e,i){ if(e.parentNode.classList.contains('menu')){e.style.setProperty('--d',(i%6)*0.07+'s')} });
  var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target)}})},{threshold:.15,rootMargin:'0px 0px -6% 0px'});
  els.forEach(function(e){io.observe(e)});
})();

/* ---------- 3D logo (stacked layers, CSS 3D) + spider ---------- */
(function(){
  var stage=$('#stage'),rig=$('#rig'),front=$('.layer.front'),sheen=$('.sheen'),sp=$('#spider');
  if(!stage||!rig||!front)return;
  var N=10,GAP=2.2;
  front.style.transform='translateZ(0)';
  for(var i=1;i<N;i++){
    var c=front.cloneNode(false);
    c.className='layer';c.removeAttribute('fetchpriority');c.alt='';c.setAttribute('aria-hidden','true');
    c.style.transform='translateZ('+(-i*GAP)+'px)';
    c.style.filter='brightness('+(0.78-0.5*(i/(N-1))).toFixed(2)+')';
    rig.insertBefore(c,sheen);
  }
  if(RM){rig.style.transform='rotateX(6deg) rotateY(-10deg)';if(sp)sp.style.display='none';return}

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

  /* spider */
  var S={on:false,t:0,len:1,p0:null,p1:null,p2:null,pauseAt:0,pauseLeft:0,wait:(location.hash==='#spider'?0:1.2),rot:0,ph:0,x:0,y:0,paused:false};
  function pt(t){var u=1-t;return{x:u*u*S.p0.x+2*u*t*S.p1.x+t*t*S.p2.x,y:u*u*S.p0.y+2*u*t*S.p1.y+t*t*S.p2.y}}
  function rnd(a,b){return a+Math.random()*(b-a)}
  function startSpider(){
    var W=stage.offsetWidth,H=stage.offsetHeight,m=34;
    var side=Math.floor(Math.random()*3),a,b;
    function edge(s){var f=rnd(.15,.85);return s===0?{x:-m,y:f*H}:s===1?{x:W+m,y:f*H}:s===2?{x:f*W,y:-m}:{x:f*W,y:H+m}}
    a=edge(side);b=edge(side===2?Math.floor(Math.random()*2):(Math.random()<.75?(side^1):2));
    S.p0=a;S.p2=b;S.p1={x:rnd(.2,.8)*W,y:rnd(.2,.8)*H};
    S.len=Math.hypot(b.x-a.x,b.y-a.y)*1.15;S.t=0;S.on=true;S.paused=false;
    S.pauseAt=Math.random()<.65?rnd(.3,.65):2;S.pauseLeft=rnd(.9,1.8);
    var q=pt(0);S.x=q.x;S.y=q.y;
    var q2=pt(.02);S.rot=Math.atan2(q2.y-q.y,q2.x-q.x)+Math.PI/2;
    sp.style.opacity=1;
  }
  function stepSpider(dt,now){
    if(!S.on){S.wait-=dt;if(S.wait<=0)startSpider();return}
    var speed=Math.max(36,stage.offsetWidth*.2); /* px/s */
    var moving=true;
    if(S.t>=S.pauseAt&&S.pauseLeft>0){S.paused=true;S.pauseLeft-=dt;moving=false;if(S.pauseLeft<=0){S.paused=false;S.pauseAt=2}}
    if(moving){S.t+=speed*dt/S.len;S.ph+=dt}
    var p=pt(clamp(S.t,0,1)),q=pt(clamp(S.t+.01,0,1));
    S.x=p.x;S.y=p.y;
    var target=Math.atan2(q.y-p.y,q.x-p.x)+Math.PI/2;
    var d=target-S.rot;d=Math.atan2(Math.sin(d),Math.cos(d));S.rot+=d*Math.min(1,dt*6);
    var wob=moving?Math.sin(S.ph*38):Math.sin(now/90)*.35*(Math.sin(now/700)>.4?1:0);
    var sc=1+wob*.07,sk=wob*5;
    sp.style.transform='translate3d('+(S.x-22)+'px,'+(S.y-25)+'px,0) rotate('+S.rot+'rad) skewX('+sk+'deg) scale('+(1/sc)+','+sc+')';
    if(S.t>=1){S.on=false;sp.style.opacity=0;S.wait=rnd(3,6.5)}
  }

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
    if(sp)stepSpider(dt,now);
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
})();
