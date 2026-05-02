import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { DocsFrame } from "@/components/layout/DocsFrame";

export const metadata = {
  title: "이용약관 | Gomdol Tool",
  description: "Gomdol Tool 이용약관입니다.",
};

export default function TermsPage() {
  return (
    <DocsFrame>
      <div className="detail-page info-page">
        <Breadcrumb
          items={[
            { label: "홈", href: "/" },
            { label: "이용약관" },
          ]}
        />

        <div className="info-page-hero">
          <h1>이용약관</h1>
          <p>시행일: 2026년 1월 1일</p>
        </div>

        <div className="info-prose-stack">
          <section className="detail-card info-card">
            <h2>제1조 (목적)</h2>
            <p>
              이 약관은 Gomdol Tool(이하 &quot;서비스&quot;)의 이용과 관련하여 서비스 운영자와 이용자 간의
              권리, 의무 및 책임 사항을 규정하는 것을 목적으로 합니다.
            </p>
          </section>

          <section className="detail-card info-card">
            <h2>제2조 (서비스의 제공)</h2>
            <p>서비스는 다음과 같은 기능을 제공합니다.</p>
            <ul className="info-prose-list">
              <li>문서/콘텐츠 관련 유틸리티 도구</li>
              <li>PDF 편집 및 변환 도구</li>
              <li>이미지 처리 도구</li>
              <li>개발자용 유틸리티 도구</li>
              <li>업무용 계산기 및 서류 생성 도구</li>
              <li>기타 운영자가 추가하는 유틸리티 도구</li>
            </ul>
            <p>
              서비스는 별도의 회원가입 없이 이용할 수 있으며, 서비스 운영자는 필요에 따라
              서비스의 내용을 변경하거나 종료할 수 있습니다.
            </p>
          </section>

          <section className="detail-card info-card">
            <h2>제3조 (이용자의 의무)</h2>
            <p>이용자는 다음 각 호의 행위를 하여서는 안 됩니다.</p>
            <ul className="info-prose-list">
              <li>서비스를 이용하여 법령 또는 공공질서에 위반되는 행위</li>
              <li>타인의 권리(저작권, 개인정보 등)를 침해하는 행위</li>
              <li>서비스의 정상적인 운영을 방해하는 행위</li>
              <li>자동화된 방법(봇, 스크레이퍼 등)으로 서비스를 대량 호출하는 행위</li>
              <li>서비스를 상업적으로 무단 전용하는 행위</li>
            </ul>
          </section>

          <section className="detail-card info-card">
            <h2>제4조 (면책 사항)</h2>
            <ul className="info-prose-list">
              <li>
                서비스는 도구의 연산 결과에 대해 법적 효력이나 정확성을 보장하지 않습니다.
                계산 결과는 참고용으로만 사용하시기 바랍니다.
              </li>
              <li>
                서비스는 이용자가 서비스를 통해 처리한 파일 및 데이터의 손실, 유출,
                훼손에 대해 책임을 지지 않습니다.
              </li>
              <li>
                서비스는 천재지변, 시스템 장애 등 불가항력적 사유로 인한 서비스 중단에 대해
                책임을 지지 않습니다.
              </li>
              <li>
                서비스 내 외부 링크를 통해 이동한 제3자 사이트의 내용 및 서비스에 대해
                책임을 지지 않습니다.
              </li>
            </ul>
          </section>

          <section className="detail-card info-card">
            <h2>제5조 (지식재산권)</h2>
            <p>
              서비스의 디자인, 텍스트, 소프트웨어, 로고 등 모든 콘텐츠에 대한 저작권 및
              지식재산권은 서비스 운영자에게 있습니다. 이용자는 서비스를 통해 제공되는
              콘텐츠를 운영자의 사전 동의 없이 복제, 배포, 상업적으로 이용할 수 없습니다.
            </p>
          </section>

          <section className="detail-card info-card">
            <h2>제6조 (약관의 변경)</h2>
            <p>
              운영자는 필요한 경우 이 약관을 변경할 수 있으며, 변경된 약관은 서비스 내
              공지를 통해 고지합니다. 변경 약관의 시행일 이후에도 서비스를 계속 이용하는
              경우 변경된 약관에 동의한 것으로 간주합니다.
            </p>
          </section>

          <section className="detail-card info-card">
            <h2>제7조 (준거법 및 관할)</h2>
            <p>
              이 약관은 대한민국 법률에 따라 해석 및 적용됩니다.
              서비스 이용과 관련한 분쟁이 발생할 경우 운영자의 소재지를 관할하는
              법원을 전속 관할 법원으로 합니다.
            </p>
          </section>
        </div>

        <Link href="/" className="wide-link">
          홈으로 돌아가기
          <ArrowRight size={18} />
        </Link>
      </div>
    </DocsFrame>
  );
}
