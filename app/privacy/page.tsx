import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { DocsFrame } from "@/components/layout/DocsFrame";

export const metadata = {
  title: "개인정보처리방침 | Gomdol Tool",
  description: "Gomdol Tool 개인정보처리방침입니다.",
};

export default function PrivacyPage() {
  return (
    <DocsFrame>
      <div className="detail-page info-page">
        <Breadcrumb
          items={[
            { label: "홈", href: "/" },
            { label: "개인정보처리방침" },
          ]}
        />

        <div className="info-page-hero">
          <h1>개인정보처리방침</h1>
          <p>시행일: 2026년 1월 1일</p>
        </div>

        <div className="info-prose-stack">
          <section className="detail-card info-card">
            <h2>1. 개인정보 수집 및 이용 원칙</h2>
            <p>
              Gomdol Tool(이하 &quot;서비스&quot;)은 별도의 회원가입 없이 이용할 수 있으며,
              이용자의 개인정보를 최소한으로 수집합니다. 서비스의 대부분 기능은
              이용자가 입력한 데이터를 서버로 전송하지 않고 브라우저 내에서만 처리합니다.
            </p>
          </section>

          <section className="detail-card info-card">
            <h2>2. 수집하는 정보</h2>
            <h3>자동 수집 정보</h3>
            <p>서비스는 서비스 품질 개선 및 통계 분석을 위해 다음 정보를 자동으로 수집할 수 있습니다.</p>
            <ul className="info-prose-list">
              <li>방문한 페이지, 체류 시간, 클릭 이벤트 등 서비스 이용 기록 (Google Analytics)</li>
              <li>브라우저 유형, 운영체제, 화면 해상도 등 기기 정보</li>
              <li>접속 IP 주소 및 접속 일시</li>
            </ul>
            <h3>로컬 저장 정보</h3>
            <p>
              서비스는 이용자의 편의를 위해 최근 사용한 도구 목록을 이용자 기기의
              로컬 스토리지(localStorage)에만 저장합니다. 이 정보는 서버로 전송되지 않으며
              이용자가 직접 삭제할 수 있습니다.
            </p>
          </section>

          <section className="detail-card info-card">
            <h2>3. 수집하지 않는 정보</h2>
            <p>서비스는 다음 정보를 수집하지 않습니다.</p>
            <ul className="info-prose-list">
              <li>이름, 이메일 주소, 전화번호 등 식별 가능한 개인정보</li>
              <li>이용자가 도구에 입력한 문서, 파일, 계산 데이터</li>
              <li>결제 정보</li>
            </ul>
          </section>

          <section className="detail-card info-card">
            <h2>4. 제3자 서비스 이용</h2>
            <p>서비스는 다음 제3자 서비스를 이용합니다.</p>
            <ul className="info-prose-list">
              <li>
                <strong>Google Analytics</strong> — 서비스 이용 통계 분석에 사용됩니다.
                Google의 개인정보처리방침은{" "}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                  policies.google.com/privacy
                </a>
                에서 확인하실 수 있습니다.
              </li>
              <li>
                <strong>Google AdSense</strong> — 광고 제공에 사용됩니다.
                Google은 쿠키를 사용하여 이용자의 관심사에 맞는 광고를 표시할 수 있습니다.
              </li>
            </ul>
          </section>

          <section className="detail-card info-card">
            <h2>5. 쿠키 사용</h2>
            <p>
              서비스는 Google Analytics 및 Google AdSense를 통해 쿠키를 사용할 수 있습니다.
              이용자는 브라우저 설정에서 쿠키 수집을 거부하거나 삭제할 수 있습니다.
              단, 쿠키 수집을 거부할 경우 일부 기능 이용이 제한될 수 있습니다.
            </p>
          </section>

          <section className="detail-card info-card">
            <h2>6. 개인정보의 보유 및 파기</h2>
            <p>
              서비스는 이용자의 개인정보를 별도로 보관하지 않습니다.
              Google Analytics를 통해 수집된 통계 데이터는 Google의 정책에 따라 처리됩니다.
              이용자 기기에 저장된 로컬 스토리지 데이터는 이용자가 직접 브라우저를 통해 삭제할 수 있습니다.
            </p>
          </section>

          <section className="detail-card info-card">
            <h2>7. 이용자의 권리</h2>
            <p>이용자는 다음과 같은 권리를 가집니다.</p>
            <ul className="info-prose-list">
              <li>브라우저 설정을 통해 쿠키 수집 거부</li>
              <li>브라우저 로컬 스토리지에서 저장된 데이터 직접 삭제</li>
              <li>Google Analytics 추적 거부 (Google Analytics 옵트아웃 브라우저 부가기능 사용)</li>
            </ul>
          </section>

          <section className="detail-card info-card">
            <h2>8. 방침의 변경</h2>
            <p>
              이 개인정보처리방침은 법령 개정이나 서비스 변경에 따라 업데이트될 수 있습니다.
              변경 사항은 서비스 내 공지를 통해 고지하며, 시행일 기준으로 적용됩니다.
              문의 사항이 있으신 경우{" "}
              <Link href="/contact">문의하기</Link>
              를 통해 연락해 주세요.
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
