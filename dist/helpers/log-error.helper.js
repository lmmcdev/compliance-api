"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logErr = logErr;
function logErr(context, err) {
    const msg = err instanceof Error
        ? (err.stack ?? err.message)
        : typeof err === 'string'
            ? err
            : JSON.stringify(err);
    context.error(msg);
}
//# sourceMappingURL=log-error.helper.js.map