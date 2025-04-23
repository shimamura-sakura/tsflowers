type ImgSave = { src: null | string; nextSrc: null | string; style: { [k: string]: string } };
type ImgSty = { left: string; top: string; scale: string; opacity: string };

class MyImg extends Image {
  private static Style = ['width', 'height', 'background-color', 'left', 'top', 'scale', 'opacity'];
  private static Empty = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
  private nextSrc: null | string = null;
  constructor(fg?: boolean) {
    super();
    this.style.position = 'absolute';
    if (fg) Object.assign(this.style, { translate: '-50%', transformOrigin: '0 0' });
  }
  static fmtParam(x: number, y: number, xs: number, ys: number, a: number): ImgSty {
    return { left: `${x}px`, top: `${y}px`, scale: `${xs}% ${ys}%`, opacity: (a / 255).toString() };
  }
  setParam(x: number, y: number, s: number) {
    Object.assign(this.style, MyImg.fmtParam(x, y, s, s, 255));
  }
  setImage(src: null | string) {
    this.nextSrc = src;
    MyImg.Style.forEach((n) => this.style.removeProperty(n));
  }
  setColor(w: number, h: number, r: number, g: number, b: number) {
    this.setImage(null);
    Object.assign(this.style, { width: `${w}px`, height: `${h}px`, backgroundColor: `rgb(${r},${g},${b})` });
  }
  async loadSrc() {
    await G.loadImg(this.nextSrc || MyImg.Empty, this);
    return this.decode();
  }
  async load(s: ImgSave) {
    this.setImage(s.src);
    for (const k in s.style) this.style.setProperty(k, s.style[k]);
    await this.loadSrc();
    this.nextSrc = s.nextSrc;
  }
  save() {
    const src = this.getAttribute('src');
    const style: { [k: string]: string } = {};
    MyImg.Style.forEach((n) => (style[n] = this.style.getPropertyValue(n)));
    return { src: src == MyImg.Empty ? null : src, nextSrc: this.nextSrc, style };
  }
  copyTo(o: MyImg) {
    o.nextSrc = this.nextSrc;
    MyImg.Style.forEach((n) => o.style.setProperty(n, this.style.getPropertyValue(n)));
  }
}

type AniSave = { f: Keyframe[]; o: { iterations: number; direction: PlaybackDirection; duration: number } };
type LayAniA = null | { kf0: ImgSty; iterations: number };
type LayAniB = null | { kf1: ImgSty; direction: PlaybackDirection; duration: number };
type LayerSave = {
  next: ImgSave;
  curr: ImgSave;
  prev: ImgSave;
  aniA: LayAniA;
  aniB: LayAniB;
  anim: null | { opts: AniSave; time: number };
};

class Layer {
  next: MyImg;
  private curr: MyImg;
  private prev: MyImg;
  private aSav: null | AniSave = null;
  private anim: null | Animation = null;
  private aniA: LayAniA = null;
  private aniB: LayAniB = null;
  constructor(currDiv: HTMLDivElement, prevDiv: HTMLDivElement, fg?: boolean) {
    this.next = new MyImg(fg);
    currDiv.appendChild((this.curr = new MyImg(fg)));
    prevDiv.appendChild((this.prev = new MyImg(fg)));
  }
  drawNext(currToPrev?: boolean) {
    if (currToPrev) {
      this.anim?.commitStyles();
      [this.curr, this.prev] = [this.prev, this.curr];
    }
    this.curr.replaceWith(this.next);
    [this.curr, this.next] = [this.next, this.curr];
    this.curr.copyTo(this.next);
    if (this.anim) (this.anim.effect as KeyframeEffect).target = this.curr;
  }
  setAniA(x: number, y: number, xs: number, ys: number, a: number, repeat: number) {
    this.aniA = { kf0: MyImg.fmtParam(x, y, xs, ys, a), iterations: repeat + 1 };
  }
  setAniB(x: number, y: number, xs: number, ys: number, a: number, mode: number, duration: number) {
    const direction = mode == 2 ? 'reverse' : mode == 4 ? 'alternate' : 'normal';
    this.aniB = { kf1: MyImg.fmtParam(x, y, xs, ys, a), direction, duration };
  }
  begAnim() {
    if (!(this.aniA && this.aniB)) return;
    this.cancelAnim();
    const { kf0, iterations } = this.aniA;
    const { kf1, direction, duration } = this.aniB;
    this.aniA = this.aniB = null;
    this.drawNext();
    this.aSav = { f: [kf0, kf1], o: { iterations, direction, duration } };
    this.anim = this.curr.animate([kf0, kf1], { iterations, direction, duration, fill: 'forwards' });
  }
  cancelAnim(finish?: boolean) {
    if (finish) this.anim?.finish();
    this.anim?.commitStyles();
    this.anim?.cancel();
    this.aSav = this.anim = null;
  }
  async load(s: LayerSave) {
    this.cancelAnim();
    await Promise.all([this.next.load(s.next), this.curr.load(s.curr), this.prev.load(s.prev)]);
    this.aniA = s.aniA;
    this.aniB = s.aniB;
    if (s.anim) {
      this.aSav = s.anim.opts;
      this.anim = this.curr.animate(this.aSav.f, { ...this.aSav.o, fill: 'forwards' });
      this.anim.currentTime = s.anim.time;
    }
  }
  save(): LayerSave {
    this.anim?.commitStyles();
    return {
      next: this.next.save(),
      curr: this.curr.save(),
      prev: this.prev.save(),
      aniA: this.aniA,
      aniB: this.aniB,
      anim: this.anim && { opts: this.aSav!, time: (this.anim.currentTime as number) || 0 }
    };
  }
}

type AvatarSave = {
  next: ImgSave;
  curr: ImgSave;
  prev: ImgSave;
  fade: null | { d: number; t: number };
};

class Avatar {
  root = document.createElement('div');
  next = new MyImg();
  private curr = new MyImg();
  private prev = new MyImg();
  private fade: null | { ci: Animation; po: Animation } = null;
  constructor() {
    Object.assign(this.next.style, { position: 'absolute', opacity: '0', mixBlendMode: 'plus-lighter' });
    Object.assign(this.curr.style, { position: 'absolute', opacity: '1', mixBlendMode: 'plus-lighter' });
    Object.assign(this.prev.style, { position: 'absolute', opacity: '0', mixBlendMode: 'plus-lighter' });
    Object.assign(this.root.style, {
      ...G.awhStyle,
      overflow: 'hidden',
      position: 'absolute',
      isolation: 'isolate'
    });
    this.root.append(this.curr, this.prev);
  }
  begFadeNoLoad(duration: number) {
    this.cancelFade();
    [this.curr, this.prev] = [this.prev, this.curr];
    this.curr.replaceWith(this.next);
    [this.curr, this.next] = [this.next, this.curr];
    this.curr.copyTo(this.next);
    const ci = this.curr.animate([{ opacity: 0 }, { opacity: 1 }], { duration, fill: 'forwards' });
    const po = this.prev.animate([{ opacity: 1 }, { opacity: 0 }], { duration, fill: 'forwards' });
    this.curr.style.opacity = '1';
    this.prev.style.opacity = '0';
    this.fade = { ci, po };
  }
  cancelFade(finish?: boolean) {
    if (this.fade) {
      if (finish) {
        this.fade.ci.finish();
        this.fade.po.finish();
      }
      this.fade.ci.cancel();
      this.fade.po.cancel();
      this.fade = null;
    }
  }
  async load(s: AvatarSave) {
    this.cancelFade();
    await Promise.all([this.next.load(s.next), this.curr.load(s.curr), this.prev.load(s.prev)]);
    if (s.fade) {
      const { d: duration, t } = s.fade;
      const ci = this.curr.animate([{ opacity: 0 }, { opacity: 1 }], { duration, fill: 'forwards' });
      const po = this.prev.animate([{ opacity: 1 }, { opacity: 0 }], { duration, fill: 'forwards' });
      this.curr.style.opacity = '1';
      this.prev.style.opacity = '0';
      ci.currentTime = po.currentTime = t;
      this.fade = { ci, po };
    }
  }
  save(): AvatarSave {
    return {
      next: this.next.save(),
      curr: this.curr.save(),
      prev: this.prev.save(),
      fade: this.fade && {
        d: (this.fade.ci.effect?.getTiming().duration as number) || 1,
        t: (this.fade.ci.currentTime as number) || 0
      }
    };
  }
}

type ShakeOpts = { duration: number; repeat: number; dist: number };
type FlashOpts = { duration: number; times: number; color: string };

type StageSave = {
  bg: LayerSave;
  fg: LayerSave[];
  avat: AvatarSave;
  fade: null | { d: number; t: number };
  shake: null | { o: ShakeOpts; t: number };
  flash: null | { o: FlashOpts; t: number };
};

class Stage {
  avat = new Avatar();
  root = document.createElement('div');
  private curr = document.createElement('div');
  private prev = document.createElement('div');
  private flas = document.createElement('div');
  private bg = new Layer(this.curr, this.prev);
  private fg = [1, 2, 3, 4, 5].map((i) => new Layer(this.curr, this.prev, true));
  fade: null | { ci: Animation; po: Animation } = null;
  shake: null | { o: ShakeOpts; a: Animation } = null;
  flash: null | { o: FlashOpts; a: Animation } = null;
  constructor() {
    Object.assign(this.curr.style, { position: 'absolute', opacity: '1', mixBlendMode: 'plus-lighter' });
    Object.assign(this.prev.style, { position: 'absolute', opacity: '0', mixBlendMode: 'plus-lighter' });
    Object.assign(this.flas.style, { position: 'absolute', opacity: '0', mixBlendMode: 'source-over', ...G.whStyle });
    Object.assign(this.root.style, {
      ...G.whStyle,
      overflow: 'hidden',
      position: 'absolute',
      isolation: 'isolate'
    });
    this.root.append(this.curr, this.prev, this.flas);
  }
  bgColor(r: number, g: number, b: number) {
    this.fgClearAll();
    this.bg.next.setColor(G.w, G.h, r, g, b);
  }
  bgImage(src: string) {
    this.fgClearAll();
    this.bg.next.setImage(src);
  }
  fgClearAll() {
    this.avat.next.setImage(null);
    this.fg.forEach((f) => f.next.setImage(null));
  }
  fgImage(i: number, src: string) {
    this.fg[i].next.setImage(src);
  }
  fgParam(i: number, x: number, y: number, s: number) {
    this.fg[i].next.setParam(x, y, s);
  }
  fgAniA(i: number, x: number, y: number, xs: number, ys: number, a: number, repeat: number) {
    this.fg[i].setAniA(x, y, xs, ys, a, repeat);
  }
  fgAniB(i: number, x: number, y: number, xs: number, ys: number, a: number, mode: number, duration: number) {
    this.fg[i].setAniB(x, y, xs, ys, a, mode, duration);
  }
  avImage(src: string) {
    this.avat.next.setImage(src);
    this.avat.next.style.opacity = '0';
  }
  async begFade(duration: number) {
    await Promise.all([this.bg.next.loadSrc(), this.fg.map((f) => f.next.loadSrc()), this.avat.next.loadSrc()]);
    this.cancelFade();
    this.bg.drawNext(true);
    this.fg.forEach((f) => f.drawNext(true));
    [this.curr, this.prev] = [this.prev, this.curr];
    const ci = this.curr.animate([{ opacity: 0 }, { opacity: 1 }], { duration, fill: 'forwards' });
    const po = this.prev.animate([{ opacity: 1 }, { opacity: 0 }], { duration, fill: 'forwards' });
    this.curr.style.opacity = '1';
    this.prev.style.opacity = '0';
    this.fade = { ci, po };
    this.avat.begFadeNoLoad(duration);
  }
  cancelFade(finish?: boolean) {
    if (this.fade) {
      if (finish) {
        this.fade.ci.finish();
        this.fade.po.finish();
      }
      this.fade.ci.cancel();
      this.fade.po.cancel();
      this.fade = null;
    }
    this.avat.cancelFade(finish);
  }
  async begAnim(...idxs: number[]) {
    const ls = idxs.length ? idxs.map((i) => this.fg[i]) : this.fg;
    await Promise.all(ls.map((f) => f.next.loadSrc()));
    ls.forEach((f) => f.begAnim());
  }
  endAnim(...idxs: number[]) {
    const ls = idxs.length ? idxs.map((i) => this.fg[i]) : this.fg;
    ls.forEach((f) => f.cancelAnim(true));
  }
  begShake(dist: number, duration: number, repeat: number) {
    this.cancelShake();
    this.shake = {
      o: { dist, duration, repeat },
      a: this.root.animate(
        [
          { left: 0, top: 0 },
          { left: `-${dist}px`, top: `${dist}px` },
          { left: `${dist}px`, top: `-${dist}px` },
          { left: 0, top: 0 }
        ],
        { direction: 'alternate', duration, iterations: repeat + 1 }
      )
    };
  }
  cancelShake(finish?: boolean) {
    if (finish) this.shake?.a.finish();
    this.shake?.a.cancel();
    this.shake = null;
  }
  begFlash(color: string, duration: number, times: number) {
    this.cancelFlash();
    this.flas.style.backgroundColor = color;
    this.flash = {
      o: { color, duration, times },
      a: this.flas.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }], {
        duration,
        iterations: times < 1 ? 1 : times
      })
    };
  }
  cancelFlash(finish?: boolean) {
    if (finish) this.flash?.a.finish();
    this.flash?.a.cancel();
    this.flash = null;
  }
  async load(s: StageSave) {
    this.cancelFade();
    this.cancelShake();
    this.cancelFlash();
    await Promise.all([this.bg.load(s.bg), ...this.fg.map((f, i) => f.load(s.fg[i])), this.avat.load(s.avat)]);
    if (s.fade) {
      const { d: duration, t } = s.fade;
      const ci = this.curr.animate([{ opacity: 0 }, { opacity: 1 }], { duration, fill: 'forwards' });
      const po = this.prev.animate([{ opacity: 1 }, { opacity: 0 }], { duration, fill: 'forwards' });
      this.curr.style.opacity = '1';
      this.prev.style.opacity = '0';
      ci.currentTime = po.currentTime = t;
      this.fade = { ci, po };
    }
    if (s.shake) {
      const { dist, duration, repeat } = s.shake.o;
      this.begShake(dist, duration, repeat);
      this.shake!.a.currentTime = s.shake.t;
    }
    if (s.flash) {
      const { duration, times, color } = s.flash.o;
      this.begFlash(color, duration, times);
      this.flash!.a.currentTime = s.flash.t;
    }
  }
  save(): StageSave {
    return {
      bg: this.bg.save(),
      fg: this.fg.map((f) => f.save()),
      avat: this.avat.save(),
      fade: this.fade && {
        d: (this.fade.ci.effect?.getTiming().duration as number) || 1,
        t: (this.fade.ci.currentTime as number) || 0
      },
      shake: this.shake && {
        o: this.shake.o,
        t: (this.shake.a.currentTime as number) || 0
      },
      flash: this.flash && {
        o: this.flash.o,
        t: (this.flash.a.currentTime as number) || 0
      }
    };
  }
}
