"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDataSource = getDataSource;
const data_source_1 = __importDefault(require("./data-source"));
let ds = null;
async function getDataSource() {
    if (ds?.isInitialized)
        return ds;
    ds = await data_source_1.default.initialize();
    return ds;
}
//# sourceMappingURL=ds-runtime.js.map