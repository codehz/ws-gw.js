import * as WS from "ws";
import { deferred, Deferred } from "./deferred";

export interface MinWebSocket {
  send(data: string | ArrayBuffer): Promise<void>;
  recv(): Promise<string | ArrayBuffer>;
  close(): void;
}

export default async function connect(endpoint: string): Promise<MinWebSocket> {
  const ws = new WS(endpoint);
  const xopen = deferred<void>();
  let err = xopen.reject;
  ws.binaryType = "arraybuffer";
  ws.once("open", () => xopen.resolve());
  ws.on("error", (msg) => err("err: " + msg));
  ws.on("close", (msg) => err("close: " + msg));
  await xopen;
  const queued: Array<string | ArrayBuffer> = [];
  let frames: Array<Deferred<string | ArrayBuffer>> = [];
  ws.on("message", (data) => {
    if (frames.length === 0) queued.push(data as any);
    else {
      frames.shift().resolve(data as any);
    }
  });
  err = (msg) => {
    frames.forEach((x) => x.reject(msg));
    frames = [];
  };
  return {
    send(data: string | ArrayBuffer): Promise<void> {
      return new Promise((resolve, reject) => {
        ws.send(data, (e) => {
          if (e) {
            reject(e);
            err(e);
          } else {
            resolve();
          }
        });
      });
    },
    async recv() {
      if (queued.length) return queued.shift();
      const frame = deferred<string | ArrayBuffer>();
      frames.push(frame);
      const ret = await frame;
      return ret;
    },
    close() {
      err = () => {};
      try {
        ws.close();
      } catch {}
    },
  };
}
