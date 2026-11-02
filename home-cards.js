(function(){
"use strict";
var rm=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
function watch(el,cb){ if(!("IntersectionObserver" in window)){cb(true);return}
  new IntersectionObserver(function(e){cb(e[0].isIntersecting)},{threshold:.1}).observe(el)}

/* ---------- 1. spinning 3D ascii "e" (algorithm from /e/index.html) ---------- */
function initE(){
  var pre=document.getElementById("hc-e-pre"); if(!pre)return;
  var stops=[[255,77,0],[255,138,0],[255,196,0],[255,228,92]],at=[0,.35,.7,1],NK=16;
  function col(t){t=Math.max(0,Math.min(1,t));for(var i=1;i<4;i++)if(t<=at[i]){var k=(t-at[i-1])/(at[i]-at[i-1]),a=stops[i-1],b=stops[i];return[0,1,2].map(function(j){return Math.round(a[j]+(b[j]-a[j])*k)})}return stops[3]}
  var css="";for(var q=0;q<NK;q++)css+=".hc-e pre .k"+q+"{color:rgb("+col(q/(NK-1)).join()+")}";
  var st=document.createElement("style");st.textContent=css;document.head.appendChild(st);
  var RAMP=".,-~:;=+x!*#$@",COLS=44,ROWS=24,ASP=0.6,SC=10.16,CAM=4.2,E=null;
  function buildE(){
    var S=256,c=document.createElement("canvas");c.width=c.height=S;var g=c.getContext("2d");
    g.fillStyle="#000";g.fillRect(0,0,S,S);g.fillStyle="#fff";g.textAlign="center";g.textBaseline="alphabetic";
    g.font='italic 300px "Instrument Serif", Georgia, "Times New Roman", serif';g.fillText("e",S/2,S*0.80);
    var d=g.getImageData(0,0,S,S).data,x0=S,y0=S,x1=0,y1=0,x,y;
    for(y=0;y<S;y++)for(x=0;x<S;x++)if(d[(y*S+x)*4]>128){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
    var bw=x1-x0+1,bh=y1-y0+1,R=70,m=Math.max(bw,bh),cs=m/R,GW=Math.ceil(bw/cs),GH=Math.ceil(bh/cs);
    var A=[];for(y=0;y<GH;y++){A.push(new Float32Array(GW));for(x=0;x<GW;x++){var s=0,n=0;
      for(var yy=0;yy<cs;yy+=1)for(var xx=0;xx<cs;xx+=1){var px=Math.floor(x0+x*cs+xx),py=Math.floor(y0+y*cs+yy);if(px<S&&py<S){s+=d[(py*S+px)*4]/255;n++}}
      A[y][x]=n?s/n:0}}
    function at2(a,x,y){return(x<0||y<0||x>=GW||y>=GH)?0:a[y][x]}
    var B=A.map(function(r,y){return r.map(function(_,x){var s=0;for(var j=-1;j<=1;j++)for(var i=-1;i<=1;i++)s+=at2(A,x+i,y+j);return s/9})});
    var P=[],N=[],T=0.55,L=22,half=GW/2,halfh=GH/2,u=2/Math.max(GW,GH);
    for(y=0;y<GH;y++)for(x=0;x<GW;x++){if(A[y][x]<.5)continue;
      var wx=(x-half)*u,wy=-(y-halfh)*u;
      var gx=at2(B,x+1,y)-at2(B,x-1,y),gy=at2(B,x,y+1)-at2(B,x,y-1);
      var edge=A[y][x]>=.5&&(at2(A,x-1,y)<.5||at2(A,x+1,y)<.5||at2(A,x,y-1)<.5||at2(A,x,y+1)<.5);
      var gl=Math.hypot(gx,gy)||1;
      var tilt=Math.min(1,Math.hypot(gx,gy)*3);
      [[1,T/2],[-1,-T/2]].forEach(function(f){var nz=f[0]*(1-tilt*.6),nx=-gx/gl*tilt*.6,ny=gy/gl*tilt*.6,nl=Math.hypot(nx,ny,nz);
        P.push(wx,wy,f[1]);N.push(nx/nl,ny/nl,nz/nl)});
      if(edge){for(var k=1;k<L;k++){var z=(k/L-.5)*T;P.push(wx,wy,z);var nx2=-gx/gl,ny2=gy/gl;N.push(nx2,ny2,0)}}
    }
    E={p:new Float32Array(P),n:new Float32Array(N),len:P.length/3};
  }
  var LX=-0.35,LY=0.5,LZ=0.8,ll=Math.hypot(LX,LY,LZ);LX/=ll;LY/=ll;LZ/=ll;
  function frame(ay,ax){
    var zb=new Float32Array(COLS*ROWS).fill(-1e9),ch=new Int8Array(COLS*ROWS).fill(-1),lm=new Float32Array(COLS*ROWS);
    var cy=Math.cos(ay),sy=Math.sin(ay),cx=Math.cos(ax),sx=Math.sin(ax),p=E.p,n=E.n;
    for(var i=0;i<E.len;i++){
      var px=p[i*3],py=p[i*3+1],pz=p[i*3+2],nx=n[i*3],ny=n[i*3+1],nz=n[i*3+2];
      var x1=px*cy+pz*sy,z1=-px*sy+pz*cy,nx1=nx*cy+nz*sy,nz1=-nx*sy+nz*cy;
      var y2=py*cx-z1*sx,z2=py*sx+z1*cx,ny2=ny*cx-nz1*sx,nz2=ny*sx+nz1*cx;
      if(nz2<=0)continue;
      var k=CAM/(CAM-z2),col_=Math.round(COLS/2+x1*SC*k/ASP),row=Math.round(ROWS/2-y2*SC*k);
      if(col_<0||col_>=COLS||row<0||row>=ROWS)continue;
      var id=row*COLS+col_;if(z2<=zb[id])continue;zb[id]=z2;
      var l=Math.max(0,nx1*LX+ny2*LY+nz2*LZ);ch[id]=1;lm[id]=l}
    var out="",run="",rc=-1,id2=0;
    for(var r=0;r<ROWS;r++){for(var c=0;c<COLS;c++){id2=r*COLS+c;
      if(ch[id2]<0){if(run){out+=run+"</b>";run="";rc=-1}out+=" ";continue}
      var l2=Math.min(1,lm[id2]*1.1),idx=Math.min(RAMP.length-1,Math.floor(l2*RAMP.length)),kk=Math.min(NK-1,Math.floor(l2*NK)),chr=RAMP[idx];
      if(kk!==rc){if(run)out+=run+"</b>";run='<b class="k'+kk+'">';rc=kk}
      run+=chr}
      if(run){out+=run+"</b>";run="";rc=-1}out+="\n"}
    return out}
  function fit(){var box=pre.parentNode,w=box.clientWidth-12,h=box.clientHeight-8;
    pre.style.fontSize=Math.max(5,Math.min(w/(COLS*0.6),h/ROWS,14))+"px"}
  function start(){
    try{buildE()}catch(err){pre.textContent="e";return}
    fit();var FY=-0.12,FX=0.18,raf=0,t0=0,vis=false,last=0;
    function paint(ay,ax){pre.innerHTML=frame(ay,ax)}
    function tick(now){raf=0;if(!vis)return;raf=requestAnimationFrame(tick);if(now-last<33)return;last=now;if(!t0)t0=now;var s=(now-t0)/1000;
      paint(FY+s*0.55,FX+Math.sin(s*.5)*.08)}   /* 0.55 rad/s = ~11.4 s per turn */
    paint(FY,FX);
    if(!rm)watch(pre,function(v){vis=v;if(v&&!raf)raf=requestAnimationFrame(tick)});
    var lw=innerWidth;addEventListener("resize",function(){if(innerWidth!==lw){lw=innerWidth;fit()}});
  }
  if(document.fonts&&document.fonts.load){Promise.race([document.fonts.load('italic 300px "Instrument Serif"','e'),new Promise(function(r){setTimeout(r,1500)})]).then(start,start)}else start();
}

/* ---------- 2. GymBuddy phone mock (copy from gymbuddy-fx.js THREADS) ---------- */
function initPhone(){
  var th=document.getElementById("hc-thread"); if(!th)return;
  var MSGS=[["out","bench 185 for 5"],["in","▲ Logged: bench press, 185 × 5. That's set 1."],["out","how's my bench looking?"],["in","▲ Trending up. 175 × 5 three weeks ago, 180 × 5 last week, 185 × 5 today — all from sets you logged."]];
  function add(k,t){var el=document.createElement("div");el.className="hc-m hc-"+k;el.textContent=t;th.appendChild(el);requestAnimationFrame(function(){requestAnimationFrame(function(){el.classList.add("in")})});return el}
  if(rm){MSGS.forEach(function(m){add(m[0],m[1]).classList.add("in")});return}
  var run=0,vis=false,playing=false;
  function wait(ms){return new Promise(function(r){setTimeout(r,ms)})}
  async function play(){
    if(playing)return;playing=true;var id=++run;
    while(vis&&id===run){
      th.replaceChildren();await wait(500);
      for(var i=0;i<MSGS.length;i++){
        if(!vis||id!==run){playing=false;return}
        var m=MSGS[i];
        if(m[0]==="in"){var ty=document.createElement("div");ty.className="hc-m hc-typ in";ty.innerHTML="<i></i><i></i><i></i>";th.appendChild(ty);await wait(800);ty.remove()}
        add(m[0],m[1]);await wait(m[0]==="out"?650:1700);
      }
      await wait(3200);
    }
    playing=false;
  }
  watch(document.getElementById("hc-phone"),function(v){vis=v;if(v)play();else run++});
}

/* ---------- 3. Second Brain: Three.js knowledge graph ---------- */
function initGraph(){
  var box=document.getElementById("hc-graph"); if(!box)return;
  try{
    if(!window.THREE)throw new Error("no three");
    var w=box.clientWidth||320,h=box.clientHeight||240;
    var r=new THREE.WebGLRenderer({antialias:true,alpha:true});
    if(!r.getContext())throw new Error("no gl");
    r.setPixelRatio(Math.min(devicePixelRatio||1,2));r.setSize(w,h);
    var sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(50,w/h,.1,100);cam.position.z=9;
    var grp=new THREE.Group();sc.add(grp);
    var seed=7;function rnd(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646}
    var N=44,pts=[],i,j;
    for(i=0;i<N;i++){ /* fibonacci sphere with jitter */
      var y=1-2*(i+.5)/N,rad=Math.sqrt(1-y*y),th=i*2.399963,k=3.1+rnd()*.9;
      pts.push(new THREE.Vector3(Math.cos(th)*rad*k,y*k*.9,Math.sin(th)*rad*k))}
    var hi={3:1,12:1,21:1,30:1,38:1};
    var nodeG=new THREE.SphereGeometry(.11,12,12);
    var mBase=new THREE.MeshBasicMaterial({color:0x9a9aa8}),mHi=new THREE.MeshBasicMaterial({color:0xFFB020});
    pts.forEach(function(p,i){var m=new THREE.Mesh(nodeG,hi[i]?mHi:mBase);m.position.copy(p);if(hi[i])m.scale.setScalar(2);grp.add(m)});
    var lp=[],hp=[];
    for(i=0;i<N;i++){var d=[];for(j=0;j<N;j++)if(i!==j)d.push([pts[i].distanceTo(pts[j]),j]);
      d.sort(function(a,b){return a[0]-b[0]});
      for(var n=0;n<2;n++){var jj=d[n][1];if(jj<i&&n>0)continue;var tgt=(hi[i]||hi[jj])?hp:lp;tgt.push(pts[i].x,pts[i].y,pts[i].z,pts[jj].x,pts[jj].y,pts[jj].z)}}
    function lines(a,c,o){var g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(a,3));grp.add(new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:c,transparent:true,opacity:o})))}
    lines(lp,0x6c6c7c,.45);lines(hp,0xFFB020,.85);
    r.domElement.setAttribute("aria-hidden","true");
    var img=box.querySelector("img");
    box.appendChild(r.domElement);r.domElement.style.cssText="position:absolute;inset:0;width:100%;height:100%";
    if(img)img.style.display="none";
    function draw(){r.render(sc,cam)}
    grp.rotation.x=.3;grp.rotation.y=.6;draw();
    if(!rm){var raf=0,vis=false,t0=0;
      var L=function(now){raf=0;if(!vis)return;raf=requestAnimationFrame(L);if(!t0)t0=now;var s=(now-t0)/1000;grp.rotation.y=.6+s*.18;grp.rotation.x=.3+Math.sin(s*.25)*.12;draw()};
      watch(box,function(v){vis=v;if(v&&!raf)raf=requestAnimationFrame(L)})}
    addEventListener("resize",function(){var w2=box.clientWidth,h2=box.clientHeight;if(!w2||!h2)return;r.setSize(w2,h2);cam.aspect=w2/h2;cam.updateProjectionMatrix();draw()});
  }catch(err){
    var im=box.querySelector("img");if(im)im.style.display="";
  }
}
function go(){initE();initPhone();initGraph()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",go);else go();
})();
