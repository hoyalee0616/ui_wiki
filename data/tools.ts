import {
  BookOpen,
  Box,
  BriefcaseBusiness,
  Calculator,
  CalendarDays,
  Clock3,
  Coins,
  Database,
  FileText,
  Hash,
  Home,
  Image,
  Languages,
  LayoutGrid,
  Link2,
  Mail,
  NotebookPen,
  Percent,
  Receipt,
  ScanText,
  Search,
  ShieldCheck,
  Stamp,
  Table2,
  TrendingUp,
  Type,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Accent =
  | "blue"
  | "green"
  | "purple"
  | "red"
  | "orange"
  | "yellow";

export type ToolSectionId = "documents" | "pdf" | "business-calculators" | "business-documents";

export interface ToolSection {
  id: ToolSectionId;
  label: string;
  href: string;
  description: string;
  accent: Accent;
  icon: LucideIcon;
  stats: string;
}

export interface ToolItem {
  id: string;
  name: string;
  slug: string;
  summary: string;
  description: string;
  sectionId: ToolSectionId;
  accent: Accent;
  icon: LucideIcon;
  features: string[];
  useCases: string[];
  isPopular?: boolean;
  isNew?: boolean;
}

export const toolSections: ToolSection[] = [
  {
    id: "documents",
    label: "문서/콘텐츠",
    href: "/menu#documents",
    description: "작성, 교정, 구조화, 복사까지 바로 처리하는 콘텐츠 유틸리티 모음",
    accent: "blue",
    icon: NotebookPen,
    stats: "7개 도구",
  },
  {
    id: "pdf",
    label: "PDF 도구",
    href: "/menu#pdf",
    description: "편집, 변환, 워터마크, 메타데이터까지 문서 후처리를 한 번에",
    accent: "red",
    icon: FileText,
    stats: "6개 도구",
  },
  {
    id: "business-calculators",
    label: "업무용 계산기",
    href: "/menu#business-calculators",
    description: "일정, 투자, 급여, 세금, 대출 등 실무 계산을 빠르게 정리",
    accent: "green",
    icon: Calculator,
    stats: "10개 도구",
  },
  {
    id: "business-documents",
    label: "업무 서류",
    href: "/menu#business-documents",
    description: "세금계산서, 견적서, 도장, 이메일 서명, 연간달력을 바로 생성",
    accent: "purple",
    icon: BriefcaseBusiness,
    stats: "5개 도구",
  },
];

const sectionMapById = Object.fromEntries(toolSections.map((section) => [section.id, section])) as Record<
  ToolSectionId,
  ToolSection
>;

export const primaryMenu = [
  { label: "홈", href: "/", icon: Home },
  { label: "전체 도구", href: "/menu", icon: LayoutGrid },
];

export const tools: ToolItem[] = [
  {
    id: "markdown-preview",
    name: "마크다운 미리보기",
    slug: "/tools/markdown-preview",
    summary: "문서 작성 중 마크다운 결과를 즉시 미리보기",
    description: "작성 중인 마크다운 문서를 실시간으로 확인하고 구조를 점검할 수 있는 에디터형 도구입니다.",
    sectionId: "documents",
    accent: "blue",
    icon: BookOpen,
    features: ["실시간 미리보기", "문단/리스트 점검", "문서 구조 확인"],
    useCases: ["README 작성", "노션 초안 정리", "기술 문서 검수"],
    isPopular: true,
  },
  {
    id: "markdown-table",
    name: "마크다운 테이블",
    slug: "/tools/markdown-table",
    summary: "표를 쉽게 생성하고 마크다운 포맷으로 복사",
    description: "열과 행을 빠르게 구성하고 복사하기 좋은 형태로 테이블 마크다운을 만드는 도구입니다.",
    sectionId: "documents",
    accent: "green",
    icon: Table2,
    features: ["표 생성기", "정렬 옵션", "복사 가능한 결과"],
    useCases: ["문서 표 작성", "위키 편집", "블로그 포스팅"],
    isPopular: true,
  },
  {
    id: "character-counter",
    name: "글자수 계산기",
    slug: "/tools/character-counter",
    summary: "글자수, 공백 포함 글자수, 단어수를 한 번에 확인",
    description: "콘텐츠 길이 제한이 있는 업무에서 실시간으로 글자수와 단어수를 체크할 수 있습니다.",
    sectionId: "documents",
    accent: "orange",
    icon: Hash,
    features: ["공백 포함/제외", "단어 수 측정", "문장 수 파악"],
    useCases: ["광고 문구 작성", "지원서 문항", "SNS 카피 검수"],
    isPopular: true,
  },
  {
    id: "dummy-text",
    name: "더미 텍스트",
    slug: "/tools/dummy-text",
    summary: "시안용 샘플 문장을 빠르게 생성",
    description: "레이아웃 시안, 카드 UI, 텍스트 블록 테스트를 위한 더미 문장을 생성합니다.",
    sectionId: "documents",
    accent: "yellow",
    icon: Type,
    features: ["길이 조절", "문단 단위 생성", "복사용 결과"],
    useCases: ["디자인 시안", "콘텐츠 박스 테스트", "템플릿 제작"],
    isNew: true,
  },
  {
    id: "slug-generator",
    name: "슬러그 생성기",
    slug: "/tools/slug-generator",
    summary: "제목을 URL 친화적인 슬러그로 변환",
    description: "블로그 글 제목이나 문서 제목을 URL에 적합한 형태로 정리해 주는 도구입니다.",
    sectionId: "documents",
    accent: "blue",
    icon: Link2,
    features: ["영문/숫자 정리", "공백 제거", "URL 안전 문자 변환"],
    useCases: ["블로그 발행", "CMS 관리", "문서 URL 설계"],
  },
  {
    id: "romanization",
    name: "로마자 변환기",
    slug: "/tools/romanization",
    summary: "한글 표기를 영문 로마자 표기로 변환",
    description: "이름, 주소, 문서 표기용 한글 텍스트를 로마자 형태로 정리하는 도구입니다.",
    sectionId: "documents",
    accent: "purple",
    icon: Languages,
    features: ["한글 로마자 변환", "복사용 결과", "문서용 표기 점검"],
    useCases: ["여권 표기 초안", "영문 문서 작성", "명함 정보 정리"],
  },
  {
    id: "special-emoji",
    name: "특수문자/이모지",
    slug: "/tools/special-emoji",
    summary: "자주 쓰는 특수문자와 이모지를 검색하고 복사",
    description: "콘텐츠 제작과 고객 응대에 자주 쓰는 심볼과 이모지를 빠르게 찾는 도구입니다.",
    sectionId: "documents",
    accent: "red",
    icon: Search,
    features: ["카테고리 탐색", "즉시 복사", "자주 쓰는 문자 모음"],
    useCases: ["콘텐츠 꾸미기", "공지 작성", "이메일 작성"],
  },
  {
    id: "pdf-editor",
    name: "PDF 편집기",
    slug: "/tools/pdf-editor",
    summary: "파일을 올리고 PDF 정리 작업을 바로 시작하는 편집 화면",
    description: "PDF 파일을 업로드한 뒤 병합, 분할, 회전 같은 기본 정리 작업을 한 화면에서 바로 이어갈 수 있습니다.",
    sectionId: "pdf",
    accent: "red",
    icon: FileText,
    features: ["PDF 병합", "PDF 분할", "페이지 회전"],
    useCases: ["계약서 편집", "보고서 합치기", "제출 파일 정리"],
    isPopular: true,
  },
  {
    id: "image-to-pdf",
    name: "이미지 → PDF",
    slug: "/tools/image-to-pdf",
    summary: "이미지 여러 장을 순서대로 PDF로 변환",
    description: "영수증, 스캔 이미지, 촬영본을 하나의 PDF 문서로 묶어 정리하는 도구입니다.",
    sectionId: "pdf",
    accent: "orange",
    icon: Image,
    features: ["다중 이미지 묶기", "페이지 순서 정렬", "PDF 내보내기"],
    useCases: ["증빙 제출", "스캔 문서 정리", "고객 전달용 파일 제작"],
    isPopular: true,
  },
  {
    id: "pdf-to-image",
    name: "PDF → 이미지",
    slug: "/tools/pdf-to-image",
    summary: "PDF 페이지를 이미지로 추출해 공유",
    description: "문서 일부를 이미지로 빠르게 변환해 메신저나 슬라이드에 붙여넣을 수 있습니다.",
    sectionId: "pdf",
    accent: "yellow",
    icon: Image,
    features: ["페이지별 추출", "PNG/JPG 변환", "썸네일 생성"],
    useCases: ["문서 미리보기 공유", "슬라이드 삽입", "디자인 전달"],
  },
  {
    id: "pdf-watermark",
    name: "PDF 워터마크",
    slug: "/tools/pdf-watermark",
    summary: "문서 위에 텍스트 워터마크를 추가",
    description: "대외 공유용 문서에 회사명, 초안 여부, 보안 문구를 워터마크로 삽입하는 도구입니다.",
    sectionId: "pdf",
    accent: "purple",
    icon: ShieldCheck,
    features: ["텍스트 워터마크", "반복 배치", "위치/투명도 설정"],
    useCases: ["외부 공유 문서", "보안 초안", "검토용 배포본"],
    isNew: true,
  },
  {
    id: "pdf-metadata",
    name: "PDF 메타데이터",
    slug: "/tools/pdf-metadata",
    summary: "제목, 작성자, 키워드 등 문서 정보를 편집",
    description: "PDF 내부 문서 정보를 확인하고 정리해서 아카이빙 품질을 높이는 메타데이터 관리 도구입니다.",
    sectionId: "pdf",
    accent: "blue",
    icon: Database,
    features: ["문서 정보 조회", "작성자/제목 편집", "키워드 정리"],
    useCases: ["문서 보관", "검색 최적화", "전달용 파일 정리"],
  },
  {
    id: "pdf-to-markdown",
    name: "PDF → Markdown",
    slug: "/tools/pdf-to-markdown",
    summary: "문서 내용을 마크다운 구조로 재정리",
    description: "리서치 문서나 회의 자료를 마크다운 초안으로 옮겨 재활용하기 쉽게 정리합니다.",
    sectionId: "pdf",
    accent: "green",
    icon: ScanText,
    features: ["텍스트 추출", "제목 구조 인식", "마크다운 초안 생성"],
    useCases: ["문서 요약", "위키 이전", "리서치 정리"],
    isPopular: true,
  },
  {
    id: "unit-converter",
    name: "단위 변환기",
    slug: "/tools/unit-converter",
    summary: "길이, 무게, 면적, 데이터 등 다양한 단위를 환산",
    description: "업무 중 자주 필요한 여러 단위를 한 화면에서 빠르게 변환하는 실무형 계산기입니다.",
    sectionId: "business-calculators",
    accent: "green",
    icon: Box,
    features: ["다중 단위 지원", "즉시 결과 표시", "실무형 단위 프리셋"],
    useCases: ["물류", "개발", "디자인 작업"],
    isPopular: true,
  },
  {
    id: "date-calculator",
    name: "날짜 계산기",
    slug: "/tools/date-calculator",
    summary: "날짜 차이와 특정 일수 후 일정을 빠르게 계산",
    description: "프로젝트 일정, 계약 기간, 배송 예정일 계산에 바로 활용할 수 있는 날짜 계산기입니다.",
    sectionId: "business-calculators",
    accent: "red",
    icon: CalendarDays,
    features: ["날짜 차이 계산", "N일 후 날짜", "주말 고려 메모"],
    useCases: ["일정 관리", "계약 마감일", "배송 ETA 계산"],
    isPopular: true,
  },
  {
    id: "age-dday",
    name: "나이/디데이",
    slug: "/tools/age-dday",
    summary: "만 나이와 특정 날짜까지 남은 일수를 계산",
    description: "기념일, 이벤트 시작일, 입사일 기준 계산을 빠르게 처리하는 도구입니다.",
    sectionId: "business-calculators",
    accent: "orange",
    icon: Clock3,
    features: ["만 나이 계산", "D-day 표시", "기준일 저장"],
    useCases: ["이벤트 운영", "인사 업무", "개인 일정 관리"],
  },
  {
    id: "compound-interest",
    name: "복리 계산기",
    slug: "/tools/compound-interest",
    summary: "복리 이자와 자산 성장 시뮬레이션을 한 번에",
    description: "초기 자산, 납입액, 수익률 기준으로 장기 자산 성장 시나리오를 계산하는 도구입니다.",
    sectionId: "business-calculators",
    accent: "green",
    icon: TrendingUp,
    features: ["복리 성장 시뮬레이션", "월 납입액 반영", "기간별 예상 자산"],
    useCases: ["개인 재무", "장기 투자", "사내 재테크 콘텐츠"],
    isPopular: true,
  },
  {
    id: "irr-calculator",
    name: "IRR 계산기",
    slug: "/tools/irr-calculator",
    summary: "내부수익률과 투자 회수 관점을 빠르게 검토",
    description: "현금 흐름 기반으로 IRR, NPV, 회수기간을 함께 검토하는 투자 분석용 계산기입니다.",
    sectionId: "business-calculators",
    accent: "blue",
    icon: Percent,
    features: ["IRR 계산", "NPV 개요", "회수기간 요약"],
    useCases: ["투자 검토", "사업성 분석", "재무 보고"],
    isNew: true,
  },
  {
    id: "equity-simulator",
    name: "지분율 시뮬레이터",
    slug: "/tools/equity-simulator",
    summary: "투자 라운드별 지분 희석을 시각적으로 확인",
    description: "라운드별 투자와 옵션 풀 변화를 반영해 창업팀 지분율이 어떻게 바뀌는지 살펴볼 수 있습니다.",
    sectionId: "business-calculators",
    accent: "purple",
    icon: Coins,
    features: ["라운드별 희석 계산", "창업팀/투자자 비중", "옵션 풀 반영"],
    useCases: ["스타트업 재무", "투자 협상", "지분 구조 브리핑"],
  },
  {
    id: "stock-option",
    name: "스톡옵션 계산기",
    slug: "/tools/stock-option",
    summary: "베스팅과 행사 시나리오를 기준으로 예상 가치를 계산",
    description: "베스팅 일정, 행사가, 예상 기업가치를 넣어 스톡옵션의 잠재 가치를 가늠하는 도구입니다.",
    sectionId: "business-calculators",
    accent: "yellow",
    icon: Wallet,
    features: ["베스팅 스케줄", "행사 시나리오", "세전 가치 추정"],
    useCases: ["보상 비교", "입사 검토", "인재 영입 자료"],
  },
  {
    id: "net-pay",
    name: "실수령액 계산기",
    slug: "/tools/net-pay",
    summary: "급여에서 공제 후 실제 수령액을 빠르게 추정",
    description: "월급, 상여, 공제 항목을 기준으로 실수령액을 계산하는 인사/재무용 도구입니다.",
    sectionId: "business-calculators",
    accent: "orange",
    icon: Wallet,
    features: ["4대보험 반영", "세전/세후 비교", "월 수령액 계산"],
    useCases: ["채용 제안서", "급여 검토", "재무 상담"],
    isPopular: true,
  },
  {
    id: "tax-calculator",
    name: "세금 계산기",
    slug: "/tools/tax-calculator",
    summary: "부가세와 원천징수 등 자주 쓰는 세액을 계산",
    description: "공급가, 합계금액, 세율 기준으로 세금 관련 계산을 빠르게 수행하는 업무 도구입니다.",
    sectionId: "business-calculators",
    accent: "red",
    icon: Receipt,
    features: ["부가세 계산", "원천징수 계산", "세전/세후 환산"],
    useCases: ["거래 정산", "프리랜서 정산", "세무 초안 점검"],
    isPopular: true,
  },
  {
    id: "loan-calculator",
    name: "대출 계산기",
    slug: "/tools/loan-calculator",
    summary: "상환 방식에 따른 월 납입액과 총 이자를 계산",
    description: "대출 원금, 금리, 기간, 상환 방식 기준으로 부담 금액을 정리하는 계산기입니다.",
    sectionId: "business-calculators",
    accent: "blue",
    icon: Coins,
    features: ["원리금 균등", "원금 균등", "총 이자 추정"],
    useCases: ["예산 계획", "자금 조달", "금융 비교"],
    isPopular: true,
  },
  {
    id: "tax-invoice",
    name: "세금계산서",
    slug: "/tools/tax-invoice",
    summary: "거래처 정보와 품목을 입력해 세금계산서 초안 생성",
    description: "필수 입력 필드를 구조화해 세금계산서/계산서 문서 초안을 빠르게 준비하는 도구입니다.",
    sectionId: "business-documents",
    accent: "purple",
    icon: FileText,
    features: ["공급자/공급받는자 입력", "품목 목록", "출력용 초안"],
    useCases: ["세무 정산", "거래 명세 작성", "회계 전달 자료"],
    isPopular: true,
  },
  {
    id: "estimate-builder",
    name: "견적서 생성기",
    slug: "/tools/estimate-builder",
    summary: "견적서와 인보이스를 빠르게 작성하고 출력",
    description: "품목과 단가, 합계를 정리해 고객에게 전달 가능한 견적서 초안을 작성하는 문서 도구입니다.",
    sectionId: "business-documents",
    accent: "blue",
    icon: Receipt,
    features: ["견적 항목 편집", "합계 자동 정리", "인보이스 겸용 레이아웃"],
    useCases: ["외주 제안", "고객 발송", "영업 문서"],
    isPopular: true,
  },
  {
    id: "stamp-generator",
    name: "도장 생성기",
    slug: "/tools/stamp-generator",
    summary: "전자문서용 도장 이미지를 깔끔하게 생성",
    description: "한글/영문 이름으로 전자문서에 쓸 수 있는 간단한 도장 이미지를 만드는 도구입니다.",
    sectionId: "business-documents",
    accent: "red",
    icon: Stamp,
    features: ["도장 텍스트 입력", "원형/사각 스타일", "PNG 저장 준비"],
    useCases: ["전자 결재", "계약서 서명 대체", "증빙 문서"],
  },
  {
    id: "email-signature",
    name: "이메일 서명",
    slug: "/tools/email-signature",
    summary: "회사 정보가 정리된 HTML 이메일 서명 생성",
    description: "이름, 직함, 연락처, 링크 정보를 넣어 통일감 있는 이메일 서명을 만드는 도구입니다.",
    sectionId: "business-documents",
    accent: "green",
    icon: Mail,
    features: ["HTML 서명 레이아웃", "연락처 블록", "브랜드 컬러 반영"],
    useCases: ["회사 메일 세팅", "브랜드 통일", "신규 입사자 온보딩"],
    isNew: true,
  },
  {
    id: "annual-calendar",
    name: "연간달력",
    slug: "/tools/annual-calendar",
    summary: "A4 한 장으로 정리된 1년 달력을 생성하고 출력",
    description: "연간 일정 계획이나 오프라인 부착용으로 적합한 한 장짜리 달력을 빠르게 생성합니다.",
    sectionId: "business-documents",
    accent: "orange",
    icon: CalendarDays,
    features: ["12개월 한 장 보기", "출력 친화 레이아웃", "휴일 메모 영역"],
    useCases: ["연간 운영 계획", "벽 부착용 일정표", "팀 캘린더"],
  },
];

export const sectionMap = toolSections.reduce(
  (acc, section) => {
    acc[section.id] = tools.filter((tool) => tool.sectionId === section.id);
    return acc;
  },
  {} as Record<ToolSectionId, ToolItem[]>,
);

export const popularTools = tools.filter((tool) => tool.isPopular).slice(0, 10);

export const highlightedSections = toolSections.map((section) => ({
  ...section,
  tools: sectionMap[section.id].slice(0, 4),
}));

export const recentTools = [
  { name: "PDF 편집기", href: "/tools/pdf-editor", time: "방금 전", accent: "red" as Accent },
  { name: "마크다운 미리보기", href: "/tools/markdown-preview", time: "5분 전", accent: "blue" as Accent },
  { name: "대출 계산기", href: "/tools/loan-calculator", time: "14분 전", accent: "green" as Accent },
  { name: "견적서 생성기", href: "/tools/estimate-builder", time: "1시간 전", accent: "purple" as Accent },
];

export function getToolById(toolId: string) {
  return tools.find((tool) => tool.id === toolId);
}

export function getSectionById(sectionId: ToolSectionId) {
  return sectionMapById[sectionId];
}

export function getRelatedTools(toolId: string) {
  const tool = getToolById(toolId);
  if (!tool) return [];
  return sectionMap[tool.sectionId].filter((item) => item.id !== tool.id).slice(0, 4);
}
