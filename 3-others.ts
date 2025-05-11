type VideoSave = { curr: null | { src: string; mime?: string; t: number; }; };

class MyVideo {
  root = document.createElement('video');
  finished = Promise.resolve();
  curr: null | { src: string; mime?: string; resolve: () => void; reject: () => void; } = null;
  constructor() {
    Object.assign(this.root, { autoplay: true, controls: true });
    Object.assign(this.root.style, G.whStyle, G.videoStyle);
    this.root.addEventListener('ended', () => this.cancel(true));
    this.root.addEventListener('click', (ev) => ev.stopPropagation());
    this.cancel();
  }
  cancel(finish?: boolean) {
    if (finish) this.curr?.resolve();
    else this.curr?.reject();
    this.curr = null;
    this.root.style.display = 'none';
    this.root.pause();
  }
  play(src: string, mime?: string) {
    this.cancel();
    this.finished = new Promise((resolve, reject) => {
      this.curr = { src, mime, resolve, reject };
      this.root.style.display = 'block';
      if (mime) this.root.innerHTML = `<source src="${src}" type="${mime}"/>`;
      else this.root.innerHTML = `<source src="${src}" />`;
      this.root.load();
    });
  }
  load(s: VideoSave) {
    this.cancel();
    if (s.curr) {
      this.play(s.curr.src, this.curr?.mime);
      this.root.currentTime = s.curr.t;
    }
  }
  save(): VideoSave {
    return { curr: this.curr && { src: this.curr.src, mime: this.curr.mime, t: this.root.currentTime } };
  }
}

type ChanSave = { src: null | string; loop: boolean; time: number; gain: number; fade: ChanFadeSave; };
type ChanFadeSave = null | { durSec: number; target: number; };

class MySoundChan {
  private ctx: AudioContext;
  private gainNode: GainNode;
  private audioEle = new Audio();
  private nextFade: ChanFadeSave = null;
  private lastTarget = { endTime: 0, target: 1 };
  private cancelEvName = 'can-' + Math.random().toString(16).substring(2);
  private finishEvName = 'fin-' + Math.random().toString(16).substring(2);
  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.audioEle.autoplay = true;
    this.gainNode = ctx.createGain();
    this.audioEle.addEventListener('play', () => {
      const g = this.gainNode.gain;
      if (this.nextFade) {
        this.fade(this.nextFade.durSec, this.nextFade.target);
        this.nextFade = null;
      }
    });
    ctx.createMediaElementSource(this.audioEle).connect(this.gainNode).connect(ctx.destination);
  }
  cancel(finish?: boolean) {
    this.audioEle.pause();
    this.audioEle.dispatchEvent(new Event(finish ? this.finishEvName : this.cancelEvName));
    this.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
    this.gainNode.gain.value = 1;
    this.nextFade = null;
  }
  play(src: string, loop?: boolean, fadeInSec?: number) {
    this.cancel();
    if (fadeInSec) {
      this.nextFade = { durSec: fadeInSec, target: 1 };
      this.gainNode.gain.value = 0;
    }
    this.audioEle.loop = loop || false;
    this.audioEle.src = src;
    this.audioEle.load();
  }
  fade(durSec: number, target: number) {
    this.lastTarget = { endTime: this.ctx.currentTime + durSec, target };
    const g = this.gainNode.gain;
    const v = g.value;
    g.cancelScheduledValues(this.ctx.currentTime);
    g.value = v;
    g.linearRampToValueAtTime(target, this.lastTarget.endTime);
  }
  async wait() {
    const e = this.audioEle;
    if (e.loop || e.paused) return Promise.resolve();
    return new Promise<void>((res, rej) => {
      const a = new AbortController();
      e.addEventListener(this.cancelEvName, () => rej(a.abort()), { once: true, signal: a.signal });
      e.addEventListener(this.finishEvName, () => res(a.abort()), { once: true, signal: a.signal });
      e.addEventListener('ended', () => res(a.abort()), { once: true, signal: a.signal });
    });
  }
  load(s: ChanSave) {
    this.cancel();
    if (s.src) this.play(s.src, s.loop);
    this.audioEle.currentTime = s.time;
    if (s.fade) this.nextFade = s.fade;
    this.gainNode.gain.value = s.gain;
  }
  save(): ChanSave {
    const fade = this.ctx.currentTime < this.lastTarget.endTime && {
      durSec: this.lastTarget.endTime - this.ctx.currentTime,
      target: this.lastTarget.target
    };
    return {
      src: this.audioEle.getAttribute('src'),
      loop: this.audioEle.loop,
      time: this.audioEle.currentTime,
      gain: this.gainNode.gain.value,
      fade: fade || null
    };
  }
}

class MySound {
  static SE = 0;
  static VO = 1;
  static BGM = 2;
  ctx = new AudioContext();
  chan = [0, 1, 2].map(() => new MySoundChan(this.ctx));
  play(i: number, src: string, loop?: boolean, fadeInMil?: number) {
    this.chan[i].play(src, loop, fadeInMil && fadeInMil / 1000);
  }
  cancel(i: number, finish?: boolean) {
    this.chan[i].cancel(finish);
  }
  fade(i: number, durMil: number, target: number) {
    this.chan[i].fade(durMil / 1000, target / 100);
  }
  async wait(i: number) {
    return this.chan[i].wait();
  }
  load(s: ChanSave[]) {
    this.chan.forEach((c) => c.cancel());
    this.chan.forEach((c, i) => i < s.length && c.load(s[i]));
  }
  save(): ChanSave[] {
    return this.chan.map((c) => c.save());
  }
}

type MyChoice = { text: string; label: string; };
type ChoiceSave = { sels: null | MyChoice[]; };

class ChoiceWindow {
  root = document.createElement('div');
  curr: null | MyChoice[] = null;
  result = Promise.reject<string>("don't worry, this is just an initial value");
  private btns = [0, 1, 2, 3, 4, 5].map(() => document.createElement('div'));
  private prom: null | { resolve: (v: string) => void; reject: () => void; } = null;
  constructor() {
    this.root.style.position = 'absolute';
    const c = 'cls-' + Math.random().toString(16).substring(2);
    this.root.appendChild(document.createElement('style')).innerText = G.choiceStyle(c);
    this.btns.forEach((d) => (this.root.appendChild(d).className = c));
    this.btns.forEach((e, i) => {
      e.onclick = (ev) => {
        ev.stopPropagation(); // fix a yuri immediate skip
        this.onclick(e.dataset.label || null);
      };
    });
    this.cancelChoice();
  }
  loadRes(fs: MyFS) {
    this.btns.forEach((e, i) => Object.assign(e.style, G.chBtnStyle(fs)));
  }
  private cancelChoice() {
    this.root.style.display = 'none';
    this.btns.forEach((e) => (e.style.display = 'none'));
    this.prom?.reject();
    this.prom = null;
    this.curr = null;
  }
  private onclick(label: null | string) {
    if (label) {
      this.prom?.resolve(label);
      this.prom = null;
    }
    this.cancelChoice();
  }
  showChoice(sels: MyChoice[]) {
    this.cancelChoice();
    if (sels.length == 0) return;
    this.curr = sels = sels.slice(0, Math.min(sels.length, this.btns.length));
    sels.forEach(({ text, label }, i) => {
      Object.assign(this.btns[i].style, G.chBtnPos(i, sels.length));
      this.btns[i].style.display = 'block';
      this.btns[i].dataset.label = label;
      this.btns[i].innerText = text;
    });
    this.result = new Promise((resolve, reject) => (this.prom = { resolve, reject }));
    this.root.style.display = 'block';
  }
  load(s: ChoiceSave) {
    this.cancelChoice();
    if (s.sels) this.showChoice(s.sels);
  }
  save(): ChoiceSave {
    return { sels: this.curr };
  }
}

type InvestigateSave = { show: boolean; };

class Investigate {
  root = document.createElement('div');
  curr = false;
  result = Promise.reject<number>("don't worry, this is just an initial value");
  private cvs: HTMLCanvasElement;
  private msk: null | Uint8Array = null;
  private prom: null | { resolve: (idx: number) => void; reject: () => void; } = null;
  constructor() {
    Object.assign(this.root.style, G.whStyle, { position: 'absolute' });
    this.root.onclick = (ev) => { ev.stopPropagation(); this.onclick(ev); };
    this.root.appendChild(this.cvs = document.createElement('canvas'));
    Object.assign(this.cvs, { width: 1280, height: 720 });
    this.cancel();
  }
  setMsk(mskFile: string) {
    fetch(mskFile).then(res => res.bytes()).then(msk => {
      const pixels = new Uint32Array(1280 * 720);
      const palette = [0];
      for (let i = 0; i < 16; i++) palette.push(0x7F000000 +
        Math.round(Math.random() * 3) * 0x600000 +
        Math.round(Math.random() * 3) * 0x6000 +
        Math.round(Math.random() * 3) * 0x60
      );
      msk.forEach((v, i) => pixels[i] = palette[v]);
      this.msk = msk;
      this.cvs.getContext('2d')?.putImageData(
        new ImageData(new Uint8ClampedArray(pixels.buffer), 1280, 720), 0, 0
      );
    });
  }
  private onclick(ev: MouseEvent) {
    if (!this.msk) return;
    const b = this.root.getBoundingClientRect();
    const x = Math.floor((ev.pageX - b.left) / b.width * 1280);
    const y = Math.floor((ev.pageY - b.top) / b.height * 720);
    console.log(ev, b);
    const i = y * 1280 + x;
    if (i >= this.msk.length) return;
    if (this.msk[i] == 0) return;
    console.log('investigate: clicked on', this.msk[i]);
    this.prom?.resolve(this.msk[i] - 1);
    this.prom = null;
    this.cancel();
  }
  cancel() {
    this.root.style.display = 'none';
    this.prom?.reject();
    this.prom = null;
    this.curr = false;
  }
  show() {
    this.cancel();
    this.curr = true;
    this.root.style.display = 'block';
    this.result = new Promise((resolve, reject) => (this.prom = { resolve, reject }));
  }
  load(s: InvestigateSave) {
    this.cancel();
    if (s.show) this.show();
  }
  save(): InvestigateSave {
    return { show: this.curr };
  }
}
