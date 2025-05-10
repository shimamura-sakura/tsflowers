const elflowers = document.getElementById('flowers');
const container = document.getElementById('container');
container.addEventListener('fullscreenchange', (ev) => {
  if (!document.fullscreenElement) {
    fl.root.style.removeProperty('scale');
    elflowers.style.removeProperty('width');
    elflowers.style.removeProperty('height');
    elflowers.style.removeProperty('padding');
  }
});
window.addEventListener('resize', (ev) => {
  if (!document.fullscreenElement) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const s = Math.min(w / 1280, h / 720);
  fl.root.style.scale = s.toString();
  Object.assign(elflowers.style, { width: `${1280 * s}px`, height: `${720 * s}px` });
});
fl.autoCheck = document.getElementById('autoCheck');
fl.skipCheck = document.getElementById('skipCheck');
let flStarted = false;
function flStart() {
  if (flStarted) return;
  flStarted = true;
  document.getElementById('placeholder').replaceWith(fl.root);
  fl.loadRes().then(() => fl.interpreter());
}
const savebtn = document.getElementById('save');
const loadbtn = document.getElementById('load');
const notify = document.getElementById('notify');
function myAlert(s) {
  notify.innerText = s;
  notify.style.animation = 'bg-flash-red 0.5s infinite';
  setTimeout(() => notify.style.removeProperty('animation'), 1000);
}
{
  const savelist = document.getElementById('savelist');
  const savetxt = document.getElementById('savetext');
  savebtn.onclick = () => {
    if (!flStarted) return myAlert('还未开始，请先点击开始');
    fl.save().then(o => {
      o = JSON.stringify(o);
      addSaveEntry(o);
      saveToStor();
      savetxt.value = o;
      savebtn.innerText = '已保存!';
      setTimeout(() => savebtn.innerText = '保存', 1000);
      doCopy(o);
    });
  };
  loadbtn.onclick = function () { gameLoad(savetxt.value, this); };
  function entryDele() { this.parentElement.remove(); saveToStor(); }
  function entryLoad() { gameLoad(this.parentElement.dataset.save, this); }
  function entryCopy() { doCopy(this.parentElement.dataset.save, this, true); }
  function entryNote() {
    const inNote = this.parentElement.querySelector('input');
    this.parentElement.dataset.note = inNote.value;
    this.innerText = '已更新!';
    saveToStor();
    setTimeout(() => this.innerText = '更新笔记', 1000);
  }
  async function doCopy(s, btn, forceAlert) {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(s);
        if (btn) {
          btn.innerText = '已复制!';
          setTimeout(() => btn.innerText = '复制', 1000);
        }
        return;
      }
    } catch (e) { }
    myAlert('无法访问剪贴板，请手动从输入框或提示窗口中复制');
    if (forceAlert) prompt('请手动复制', s);
  }
  function addSaveEntry(s, date, note) {
    const li = document.createElement('li');
    document.getElementById('firstload').insertAdjacentElement("afterend", li);
    li.className = 'save';
    li.dataset.save = s;
    li.dataset.date = date || Date().toString();
    li.dataset.note = note || '';
    li.append(li.dataset.date);
    const btnLoad = li.appendChild(document.createElement('button'));
    btnLoad.innerText = '加载';
    btnLoad.onclick = entryLoad;
    const btnCopy = li.appendChild(document.createElement('button'));
    btnCopy.innerText = '复制';
    btnCopy.onclick = entryCopy;
    const inNote = li.appendChild(document.createElement('input'));
    inNote.size = 20;
    inNote.placeholder = '笔记';
    inNote.value = li.dataset.note;
    const btnNote = li.appendChild(document.createElement('button'));
    btnNote.innerText = '更新笔记';
    btnNote.onclick = entryNote;
    const btnDele = li.appendChild(document.createElement('button'));
    btnDele.innerText = '删除';
    btnDele.onclick = entryDele;
  }
  function gameLoad(s, btn) {
    if (s == null || s == '') return;
    if (!flStarted) return myAlert('还未开始，请先点击开始');
    try {
      s = JSON.parse(s);
    } catch (e) { return myAlert(`加载失败: ${e.toString()}`); }
    fl.load(s).then(() => {
      if (!btn) return;
      btn.innerText = '已加载!';
      setTimeout(() => btn.innerText = '加载', 1000);
    });
  }
  const storItemName = `flowers-${fl.fs.root}`;
  function loadFromStor() {
    let s = localStorage.getItem(storItemName);
    if (!s) return;
    s = JSON.parse(s);
    for (const { date, note, save } of s) addSaveEntry(save, date, note);
  }
  function saveToStor() {
    const o = Array.from(savelist.querySelectorAll('li.save')).reverse().map(e => ({
      date: e.dataset.date,
      note: e.dataset.note,
      save: e.dataset.save,
    }));
    localStorage.setItem(storItemName, JSON.stringify(o));
  }
}
document.body.onkeydown = document.body.onkeyup = function (ev) {
  const k = ev.key.toLowerCase();
  const d = ev.type == 'keydown';
  switch (k) {
    case 'x':
      fl.setSkip(d);
      break;
    case 'a':
      if (!d) fl.setAuto(!fl.autoMode);
      break;
    case 's':
      if (!d) savebtn.click();
      break;
    case 'l':
      if (!d) loadbtn.click();
      break;
    case 'z':
      if (!d) fl.root.click();
      break;
  }
};
loadFromStor();
// for electron: flStart();