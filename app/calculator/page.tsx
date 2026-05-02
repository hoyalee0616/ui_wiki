import { Breadcrumb } from "@/components/common/Breadcrumb";
import { CalculatorPad } from "@/components/tools/CalculatorPad";
import { Header } from "@/components/layout/Header";

export default function CalculatorPage() {
  return (
    <div className="detail-page-shell">
      <Header />
      <main className="detail-page">
        <Breadcrumb
          items={[
            { label: "홈", href: "/" },
            { label: "계산", href: "/menu?category=calc" },
            { label: "계산기" },
          ]}
        />
        <section className="detail-intro">
          <h1>계산기</h1>
          <p>기본 계산기를 사용하여 계산할 수 있습니다.</p>
        </section>
        <CalculatorPad />
      </main>
    </div>
  );
}
