import { DeviceStepLogger } from './runtime.js';
import { ScrcpySession, type VideoPacketSink } from './scrcpySession.js';
import type { StreamQuery } from './protocol.js';
import { log, warn } from './logger.js';

// Keep startup concurrency low. ADB gets unstable if 16-35 scrcpy servers start at once.
const MAX_START_CONCURRENCY = Number(process.env.MONVIEW_STREAM_START_CONCURRENCY ?? 2);

type QueueJob<T> = {
  udid: string;
  run: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
};

export class SessionManager {
  #sessions = new Map<string, ScrcpySession>();
  #queue: QueueJob<unknown>[] = [];
  #activeStarts = 0;

  async start(query: StreamQuery, onVideoPacket: VideoPacketSink): Promise<ScrcpySession> {
    log(query.udid, `[MANAGER] start requested. queue=${this.#queue.length}, activeStarts=${this.#activeStarts}`);

    await this.close(query.udid);

    const session = new ScrcpySession(query, new DeviceStepLogger(query.udid, `${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 6)}`));
    this.#sessions.set(query.udid, session);

    try {
      await this.#enqueue(query.udid, () => session.start(onVideoPacket));
      return session;
    } catch (e) {
      if (this.#sessions.get(query.udid) === session) {
        this.#sessions.delete(query.udid);
      }
      const wasCancelled = session.closed || String((e as Error)?.message ?? e).includes('cancelled');
      await session.close();
      if (wasCancelled) {
        warn(query.udid, `[MANAGER] start cancelled, not counted as crash: ${String((e as Error)?.message ?? e)}`);
      } else {
        warn(query.udid, `[MANAGER] start failed: ${String((e as Error)?.message ?? e)}`);
      }
      throw e;
    }
  }

  get(udid: string) {
    return this.#sessions.get(udid);
  }

  async close(udid: string) {
    const previous = this.#sessions.get(udid);
    if (!previous) return;
    this.#sessions.delete(udid);
    previous.trace.step('MANAGER_CLOSE_EXISTING_SESSION');
    await previous.close();
  }

  async closeIfCurrent(udid: string, session: ScrcpySession) {
    const current = this.#sessions.get(udid);
    if (current !== session) {
      session.trace.step('MANAGER_SKIP_CLOSE_STALE_SESSION');
      return false;
    }
    this.#sessions.delete(udid);
    session.trace.step('MANAGER_CLOSE_CURRENT_SESSION');
    await session.close();
    return true;
  }

  async closeAll() {
    await Promise.all(Array.from(this.#sessions.keys()).map((udid) => this.close(udid)));
  }

  #enqueue<T>(udid: string, run: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.#queue.push({ udid, run, resolve: resolve as (value: unknown) => void, reject });
      log(udid, `[QUEUE] enqueued. queueSize=${this.#queue.length}, activeStarts=${this.#activeStarts}, max=${MAX_START_CONCURRENCY}`);
      this.#pump();
    });
  }

  #pump() {
    while (this.#activeStarts < MAX_START_CONCURRENCY && this.#queue.length > 0) {
      const job = this.#queue.shift()!;
      this.#activeStarts++;
      log(job.udid, `[QUEUE] dequeued/start. remaining=${this.#queue.length}, activeStarts=${this.#activeStarts}`);
      job.run()
        .then(job.resolve, job.reject)
        .finally(() => {
          this.#activeStarts--;
          log(job.udid, `[QUEUE] finished. remaining=${this.#queue.length}, activeStarts=${this.#activeStarts}`);
          this.#pump();
        });
    }
  }
}

export const sessionManager = new SessionManager();
