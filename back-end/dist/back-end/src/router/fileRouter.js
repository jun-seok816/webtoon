"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const fileRouter = (0, express_1.Router)();
const uploadsRoot = path_1.default.join(__dirname, "../../data/uploads");
const testUploadsRoot = path_1.default.join(__dirname, "../../data/test_uploads");
const fsp = fs_1.default.promises;
const resolveSafePath = (root, requested) => {
    if (!requested) {
        throw new Error("파일명이 필요합니다.");
    }
    const normalized = requested.replace(/\\/g, "/");
    const candidate = path_1.default.resolve(root, normalized);
    const relative = path_1.default.relative(root, candidate);
    if (relative.startsWith("..") || path_1.default.isAbsolute(relative)) {
        throw new Error("잘못된 파일 경로입니다.");
    }
    return candidate;
};
const sendFileFromRoot = async (root, requested, res) => {
    try {
        const filePath = resolveSafePath(root, requested);
        const exists = await fsp
            .access(filePath, fs_1.default.constants.R_OK)
            .then(() => true)
            .catch(() => false);
        if (!exists) {
            res.status(404).json({
                success: false,
                message: "파일을 찾을 수 없습니다.",
            });
            return;
        }
        res.sendFile(filePath);
    }
    catch (error) {
        const message = error instanceof Error && error.message === "파일명이 필요합니다."
            ? error.message
            : error instanceof Error && error.message === "잘못된 파일 경로입니다."
                ? error.message
                : "파일을 전송하는 중 오류가 발생했습니다.";
        const status = message === "파일명이 필요합니다." || message === "잘못된 파일 경로입니다."
            ? 400
            : 500;
        if (status === 500) {
            console.error("[files] 파일 응답 실패", error);
        }
        res.status(status).json({
            success: false,
            message,
        });
    }
};
fileRouter.get("/uploads/:filename", async (req, res) => {
    await sendFileFromRoot(uploadsRoot, req.params.filename, res);
});
fileRouter.get("/test_uploads/:filePath(*)", async (req, res) => {
    const requestedPath = req.params.filePath;
    await sendFileFromRoot(testUploadsRoot, requestedPath, res);
});
exports.default = fileRouter;
//# sourceMappingURL=fileRouter.js.map