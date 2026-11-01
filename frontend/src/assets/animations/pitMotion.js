import framesUrl from './pit-frames.webp'
import patchUrl from './pit-patch.webp'

// Rendering and timing extracted from assets/loading_motion.html, Final v1.
export function mountPitMotion(canvas, { speed = 1, paused = false, onError } = {}) {
const W=540,H=357,COLS=6,FRAMES=57,OUT=2000/1.5,HOLD_LOGO=0,BACK=2000/1.5,HOLD_DROP=0,CYCLE=OUT+BACK;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{const q=clamp((x-a)/(b-a));return q*q*(3-2*q)};
const ctx=canvas.getContext('2d',{alpha:true});
const layer=document.createElement('canvas');layer.width=W;layer.height=H;const lc=layer.getContext('2d',{alpha:true});
const image=new Image();
const patch=new Image();
const legacy=false;
function drawFrame(n,alpha=1){
  const ix=clamp(n,0,FRAMES-1);
  lc.globalAlpha=alpha;
  // Only frames 44–48 are rebuilt with independently registered glass parts. Original frames are retained
  // for the rest of the animation and for the "기존 모션 비교" mode.
  if(!legacy && ix>=44 && ix<=48 && patch.complete && patch.naturalWidth){
    lc.drawImage(patch,(ix-44)*W,0,W,H,0,0,W,H);
  }else{
    lc.drawImage(image,(ix%COLS)*W,Math.floor(ix/COLS)*H,W,H,0,0,W,H);
  }
  lc.globalAlpha=1;
}
// The shape frames are intentionally unchanged. The early droplet is preserved,
// then seconds 2.0–4.65 are expanded so letter separation does not race ahead.
// Source timestamps refer to the original 3.8 s outward v4.5 morph.
const TEMPO=[
  [0,0],[1700,1700],[2000,1990],[2380,2200],
  [2800,2480],[3400,2950],[4100,3450],[4650,3800]
];
// A monotone cubic Hermite curve: continuous speed across timing landmarks,
// unlike discrete frame holds or abrupt piecewise-linear playback.
const TEMPO_D=TEMPO.map((v,i)=>{
  if(i===0)return (TEMPO[1][1]-v[1])/(TEMPO[1][0]-v[0]);
  if(i===TEMPO.length-1)return (v[1]-TEMPO[i-1][1])/(v[0]-TEMPO[i-1][0]);
  const a=TEMPO[i-1],b=TEMPO[i+1];
  const h0=v[0]-a[0],h1=b[0]-v[0];
  const d0=(v[1]-a[1])/h0,d1=(b[1]-v[1])/h1;
  if(d0*d1<=0)return 0;
  const w0=2*h1+h0,w1=h1+2*h0;
  return (w0+w1)/(w0/d0+w1/d1);
});
function originalClock(ms){
  const x=clamp(ms,0,4650);
  for(let i=0;i<TEMPO.length-1;i++){
    const a=TEMPO[i],b=TEMPO[i+1];
    if(x<=b[0]){
      const h=b[0]-a[0],u=(x-a[0])/h,u2=u*u,u3=u2*u;
      return (2*u3-3*u2+1)*a[1]+(u3-2*u2+u)*h*TEMPO_D[i]
           + (-2*u3+3*u2)*b[1]+(u3-u2)*h*TEMPO_D[i+1];
    }
  }
  return 3800;
}
// At the peak the previous 1 s static-logo hold is gone. A C2-smooth
// terminal time-warp makes shape velocity reach exactly zero, so reversal
// at the turnaround has no speed discontinuity or sudden freeze.
function forwardProgress(t){
  let u=clamp(t/OUT);
  if(u>0.82){
    const a=0.82,x=(u-a)/(1-a),x2=x*x,x3=x2*x;
    const eased=x+4*x3-7*x3*x+3*x3*x2;
    u=a+(1-a)*eased;
  }
  return clamp(originalClock(u*4650)/3800);
}
function progress(ms){
  const t=ms<=OUT?ms:(CYCLE-ms);
  return forwardProgress(t);
}
function glassLighting(seconds,p){
  // All caustics are masked by the very same animated silhouette. No later
  // logo-shaped image, filter or crossfade replaces the original material.
  lc.save();lc.globalCompositeOperation='source-atop';
  const glowX=270+125*Math.sin(seconds*.84+.22),glowY=152+44*Math.cos(seconds*.66);
  let rg=lc.createRadialGradient(glowX-23,glowY-13,2,glowX,glowY,200);
  rg.addColorStop(0,'rgba(255,255,250,.14)');rg.addColorStop(.24,'rgba(239,255,246,.065)');rg.addColorStop(.70,'rgba(84,231,181,.035)');rg.addColorStop(1,'rgba(255,255,255,0)');
  lc.fillStyle=rg;lc.fillRect(0,0,W,H);
  // Slow specular band, visible before and after separation (also during hold).
  const sweep=seconds*38 % (W+360)-180;
  lc.save();lc.translate(sweep,105);lc.rotate(-.28);
  let band=lc.createLinearGradient(-110,0,110,0);
  band.addColorStop(0,'rgba(255,255,255,0)');band.addColorStop(.37,'rgba(255,255,255,.0)');
  band.addColorStop(.5,'rgba(250,255,255,.19)');band.addColorStop(.56,'rgba(240,255,244,.09)');band.addColorStop(1,'rgba(255,255,255,0)');
  lc.fillStyle=band;lc.fillRect(-115,-240,230,650);lc.restore();
  // Small local light pools keep the letter faces luminous when motion settles.
  const w=seconds*1.65;
  for(const [x,y,s,a] of [[173,200,76,.095],[310,226,48,.085],[397,206,68,.075]]){
    const xx=x+11*Math.sin(w+x*.02),yy=y+8*Math.cos(w*.7+y*.013);
    let g=lc.createRadialGradient(xx-8,yy-10,1,xx,yy,s);
    g.addColorStop(0,`rgba(255,255,255,${a})`);g.addColorStop(1,'rgba(255,255,255,0)');
    lc.fillStyle=g;lc.fillRect(xx-s,yy-s,s*2,s*2);
  }
  lc.restore();
}
function draw(ms,seconds){
  if(!image.complete||!image.naturalWidth)return;
  const p=clamp(progress(ms));
  const exact=p*(FRAMES-1),lo=Math.floor(exact),hi=Math.min(FRAMES-1,lo+1),blend=legacy?0:exact-lo;
  lc.clearRect(0,0,W,H);
  if(legacy||hi===lo||blend<=.001){
    drawFrame(legacy?Math.round(exact):lo);
  }else if(exact>=43 && exact<49){
    // Correct alpha interpolation only across repaired frames (43–49).
    // This prevents overlaid semitransparent rims from doubling in intensity.
    drawFrame(lo,1-blend);
    lc.save();lc.globalCompositeOperation='lighter';
    drawFrame(hi,blend);
    lc.restore();
  }else{
    // Preserve v4.3 blending outside the requested fix interval.
    drawFrame(lo);
    drawFrame(hi,blend);
  }
  if(!legacy)glassLighting(seconds,p);
  ctx.clearRect(0,0,W,H);
  if(legacy){ctx.drawImage(layer,0,0);return;}
  // A sub-pixel flow field continues at p=1 instead of suddenly freezing the
  // glass into a flat logo. Single surface texture, single time base for motion.
  const flow=1.3-.35*smooth(.5,1,p);
  const breath=1+.0021*Math.sin(seconds*1.25);
  ctx.save();ctx.translate(W*.5,H*.5);ctx.scale(breath,breath);ctx.translate(-W*.5,-H*.5);
  const strip=3;
  for(let y=0;y<H;y+=strip){
    const h=Math.min(strip,H-y);
    const sx=flow*(.72*Math.sin(y*.044+seconds*2.1)+.38*Math.sin(y*.019-seconds*1.27));
    ctx.drawImage(layer,0,y,W,h,sx,y,W,h);
  }
  ctx.restore();
}

let disposed = false, raf = 0, last = null, playhead = 0;
const media = window.matchMedia('(prefers-reduced-motion: reduce)');
const ready = () => image.naturalWidth && patch.naturalWidth;
function tick(now) {
  if (disposed) return;
  if (last !== null && !paused && !media.matches) {
    playhead = (playhead + Math.min(80, Math.max(0, now-last))*speed) % CYCLE;
  }
  last = now;
  draw(media.matches ? OUT : playhead, media.matches ? 0 : now/1000);
  if (!paused && !media.matches) raf = requestAnimationFrame(tick);
}
function restart() {
  cancelAnimationFrame(raf);
  last = null;
  if (!disposed && ready()) raf = requestAnimationFrame(tick);
}
function failed() { if (!disposed) onError?.(); }
image.onload = patch.onload = restart;
image.onerror = patch.onerror = failed;
media.addEventListener('change', restart);
image.src = framesUrl;
patch.src = patchUrl;
const dispose = () => {
  disposed = true;
  cancelAnimationFrame(raf);
  media.removeEventListener('change', restart);
  image.onload = patch.onload = image.onerror = patch.onerror = null;
};
dispose.update = (options) => { speed = options.speed; paused = options.paused; restart(); };
return dispose;
}
