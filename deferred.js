"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function deferred() {
    let methods;
    const promise = new Promise((resolve, reject) => {
        methods = { resolve, reject };
    });
    return Object.assign(promise, methods);
}
exports.deferred = deferred;
