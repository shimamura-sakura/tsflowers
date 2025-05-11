type CodeLine = string | CodeInst;
type CodeInst = { [op: string]: { [k: string]: any; }; };
type DataVars = { [idx: number]: number; };
type InvCount = { [idx: number]: number; };
type GameScript = { [file: string]: CodeLine[]; };
type Waiting = { k: WaitKind; o?: any; };
type WaitKind =
  | 'stageFade'
  | 'stageFlash'
  | 'yuriChange'
  | 'dialogType'
  | 'dialogFade'
  | 'video'
  | 'clickVoice'
  | 'clickTime'
  | 'choice'
  | 'investigate';

class Flowers {
  root = document.createElement('div');
  private stg = new Stage();
  private vid = new MyVideo();
  private snd = new MySound();
  private inv = new Investigate();
  private sel = new ChoiceWindow();
  private dlg = new TextDlg(this.stg.avat.root);
  private fs: MyFS;
  private scriptFiles: GameScript;
  private investigateScript: null | string = null;
  private cancelEvName = 'can-' + Math.random().toString(16).substring(2);
  private finishEvName = 'fin-' + Math.random().toString(16).substring(2);
  constructor(fs: MyFS, scriptFiles: GameScript, investigate?: { script: string; svg: string; }) {
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
    if (this.loaded) return;
    this.loaded = true;
    this.sel.loadRes(this.fs);
    await this.dlg.loadRes(this.fs);
    await this.snd.ctx.resume();
  }
  private currWait: null | Waiting = null;
  private async doWait() {
    if (this.currWait == null) return;
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
        const twoPromise: Promise<any>[] = [];
        if (this.dlg.yuri.fade) twoPromise.push(this.dlg.yuri.fade.ci.finished);
        if (this.dlg.yuri.flash) twoPromise.push(this.dlg.yuri.flash.a.finished);
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
        if (this.vid.curr) await this.rawWait([this.vid.finished, this.waitClick()], () => this.vid.cancel(true));
        break;
      case 'clickTime':
        if (Number.isFinite(o)) await this.rawWait([this.waitTime(o), this.waitClick()]);
        break;
      case 'clickVoice':
        const clickVoice: Promise<any>[] = [this.waitClick()];
        if (this.autoMode) clickVoice.push(this.snd.wait(MySound.VO).then(() => this.waitTime(G.timeAfterVoice)));
        await this.rawWait(clickVoice /* , stopVoiceAfterDialog ? () => this.snd.cancel(MySound.VO) */);
        break;
      case 'choice':
        if (this.sel.curr) this.jump(await this.sel.result);
        break;
      case 'investigate':
        if (this.investigateScript && this.inv.curr) {
          this.invI = await this.inv.result;
          this.jump(null, this.investigateScript);
        } else throw new Error('trying to start investigation in a game without investigation');
        break;
    }
    this.currWait = null;
  }
  autoMode: boolean = false;
  autoCheck: null | HTMLInputElement = null;
  setAuto(auto: boolean) {
    if (auto == this.autoMode) return;
    this.autoMode = auto;
    if (this.autoCheck) this.autoCheck.checked = auto;
    if (auto) this.root.dispatchEvent(new Event(this.finishEvName));
  }
  skipMode: boolean = false;
  skipCheck: null | HTMLInputElement = null;
  setSkip(skip: boolean) {
    if (skip == this.skipMode) return;
    this.skipMode = skip;
    if (this.skipCheck) this.skipCheck.checked = skip;
    if (skip) this.root.dispatchEvent(new Event(this.finishEvName));
  }
  private async waitTime(timeout: number) {
    return new Promise((resolve, reject) => {
      setTimeout(resolve, timeout);
      this.root.addEventListener(this.finishEvName, resolve, { once: true });
      this.root.addEventListener(this.cancelEvName, reject, { once: true });
    });
  }
  private async waitClick() {
    if (this.skipMode) return;
    return new Promise((resolve, reject) => {
      this.root.addEventListener('click', resolve, { once: true });
      this.root.addEventListener(this.finishEvName, resolve, { once: true });
      this.root.addEventListener(this.cancelEvName, reject, { once: true });
    });
  }
  private async waitCancel() {
    return new Promise((resolve, reject) => {
      this.root.addEventListener(this.cancelEvName, reject, { once: true });
    });
  }
  private async rawWait(waitables: PromiseLike<any>[], finish?: () => void) {
    const prom = Promise.race(waitables);
    prom.finally(finish);
    await prom;
  }
  private pc: number = 0;
  private file: string = '';
  private code: CodeLine[] = [];
  private sels: MyChoice[] = [];
  private lbls: { [label: string]: number; } = {};
  private vars: DataVars = {};
  private invN: InvCount = {};
  private invI: number = 0;
  private inRunUntilWait = false;
  private beforeWait: null | (() => void) = null;
  private waitLoad: Promise<void> | null = null;
  private running = false;
  private async interpreter() {
    if (this.running) return;
    if (this.file == '') {
      this.running = true;
      this.jump(G.sys.lblStart, G.sys.sysScript);
    }
    while (this.running) {
      this.beforeWait?.();
      this.beforeWait = null;
      if (this.waitLoad) await this.waitLoad;
      if (this.currWait) {
        try {
          await this.doWait();
        } catch (e) {
          console.log('load save when waiting', e);
        }
      } else {
        this.inRunUntilWait = true;
        await this.runUntilWait();
        this.inRunUntilWait = false;
      }
    }
  }
  private jump(label: string | null, file?: string) {
    if (file) {
      if (!(file in this.scriptFiles || file in G.specialScripts)) throw Error(`script ${file} not found`);
      this.pc = 0;
      this.file = file;
      this.code = this.scriptFiles[file] || G.specialScripts[file];
      this.lbls = {};
      this.code.forEach((line, i) => {
        if (typeof line == 'string') this.lbls[line] = i;
      });
    }
    this.pc = label ? this.lbls[label] : 0;
  }
  private async runUntilWait() {
    while (this.pc < this.code.length) {
      const inst = this.code[this.pc++];
      if (typeof inst == 'string') continue;
      const op = Object.getOwnPropertyNames(inst).filter((s) => !s.startsWith('_'))[0];
      const arg = inst[op];
      console.log(op, arg);
      switch (op) {
        // 1. Control
        // 1.1 Variable and Control Flow
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
          if ((this.vars[arg.idx] || 0) == arg.val) this.jump(arg.label);
          break;
        case 'jumpGtEql':
          if ((this.vars[arg.idx] || 0) >= arg.val) this.jump(arg.label);
          break;
        case 'jumpLtEql':
          if ((this.vars[arg.idx] || 0) <= arg.val) this.jump(arg.label);
          break;
        case 'jump':
          this.jump(arg.label);
          break;
        case 'jumpCleared':
          if (true /* && sysSave.gameCleared[arg.idx] */) this.jump(arg.label);
          break;
        // 1.2 Choice
        case 'selBeg':
          this.sels.length = 0;
          break;
        case 'selAdd':
          this.sels.push({ text: arg.text, label: arg.label });
          break;
        case 'selEnd':
          this.sel.showChoice(this.sels);
          return void (this.currWait = { k: 'choice' });
        // 1.3 Investigation
        case 'startInvestigate':
        case 'investigateRet':
          if (!this.investigateScript) {
            this.jump(G.sys.lblErrInv, G.sys.sysScript);
            break;
          } else this.inv.show();
          return void (this.currWait = { k: 'investigate' });
        case 'zeroInvItemTimes':
          this.invN = {};
          break;
        case 'jumpInvItemTimesEq':
          if ((this.invN[arg.idx] || 0) == arg.cnt) this.jump(arg.label);
          break;
        case 'jumpInvClickedPos':
          this.jump(arg.labels[this.invI]);
          break;
        case 'setInvItemTimes':
          this.invN[arg.idx] = arg.cnt;
          break;
        // 2. Stage
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
        // 3. Audio (BGM, Voice, SE)
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
        // 4. Dialog
        case 'dialog':
          if (arg.text.startsWith('＃')) this.dlg.setPerson((arg.text as string).substring(1));
          else {
            this.dlg.addText(arg.text);
            return void (this.currWait = { k: 'dialogType' });
          }
          break;
        case 'dialogVisible':
          if (arg.visible == false) this.dlg.setVisible(arg.visible); // fix some bug ?
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
          // todo yuri fade
          this.dlg.yuri.nextLevel(((this.vars[100] ?? 128) - 128) / 16 + 4);
          this.dlg.yuri.begFade(1000);
          this.dlg.yuri.begFlash(['white', 'yellow', 'cyan'][arg.action], 1000);
          return void (this.currWait = { k: 'yuriChange' });
        // 5. Timing
        case 'waitTime':
          return void (this.currWait = { k: 'clickTime', o: arg.duration });
        case 'waitClick':
          return void (this.currWait = { k: 'clickVoice' });
        // 6. Others
        case 'video':
          this.vid.play(this.fs.video(arg.kind));
          return void (this.currWait = { k: 'video' });
        case 'credits':
          break;
        // 999. Ignored
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
        // 999. Unknown and TODO
        default:
          throw new Error('unknown instruction');
      }
    }
    return this.jump(G.sys.lblExit, G.sys.sysScript);
  }
  async save(): Promise<FlowersSave> {
    if (this.inRunUntilWait) await new Promise<void>((resolve) => (this.beforeWait = resolve));
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
  async load(s: FlowersSave) {
    if (this.inRunUntilWait) await new Promise<void>((resolve) => (this.beforeWait = resolve));
    const { promise, resolve } = Promise.withResolvers<void>();
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

type FlowersSave = {
  stg: StageSave;
  vid: VideoSave;
  snd: ChanSave[];
  inv: InvestigateSave;
  sel: ChoiceSave;
  dlg: TextDlgSave;
  wait: null | Waiting;
  pc: number;
  file: string;
  sels: MyChoice[];
  vars: DataVars;
  invN: InvCount;
  invI: number;
};
