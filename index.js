"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const websocket_1 = require("./websocket");
const proto_1 = require("./proto");
const deferred_1 = require("./deferred");
const map2_1 = require("./map2");
function buildHandshake() {
    const builder = new proto_1.default.Builder(64);
    builder.finish(proto_1.default.Client.Handshake.createHandshake(builder, builder.createString("WS-GATEWAY-CLIENT"), 0));
    return builder.asUint8Array();
}
class ServiceProxy {
    constructor(client, name, status) {
        this.client = client;
        this.name = name;
        this._status = status;
    }
    init(initFn) {
        this._initFn = initFn;
        if (this.status && this._initFn != null) {
            this._initFn(this);
        }
    }
    async call(key, data) {
        return this.client._start_call(this.name, key, data);
    }
    async on(key, handler) {
        return this.client._subscribe(this.name, key, handler);
    }
    async off(key) {
        return this.client._unsubscribe(this.name, key);
    }
    async disconnect() {
        return this.client._cancel_wait(this.name);
    }
    async waitOnline() {
        if (this.status)
            return;
        this.wait = deferred_1.deferred();
        await this.wait;
    }
    async waitOffline() {
        if (!this.status)
            return;
        this.wait = deferred_1.deferred();
        await this.wait;
    }
    get status() {
        return this._status;
    }
    set status(val) {
        var _a, _b;
        this._status = val;
        (_a = this.wait) === null || _a === void 0 ? void 0 : _a.resolve(val);
        delete this.wait;
        (_b = this._initFn) === null || _b === void 0 ? void 0 : _b.call(this, this);
    }
}
exports.ServiceProxy = ServiceProxy;
class Client {
    constructor() {
        this.syncQueue = [];
        this.pending_call = new map2_1.default();
        this.listeners = new map2_1.default();
        this.wait_list = new Map();
    }
    async handlePacket(frame) {
        var _a;
        switch (frame.receiveType()) {
            case proto_1.default.Client.Receive.Receive.SyncResult:
                if (this.syncHandler != null) {
                    this.syncHandler.resolve(frame.receive(new proto_1.default.Client.Receive.Sync.SyncResult()));
                    delete this.syncHandler;
                    const next = this.syncQueue.shift();
                    if (next)
                        next.resolve();
                }
                else {
                    throw "illegal state";
                }
                break;
            case proto_1.default.Client.Receive.Receive.AsyncResult:
                const asy = frame.receive(new proto_1.default.Client.Receive.Async.AsyncResult());
                switch (asy.asyncType()) {
                    case proto_1.default.Client.Receive.Async.Async.CallResponse: {
                        const resp = asy.async(new proto_1.default.Client.Receive.Async.Call.CallResponse());
                        const name = resp.name();
                        const id = resp.id();
                        const pending = this.pending_call.get(name, id);
                        if (pending) {
                            this.pending_call.delete(name, id);
                            switch (resp.payloadType()) {
                                case proto_1.default.Client.Receive.Async.Call.CallResponsePayload
                                    .CallSuccess:
                                    {
                                        const suc = resp.payload(new proto_1.default.Client.Receive.Async.Call.CallSuccess());
                                        pending.resolve(suc.payloadArray());
                                        break;
                                    }
                                case proto_1.default.Client.Receive.Async.Call.CallResponsePayload
                                    .CallException:
                                    {
                                        const exp = resp.payload(new proto_1.default.Client.Receive.Async.Call.CallException());
                                        pending.reject(exp.info().message());
                                        break;
                                    }
                                default:
                                    pending.reject();
                            }
                        }
                        break;
                    }
                    case proto_1.default.Client.Receive.Async.Async.Event: {
                        const evt = asy.async(new proto_1.default.Client.Receive.Async.Event.Event());
                        const name = evt.name();
                        const key = evt.key();
                        const payload = evt.payload();
                        if (payload) {
                            await ((_a = this.listeners.get(name, key)) === null || _a === void 0 ? void 0 : _a(payload.payloadArray()));
                        }
                        else {
                            this.listeners.delete(name, key);
                        }
                        break;
                    }
                    case proto_1.default.Client.Receive.Async.Async.WaitResult: {
                        const res = asy.async(new proto_1.default.Client.Receive.Async.WaitResult());
                        const name = res.name();
                        const status = res.status() === proto_1.default.Client.Receive.OnlineStatus.Online;
                        const pxy = this.wait_list.get(name);
                        if (pxy == null)
                            break;
                        pxy.status = status;
                        if (status == false) {
                            const calls = this.pending_call.get(name);
                            if (calls != null) {
                                for (const [, p] of calls) {
                                    p.reject();
                                }
                                this.pending_call.delete(name);
                            }
                            this.listeners.delete(name);
                        }
                        break;
                    }
                }
                break;
            default:
                throw `illegal op: ${frame.receiveType()}`;
        }
    }
    async send_sync(data) {
        if (this.syncHandler != null) {
            const sig = deferred_1.deferred();
            this.syncQueue.push(sig);
            await sig;
        }
        const defer = deferred_1.deferred();
        this.syncHandler = defer;
        await this.connection.send(data);
        return defer;
    }
    async _start_call(name, key, data) {
        const builder = new proto_1.default.Builder(64 + data.length);
        builder.finish(proto_1.default.Client.Send.SendPacket.createSendPacket(builder, proto_1.default.Client.Send.Send.CallService, proto_1.default.Client.Send.CallService.createCallService(builder, builder.createString(name), builder.createString(key), proto_1.default.Client.Send.CallService.createPayloadVector(builder, data))));
        const sync = await this.send_sync(builder.asUint8Array());
        if (sync.syncType() !== proto_1.default.Client.Receive.Sync.Sync.RequestResult) {
            throw new Error("service not exists");
        }
        const result = sync.sync(new proto_1.default.Client.Receive.Sync.RequestResult());
        const id = result.id();
        const defer = deferred_1.deferred();
        this.pending_call.set(name, id, defer);
        return defer;
    }
    async _subscribe(name, key, handler) {
        if (this.listeners.has(name, key)) {
            throw new Error("cannot subscribe same event multiple times");
        }
        const builder = new proto_1.default.Builder(64);
        builder.finish(proto_1.default.Client.Send.SendPacket.createSendPacket(builder, proto_1.default.Client.Send.Send.SubscribeService, proto_1.default.Client.Send.SubscribeService.createSubscribeService(builder, builder.createString(name), builder.createString(key))));
        const sync = await this.send_sync(builder.asUint8Array());
        if (sync.syncType() !== proto_1.default.Client.Receive.Sync.Sync.SimpleResult) {
            throw new Error("service not exists");
        }
        this.listeners.set(name, key, handler);
    }
    async _unsubscribe(name, key) {
        var _a, _b;
        if (!this.listeners.has(name, key))
            return false;
        const builder = new proto_1.default.Builder(64);
        builder.finish(proto_1.default.Client.Send.SendPacket.createSendPacket(builder, proto_1.default.Client.Send.Send.UnscribeService, proto_1.default.Client.Send.UnscribeService.createUnscribeService(builder, builder.createString(name), builder.createString(key))));
        const sync = await this.send_sync(builder.asUint8Array());
        return (sync.syncType() == proto_1.default.Client.Receive.Sync.Sync.SimpleResult &&
            ((_b = (_a = sync.sync(new proto_1.default.Client.Receive.Sync.SimpleResult())) === null || _a === void 0 ? void 0 : _a.ok()) !== null && _b !== void 0 ? _b : false));
    }
    async _cancel_wait(name) {
        var _a, _b;
        if (this.wait_list.has(name)) {
            const builder = new proto_1.default.Builder(64);
            builder.finish(proto_1.default.Client.Send.SendPacket.createSendPacket(builder, proto_1.default.Client.Send.Send.CancelWaitService, proto_1.default.Client.Send.CancelWaitService.createCancelWaitService(builder, builder.createString(name))));
            const sync = await this.send_sync(builder.asUint8Array());
            this.wait_list.delete(name);
            return (sync.syncType() == proto_1.default.Client.Receive.Sync.Sync.SimpleResult &&
                ((_b = (_a = sync.sync(new proto_1.default.Client.Receive.Sync.SimpleResult())) === null || _a === void 0 ? void 0 : _a.ok()) !== null && _b !== void 0 ? _b : false));
        }
        return false;
    }
    async get(name) {
        const exist = this.wait_list.get(name);
        if (exist != null)
            return exist;
        const builder = new proto_1.default.Builder(64);
        builder.finish(proto_1.default.Client.Send.SendPacket.createSendPacket(builder, proto_1.default.Client.Send.Send.WaitService, proto_1.default.Client.Send.WaitService.createWaitService(builder, builder.createString(name))));
        const sync = await this.send_sync(builder.asUint8Array());
        const result = sync.sync(new proto_1.default.Client.Receive.Sync.ServiceStatus());
        const ret = new ServiceProxy(this, name, result.status() == proto_1.default.Client.Receive.OnlineStatus.Online);
        this.wait_list.set(name, ret);
        return ret;
    }
    get isConnected() {
        return this.connection != null;
    }
    async connect(endpoint, async_exception_handler) {
        if (this.isConnected)
            throw new Error("illegal state");
        const handshake = buildHandshake();
        const connection = await websocket_1.default(endpoint);
        await connection.send(handshake);
        const resp = await connection.recv();
        if (typeof resp === "string" ||
            proto_1.default.Client.HandshakeResponse.getRootAsHandshakeResponse(new proto_1.default.ByteBuffer(new Uint8Array(resp))).magic() !== "WS-GATEWAY OK") {
            throw new Error(`failed to handshake_response: ${resp}`);
            return;
        }
        this.connection = connection;
        (async () => {
            while (true) {
                const packet = await connection.recv();
                if (typeof packet === "string")
                    throw new Error(`packet: ${packet}`);
                const arr = new proto_1.default.ByteBuffer(new Uint8Array(packet));
                const parsed = proto_1.default.Client.Receive.ReceivePacket.getRootAsReceivePacket(arr);
                this.handlePacket(parsed);
            }
        })().catch((data) => {
            this.connection.close();
            delete this.connection;
            async_exception_handler(data);
        });
    }
    async disconnect() {
        if (!this.isConnected)
            throw new Error("illegal state");
        this.connection.close();
        delete this.connection;
    }
}
exports.default = Client;
