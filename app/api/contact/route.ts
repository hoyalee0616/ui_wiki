import { NextResponse } from "next/server";
import { addInquiry, type InquiryType } from "@/lib/inquiries";

export const runtime = "nodejs";

const VALID_TYPES: InquiryType[] = ["도구 제안", "버그 신고", "기타 의견"];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, title, content, contact = "" } = body as Record<string, string>;

    if (!VALID_TYPES.includes(type as InquiryType)) {
      return NextResponse.json({ error: "유효하지 않은 문의 유형입니다." }, { status: 400 });
    }
    if (!title?.trim()) {
      return NextResponse.json({ error: "제목을 입력해 주세요." }, { status: 400 });
    }
    if (!content?.trim()) {
      return NextResponse.json({ error: "내용을 입력해 주세요." }, { status: 400 });
    }
    if (title.length > 200) {
      return NextResponse.json({ error: "제목은 200자 이하로 입력해 주세요." }, { status: 400 });
    }
    if (content.length > 5000) {
      return NextResponse.json({ error: "내용은 5000자 이하로 입력해 주세요." }, { status: 400 });
    }

    const entry = await addInquiry({
      type: type as InquiryType,
      title: title.trim(),
      content: content.trim(),
      contact: contact.trim().slice(0, 200),
    });

    return NextResponse.json({ ok: true, id: entry.id });
  } catch (e) {
    console.error("[contact]", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
