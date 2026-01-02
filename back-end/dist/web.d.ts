import { Request, Response, NextFunction } from "express";
declare const app: import("express-serve-static-core").Express;
import { Pool } from "mysql2";
import session from "express-session";
declare global {
    namespace NodeJS {
        interface Process {
            _myApp: MyApp;
        }
    }
    interface MyApp {
        db: Pool;
        checkSession: (req: Request, res: Response, next: NextFunction) => void;
    }
}
declare module "express-session" {
    interface SessionData {
        userId?: number;
        email?: string;
        displayName?: string;
        provider?: "local" | "google" | "kakao" | "naver";
        picture_uri?: string;
        oauthState?: string;
        oauthIntent?: "login" | "sign_up";
    }
}
declare module "express-serve-static-core" {
    interface Request {
        session: session.Session & Partial<session.SessionData>;
    }
}
export default app;
