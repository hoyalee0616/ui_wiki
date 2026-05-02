import { NextResponse } from "next/server";
import { checkPassword, createSessionToken, getSessionCookieOptions, COOKIE_NAME } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { password } = await request.json() as { password: string };

    if (!checkPassword(password)) {
      // 브루트포스 방지용 딜레이
      await new Promise((r) => setTimeout(r, 800));
      return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
    }

    const token = createSessionToken();
    const opts = getSessionCookieOptions();
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, token, opts);
    return res;
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
