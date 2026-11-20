// 表单桩：show() 按脚本里的调用顺序从队列取一个应答
export const uiQueue = [];
export const uiShown = [];
export const uiState = { current: null };

class Base {
  constructor(kind) { this.kind = kind; this.buttons_ = []; this.title_ = ""; this.body_ = ""; this.fields_ = []; }
  title(t) { this.title_ = t; return this; }
  body(t) { this.body_ = t; return this; }
  button(t) { this.buttons_.push(t); return this; }
  textField(label, placeholder, options) {
    if (typeof placeholder !== "string" && typeof placeholder !== "object") throw new Error("textField 第2参必须是 placeholder");
    this.fields_.push({ label, placeholder, options });
    return this;
  }
  async show(player) {
    uiState.current = { kind: this.kind, title: this.title_, body: this.body_, buttons: [...this.buttons_], fields: [...this.fields_], player };
    uiShown.push(uiState.current);
    const next = uiQueue.shift();
    if (!next) throw new Error("表单应答队列已空：" + this.kind + " / " + this.title_);
    return next;
  }
}
export class ActionFormData extends Base { constructor() { super("action"); } }
export class ModalFormData extends Base { constructor() { super("modal"); } }
export class MessageFormData extends Base { constructor() { super("message"); } }
