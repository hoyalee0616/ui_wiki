import { Metadata } from "next";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { Footer } from "@/components/layout/Footer";
import { DocsFrame } from "@/components/layout/DocsFrame";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "문의 | Gomdol Tool",
  description: "Gomdol Tool에 도구 제안, 버그 신고, 기타 의견을 남겨주세요.",
};

export default function ContactPage() {
  return (
    <DocsFrame>
      <div className="detail-page info-page">
        <Breadcrumb
          items={[
            { label: "홈", href: "/" },
            { label: "문의" },
          ]}
        />

        <div className="info-page-hero">
          <h1>문의하기</h1>
          <p>도구 제안, 버그 신고, 기타 의견을 남겨주세요. 소중하게 검토하겠습니다.</p>
        </div>

        <ContactForm />

        <Footer />
      </div>
    </DocsFrame>
  );
}
