import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import prisma from "./db.js";
import cron from "node-cron";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // 미들웨어
  app.use(express.json());

  // ==========================================
  // API Routes
  // ==========================================

  // K3s Health Check & Readiness Probes
  app.get("/health", (_req, res) => res.status(200).send("OK"));
  app.get("/ready", (_req, res) => res.status(200).send("OK"));

  // 1. 쿠폰 등록 API (3명 동의 시 자동 퍼블리싱)
  app.post("/api/coupons", async (req, res) => {
    try {
      const { gameId, code, reward } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress || "unknown";

      if (!gameId || !code || !reward) {
        return res.status(400).json({ error: "Missing fields" });
      }

      // 쿠폰 존재 여부 확인
      let coupon = await prisma.coupon.findFirst({
        where: { gameId, code },
      });

      if (!coupon) {
        // 임의로 1달 뒤를 만료일로 설정 (원한다면 사용자 입력으로 변경 가능)
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1);

        coupon = await prisma.coupon.create({
          data: {
            code,
            reward,
            expiryDate,
            gameId,
            isPublished: false,
          },
        });
      }

      // IP 기반 중복 제출 방지
      const existingAction = await prisma.userAction.findFirst({
        where: {
          ipAddress,
          actionType: "SUBMIT_COUPON",
          couponId: coupon.id,
        },
      });

      if (existingAction) {
        return res.status(429).json({ error: "이미 제보하신 쿠폰입니다." });
      }

      // 제출 기록
      await prisma.userAction.create({
        data: {
          ipAddress,
          actionType: "SUBMIT_COUPON",
          couponId: coupon.id,
        },
      });

      // 누적 제보 수 확인
      const actionCount = await prisma.userAction.count({
        where: {
          actionType: "SUBMIT_COUPON",
          couponId: coupon.id,
        },
      });

      // 3회 도달 시 퍼블리싱
      if (actionCount >= 3 && !coupon.isPublished) {
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { isPublished: true },
        });
      }

      res.status(200).json({ success: true, count: actionCount });
    } catch (error) {
      console.error("Error submitting coupon:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 2. 추모 게임 등록 API (10명 동의 시 자동 퍼블리싱)
  app.post("/api/memorials", async (req, res) => {
    try {
      const { name, description } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress || "unknown";

      if (!name || !description) {
        return res.status(400).json({ error: "Missing fields" });
      }

      // 게임 존재 여부 확인
      let memorial = await prisma.memorialGame.findFirst({
        where: { name },
      });

      if (!memorial) {
        memorial = await prisma.memorialGame.create({
          data: {
            name,
            description,
            isPublished: false,
          },
        });
      }

      // IP 기반 중복 투표 방지
      const existingAction = await prisma.userAction.findFirst({
        where: {
          ipAddress,
          actionType: "VOTE_MEMORIAL",
          memorialGameId: memorial.id,
        },
      });

      if (existingAction) {
        return res.status(429).json({ error: "이미 동의하신 게임입니다." });
      }

      // 투표 기록
      await prisma.userAction.create({
        data: {
          ipAddress,
          actionType: "VOTE_MEMORIAL",
          memorialGameId: memorial.id,
        },
      });

      // 투표 수 업데이트
      const newVotes = memorial.votes + 1;
      
      await prisma.memorialGame.update({
        where: { id: memorial.id },
        data: { 
          votes: newVotes,
          isPublished: newVotes >= 10 ? true : memorial.isPublished
        },
      });

      res.status(200).json({ success: true, votes: newVotes });
    } catch (error) {
      console.error("Error submitting memorial:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==========================================
  // Background Worker (Cron)
  // ==========================================
  cron.schedule("0 0 * * *", async () => {
    console.log("[CRON] Running daily expired coupon cleanup...");
    try {
      const now = new Date();
      const result = await prisma.coupon.updateMany({
        where: {
          expiryDate: { lt: now },
          isExpired: false,
        },
        data: {
          isExpired: true,
        },
      });
      console.log(`[CRON] Cleanup complete. Marked ${result.count} coupons as expired.`);
    } catch (error) {
      console.error("[CRON] Failed to cleanup coupons:", error);
    }
  });

  // ==========================================
  // Static Files & Routing
  // ==========================================
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;
  const host = "0.0.0.0";

  server.listen(Number(port), host, () => {
    console.log(`Server running on http://${host}:${port}/`);
    console.log(`[CRON] Daily cleanup job scheduled.`);
  });
}

startServer().catch(console.error);
