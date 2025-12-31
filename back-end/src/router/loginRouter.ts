import axios from "axios";
import bcrypt from "bcryptjs";
import express, { Request, Response } from "express";
import { OkPacket, RowDataPacket } from "mysql2/promise";
import { randomBytes } from "crypto";
import dotenv from "dotenv";
const loginRouter = express.Router();

dotenv.config();

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
const resolveDisplayName = (email: string, displayName?: string | null) => {
  if (displayName && displayName.trim().length > 0) {
    return displayName.trim();
  }
  return email.includes("@") ? email.substring(0, email.indexOf("@")) : email;
};

const getGoogleRedirectUri = (req: Request) =>  
  `${req.protocol}://${req.get("host")}/api/login/google/callback`;

const getGoogleClientConfig = () => ({
  clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
  clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
});

const buildGoogleAuthUrl = (req: Request, oauthState: string) => {
  const { clientId } = getGoogleClientConfig();
  if (!clientId) {
    return null;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleRedirectUri(req),
    response_type: "code",
    scope: "openid email profile",
    state: oauthState,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

const renderOAuthPopup = (
  res: Response,
  payload: { success: boolean; message?: string }
) => {
  const scriptPayload = JSON.stringify(payload);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <title>Google 로그인</title>
  </head>
  <body>
    <script>
      (function () {
        var payload = ${scriptPayload};
        try {
          if (window.opener && !window.opener.closed) {
            if (payload.success && window.opener.globalCallback_login) {
              window.opener.globalCallback_login();
            }
            window.opener.postMessage(
              { type: "google-login", success: payload.success, message: payload.message },
              window.location.origin
            );
            window.close();
            return;
          }
        } catch (e) {}
        if (payload.success) {
          window.location.href = "/";
        } else if (payload.message) {
          document.body.innerText = payload.message;
        } else {
          document.body.innerText = "구글 로그인에 실패했습니다.";
        }
      })();
    </script>
  </body>
</html>`);
};

type GoogleUserProfile = {
  id?: string;
  email: string;
  name?: string;
};

const fetchGoogleUserInfo = async (accessToken: string) => {
  const { data } = await axios.get<GoogleUserProfile>(
    "https://www.googleapis.com/oauth2/v1/userinfo",
    {
      params: { alt: "json", access_token: accessToken },
    }
  );
  return data;
};

const upsertGoogleUser = async ({
  email,
  providerId,
  displayName,
}: {
  email: string;
  providerId: string | null;
  displayName: string;
}) => {
  const db = process._myApp.db.promise();
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT id, display_name FROM users WHERE email = ? LIMIT 1",
    [email]
  );

  let userId: number;
  let finalDisplayName = displayName;
  if (rows.length === 0) {
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
      [email, displayName, providerId]
    );
    userId = Number(result.insertId);
  } else {
    userId = Number(rows[0].id);
    finalDisplayName = rows[0].display_name || displayName;
    await db.query(
      `UPDATE users
         SET provider = 'google',
             provider_id = COALESCE(?, provider_id),
             last_login_at = NOW()
       WHERE id = ?`,
      [providerId, userId]
    );
  }

  return { userId, displayName: finalDisplayName, isNew: rows.length === 0 };
};

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
 * GET /google/start
 * @query { state?: "login" | "sign_up" }
 */
loginRouter.get("/google/start", async (req: Request, res: Response) => {
  const { clientId } = getGoogleClientConfig();
  if (!clientId) {
    res.status(500).send("Google OAuth client ID is not configured.");
    return;
  }

  const intent =
    typeof req.query.state === "string" ? req.query.state : "login";
  const oauthState = randomBytes(16).toString("hex");

  req.session.oauthState = oauthState;
  req.session.oauthIntent = intent === "sign_up" ? "sign_up" : "login";

  const authUrl = buildGoogleAuthUrl(req, oauthState);
  if (!authUrl) {
    res.status(500).send("Google OAuth client ID is not configured.");
    return;
  }

  req.session.save((err) => {
    if (err) {
      console.error("OAuth session save failed:", err);
      res.status(500).send("OAuth session save failed.");
      return;
    }
    res.redirect(authUrl);
  });
});

/**
 * GET /google/callback
 */
loginRouter.get("/google/callback", async (req: Request, res: Response) => {
  try {
    const { clientId, clientSecret } = getGoogleClientConfig();
    if (!clientId || !clientSecret) {
      renderOAuthPopup(res, {
        success: false,
        message: "Google OAuth 환경변수가 설정되지 않았습니다.",
      });
      return;
    }

    const code = typeof req.query.code === "string" ? req.query.code : null;
    const state = typeof req.query.state === "string" ? req.query.state : null;

    if (!code) {
      renderOAuthPopup(res, {
        success: false,
        message: "Google 인증 코드가 없습니다.",
      });
      return;
    }

    if (!state || state !== req.session.oauthState) {
      renderOAuthPopup(res, {
        success: false,
        message: "OAuth state 검증에 실패했습니다.",
      });
      return;
    }

    const redirectUri = getGoogleRedirectUri(req);
    const tokenPayload = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });

    const { data: tokenResponse } = await axios.post<{
      access_token?: string;
      id_token?: string;
    }>("https://oauth2.googleapis.com/token", tokenPayload.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const accessToken = tokenResponse.access_token;
    if (!accessToken) {
      renderOAuthPopup(res, {
        success: false,
        message: "Google 액세스 토큰을 가져오지 못했습니다.",
      });
      return;
    }

    const profile = await fetchGoogleUserInfo(accessToken);
    const email = normalizeEmail(profile.email);
    const resolvedDisplayName = resolveDisplayName(email, profile.name);
    const result = await upsertGoogleUser({
      email,
      providerId: profile.id ?? null,
      displayName: resolvedDisplayName,
    });

    await regenerateSession(req);
    req.session.userId = result.userId;
    req.session.email = email;
    req.session.displayName = result.displayName;
    req.session.provider = "google";
    req.session.oauthState = undefined;
    req.session.oauthIntent = undefined;

    renderOAuthPopup(res, {
      success: true,
      message: result.isNew ? "sign_up" : "login",
    });
  } catch (error) {
    console.error("[login] Google OAuth callback failed", error);
    renderOAuthPopup(res, {
      success: false,
      message: "구글 로그인 처리 중 오류가 발생했습니다.",
    });
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
      const profile = await fetchGoogleUserInfo(access_token);
      email = normalizeEmail(profile.email);
      providerId = profile.id ?? null;
      displayName = profile.name;
    } catch (error) {
      console.error("Failed to fetch Google user info:", error);
      res.status(400).json({ err: true, msg: "invalid token" });
      return;
    }

    const resolvedDisplayName = resolveDisplayName(email, displayName);
    const result = await upsertGoogleUser({
      email,
      providerId,
      displayName: resolvedDisplayName,
    });

    await regenerateSession(req);
    req.session.userId = result.userId;
    req.session.email = email;
    req.session.displayName = result.displayName;
    req.session.provider = "google";

    res.json({ err: false, msg: result.isNew ? "sign_up" : "login" });
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
