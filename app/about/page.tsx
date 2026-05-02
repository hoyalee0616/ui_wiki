import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { Footer } from "@/components/layout/Footer";
import { DocsFrame } from "@/components/layout/DocsFrame";

export const metadata = {
  title: "소개 | Gomdol Tool",
  description: "Gomdol Tool은 로그인 없이 브라우저에서 바로 쓸 수 있는 업무용 유틸리티 모음입니다.",
};

export default function AboutPage() {
  return (
    <DocsFrame>
      <div className="detail-page info-page">
        <Breadcrumb
          items={[
            { label: "홈", href: "/" },
            { label: "소개" },
          ]}
        />

        <div className="info-page-hero">
          <h1>Gomdol Tool 소개</h1>
          <p>문서처럼 찾고, 도구처럼 바로 실행하는 업무용 유틸리티 모음</p>
        </div>

        <div className="info-section-grid">
          <section className="detail-card info-card">
            <h2>만든 이유</h2>
            <p>
              업무 중에 글자수를 세거나, PDF를 변환하거나, 날짜를 계산해야 할 때마다
              검색 엔진을 열고 사이트를 찾는 과정이 번거롭다고 느꼈습니다.
            </p>
            <p>
              Gomdol Tool은 그 불편함에서 출발했습니다.
              자주 쓰는 실무 도구들을 한 곳에 모아두고, 로그인이나 설치 없이
              브라우저에서 곧바로 쓸 수 있도록 만들었습니다.
            </p>
          </section>

          <section className="detail-card info-card">
            <h2>주요 특징</h2>
            <ul className="info-list">
              <li>
                <strong>로그인 불필요</strong>
                <span>계정 없이 바로 사용할 수 있습니다. 회원가입, 이메일 인증 모두 필요 없습니다.</span>
              </li>
              <li>
                <strong>프라이버시 보호</strong>
                <span>대부분의 도구는 서버로 데이터를 전송하지 않고 브라우저 안에서만 처리합니다.</span>
              </li>
              <li>
                <strong>즉시 실행</strong>
                <span>페이지를 열면 바로 사용할 수 있습니다. 로딩이나 광고 팝업이 없습니다.</span>
              </li>
              <li>
                <strong>50개 이상의 도구</strong>
                <span>문서/콘텐츠, PDF, 이미지, 개발자 도구, 계산기, 업무 서류까지 카테고리별로 정리되어 있습니다.</span>
              </li>
            </ul>
          </section>

          <section className="detail-card info-card">
            <h2>제공 카테고리</h2>
            <div className="info-category-grid">
              <div className="info-category-item">
                <strong>문서/콘텐츠</strong>
                <span>마크다운 미리보기, 글자수 계산기, 더미 텍스트, 로마자 변환기 등</span>
              </div>
              <div className="info-category-item">
                <strong>PDF 도구</strong>
                <span>PDF 편집, 이미지 변환, 워터마크, 압축 예상, 암호 보호 등</span>
              </div>
              <div className="info-category-item">
                <strong>이미지 도구</strong>
                <span>이미지 리사이저, 압축 예상, 화면 비율 계산, 색상 변환 등</span>
              </div>
              <div className="info-category-item">
                <strong>개발자 도구</strong>
                <span>JSON 포매터, Base64 변환, URL 인코더, UUID 생성기, 해시 생성 등</span>
              </div>
              <div className="info-category-item">
                <strong>업무용 계산기</strong>
                <span>날짜 계산, 복리/IRR, 실수령액, 세금, 대출, 스톡옵션 등</span>
              </div>
              <div className="info-category-item">
                <strong>업무 서류</strong>
                <span>세금계산서, 견적서, 도장 생성기, 이메일 서명, QR코드, 연간달력</span>
              </div>
            </div>
          </section>

          <section className="detail-card info-card">
            <h2>앞으로의 방향</h2>
            <p>
              더 많은 실무 도구를 지속적으로 추가할 예정입니다.
              필요한 도구나 개선 사항이 있으면 언제든지 문의해 주세요.
              사용자 피드백을 바탕으로 Gomdol Tool을 계속 발전시켜 나가겠습니다.
            </p>
            <Link href="/contact" className="info-cta">
              문의하기
              <ArrowRight size={16} />
            </Link>
          </section>
        </div>

        <Link href="/" className="wide-link">
          홈으로 돌아가기
          <ArrowRight size={18} />
        </Link>
        <Footer />
      </div>
    </DocsFrame>
  );
}
