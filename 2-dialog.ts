type YuriSave = {
  nextTop: string;
  currTop: string;
  prevTop: string;
  fade: null | { d: number; t: number; };
  flash: null | { d: number; t: number; c: string; };
};

class YuriGauge {
  root = document.createElement('div');
  private nextTop = '0px';
  private curr = new Image();
  private prev = new Image();
  flash: null | { d: number; c: string; a: Animation; } = null;
  fade: null | { d: number; ci: Animation; po: Animation; } = null;
  constructor() {
    Object.assign(this.root.style, G.yuriStyle, { overflow: 'hidden' });
    Object.assign(this.curr.style, G.yimgStyle, { opacity: '1', mixBlendMode: 'plus-lighter' });
    Object.assign(this.prev.style, G.yimgStyle, { opacity: '0', mixBlendMode: 'plus-lighter' });
    const inner = this.root.appendChild(document.createElement('div'));
    inner.append(this.curr, this.prev);
    inner.style.isolation = 'isolate';
    this.nextLevel(G.yuriStartLevel);
    this.curr.style.top = this.nextTop;
  }
  async loadRes(fs: MyFS) {
    await Promise.all([
      G.loadImg(fs.system('lily_gauge.png'), this.curr),
      G.loadImg(fs.system('lily_gauge.png'), this.prev)
    ]);
  }
  nextLevel(i: number) {
    i = Math.round(i);
    this.nextTop = `-${(i < 0 ? 0 : i >= 8 ? 8 : i) * G.yuriH}px`;
  }
  begFade(duration: number) {
    this.cancelFade();
    [this.curr, this.prev] = [this.prev, this.curr];
    this.curr.style.top = this.nextTop;
    const ci = this.curr.animate([{ opacity: 0 }, { opacity: 1 }], { duration, fill: 'forwards' });
    const po = this.prev.animate([{ opacity: 1 }, { opacity: 0 }], { duration, fill: 'forwards' });
    this.curr.style.opacity = '1';
    this.prev.style.opacity = '0';
    this.fade = { d: duration, ci, po };
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
  begFlash(color: string, duration: number) {
    this.cancelFlash();
    const kf = [{}, { offset: 0.25, backgroundColor: color }, { offset: 0.75, backgroundColor: color }, {}];
    this.flash = { c: color, d: duration, a: this.root.animate(kf, { duration }) };
  }
  cancelFlash(finish?: boolean) {
    if (finish) this.flash?.a.finish();
    this.flash?.a.cancel();
    this.flash = null;
  }
  load(s: YuriSave) {
    this.cancelFade();
    this.cancelFlash();
    ({ nextTop: this.nextTop, currTop: this.curr.style.top, prevTop: this.prev.style.top } = s);
    if (s.fade) {
      const { d: duration, t } = s.fade;
      const ci = this.curr.animate([{ opacity: 0 }, { opacity: 1 }], { duration, fill: 'forwards' });
      const po = this.prev.animate([{ opacity: 1 }, { opacity: 0 }], { duration, fill: 'forwards' });
      this.curr.style.opacity = '1';
      this.prev.style.opacity = '0';
      ci.currentTime = po.currentTime = t;
      this.fade = { d: duration, ci, po };
    }
    if (s.flash) {
      this.begFlash(s.flash.c, s.flash.d);
      this.flash!.a.currentTime = s.flash.t;
    }
  }
  save(): YuriSave {
    return {
      nextTop: this.nextTop,
      currTop: this.curr.style.top,
      prevTop: this.prev.style.top,
      fade: this.fade && { d: this.fade.d, t: (this.fade.ci.currentTime as number) || 0 },
      flash: this.flash && { d: this.flash.d, t: (this.flash.a.currentTime as number) || 0, c: this.flash.c }
    };
  }
}

type TypingSeg = { k: null | 'rb' | 'rt'; s: string; };
type TypingSave = { html: string; type: null | { orig: string; iseg: number; }; };

class Typewriter {
  root = document.createElement('div');
  finished = Promise.resolve();
  private lastRB: null | HTMLElement = null;
  private prom: null | { resolve: () => void; reject: () => void; } = null;
  curr: null | { html: string; orig: string; iseg: number; segs: TypingSeg[]; } = null;
  static parseOrig(s: string): TypingSeg[] {
    let segs: TypingSeg[] = [];
    let k: null | 'rb' | 'rt' = null;
    for (let c of s)
      switch (c) {
        case '<':
          if (k == 'rb') {
            k = 'rt';
            segs.push({ k, s: '' });
          } else k = 'rb';
          break;
        case '>':
          k = null;
          break;
        default:
          if (k == 'rt') segs[segs.length - 1].s += c;
          else segs.push({ k, s: c });
      }
    return segs;
  }
  constructor() {
    setInterval(() => this.typeOne(), G.typerMsPerChar);
    Object.assign(this.root.style, { position: 'absolute', overflow: 'auto', scrollbarWidth: 'none' });
  }
  private typeOne() {
    if (this.curr == null || this.curr.iseg >= this.curr.segs.length) {
      this.prom?.resolve();
      this.prom = null;
      return false;
    }
    const seg = this.curr.segs[this.curr.iseg++];
    switch (seg.k) {
      case null:
        if (seg.s == '＄') this.root.appendChild(document.createElement('br'));
        else this.root.append(seg.s);
        break;
      case 'rb':
        if (this.lastRB == null) this.lastRB = this.root.appendChild(document.createElement('ruby'));
        this.lastRB.append(seg.s);
        break;
      case 'rt':
        if (this.lastRB) this.lastRB.appendChild(document.createElement('rt')).innerText = seg.s;
        this.lastRB = null;
        break;
    }
    return true;
  }
  begType(s: string) {
    this.cancel(true);
    this.curr = { html: this.root.innerHTML, orig: s, iseg: 0, segs: Typewriter.parseOrig(s) };
    this.finished = new Promise((resolve, reject) => (this.prom = { resolve, reject }));
  }
  cancel(finish?: boolean) {
    if (finish) while (this.typeOne());
    else this.prom?.reject();
    this.prom = null;
    this.curr = null;
    this.lastRB = null;
  }
  clear() {
    this.cancel();
    this.root.innerHTML = '';
  }
  load(s: TypingSave) {
    this.clear();
    this.root.innerHTML = s.html;
    if (s.type) {
      const { orig, iseg } = s.type;
      this.begType(orig);
      while (this.curr!.iseg < iseg && this.typeOne());
    }
  }
  save(): TypingSave {
    if (this.curr == null) return { html: this.root.innerHTML, type: null };
    const { html, orig, iseg } = this.curr;
    return { html, type: { orig, iseg } };
  }
}

type TextDlgSave = {
  yuri: YuriSave;
  isVert: boolean;
  type: TypingSave;
  person: string;
  nextPerson: string;
  visible: boolean;
  fade: null | { d: number; t: number; };
};

class TextDlg {
  root = document.createElement('div');
  yuri = new YuriGauge();
  type = new Typewriter();
  private nextPerson = '';
  private isVert: boolean;
  private vert = new Image();
  private hori = document.createElement('div');
  private person = document.createElement('div');
  private visible: boolean;
  fade: null | { d: number; a: Animation; } = null;
  constructor(avatar: HTMLElement) {
    this.setVisible((this.visible = false));
    this.root.appendChild(document.createElement('style')).innerText = G.dRubyStyle(
      (this.type.root.className = 'cls-' + Math.random().toString(16).substring(2))
    );
    Object.assign(this.root.style, G.whStyle, { position: 'absolute', font: G.dRootFont });
    Object.assign(this.hori.style, G.whStyle, { position: 'absolute' });
    Object.assign(this.vert.style, G.whStyle, { position: 'absolute' });
    Object.assign(this.hori.appendChild(avatar).style, G.axyStyle);
    Object.assign(this.hori.appendChild(this.person).style, G.personStyle);
    this.root.append(this.hori, this.vert, this.type.root);
    this.hori.append(this.yuri.root);
    this.setMode((this.isVert = false));
  }
  async loadRes(fs: MyFS) {
    const [window, wFrame] = await Promise.all([
      G.loadImg(fs.system('window.png')),
      G.loadImg(fs.system('window_frame.png')),
      G.loadImg(fs.system('window1.png'), this.vert),
      this.yuri.loadRes(fs)
    ]);
    this.hori.append(window, wFrame);
    Object.assign(window.style, G.hWinStyle);
    Object.assign(wFrame.style, G.hWFrStyle);
  }
  private typeSetMode(vert: boolean) {
    G.dialogStyles.forEach((n) => this.type.root.style.removeProperty(n));
    Object.assign(this.type.root.style, vert ? G.dialogVStyle : G.dialogHStyle);
  }
  setMode(vert: boolean) {
    this.clear();
    this.typeSetMode((this.isVert = vert));
    this.hori.style.display = vert ? 'none' : 'block';
    this.vert.style.display = vert ? 'block' : 'none';
  }
  setPerson(p: string) {
    this.nextPerson = p;
  }
  addText(s: string) {
    this.setVisible(true);
    if (this.isVert) s = s + '＄';
    else this.clear();
    this.person.innerText = this.nextPerson;
    this.nextPerson = '';
    this.type.begType(s);
  }
  clear() {
    this.type.clear();
    this.person.innerText = '';
  }
  setVisible(visible: boolean, duration?: number) {
    this.cancelFade();
    this.visible = visible;
    this.root.style.display = 'block';
    if (duration) {
      const kf = [{ opacity: 1 }, { opacity: 0 }];
      if (visible) kf.reverse();
      this.fade = { d: duration, a: this.root.animate(kf, { duration, fill: 'forwards' }) };
    } else this.cancelFade(true);
  }
  cancelFade(finish?: boolean) {
    if (finish) this.fade?.a.finish();
    this.fade?.a.cancel();
    this.fade = null;
    this.root.style.display = this.visible ? 'block' : 'none';
  }
  load(s: TextDlgSave) {
    this.cancelFade();
    this.type.cancel();
    this.setMode(s.isVert);
    this.yuri.load(s.yuri);
    this.type.load(s.type);
    this.nextPerson = s.nextPerson;
    this.person.innerText = s.person;
    this.setVisible(s.visible, (s.fade && s.fade.d) || undefined);
    if (this.fade && s.fade) this.fade.a.currentTime = s.fade.t;
  }
  save(): TextDlgSave {
    return {
      yuri: this.yuri.save(),
      isVert: this.isVert,
      type: this.type.save(),
      person: this.person.innerText,
      nextPerson: this.nextPerson,
      visible: this.visible,
      fade: this.fade && {
        d: this.fade.d,
        t: (this.fade.a.currentTime as number) || 0
      }
    };
  }
}
