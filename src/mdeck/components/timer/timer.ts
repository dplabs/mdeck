import type EventEmitter from 'eventemitter3';

interface TimerOptions {
  enabled?: boolean;
  resetable?: boolean;
  startOnChange?: boolean;
  formatter?: (elapsedTime: number) => string;
}

export class Timer {
  private options: Required<TimerOptions>;
  private element: HTMLElement;
  private chronos: Chronos;
  private state: State;
  private view: TimerView;
  private INITIAL: State;
  private RUNNING: State;
  private PAUSED: State;

  constructor(events: EventEmitter, element: HTMLElement, options?: TimerOptions) {
    this.INITIAL = new State('INITIAL', () => {});
    this.RUNNING = new State('RUNNING', (c) => c.addDelta());
    this.PAUSED = new State('PAUSED', () => {});

    this.options = Object.assign({ enabled: true, resetable: true, startOnChange: true, formatter: defaultFormatter }, options || {});
    this.element = element;
    this.chronos = new Chronos();
    this.state = this.INITIAL;
    this.view = new TimerView(element, this.options);

    events.on('start', () => { if (this.options.startOnChange) events.emit('startTimer'); });
    events.on('startTimer', () => this.start());
    events.on('pauseTimer', () => this.pause());
    events.on('toggleTimer', () => this.toggle());
    events.on('resetTimer', () => { if (this.options.resetable) this.reset(); });

    setInterval(() => this.tick(), 100);
  }

  tick() {
    this.chronos.tick();
    this.state.update(this.chronos);
    this.view.update(this.chronos.elapsedTime);
  }
  start() { this.state = this.RUNNING; }
  pause() { this.state = this.PAUSED; }
  toggle() { this.state = this.state === this.RUNNING ? this.PAUSED : this.RUNNING; }
  reset() {
    this.chronos = new Chronos();
    this.state = this.INITIAL;
    this.view = new TimerView(this.element, this.options);
  }
}

class Chronos {
  currentTick: number;
  lastTick: number;
  elapsedTime = 0;
  constructor() { this.currentTick = this.lastTick = Date.now(); }
  tick() { this.lastTick = this.currentTick; this.currentTick = Date.now(); }
  addDelta() { this.elapsedTime += this.currentTick - this.lastTick; }
}

class State {
  constructor(public identifier: string, private updater: (c: Chronos) => void) {}
  update(c: Chronos) { this.updater(c); }
}

class TimerView {
  constructor(private element: HTMLElement, private options: Required<TimerOptions>) {
    if (!options.enabled) (element as HTMLElement).style.display = 'none';
  }
  update(elapsedTime: number) {
    this.element.innerHTML = this.options.enabled ? this.options.formatter(elapsedTime) : '';
  }
}

function defaultFormatter(ms: number): string {
  let left = ms;
  left = Math.floor(left / 1000);
  const seconds = left % 60; left = Math.floor(left / 60);
  const minutes = left % 60; left = Math.floor(left / 60);
  const hours = left;
  return `${hours}:${[minutes, seconds].map((d) => String(d).padStart(2, '0')).join(':')}`;
}
