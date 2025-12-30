"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Db {
    iv_Data;
    get pt_Data() {
        return this.iv_Data;
    }
    constructor() {
        this.iv_Data = {
            DB: {
                host: "127.0.0.1",
                port: 3309,
                user: "root",
                password: "loutbtbahah4281!",
                database: "webtoon",
                charset: "utf8mb4"
            },
            port: 3000,
        };
    }
}
exports.default = Db;
//# sourceMappingURL=db.js.map