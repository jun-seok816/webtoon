"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const editorCropRouter = (0, express_1.Router)();
editorCropRouter.use((req, res, next) => process._myApp.checkSession(req, res, next));
const normalizeOpacity = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return Math.max(0, Math.min(100, Math.round(value)));
    }
    return 100;
};
editorCropRouter.get("/:batchId", async (req, res) => {
    try {
        const userId = req.session?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "세션 만료",
            });
            return;
        }
        const batchId = Number(req.params.batchId);
        if (!Number.isInteger(batchId) || batchId <= 0) {
            res.status(400).json({
                success: false,
                message: "유효하지 않은 batchId 입니다.",
            });
            return;
        }
        const [batchRows] = await process._myApp.db
            .promise()
            .query(`SELECT id
           FROM upload_batches
           WHERE id = ? AND user_id = ?
           LIMIT 1`, [batchId, userId]);
        if (batchRows.length === 0) {
            res.status(404).json({
                success: false,
                message: "배치를 찾을 수 없습니다.",
            });
            return;
        }
        const [rows] = await process._myApp.db.promise().query(`SELECT
            overlay_uuid,
            item_id,
            x,
            y,
            width,
            height,
            text,
            origin_text,
            background_color,
            text_color,
            opacity
           FROM editor_crop_overlays
           WHERE batch_id = ?
           ORDER BY item_id ASC, overlay_uuid ASC`, [batchId]);
        const overlays = rows.map((row) => ({
            id: row.overlay_uuid,
            itemId: row.item_id,
            x: row.x,
            y: row.y,
            width: row.width,
            height: row.height,
            text: row.text,
            originText: row.origin_text,
            backgroundColor: row.background_color,
            textColor: row.text_color,
            opacity: typeof row.opacity === "number" ? row.opacity : undefined,
        }));
        res.json({
            success: true,
            overlays,
        });
    }
    catch (error) {
        console.error("[editorCrop] 불러오기 실패", error);
        res.status(500).json({
            success: false,
            message: "Crop overlay 조회 중 오류가 발생했습니다.",
        });
    }
});
editorCropRouter.post("/", async (req, res) => {
    try {
        const userId = req.session?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "세션 만료",
            });
            return;
        }
        const { batchId, overlays } = req.body ?? {};
        if (!batchId || typeof batchId !== "number" || batchId <= 0) {
            res.status(400).json({
                success: false,
                message: "유효 ID가 아님.",
            });
            return;
        }
        if (!Array.isArray(overlays)) {
            res.status(400).json({
                success: false,
                message: "Crop overlay 배열 아님.",
            });
            return;
        }
        const [batchRows] = await process._myApp.db
            .promise()
            .query(`SELECT id
           FROM upload_batches
           WHERE id = ? AND user_id = ?
           LIMIT 1`, [batchId, userId]);
        if (batchRows.length === 0) {
            res.status(404).json({
                success: false,
                message: "배치를 찾을 수 없습니다.",
            });
            return;
        }
        const connection = await process._myApp.db.promise().getConnection();
        try {
            await connection.beginTransaction();
            await connection.query("DELETE FROM editor_crop_overlays WHERE batch_id = ?", [batchId]);
            let insertedCount = 0;
            if (overlays.length > 0) {
                const values = overlays.map((overlay) => [
                    batchId,
                    overlay.id,
                    String(overlay.itemId),
                    overlay.x,
                    overlay.y,
                    overlay.width,
                    overlay.height,
                    overlay.text,
                    overlay.originText,
                    overlay.backgroundColor,
                    overlay.textColor,
                    normalizeOpacity(overlay.opacity),
                ]);
                const [result] = await connection.query(`INSERT INTO editor_crop_overlays (
              batch_id,
              overlay_uuid,
              item_id,
              x,
              y,
              width,
              height,
              text,
              origin_text,
              background_color,
              text_color,
              opacity
            ) VALUES ?`, [values]);
                insertedCount = result.affectedRows;
            }
            await connection.commit();
            res.json({
                success: true,
                insertedCount,
            });
        }
        catch (error) {
            await connection.rollback();
            console.error("[editorCrop] 저장 실패", error);
            res.status(500).json({
                success: false,
                message: "Crop overlay 오류가 발생했습니다",
            });
        }
        finally {
            connection.release();
        }
    }
    catch (error) {
        console.error("[editorCrop] 처리 오류", error);
        res.status(500).json({
            success: false,
            message: "Crop overlay 요청 처리 실패",
        });
    }
});
exports.default = editorCropRouter;
//# sourceMappingURL=editorCropRouter.js.map