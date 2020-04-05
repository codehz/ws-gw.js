"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WS = require("ws");
const deferred_1 = require("./deferred");
async function connect(endpoint) {
    const ws = new WS(endpoint);
    const xopen = deferred_1.deferred();
    let err = xopen.reject;
    ws.binaryType = "arraybuffer";
    ws.once("open", () => xopen.resolve());
    ws.on("error", (msg) => err("err: " + msg));
    ws.on("close", (msg) => err("close: " + msg));
    await xopen;
    const queued = [];
    let frames = [];
    ws.on("message", (data) => {
        if (frames.length === 0)
            queued.push(data);
        else {
            frames.shift().resolve(data);
        }
    });
    err = (msg) => {
        frames.forEach((x) => x.reject(msg));
        frames = [];
    };
    return {
        send(data) {
            return new Promise((resolve, reject) => {
                ws.send(data, (e) => {
                    if (e) {
                        reject(e);
                        err(e);
                    }
                    else {
                        resolve();
                    }
                });
            });
        },
        async recv() {
            if (queued.length)
                return queued.shift();
            const frame = deferred_1.deferred();
            frames.push(frame);
            const ret = await frame;
            return ret;
        },
        close() {
            err = () => { };
            try {
                ws.close();
            }
            catch { }
        },
    };
}
exports.default = connect;
