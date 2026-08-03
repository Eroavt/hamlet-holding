import { Emitter } from './Emitter';

export type Stage = 'boot' | 'universe' | 'collapse' | 'select' | 'detail';

type Events = {
  change: { from: Stage; to: Stage };
};

const ALLOWED: Record<Stage, Stage[]> = {
  boot: ['universe', 'select'],
  universe: ['collapse'],
  collapse: ['select'],
  select: ['detail', 'collapse'],
  detail: ['select', 'detail'],
};

/**
 * Guards the order of the experience. Every visual transition is keyed off
 * this — nothing animates because a click happened, it animates because the
 * stage changed. That keeps double-clicks and stray keyboard input from
 * starting a second, overlapping timeline.
 */
export class StageMachine extends Emitter<Events> {
  private current: Stage = 'boot';
  /** True while a transition timeline is running. */
  busy = false;

  get stage(): Stage {
    return this.current;
  }

  can(to: Stage): boolean {
    return !this.busy && ALLOWED[this.current].includes(to);
  }

  go(to: Stage): boolean {
    if (!this.can(to)) return false;
    const from = this.current;
    this.current = to;
    document.documentElement.dataset.stage = to;
    this.emit('change', { from, to });
    return true;
  }

  /** Jump without guards — used once, for deep-linked cold starts. */
  reset(to: Stage): void {
    const from = this.current;
    this.current = to;
    document.documentElement.dataset.stage = to;
    this.emit('change', { from, to });
  }
}
