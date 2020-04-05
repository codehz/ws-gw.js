"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Map2 {
    constructor() {
        this.data = new Map();
    }
    has(key1, key2, value) {
        var _a, _b;
        if (key2 == null) {
            return this.data.has(key1);
        }
        else if (value == null) {
            const temp = this.data.get(key1);
            return (_a = temp === null || temp === void 0 ? void 0 : temp.has(key2)) !== null && _a !== void 0 ? _a : false;
        }
        else {
            const temp = this.data.get(key1);
            return (_b = (temp === null || temp === void 0 ? void 0 : temp.get(key2)) == value) !== null && _b !== void 0 ? _b : false;
        }
    }
    count(key1) {
        var _a, _b;
        if (key1 == null) {
            return this.data.size;
        }
        else {
            return (_b = (_a = this.data.get(key1)) === null || _a === void 0 ? void 0 : _a.size) !== null && _b !== void 0 ? _b : 0;
        }
    }
    set(key1, key2, value) {
        let temp = this.data.get(key1);
        if (temp == null) {
            temp = new Map();
            this.data.set(key1, temp);
        }
        if (temp.has(key2)) {
            return false;
        }
        temp.set(key2, value);
        return true;
    }
    delete(key1, key2) {
        if (key2 == null) {
            return this.data.delete(key1);
        }
        const temp = this.data.get(key1);
        if (temp == null) {
            return false;
        }
        const ret = temp.delete(key2);
        if (temp.size === 0) {
            this.data.delete(key1);
        }
        return ret;
    }
    *keys(key) {
        if (key == null) {
            for (const [k1, m2] of this.data) {
                yield [k1, m2.keys()];
            }
        }
        else {
            const m2 = this.data.get(key);
            if (m2)
                yield* m2.keys();
        }
    }
    values() {
        return this.data.values();
    }
    entries() {
        return this.data.entries();
    }
    clear(key) {
        var _a;
        if (key == null) {
            this.data.clear();
        }
        else {
            (_a = this.data.get(key)) === null || _a === void 0 ? void 0 : _a.clear();
        }
    }
    get(key1, key2) {
        var _a;
        if (key2 == null)
            return this.data.get(key1);
        return (_a = this.data.get(key1)) === null || _a === void 0 ? void 0 : _a.get(key2);
    }
    *[Symbol.iterator]() {
        for (const [key1, m2] of this.data) {
            for (const [key2, value] of m2) {
                yield [key1, key2, value];
            }
        }
    }
}
exports.default = Map2;
