import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ConvertForm } from "@/components/tools/ConvertForm";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export default function LengthConvertPage() {
  return (
    <div className="detail-page-shell">
      <Header />
      <main className="detail-page">
        <Breadcrumb
          items={[
            { label: "홈", href: "/" },
            { label: "변환", href: "/menu?category=convert" },
            { label: "길이 변환" },
          ]}
        />
        <section className="detail-intro">
          <h1>길이 변환</h1>
          <p>다양한 길이 단위를 변환할 수 있습니다.</p>
        </section>
        <ConvertForm />
      </main>
      <Footer />
    </div>
  );
}
