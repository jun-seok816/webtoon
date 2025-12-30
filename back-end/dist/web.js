"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const body_parser_1 = __importDefault(require("body-parser"));
const path_1 = __importDefault(require("path"));
const mysql2_1 = __importDefault(require("mysql2"));
const express_session_1 = __importDefault(require("express-session"));
var MySQLStore = require("express-mysql-session")(express_session_1.default);
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const uploadRouter_1 = __importDefault(require("./router/uploadRouter"));
const loginRouter_1 = __importDefault(require("./router/loginRouter"));
const fileRouter_1 = __importDefault(require("./router/fileRouter"));
const ocrRouter_1 = __importDefault(require("./router/ocrRouter"));
const translateRouter_1 = __importDefault(require("./router/translateRouter"));
const editorCropRouter_1 = __importDefault(require("./router/editorCropRouter"));
const db_1 = __importDefault(require("./db"));
// .env 파일에서 환경 변수 로드
dotenv_1.default.config();
const lv_Db = new db_1.default();
const port = Number.parseInt(process.env.PORT ?? "", 10) || 9004;
const gf_cs = (req, res, next) => {
    // 세션에 userId가 없을 경우
    if (!req.session || !req.session.userId) {
        // 세션이 존재하지 않을 때
        res.status(500).json({
            success: false,
            message: "세션 정보가 유효하지 않습니다.",
        });
    }
    else {
        // 세션이 존재하면 다음 미들웨어로 넘어갑니다
        next();
    }
};
process._myApp = {
    db: mysql2_1.default.createPool(lv_Db.pt_Data.DB),
    checkSession: gf_cs,
};
//https://expressjs.com/ko/starter/static-files.html s
app.set("puplic", path_1.default.join(__dirname, "../build"));
app.use(express_1.default.static(app.settings.puplic));
//https://www.npmjs.com/package/body-parser
app.use(body_parser_1.default.json({ limit: "100mb" }));
app.use(body_parser_1.default.urlencoded({ limit: "100mb", extended: false }));
app.use((0, cookie_parser_1.default)());
var sessionStore = new MySQLStore(lv_Db.pt_Data.DB);
app.use((0, express_session_1.default)({
    secret: "subscribe_loutbtbahah4281!@",
    resave: true,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000 * 1, // 24 hours
    },
}));
const sessionMiddleware = (0, express_session_1.default)({
    secret: "subscribe_loutbtbahah4281!@",
    resave: true,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000 * 7, // 24 hours
    },
});
app.use(sessionMiddleware);
app.use("/data", fileRouter_1.default);
app.use("/data", express_1.default.static(path_1.default.join(__dirname, "../../data"), {
    index: false,
}));
app.use("/api/uploads", uploadRouter_1.default);
app.use("/api/login", loginRouter_1.default);
app.use("/api/ocr", ocrRouter_1.default);
app.use("/api/translate", translateRouter_1.default);
app.use("/api/editor/crops", editorCropRouter_1.default);
// ② React 번들의 정적 파일
app.use(express_1.default.static(path_1.default.join(__dirname, "../build"), {
    index: false, // index.html 은 직접 라우트에서 전송
}));
// ⑤ React SPA 용 catch‑all
app.get("*", (_, res) => {
    res.sendFile(path_1.default.join(__dirname, "../build/index.html"));
});
console.log("[routes]", app._router.stack
    .filter((l) => l.route)
    .map((l) => `${Object.keys(l.route.methods)[0].toUpperCase()} ${l.route.path}`));
const server = app
    .listen(port, "127.0.0.1", () => {
    console.log(`Example app listening on port ${port}`);
})
    .setTimeout(12000000);
server.keepAliveTimeout = 300; // Keep-Alive 연결 제한 시간
server.headersTimeout = 11000; // 헤더 대기 시간
exports.default = app;
//# sourceMappingURL=web.js.map