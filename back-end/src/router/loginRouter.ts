import axios from "axios";
import bcrypt from "bcryptjs";
import express, { Request, Response } from "express";
import { OkPacket, RowDataPacket } from "mysql2/promise";
const loginRouter = express.Router();

async function regenerateSession(req: Request) {
  await new Promise<void>((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

/**
 * POST /loginEmailCheck
 * @body { email: string }
 * @returns { exists: boolean }
 */
loginRouter.post("/loginEmailCheck", async (req: Request, res: Response) => {
  try {
    const email: string | undefined = req.body?.email ?? req.body?.data?.email;
    if (!email) {
      res.status(400).json({ err: true, msg: "email is required" });
      return;
    }

    /* ① 존재 여부 확인 */
    const [rows] = await process._myApp.db
      .promise()
      .query<RowDataPacket[]>(
        "SELECT id FROM users WHERE email = ? LIMIT 1",
        [email]
      );

    const exists = rows.length > 0;

    /* ② 응답 */
    res.json({ err: false, exists });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: true });
  }
});

/**
 * POST /login
 * @body { email: string; password: string }
 */
loginRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const payload = req.body?.data ?? req.body;
    const rawEmail: string | undefined = payload?.email;
    const password: string | undefined = payload?.password;

    if (!rawEmail || !password) {
      res.status(400).json({ err: true, msg: "email and password are required" });
      return;
    }

    const email = normalizeEmail(rawEmail);
    const db = process._myApp.db.promise();

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT id, password_hash, display_name, provider
         FROM users
        WHERE email = ?
        LIMIT 1`,
      [email]
    );

    if (!rows.length) {
      res.status(401).json({ err: true, msg: "invalid email or password" });
      return;
    }

    const user = rows[0];
    if (!user.password_hash) {
      res.status(400).json({
        err: true,
        msg: "이 계정은 소셜 로그인을 사용하고 있어요. 해당 공급자로 로그인하세요.",
      });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      res.status(401).json({ err: true, msg: "invalid email or password" });
      return;
    }

    await db.query("UPDATE users SET last_login_at = NOW() WHERE id = ?", [
      user.id,
    ]);

    await regenerateSession(req);
    req.session.userId = Number(user.id);
    req.session.email = email;
    req.session.displayName = user.display_name;
    req.session.provider = (user.provider as any) ?? "local";

    res.json({ err: false, msg: "login" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: true });
  }
});


loginRouter.post("/logout", (req: Request, res: Response) => {
  // 세션 쿠키 이름(기본: connect.sid). 미들웨어에서 name을 바꿨다면 동일하게 맞추세요.
  const cookieName = process.env.SESSION_NAME || "connect.sid";
  const cookiePath = (req.session as any)?.cookie?.path || "/";
  
  if (!req.session) {
    res.clearCookie(cookieName, { path: cookiePath, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
    res.json({ err: false, loggedOut: true });
    return 
  }

  req.session.destroy((err) => {
    if (err) {
      console.error("Session destroy error:", err);
      return res.status(500).json({ err: true, msg: "session destroy failed" });
    }

    // 브라우저에서 세션 쿠키 삭제
    res.clearCookie(cookieName, {
      path: cookiePath,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return res.json({ err: false, loggedOut: true });
  });
});


loginRouter.get("/loginSession", (req, res) => {
  console.log(`session Data user_id: %o`, req.session.userId);
  if (req.session.userId) {
    res.json({
      loggedIn: true,
      email: req.session.email,
      displayName: req.session.displayName,
      provider: req.session.provider,
    });
  } else {
    res.json({ loggedIn: false });
  }
});


/**
 * POST /save_data_google
 * @body { access_token: string; expires_in?: number }
 */
loginRouter.post("/save_data_google", async (req: Request, res: Response) => {
  try {
    const access_token: string | undefined =
      req.body?.access_token ?? req.body?.data?.access_token;
    if (!access_token) {
      res.status(400).json({ err: true, msg: "access_token is required" });
      return;
    }

    /* ① Google OAuth 토큰 확인 → 사용자 정보 획득 */
    let email: string;
    let providerId: string | null = null;
    let displayName: string | undefined;
    try {
      const { data } = await axios.get<{
        id?: string;
        email: string;
        name?: string;
      }>("https://www.googleapis.com/oauth2/v1/userinfo", {
        params: {
          access_token,
          alt: "json",
        },
      });
      email = normalizeEmail(data.email);
      providerId = data.id ?? null;
      displayName = data.name;
    } catch (error) {
      console.error("Failed to fetch Google user info:", error);
      res.status(400).json({ err: true, msg: "invalid token" });
      return;
    }

    const emailNamePart =
      email.includes("@") ? email.substring(0, email.indexOf("@")) : email;
    const resolvedDisplayName = displayName ?? emailNamePart;

    /* ② users 테이블 조회 */
    const [rows] = await process._myApp.db
      .promise()
      .query<RowDataPacket[]>(
        "SELECT id, display_name FROM users WHERE email = ? LIMIT 1",
        [email]
      );

    let userId: number;
    let finalDisplayName = resolvedDisplayName;
    const db = process._myApp.db.promise();

    if (rows.length === 0) {
      /* ─── 첫 방문: 회원가입 ─── */
      const [result] = await db.query<OkPacket>(
        `INSERT INTO users (
          email,
          password_hash,
          display_name,
          provider,
          provider_id,
          role,
          status,
          last_login_at
        ) VALUES (?, NULL, ?, 'google', ?, 'user', 'active', NOW())`,
        [email, resolvedDisplayName, providerId]
      );
      userId = Number(result.insertId);
    } else {
      /* ─── 이미 회원: 로그인 ─── */
      userId = Number(rows[0].id);
      finalDisplayName = rows[0].display_name || resolvedDisplayName;
      await db.query(
        `UPDATE users
           SET provider = 'google',
               provider_id = COALESCE(?, provider_id),
               last_login_at = NOW()
         WHERE id = ?`,
        [providerId, userId]
      );
    }

    /* ③ 세션 재생성 및 저장 */
    await regenerateSession(req);
    req.session.userId = userId;
    req.session.email = email;
    req.session.displayName = finalDisplayName;
    req.session.provider = "google";

    res.json({ err: false, msg: rows.length === 0 ? "sign_up" : "login" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: true });
  }
});

/**
 * POST /sign_up
 * @body { email: string; password: string; displayName: string }
 */
loginRouter.post("/sign_up", async (req: Request, res: Response) => {
  try {
    const payload = req.body?.data ?? req.body;
    const rawEmail: string | undefined = payload?.email;
    const password: string | undefined = payload?.password;
    const displayName: string | undefined =
      payload?.displayName ?? payload?.display_name;

    if (!rawEmail || !password || !displayName) {
      res
        .status(400)
        .json({ err: true, msg: "email, password, displayName are required" });
      return;
    }

    const email = normalizeEmail(rawEmail);
    if (password.length < 8) {
      res.status(422).json({
        err: true,
        msg: "password must be at least 8 characters",
      });
      return;
    }

    const db = process._myApp.db.promise();

    /* 중복 체크 */
    const [dup] = await db.query<RowDataPacket[]>(
      "SELECT 1 FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    if (dup.length) {
      res.status(409).json({ err: true, msg: "email already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    /* 회원 등록 */
    const [result] = await db.query<OkPacket>(
      `INSERT INTO users (
        email,
        password_hash,
        display_name,
        provider,
        provider_id,
        role,
        status,
        last_login_at
      ) VALUES (?, ?, ?, 'local', NULL, 'user', 'active', NOW())`,
      [email, passwordHash, displayName]
    );

    const userId = Number(result.insertId);

    await regenerateSession(req);
    req.session.userId = userId;
    req.session.email = email;
    req.session.displayName = displayName;
    req.session.provider = "local";

    res.json({ err: false, msg: "sign_up" });
  } catch (err: any) {
    if (err?.code === "ER_DUP_ENTRY") {
      res.status(409).json({ err: true, msg: "email already exists" });
      return;
    }
    console.error(err);
    res.status(500).json({ err: true });
  }
});

export default loginRouter;
