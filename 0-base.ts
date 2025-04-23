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
  dRubyStyle: (c: string) => `.${c}{ruby-align:center;line-height:46px}rt{font:12px FlowersRuby}`,
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
  choiceStyle: (c: string) => `.${c}:hover{background-position-y:147px}`,
  chBtnStyle: (i: number, fs: MyFS) => ({
    width: '908px',
    height: '74px',
    fontSize: '26px',
    lineHeight: '74px',
    fontFamily: 'FlowersText',
    position: 'absolute',
    top: `${186 + i * 78}px`,
    left: `${132 + i * 80}px`,
    backgroundImage: `url(${fs.system('select_p.png')})`,
    textAlign: 'center'
  }),
  videoStyle: { position: 'absolute', zIndex: '2' },
  async loadImg(src: string, img?: HTMLImageElement) {
    img ||= new Image();
    await new Promise((res, rj) => {
      const a = new AbortController();
      img.addEventListener('load', () => res(a.abort()), { once: true, signal: a.signal });
      img.addEventListener('error', () => rj(a.abort()), { once: true, signal: a.signal });
      img.src = src;
    });
    return img;
  }
};

class MyFS {
  root: string;
  videos: string[];
  useSmall: boolean;
  constructor(useSmall: boolean, root: string, ...videos: string[]) {
    this.root = root;
    this.videos = videos;
    this.useSmall = useSmall;
  }
  bgm(name: string) {
    return this.toSmallFilename(`${this.root}/bgm/${name.toLowerCase()}.ogg`); // NOTE: rename to lower
  }
  voice(name: string) {
    return this.toSmallFilename(`${this.root}/voice/${name}.ogg`);
  }
  se(name: string) {
    return this.toSmallFilename(`${this.root}/se/${name}.ogg`);
  }
  bg(filename: string) {
    return this.toSmallFilename(`${this.root}/bgimage/${filename}`);
  }
  fg(filename: string) {
    return this.toSmallFilename(`${this.root}/fgimage/${filename}`);
  }
  system(filename: string) {
    return this.toSmallFilename(`${this.root}/system/${filename}`);
  }
  avatar(filename: string) {
    return this.fg(filename);
  }
  video(i: number) {
    const filename = this.videos[i] || 'op.mpg';
    return this.toSmallFilename(`${this.root}/video/${filename}`);
  }
  toSmallFilename(s: string) {
    s = s.replace('.mpg', '.webm'); // video
    if (!this.useSmall) return s;
    s = s.replace('.ogg', '.opus'); // audio
    s = s.replace('.bmp', '.webp').replace('.png', '.webp');
    return s;
  }
}
