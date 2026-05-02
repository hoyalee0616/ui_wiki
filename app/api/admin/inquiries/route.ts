import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getInquiries, markRead, deleteInquiry } from "@/lib/inquiries";

export const runtime = "nodejs";

async function guard() {
  const ok = await isAuthenticated();
  if (!ok) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  return null;
}

export async function GET() {
  const err = await guard();
  if (err) return err;
  const list = await getInquiries();
  return NextResponse.json(list);
}

export async function PATCH(request: Request) {
  const err = await guard();
  if (err) return err;
  const { id } = await request.json() as { id: string };
  await markRead(id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const err = await guard();
  if (err) return err;
  const { id } = await request.json() as { id: string };
  await deleteInquiry(id);
  return NextResponse.json({ ok: true });
}
