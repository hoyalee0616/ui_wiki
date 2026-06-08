import { type NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

const API_KEY = process.env.SWEETTRACKER_API_KEY ?? "";
const BASE = "https://info.sweettracker.co.kr/api/v1";

export interface TrackEvent {
  time: string;       // "2024-01-15 14:30:00"
  status: string;     // "배송출발"
  location: string;   // "서울 강남"
  description: string;
}

export interface TrackResult {
  carrierName: string;
  carrierCode: string;
  trackingNumber: string;
  status: string;
  statusCode: string;
  events: TrackEvent[];
  arrivalPrediction: ArrivalPrediction;
}

export interface ArrivalPrediction {
  probability: number;       // 0~100
  estimatedDate: string | null;  // "오늘 오후 중", "내일", "2~3일 내" 등
  message: string;
  confidence: "high" | "medium" | "low";
}

/* ── 택배사 목록 ──────────────────────────────────────────── */
export const CARRIERS = [
  { code: "04", name: "CJ대한통운" },
  { code: "05", name: "한진택배" },
  { code: "08", name: "롯데택배" },
  { code: "01", name: "우체국택배" },
  { code: "06", name: "로젠택배" },
  { code: "11", name: "일양로지스" },
  { code: "23", name: "대신택배" },
  { code: "32", name: "ACI택배" },
  { code: "46", name: "CU편의점택배" },
  { code: "12", name: "EMS" },
  { code: "13", name: "DHL" },
  { code: "14", name: "UPS" },
  { code: "21", name: "FedEx" },
];

/* ── 도착 예측 알고리즘 ────────────────────────────────────── */
function predictArrival(events: TrackEvent[], statusCode: string): ArrivalPrediction {
  // 배송 완료
  if (statusCode === "delivered" || statusCode === "9") {
    return { probability: 100, estimatedDate: "배송 완료", message: "이미 배송이 완료되었습니다.", confidence: "high" };
  }

  if (events.length === 0) {
    return { probability: 5, estimatedDate: null, message: "아직 배송 정보가 없습니다. 접수 후 수집까지 시간이 걸릴 수 있습니다.", confidence: "low" };
  }

  const lastEvent = events[events.length - 1];
  const lastTime = new Date(lastEvent.time.replace(" ", "T"));
  const now = new Date();
  const hoursSinceLast = (now.getTime() - lastTime.getTime()) / 3600000;
  const status = lastEvent.status ?? "";

  // 배송 출발(배달 중) → 당일 배송 가능성 높음
  const isOutForDelivery = ["배송출발", "배달출발", "배달중", "출발"].some((s) => status.includes(s));
  if (isOutForDelivery) {
    if (hoursSinceLast < 4) {
      return { probability: 90, estimatedDate: "오늘 중", message: "배송기사가 출발했습니다. 오늘 중 도착 예정입니다.", confidence: "high" };
    }
    return { probability: 70, estimatedDate: "오늘~내일", message: "배송출발 후 시간이 경과되었습니다. 오늘 또는 내일 도착 예정입니다.", confidence: "medium" };
  }

  // 배송 지점 도착 or 간선상차
  const atHub = ["도착", "입고", "상차", "하차", "집화"].some((s) => status.includes(s));

  // 최근 이벤트 수 (진행 속도 판단)
  const eventCount = events.length;

  if (atHub) {
    if (hoursSinceLast < 6) {
      return { probability: 75, estimatedDate: "오늘~내일", message: "배송센터에 도착했습니다. 오늘 또는 내일 배송 예정입니다.", confidence: "medium" };
    }
    if (hoursSinceLast < 24) {
      return { probability: 60, estimatedDate: "내일~모레", message: "배송센터 처리 중입니다. 내일 또는 모레 배송 예정입니다.", confidence: "medium" };
    }
    return { probability: 40, estimatedDate: "2~3일 내", message: "배송센터에서 대기 중입니다. 2~3일 내 도착 예상됩니다.", confidence: "low" };
  }

  // 접수/집화 완료
  const isPickedUp = ["접수", "집화"].some((s) => status.includes(s));
  if (isPickedUp || eventCount <= 2) {
    if (hoursSinceLast < 12) {
      return { probability: 45, estimatedDate: "1~2일 내", message: "물품이 접수되었습니다. 1~2일 내 도착 예상됩니다.", confidence: "medium" };
    }
    return { probability: 30, estimatedDate: "2~3일 내", message: "이동 중입니다. 2~3일 내 도착 예상됩니다.", confidence: "low" };
  }

  // 이동 중 (일반)
  if (hoursSinceLast < 6) {
    return { probability: 55, estimatedDate: "내일", message: "이동 중입니다. 내일 도착 예상됩니다.", confidence: "medium" };
  }
  if (hoursSinceLast < 24) {
    return { probability: 40, estimatedDate: "1~2일 내", message: "이동 중입니다. 1~2일 내 도착 예상됩니다.", confidence: "low" };
  }

  return { probability: 20, estimatedDate: "미정", message: `마지막 업데이트 후 ${Math.floor(hoursSinceLast)}시간 경과. 지연 가능성이 있습니다.`, confidence: "low" };
}

/* ── Sweet Tracker API 호출 ───────────────────────────────── */
async function autoDetectCarrier(trackingNumber: string): Promise<string | null> {
  try {
    const url = `${BASE}/recommend?t_key=${API_KEY}&t_invoice=${trackingNumber}`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return data[0].Code ?? null;
    }
  } catch {}
  return null;
}

async function fetchTracking(carrierCode: string, trackingNumber: string) {
  const url = `${BASE}/trackingInfo?t_key=${API_KEY}&t_code=${carrierCode}&t_invoice=${trackingNumber}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`API 오류 (${res.status})`);
  return res.json();
}

function parseEvents(raw: unknown[]): TrackEvent[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const e = item as Record<string, string>;
    return {
      time: `${e.time ?? ""}`.trim(),
      status: `${e.kind ?? ""}`.trim(),
      location: `${e.where ?? ""}`.trim(),
      description: `${e.telno ?? ""}`.trim(),
    };
  });
}

/* ── Route Handler ────────────────────────────────────────── */
export async function GET() {
  return NextResponse.json({ carriers: CARRIERS });
}

export async function POST(req: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json({ error: "서버에 SWEETTRACKER_API_KEY가 설정되지 않았습니다." }, { status: 500 });
  }

  const { trackingNumber, carrierCode } = await req.json();
  if (!trackingNumber?.trim()) {
    return NextResponse.json({ error: "운송장 번호를 입력해 주세요." }, { status: 400 });
  }

  let code = carrierCode?.trim() || null;

  // 자동 택배사 감지
  if (!code) {
    code = await autoDetectCarrier(trackingNumber.trim());
    if (!code) {
      return NextResponse.json({ error: "택배사를 자동으로 감지하지 못했습니다.\n택배사를 직접 선택해 주세요." }, { status: 400 });
    }
  }

  let raw: Record<string, unknown>;
  try {
    raw = await fetchTracking(code, trackingNumber.trim());
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "조회 실패" }, { status: 500 });
  }

  if (raw.result === "N") {
    return NextResponse.json({ error: raw.msg ?? "조회 결과가 없습니다. 운송장 번호를 다시 확인해 주세요." }, { status: 404 });
  }

  const events = parseEvents((raw.trackingDetails as unknown[]) ?? []);
  const carrier = CARRIERS.find((c) => c.code === code);
  const statusCode = String(raw.completeYN === "Y" ? "9" : raw.level ?? "");

  const result: TrackResult = {
    carrierName: carrier?.name ?? (raw.companyName as string) ?? code,
    carrierCode: code,
    trackingNumber: trackingNumber.trim(),
    status: String(raw.invoiceNo ? raw.itemImage ?? raw.level ?? "진행중" : "정보없음"),
    statusCode,
    events,
    arrivalPrediction: predictArrival(events, statusCode),
  };

  return NextResponse.json(result);
}
