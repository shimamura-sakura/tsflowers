"use strict";
const G = {
    w: 1280,
    h: 720,
    whStyle: { width: '1280px', height: '720px' },
    aw: 178,
    ah: 152,
    awhStyle: { width: '178px', height: '152px' },
    axyStyle: { left: '65px', bottom: '25px', zIndex: '1' },
    hWinStyle: { position: 'absolute', left: '63px', bottom: '23px', opacity: '75%' },
    hWFrStyle: { position: 'absolute', left: '0px', bottom: '0px' },
    yuriH: 104,
    yimgStyle: { position: 'absolute', left: '15px' },
    yuriStyle: {
        position: 'absolute',
        right: '35px',
        bottom: '182px',
        width: '104px',
        height: '104px',
        clipPath: 'circle(50px)'
    },
    yuriStartLevel: 4,
    dRootFont: '26px FlowersText',
    dRubyStyle: (c) => `.${c}{ruby-align:center;line-height:46px}rt{font:12px FlowersRuby}`,
    personStyle: { position: 'absolute', right: '962px', bottom: '123px', zIndex: '1' },
    dialogStyles: ['left', 'right', 'top', 'bottom', 'width', 'writing-mode', 'padding'],
    dialogVStyle: { right: '100px', top: '100px', left: '100px', bottom: '100px', writingMode: 'vertical-rl' },
    dialogHStyle: {
        left: '340px',
        top: '550px',
        width: '700px',
        bottom: '23px',
        writingMode: 'horizontal-tb',
        padding: '10px 0 0 0'
    },
    typerMsPerChar: 50,
    timeAfterVoice: 1000,
    choiceStyle: (c) => `.${c}:hover{background-position-y:147px}`,
    chBtnStyle: (fs) => ({
        width: '908px',
        height: '74px',
        fontSize: '26px',
        lineHeight: '74px',
        fontFamily: 'FlowersText',
        position: 'absolute',
        backgroundImage: `url(${fs.system('select_p.png')})`,
        textAlign: 'center'
    }),
    chBtnPos: (i, n) => {
        if (n > 3)
            i -= n - 3;
        return { top: `${186 + i * 78}px`, left: `${132 + i * 80}px` };
    },
    videoStyle: { position: 'absolute', zIndex: '2' },
    async loadImg(src, img) {
        img ||= new Image();
        await new Promise((res, rj) => {
            const a = new AbortController();
            img.addEventListener('load', () => res(a.abort()), { once: true, signal: a.signal });
            img.addEventListener('error', () => rj(a.abort()), { once: true, signal: a.signal });
            img.src = src;
        });
        return img;
    },
    specialScripts: {},
    sys: {}
};
class MyFS {
    root;
    videos;
    useSmall;
    constructor(useSmall, root, ...videos) {
        this.root = root;
        this.videos = videos;
        this.useSmall = useSmall;
    }
    bgm(name) {
        return this.toSmallFilename(`${this.root}/bgm/${name.toLowerCase()}.ogg`);
    }
    voice(name) {
        return this.toSmallFilename(`${this.root}/voice/${name}.ogg`);
    }
    se(name) {
        return this.toSmallFilename(`${this.root}/se/${name}.ogg`);
    }
    bg(filename) {
        return this.toSmallFilename(`${this.root}/bgimage/${filename}`);
    }
    fg(filename) {
        return this.toSmallFilename(`${this.root}/fgimage/${filename}`);
    }
    system(filename) {
        return this.toSmallFilename(`${this.root}/system/${filename}`);
    }
    avatar(filename) {
        return this.fg(filename);
    }
    video(i) {
        const filename = this.videos[i] || this.videos[0];
        return this.toSmallFilename(`${this.root}/video/${filename}`);
    }
    toSmallFilename(s) {
        s = s.replace('.mpg', '.webm');
        if (!this.useSmall)
            return s;
        s = s.replace('.ogg', '.opus');
        s = s.replace('.bmp', '.webp').replace('.png', '.webp');
        return s;
    }
}
class MyImg extends Image {
    static Style = ['width', 'height', 'background-color', 'left', 'top', 'scale', 'opacity'];
    static Empty = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
    nextSrc = null;
    constructor(fg) {
        super();
        this.style.position = 'absolute';
        if (fg)
            Object.assign(this.style, { translate: '-50%', transformOrigin: '0 0' });
    }
    static fmtParam(x, y, xs, ys, a) {
        return { left: `${x}px`, top: `${y}px`, scale: `${xs}% ${ys}%`, opacity: (a / 255).toString() };
    }
    setParam(x, y, s) {
        Object.assign(this.style, MyImg.fmtParam(x, y, s, s, 255));
    }
    setImage(src) {
        this.nextSrc = src;
        MyImg.Style.forEach((n) => this.style.removeProperty(n));
    }
    setColor(w, h, r, g, b) {
        this.setImage(null);
        Object.assign(this.style, { width: `${w}px`, height: `${h}px`, backgroundColor: `rgb(${r},${g},${b})` });
    }
    async loadSrc() {
        await G.loadImg(this.nextSrc || MyImg.Empty, this);
        try {
            await this.decode();
        }
        catch {
            console.log('error loading src');
        }
        return;
    }
    async load(s) {
        this.setImage(s.src);
        for (const k in s.style)
            this.style.setProperty(k, s.style[k]);
        await this.loadSrc();
        this.nextSrc = s.nextSrc;
    }
    save() {
        const src = this.getAttribute('src');
        const style = {};
        MyImg.Style.forEach((n) => (style[n] = this.style.getPropertyValue(n)));
        return { src: src == MyImg.Empty ? null : src, nextSrc: this.nextSrc, style };
    }
    copyTo(o) {
        o.nextSrc = this.nextSrc;
        MyImg.Style.forEach((n) => o.style.setProperty(n, this.style.getPropertyValue(n)));
    }
}
class Layer {
    next;
    curr;
    prev;
    aSav = null;
    anim = null;
    aniA = null;
    aniB = null;
    constructor(currDiv, prevDiv, fg) {
        this.next = new MyImg(fg);
        currDiv.appendChild((this.curr = new MyImg(fg)));
        prevDiv.appendChild((this.prev = new MyImg(fg)));
    }
    drawNext(currToPrev) {
        if (currToPrev) {
            this.anim?.commitStyles();
            [this.curr, this.prev] = [this.prev, this.curr];
        }
        this.curr.replaceWith(this.next);
        [this.curr, this.next] = [this.next, this.curr];
        this.curr.copyTo(this.next);
        if (this.anim)
            this.anim.effect.target = this.curr;
    }
    setAniA(x, y, xs, ys, a, repeat) {
        this.aniA = { kf0: MyImg.fmtParam(x, y, xs, ys, a), iterations: repeat + 1 };
    }
    setAniB(x, y, xs, ys, a, mode, duration) {
        const direction = mode == 2 ? 'reverse' : mode == 4 ? 'alternate' : 'normal';
        this.aniB = { kf1: MyImg.fmtParam(x, y, xs, ys, a), direction, duration };
    }
    begAnim() {
        if (!(this.aniA && this.aniB))
            return;
        this.cancelAnim();
        const { kf0, iterations } = this.aniA;
        const { kf1, direction, duration } = this.aniB;
        this.aniA = this.aniB = null;
        this.drawNext();
        this.aSav = { f: [kf0, kf1], o: { iterations, direction, duration } };
        this.anim = this.curr.animate([kf0, kf1], { iterations, direction, duration, fill: 'forwards' });
    }
    cancelAnim(finish) {
        if (finish)
            this.anim?.finish();
        this.anim?.commitStyles();
        this.anim?.cancel();
        this.aSav = this.anim = null;
    }
    async load(s) {
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
    save() {
        this.anim?.commitStyles();
        return {
            next: this.next.save(),
            curr: this.curr.save(),
            prev: this.prev.save(),
            aniA: this.aniA,
            aniB: this.aniB,
            anim: this.anim && { opts: this.aSav, time: this.anim.currentTime || 0 }
        };
    }
}
class Avatar {
    root = document.createElement('div');
    next = new MyImg();
    curr = new MyImg();
    prev = new MyImg();
    fade = null;
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
    begFadeNoLoad(duration) {
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
    cancelFade(finish) {
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
    async load(s) {
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
    save() {
        return {
            next: this.next.save(),
            curr: this.curr.save(),
            prev: this.prev.save(),
            fade: this.fade && {
                d: this.fade.ci.effect?.getTiming().duration || 1,
                t: this.fade.ci.currentTime || 0
            }
        };
    }
}
class Stage {
    avat = new Avatar();
    root = document.createElement('div');
    curr = document.createElement('div');
    prev = document.createElement('div');
    flas = document.createElement('div');
    bg = new Layer(this.curr, this.prev);
    fg = [1, 2, 3, 4, 5].map((i) => new Layer(this.curr, this.prev, true));
    fade = null;
    shake = null;
    flash = null;
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
    bgColor(r, g, b) {
        this.fgClearAll();
        this.bg.next.setColor(G.w, G.h, r, g, b);
    }
    bgImage(src) {
        this.fgClearAll();
        this.bg.next.setImage(src);
    }
    fgClearAll() {
        this.avat.next.setImage(null);
        this.fg.forEach((f) => f.next.setImage(null));
    }
    fgImage(i, src) {
        this.fg[i].next.setImage(src);
    }
    fgParam(i, x, y, s) {
        this.fg[i].next.setParam(x, y, s);
    }
    fgAniA(i, x, y, xs, ys, a, repeat) {
        this.fg[i].setAniA(x, y, xs, ys, a, repeat);
    }
    fgAniB(i, x, y, xs, ys, a, mode, duration) {
        this.fg[i].setAniB(x, y, xs, ys, a, mode, duration);
    }
    avImage(src) {
        this.avat.next.setImage(src);
        this.avat.next.style.opacity = '0';
    }
    async begFade(duration) {
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
    cancelFade(finish) {
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
    async begAnim(...idxs) {
        const ls = idxs.length ? idxs.map((i) => this.fg[i]) : this.fg;
        await Promise.all(ls.map((f) => f.next.loadSrc()));
        ls.forEach((f) => f.begAnim());
    }
    endAnim(...idxs) {
        const ls = idxs.length ? idxs.map((i) => this.fg[i]) : this.fg;
        ls.forEach((f) => f.cancelAnim(true));
    }
    begShake(dist, duration, repeat) {
        this.cancelShake();
        this.shake = {
            o: { dist, duration, repeat },
            a: this.root.animate([
                { left: 0, top: 0 },
                { left: `-${dist}px`, top: `${dist}px` },
                { left: `${dist}px`, top: `-${dist}px` },
                { left: 0, top: 0 }
            ], { direction: 'alternate', duration, iterations: repeat + 1 })
        };
    }
    cancelShake(finish) {
        if (finish)
            this.shake?.a.finish();
        this.shake?.a.cancel();
        this.shake = null;
    }
    begFlash(color, duration, times) {
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
    cancelFlash(finish) {
        if (finish)
            this.flash?.a.finish();
        this.flash?.a.cancel();
        this.flash = null;
    }
    async load(s) {
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
            this.shake.a.currentTime = s.shake.t;
        }
        if (s.flash) {
            const { duration, times, color } = s.flash.o;
            this.begFlash(color, duration, times);
            this.flash.a.currentTime = s.flash.t;
        }
    }
    save() {
        return {
            bg: this.bg.save(),
            fg: this.fg.map((f) => f.save()),
            avat: this.avat.save(),
            fade: this.fade && {
                d: this.fade.ci.effect?.getTiming().duration || 1,
                t: this.fade.ci.currentTime || 0
            },
            shake: this.shake && {
                o: this.shake.o,
                t: this.shake.a.currentTime || 0
            },
            flash: this.flash && {
                o: this.flash.o,
                t: this.flash.a.currentTime || 0
            }
        };
    }
}
class YuriGauge {
    root = document.createElement('div');
    nextTop = '0px';
    curr = new Image();
    prev = new Image();
    flash = null;
    fade = null;
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
    async loadRes(fs) {
        await Promise.all([
            G.loadImg(fs.system('lily_gauge.png'), this.curr),
            G.loadImg(fs.system('lily_gauge.png'), this.prev)
        ]);
    }
    nextLevel(i) {
        i = Math.round(i);
        this.nextTop = `-${(i < 0 ? 0 : i >= 8 ? 8 : i) * G.yuriH}px`;
    }
    begFade(duration) {
        this.cancelFade();
        [this.curr, this.prev] = [this.prev, this.curr];
        this.curr.style.top = this.nextTop;
        const ci = this.curr.animate([{ opacity: 0 }, { opacity: 1 }], { duration, fill: 'forwards' });
        const po = this.prev.animate([{ opacity: 1 }, { opacity: 0 }], { duration, fill: 'forwards' });
        this.curr.style.opacity = '1';
        this.prev.style.opacity = '0';
        this.fade = { d: duration, ci, po };
    }
    cancelFade(finish) {
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
    begFlash(color, duration) {
        this.cancelFlash();
        const kf = [{}, { offset: 0.25, backgroundColor: color }, { offset: 0.75, backgroundColor: color }, {}];
        this.flash = { c: color, d: duration, a: this.root.animate(kf, { duration }) };
    }
    cancelFlash(finish) {
        if (finish)
            this.flash?.a.finish();
        this.flash?.a.cancel();
        this.flash = null;
    }
    load(s) {
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
            this.flash.a.currentTime = s.flash.t;
        }
    }
    save() {
        return {
            nextTop: this.nextTop,
            currTop: this.curr.style.top,
            prevTop: this.prev.style.top,
            fade: this.fade && { d: this.fade.d, t: this.fade.ci.currentTime || 0 },
            flash: this.flash && { d: this.flash.d, t: this.flash.a.currentTime || 0, c: this.flash.c }
        };
    }
}
class Typewriter {
    root = document.createElement('div');
    finished = Promise.resolve();
    lastRB = null;
    prom = null;
    curr = null;
    static parseOrig(s) {
        let segs = [];
        let k = null;
        for (let c of s)
            switch (c) {
                case '<':
                    if (k == 'rb') {
                        k = 'rt';
                        segs.push({ k, s: '' });
                    }
                    else
                        k = 'rb';
                    break;
                case '>':
                    k = null;
                    break;
                default:
                    if (k == 'rt')
                        segs[segs.length - 1].s += c;
                    else
                        segs.push({ k, s: c });
            }
        return segs;
    }
    constructor() {
        setInterval(() => this.typeOne(), G.typerMsPerChar);
        Object.assign(this.root.style, { position: 'absolute', overflow: 'auto', scrollbarWidth: 'none' });
    }
    typeOne() {
        if (this.curr == null || this.curr.iseg >= this.curr.segs.length) {
            this.prom?.resolve();
            this.prom = null;
            return false;
        }
        const seg = this.curr.segs[this.curr.iseg++];
        switch (seg.k) {
            case null:
                if (seg.s == '＄')
                    this.root.appendChild(document.createElement('br'));
                else
                    this.root.append(seg.s);
                break;
            case 'rb':
                if (this.lastRB == null)
                    this.lastRB = this.root.appendChild(document.createElement('ruby'));
                this.lastRB.append(seg.s);
                break;
            case 'rt':
                if (this.lastRB)
                    this.lastRB.appendChild(document.createElement('rt')).innerText = seg.s;
                this.lastRB = null;
                break;
        }
        return true;
    }
    begType(s) {
        this.cancel(true);
        this.curr = { html: this.root.innerHTML, orig: s, iseg: 0, segs: Typewriter.parseOrig(s) };
        this.finished = new Promise((resolve, reject) => (this.prom = { resolve, reject }));
    }
    cancel(finish) {
        if (finish)
            while (this.typeOne())
                ;
        else
            this.prom?.reject();
        this.prom = null;
        this.curr = null;
        this.lastRB = null;
    }
    clear() {
        this.cancel();
        this.root.innerHTML = '';
    }
    load(s) {
        this.clear();
        this.root.innerHTML = s.html;
        if (s.type) {
            const { orig, iseg } = s.type;
            this.begType(orig);
            while (this.curr.iseg < iseg && this.typeOne())
                ;
        }
    }
    save() {
        if (this.curr == null)
            return { html: this.root.innerHTML, type: null };
        const { html, orig, iseg } = this.curr;
        return { html, type: { orig, iseg } };
    }
}
class TextDlg {
    root = document.createElement('div');
    yuri = new YuriGauge();
    type = new Typewriter();
    nextPerson = '';
    isVert;
    vert = new Image();
    hori = document.createElement('div');
    person = document.createElement('div');
    visible;
    fade = null;
    constructor(avatar) {
        this.setVisible((this.visible = false));
        this.root.appendChild(document.createElement('style')).innerText = G.dRubyStyle((this.type.root.className = 'cls-' + Math.random().toString(16).substring(2)));
        Object.assign(this.root.style, G.whStyle, { position: 'absolute', font: G.dRootFont });
        Object.assign(this.hori.style, G.whStyle, { position: 'absolute' });
        Object.assign(this.vert.style, G.whStyle, { position: 'absolute' });
        Object.assign(this.hori.appendChild(avatar).style, G.axyStyle);
        Object.assign(this.hori.appendChild(this.person).style, G.personStyle);
        this.root.append(this.hori, this.vert, this.type.root);
        this.hori.append(this.yuri.root);
        this.setMode((this.isVert = false));
    }
    async loadRes(fs) {
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
    typeSetMode(vert) {
        G.dialogStyles.forEach((n) => this.type.root.style.removeProperty(n));
        Object.assign(this.type.root.style, vert ? G.dialogVStyle : G.dialogHStyle);
    }
    setMode(vert) {
        this.clear();
        this.typeSetMode((this.isVert = vert));
        this.hori.style.display = vert ? 'none' : 'block';
        this.vert.style.display = vert ? 'block' : 'none';
    }
    setPerson(p) {
        this.nextPerson = p;
    }
    addText(s) {
        this.setVisible(true);
        if (this.isVert)
            s = s + '＄';
        else
            this.clear();
        this.person.innerText = this.nextPerson;
        this.nextPerson = '';
        this.type.begType(s);
    }
    clear() {
        this.type.clear();
        this.person.innerText = '';
    }
    setVisible(visible, duration) {
        this.cancelFade();
        this.visible = visible;
        this.root.style.display = 'block';
        if (duration) {
            const kf = [{ opacity: 1 }, { opacity: 0 }];
            if (visible)
                kf.reverse();
            this.fade = { d: duration, a: this.root.animate(kf, { duration, fill: 'forwards' }) };
        }
        else
            this.cancelFade(true);
    }
    cancelFade(finish) {
        if (finish)
            this.fade?.a.finish();
        this.fade?.a.cancel();
        this.fade = null;
        this.root.style.display = this.visible ? 'block' : 'none';
    }
    load(s) {
        this.cancelFade();
        this.type.cancel();
        this.setMode(s.isVert);
        this.yuri.load(s.yuri);
        this.type.load(s.type);
        this.nextPerson = s.nextPerson;
        this.person.innerText = s.person;
        this.setVisible(s.visible, (s.fade && s.fade.d) || undefined);
        if (this.fade && s.fade)
            this.fade.a.currentTime = s.fade.t;
    }
    save() {
        return {
            yuri: this.yuri.save(),
            isVert: this.isVert,
            type: this.type.save(),
            person: this.person.innerText,
            nextPerson: this.nextPerson,
            visible: this.visible,
            fade: this.fade && {
                d: this.fade.d,
                t: this.fade.a.currentTime || 0
            }
        };
    }
}
class MyVideo {
    root = document.createElement('video');
    finished = Promise.resolve();
    curr = null;
    constructor() {
        Object.assign(this.root, { autoplay: true, controls: true });
        Object.assign(this.root.style, G.whStyle, G.videoStyle);
        this.root.addEventListener('ended', () => this.cancel(true));
        this.root.addEventListener('click', (ev) => ev.stopPropagation());
        this.cancel();
    }
    cancel(finish) {
        if (finish)
            this.curr?.resolve();
        else
            this.curr?.reject();
        this.curr = null;
        this.root.style.display = 'none';
        this.root.pause();
    }
    play(src, mime) {
        this.cancel();
        this.finished = new Promise((resolve, reject) => {
            this.curr = { src, mime, resolve, reject };
            this.root.style.display = 'block';
            if (mime)
                this.root.innerHTML = `<source src="${src}" type="${mime}"/>`;
            else
                this.root.innerHTML = `<source src="${src}" />`;
            this.root.load();
        });
    }
    load(s) {
        this.cancel();
        if (s.curr) {
            this.play(s.curr.src, this.curr?.mime);
            this.root.currentTime = s.curr.t;
        }
    }
    save() {
        return { curr: this.curr && { src: this.curr.src, mime: this.curr.mime, t: this.root.currentTime } };
    }
}
class MySoundChan {
    ctx;
    gainNode;
    audioEle = new Audio();
    nextFade = null;
    lastTarget = { endTime: 0, target: 1 };
    cancelEvName = 'can-' + Math.random().toString(16).substring(2);
    finishEvName = 'fin-' + Math.random().toString(16).substring(2);
    constructor(ctx) {
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
    cancel(finish) {
        this.audioEle.pause();
        this.audioEle.dispatchEvent(new Event(finish ? this.finishEvName : this.cancelEvName));
        this.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
        this.gainNode.gain.value = 1;
        this.nextFade = null;
    }
    play(src, loop, fadeInSec) {
        this.cancel();
        if (fadeInSec) {
            this.nextFade = { durSec: fadeInSec, target: 1 };
            this.gainNode.gain.value = 0;
        }
        this.audioEle.loop = loop || false;
        this.audioEle.src = src;
        this.audioEle.load();
    }
    fade(durSec, target) {
        this.lastTarget = { endTime: this.ctx.currentTime + durSec, target };
        const g = this.gainNode.gain;
        const v = g.value;
        g.cancelScheduledValues(this.ctx.currentTime);
        g.value = v;
        g.linearRampToValueAtTime(target, this.lastTarget.endTime);
    }
    async wait() {
        const e = this.audioEle;
        if (e.loop || e.paused)
            return Promise.resolve();
        return new Promise((res, rej) => {
            const a = new AbortController();
            e.addEventListener(this.cancelEvName, () => rej(a.abort()), { once: true, signal: a.signal });
            e.addEventListener(this.finishEvName, () => res(a.abort()), { once: true, signal: a.signal });
            e.addEventListener('ended', () => res(a.abort()), { once: true, signal: a.signal });
        });
    }
    load(s) {
        this.cancel();
        if (s.src)
            this.play(s.src, s.loop);
        this.audioEle.currentTime = s.time;
        if (s.fade)
            this.nextFade = s.fade;
        this.gainNode.gain.value = s.gain;
    }
    save() {
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
    play(i, src, loop, fadeInMil) {
        this.chan[i].play(src, loop, fadeInMil && fadeInMil / 1000);
    }
    cancel(i, finish) {
        this.chan[i].cancel(finish);
    }
    fade(i, durMil, target) {
        this.chan[i].fade(durMil / 1000, target / 100);
    }
    async wait(i) {
        return this.chan[i].wait();
    }
    load(s) {
        this.chan.forEach((c) => c.cancel());
        this.chan.forEach((c, i) => i < s.length && c.load(s[i]));
    }
    save() {
        return this.chan.map((c) => c.save());
    }
}
class ChoiceWindow {
    root = document.createElement('div');
    curr = null;
    result = Promise.reject("don't worry, this is just an initial value");
    btns = [0, 1, 2, 3, 4, 5].map(() => document.createElement('div'));
    prom = null;
    constructor() {
        this.root.style.position = 'absolute';
        const c = 'cls-' + Math.random().toString(16).substring(2);
        this.root.appendChild(document.createElement('style')).innerText = G.choiceStyle(c);
        this.btns.forEach((d) => (this.root.appendChild(d).className = c));
        this.btns.forEach((e, i) => {
            e.onclick = (ev) => {
                ev.stopPropagation();
                this.onclick(e.dataset.label || null);
            };
        });
        this.cancelChoice();
    }
    loadRes(fs) {
        this.btns.forEach((e, i) => Object.assign(e.style, G.chBtnStyle(fs)));
    }
    cancelChoice() {
        this.root.style.display = 'none';
        this.btns.forEach((e) => (e.style.display = 'none'));
        this.prom?.reject();
        this.prom = null;
        this.curr = null;
    }
    onclick(label) {
        if (label) {
            this.prom?.resolve(label);
            this.prom = null;
        }
        this.cancelChoice();
    }
    showChoice(sels) {
        this.cancelChoice();
        if (sels.length == 0)
            return;
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
    load(s) {
        this.cancelChoice();
        if (s.sels)
            this.showChoice(s.sels);
    }
    save() {
        return { sels: this.curr };
    }
}
class Investigate {
    root = document.createElement('div');
    curr = false;
    result = Promise.reject("don't worry, this is just an initial value");
    prom = null;
    constructor() {
        Object.assign(this.root.style, G.whStyle, { position: 'absolute' });
        this.root.onclick = (ev) => {
            ev.stopPropagation();
            this.onclick(ev.target.dataset.index);
        };
        this.cancel();
    }
    setSVG(svgText) {
        this.root.innerHTML = svgText;
    }
    onclick(indexString) {
        if (!(indexString && this.curr))
            return;
        const index = parseInt(indexString);
        if (!Number.isInteger(index))
            return;
        this.prom?.resolve(index);
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
    load(s) {
        this.cancel();
        if (s.show)
            this.show();
    }
    save() {
        return { show: this.curr };
    }
}
class Flowers {
    root = document.createElement('div');
    stg = new Stage();
    vid = new MyVideo();
    snd = new MySound();
    inv = new Investigate();
    sel = new ChoiceWindow();
    dlg = new TextDlg(this.stg.avat.root);
    fs;
    scriptFiles;
    investigateScript = null;
    cancelEvName = 'can-' + Math.random().toString(16).substring(2);
    finishEvName = 'fin-' + Math.random().toString(16).substring(2);
    constructor(fs, scriptFiles, investigate) {
        Object.assign(this.root.style, G.whStyle, { position: 'relative', transformOrigin: '0 0' });
        this.root.append(this.stg.root, this.dlg.root, this.sel.root, this.inv.root, this.vid.root);
        this.root.addEventListener('click', () => {
            this.setAuto(false);
            this.setSkip(false);
        });
        this.fs = fs;
        this.scriptFiles = scriptFiles;
        if (investigate) {
            this.inv.setSVG(investigate.svg);
            this.investigateScript = investigate.script;
        }
    }
    loaded = false;
    async loadRes() {
        if (this.loaded)
            return;
        this.loaded = true;
        this.sel.loadRes(this.fs);
        await this.dlg.loadRes(this.fs);
        await this.snd.ctx.resume();
    }
    currWait = null;
    async doWait() {
        if (this.currWait == null)
            return;
        const { k, o } = this.currWait;
        switch (k) {
            case 'stageFade':
                if (this.stg.fade)
                    await this.rawWait([this.stg.fade.ci.finished, this.waitClick()], () => this.stg.cancelFade(true));
                break;
            case 'stageFlash':
                if (this.stg.flash)
                    await this.rawWait([this.stg.flash.a.finished, this.waitClick()], () => this.stg.cancelFlash(true));
                break;
            case 'yuriChange':
                const twoPromise = [];
                if (this.dlg.yuri.fade)
                    twoPromise.push(this.dlg.yuri.fade.ci.finished);
                if (this.dlg.yuri.flash)
                    twoPromise.push(this.dlg.yuri.flash.a.finished);
                if (twoPromise.length > 0)
                    await this.rawWait([...twoPromise, this.waitClick()], () => {
                        this.dlg.yuri.cancelFade(true);
                        this.dlg.yuri.cancelFlash(true);
                    });
                break;
            case 'dialogType':
                if (this.dlg.type.curr)
                    await this.rawWait([this.dlg.type.finished, this.waitClick()], () => this.dlg.type.cancel(true));
                return void (this.currWait = { k: 'clickVoice' });
            case 'dialogFade':
                if (this.dlg.fade)
                    await this.rawWait([this.dlg.fade.a.finished, this.waitClick()], () => this.dlg.cancelFade(true));
                break;
            case 'video':
                if (this.vid.curr)
                    await this.rawWait([this.vid.finished, this.waitClick()], () => this.vid.cancel(true));
                break;
            case 'clickTime':
                if (Number.isFinite(o))
                    await this.rawWait([this.waitTime(o), this.waitClick()]);
                break;
            case 'clickVoice':
                const clickVoice = [this.waitClick()];
                if (this.autoMode)
                    clickVoice.push(this.snd.wait(MySound.VO).then(() => this.waitTime(G.timeAfterVoice)));
                await this.rawWait(clickVoice);
                break;
            case 'choice':
                if (this.sel.curr)
                    this.jump(await this.sel.result);
                break;
            case 'investigate':
                if (this.investigateScript && this.inv.curr) {
                    this.invI = await this.inv.result;
                    this.jump(null, this.investigateScript);
                }
                else
                    throw new Error('trying to start investigation in a game without investigation');
                break;
        }
        this.currWait = null;
    }
    autoMode = false;
    autoCheck = null;
    setAuto(auto) {
        if (auto == this.autoMode)
            return;
        this.autoMode = auto;
        if (this.autoCheck)
            this.autoCheck.checked = auto;
        if (auto)
            this.root.dispatchEvent(new Event(this.finishEvName));
    }
    skipMode = false;
    skipCheck = null;
    setSkip(skip) {
        if (skip == this.skipMode)
            return;
        this.skipMode = skip;
        if (this.skipCheck)
            this.skipCheck.checked = skip;
        if (skip)
            this.root.dispatchEvent(new Event(this.finishEvName));
    }
    async waitTime(timeout) {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, timeout);
            this.root.addEventListener(this.finishEvName, resolve, { once: true });
            this.root.addEventListener(this.cancelEvName, reject, { once: true });
        });
    }
    async waitClick() {
        if (this.skipMode)
            return;
        return new Promise((resolve, reject) => {
            this.root.addEventListener('click', resolve, { once: true });
            this.root.addEventListener(this.finishEvName, resolve, { once: true });
            this.root.addEventListener(this.cancelEvName, reject, { once: true });
        });
    }
    async waitCancel() {
        return new Promise((resolve, reject) => {
            this.root.addEventListener(this.cancelEvName, reject, { once: true });
        });
    }
    async rawWait(waitables, finish) {
        const prom = Promise.race(waitables);
        prom.finally(finish);
        await prom;
    }
    pc = 0;
    file = '';
    code = [];
    sels = [];
    lbls = {};
    vars = {};
    invN = {};
    invI = 0;
    inRunUntilWait = false;
    beforeWait = null;
    waitLoad = null;
    running = false;
    async interpreter() {
        if (this.running)
            return;
        if (this.file == '') {
            this.running = true;
            this.jump(G.sys.lblStart, G.sys.sysScript);
        }
        while (this.running) {
            this.beforeWait?.();
            this.beforeWait = null;
            if (this.waitLoad)
                await this.waitLoad;
            if (this.currWait) {
                try {
                    await this.doWait();
                }
                catch (e) {
                    console.log('load save when waiting', e);
                }
            }
            else {
                this.inRunUntilWait = true;
                await this.runUntilWait();
                this.inRunUntilWait = false;
            }
        }
    }
    jump(label, file) {
        if (file) {
            if (!(file in this.scriptFiles || file in G.specialScripts))
                throw Error(`script ${file} not found`);
            this.pc = 0;
            this.file = file;
            this.code = this.scriptFiles[file] || G.specialScripts[file];
            this.lbls = {};
            this.code.forEach((line, i) => {
                if (typeof line == 'string')
                    this.lbls[line] = i;
            });
        }
        this.pc = label ? this.lbls[label] : 0;
    }
    async runUntilWait() {
        while (this.pc < this.code.length) {
            const inst = this.code[this.pc++];
            if (typeof inst == 'string')
                continue;
            const op = Object.getOwnPropertyNames(inst).filter((s) => !s.startsWith('_'))[0];
            const arg = inst[op];
            console.log(op, arg);
            switch (op) {
                case 'exit':
                    this.jump(G.sys.lblExit, G.sys.sysScript);
                    break;
                case 'varSet':
                    this.vars[arg.idx] = arg.val;
                    break;
                case 'varAdd':
                    this.vars[arg.idx] = (this.vars[arg.idx] || 0) + arg.val;
                    break;
                case 'jumpScript':
                    this.jump(null, arg.filename);
                    break;
                case 'jumpEqual':
                    if ((this.vars[arg.idx] || 0) == arg.val)
                        this.jump(arg.label);
                    break;
                case 'jumpGtEql':
                    if ((this.vars[arg.idx] || 0) >= arg.val)
                        this.jump(arg.label);
                    break;
                case 'jumpLtEql':
                    if ((this.vars[arg.idx] || 0) <= arg.val)
                        this.jump(arg.label);
                    break;
                case 'jump':
                    this.jump(arg.label);
                    break;
                case 'jumpCleared':
                    if (true)
                        this.jump(arg.label);
                    break;
                case 'selBeg':
                    this.sels.length = 0;
                    break;
                case 'selAdd':
                    this.sels.push({ text: arg.text, label: arg.label });
                    break;
                case 'selEnd':
                    this.sel.showChoice(this.sels);
                    return void (this.currWait = { k: 'choice' });
                case 'startInvestigate':
                case 'investigateRet':
                    if (!this.investigateScript) {
                        this.jump(G.sys.lblErrInv, G.sys.sysScript);
                        break;
                    }
                    else
                        this.inv.show();
                    return void (this.currWait = { k: 'investigate' });
                case 'zeroInvItemTimes':
                    this.invN = {};
                    break;
                case 'jumpInvItemTimesEq':
                    if ((this.invN[arg.idx] || 0) == arg.cnt)
                        this.jump(arg.label);
                    break;
                case 'jumpInvClickedPos':
                    this.jump(arg.labels[this.invI]);
                    break;
                case 'setInvItemTimes':
                    this.invN[arg.idx] = arg.cnt;
                    break;
                case 'bg_0f':
                case 'bg_10':
                    this.stg.bgImage(this.fs.bg(arg.filename));
                    break;
                case 'bgColor': {
                    const [b, g, r] = arg.bgr;
                    this.stg.bgColor(r, g, b);
                    break;
                }
                case 'fgClear':
                    this.stg.fgClearAll();
                    break;
                case 'fg_12':
                case 'fg_9c':
                    this.stg.fgImage(arg.layer, this.fs.fg(arg.filename));
                    break;
                case 'fgMetrics': {
                    const { layer, scale, xMid, yTop } = arg;
                    this.stg.fgParam(layer, xMid, yTop, scale);
                    break;
                }
                case 'crossfade':
                    await this.stg.begFade(arg.duration);
                    return void (this.currWait = { k: 'stageFade' });
                case 'animOptA': {
                    const { layer, xMid, yTop, xScale, yScale, alpha, repeats } = arg;
                    this.stg.fgAniA(layer, xMid, yTop, xScale, yScale, alpha, repeats);
                    break;
                }
                case 'animOptB': {
                    const { layer, xMid, yTop, xScale, yScale, alpha, duration, mode } = arg;
                    this.stg.fgAniB(layer, xMid, yTop, xScale, yScale, alpha, mode, duration);
                    break;
                }
                case 'animRunAll':
                    await this.stg.begAnim();
                    break;
                case 'animEndSingle':
                    this.stg.endAnim(arg.layer);
                    break;
                case 'animRun':
                    await this.stg.begAnim(...arg.layers.slice(0, arg.n));
                    break;
                case 'animEndMulti':
                    this.stg.endAnim(...arg.layers.slice(0, arg.n));
                    break;
                case 'avatar':
                    this.stg.avImage(this.fs.fg(arg.filename));
                    break;
                case 'effectStart':
                    this.stg.begShake(arg.distance, arg.duration, arg.loop);
                    break;
                case 'effectStop':
                    this.stg.cancelShake(true);
                    break;
                case 'flash':
                    this.stg.begFlash(['white', 'red', 'blue', 'green'][arg.color], arg.duration, arg.times);
                    return void (this.currWait = { k: 'stageFlash' });
                case 'bgmPlay':
                    this.snd.play(MySound.BGM, this.fs.bgm(arg.name), arg.loop);
                    break;
                case 'bgmStop':
                    this.snd.cancel(MySound.BGM, true);
                    break;
                case 'bgmFadeOut':
                    this.snd.fade(MySound.BGM, arg.duration, 0);
                    break;
                case 'bgmFadeIn':
                    this.snd.play(MySound.BGM, this.fs.bgm(arg.name), arg.loop, arg.duration);
                    break;
                case 'voPlay':
                    this.snd.play(MySound.VO, this.fs.voice(arg.name));
                    break;
                case 'sePlay':
                    this.snd.play(MySound.SE, this.fs.se(arg.name), arg.loop);
                    break;
                case 'seStop':
                    this.snd.cancel(MySound.SE, true);
                    break;
                case 'voStop':
                    this.snd.cancel(MySound.VO, true);
                    break;
                case 'seFadeOut':
                    this.snd.fade(MySound.SE, arg.duration, 0);
                    break;
                case 'seFadeIn':
                    this.snd.play(MySound.SE, this.fs.se(arg.name), arg.loop, arg.duration);
                    break;
                case 'bgmVolAnimDec':
                case 'bgmVolAnimInc':
                    this.snd.fade(MySound.BGM, arg.duration, arg.volume);
                    break;
                case 'seVolAnimDec':
                case 'seVolAnimInc':
                    this.snd.fade(MySound.SE, arg.duration, arg.volume);
                    break;
                case 'dialog':
                    if (arg.text.startsWith('＃'))
                        this.dlg.setPerson(arg.text.substring(1));
                    else {
                        this.dlg.addText(arg.text);
                        return void (this.currWait = { k: 'dialogType' });
                    }
                    break;
                case 'dialogVisible':
                    if (arg.visible == false)
                        this.dlg.setVisible(arg.visible);
                    break;
                case 'dialogClear':
                    this.dlg.clear();
                    break;
                case 'dialogFade':
                    this.dlg.setVisible(arg.visible, arg.duration);
                    return void (this.currWait = { k: 'dialogFade' });
                case 'dialogMode':
                    this.dlg.setMode(arg.mode != 0);
                    break;
                case 'yuri':
                    this.dlg.yuri.nextLevel(((this.vars[100] ?? 128) - 128) / 16 + 4);
                    this.dlg.yuri.begFade(1000);
                    this.dlg.yuri.begFlash(['white', 'yellow', 'cyan'][arg.action], 1000);
                    return void (this.currWait = { k: 'yuriChange' });
                case 'waitTime':
                    return void (this.currWait = { k: 'clickTime', o: arg.duration });
                case 'waitClick':
                    return void (this.currWait = { k: 'clickVoice' });
                case 'video':
                    this.vid.play(this.fs.video(arg.kind));
                    return void (this.currWait = { k: 'video' });
                case 'credits':
                    break;
                case 'markEnd_1e':
                case 'markEnding':
                case 'markGoodEnd':
                case 'markTrueEnd':
                case 'markChapter':
                case 'dialogIdx':
                case 'dialogLog':
                case 'op_0x36':
                case 'op_0xba':
                    break;
                default:
                    throw new Error('unknown instruction');
            }
        }
        return this.jump(G.sys.lblExit, G.sys.sysScript);
    }
    async save() {
        if (this.inRunUntilWait)
            await new Promise((resolve) => (this.beforeWait = resolve));
        return {
            stg: this.stg.save(),
            vid: this.vid.save(),
            snd: this.snd.save(),
            inv: this.inv.save(),
            sel: this.sel.save(),
            dlg: this.dlg.save(),
            wait: this.currWait,
            pc: this.pc,
            file: this.file,
            sels: this.sels,
            vars: this.vars,
            invN: this.invN,
            invI: this.invI
        };
    }
    async load(s) {
        if (this.inRunUntilWait)
            await new Promise((resolve) => (this.beforeWait = resolve));
        const { promise, resolve } = Promise.withResolvers();
        this.waitLoad = promise;
        this.root.dispatchEvent(new Event(this.cancelEvName));
        this.vid.load(s.vid);
        this.snd.load(s.snd);
        this.inv.load(s.inv);
        this.sel.load(s.sel);
        this.dlg.load(s.dlg);
        this.currWait = s.wait;
        this.jump(null, s.file);
        this.pc = s.pc;
        this.sels = s.sels;
        this.vars = s.vars;
        this.invN = s.invN;
        this.invI = s.invI;
        await this.stg.load(s.stg);
        return resolve();
    }
}
{
    G.sys.lblExit = 'scrExit';
    G.sys.lblStart = 'sysStart';
    G.sys.lblErrInv = 'errNoInv';
    const dlgHide = [{ dialogFade: { visible: 0, duration: 200 } }, { dialogClear: {} }];
    const dlgShow = [{ dialogClear: {} }, { dialogFade: { visible: 1, duration: 200 } }];
    G.specialScripts[(G.sys.sysScript = '_system')] = [
        G.sys.lblExit,
        { dialog: { text: '游戏结束，回到启动画面' } },
        ...dlgHide,
        { jump: { label: G.sys.lblStart } },
        G.sys.lblStart,
        { varSet: { idx: 100, val: 128 } },
        { yuri: { action: 1 } },
        { bgColor: { bgr: [0, 0, 0] } },
        { crossfade: { duration: 200 } },
        { jump: { label: 'startMenu' } },
        'igStart',
        ...dlgHide,
        { bgColor: { bgr: [0, 0, 0] } },
        { crossfade: { duration: 1 } },
        { bg_0f: { filename: '../system/LOGO1.bmp' } },
        { crossfade: { duration: 5000 } },
        { waitTime: { duration: 1000 } },
        { bg_0f: { filename: '../system/LOGO2.bmp' } },
        { crossfade: { duration: 5000 } },
        { waitTime: { duration: 1000 } },
        { bg_0f: { filename: '../system/CAUTION01.bmp' } },
        { crossfade: { duration: 5000 } },
        { waitTime: { duration: 1000 } },
        { bgColor: { bgr: [0, 0, 0] } },
        { crossfade: { duration: 5000 } },
        { jump: { label: 'startMenu' } },
        'startMenu',
        ...dlgShow,
        { dialog: { text: '游戏已启动，现在你可以加载存档或新开始游戏' } },
        { selBeg: {} },
        { selAdd: { text: '开始游戏', label: 'startGame' } },
        { selAdd: { text: 'IG启动画面', label: 'igStart' } },
        { selAdd: { text: '播放视频', label: 'startMenuVideo' } },
        { selEnd: {} },
        'startGame',
        ...dlgHide,
        { jumpScript: { filename: 'start.s' } },
        'startMenuVideo',
        ...dlgHide,
        { selBeg: {} },
        { selAdd: { text: '返回启动菜单', label: 'startMenu' } },
        { selAdd: { text: '播放OP视频', label: 'opVideo' } },
        { selAdd: { text: '(冬篇)播放OP2', label: 'hiverOp2' } },
        { selAdd: { text: '(冬篇)播放GrandFinale', label: 'hiverGF' } },
        { selAdd: { text: '测试调查(冬篇)', label: 'testInv' } },
        { selEnd: {} },
        'opVideo',
        { video: { kind: 0 } },
        { jump: { label: 'startMenu' } },
        'hiverOp2',
        { video: { kind: 2 } },
        { jump: { label: 'startMenu' } },
        'hiverGF',
        { video: { kind: 1 } },
        { jump: { label: 'startMenu' } },
        'testInv',
        { "bg_0f": { "layer": 1, "filename": "cut08c.bmp" } },
        { "crossfade": { "duration": 1000 } },
        { "dialog": { "text": "私が気付いた、この二人の共通点は二つ――" }, "__afterString": [0, 60, 130, 179] },
        { "varSet": { "idx": 103, "val": 0 } },
        { "varSet": { "idx": 104, "val": 0 } },
        { "zeroInvItemTimes": {} },
        { "startInvestigate": { "idx": 1 } },
        G.sys.lblErrInv,
        { dialog: { text: '错误：当前游戏没有调查环节，现在返回启动界面' } },
        ...dlgHide,
        { jump: { label: G.sys.lblStart } },
    ];
}
//# sourceMappingURL=index.js.map