import { CategoryList } from "@/components/cards/CategoryList";

export function RightPanel() {
  return (
    <aside className="right-panel">
      <div className="panel-card">
        <h2>업무 허브</h2>
        <p className="panel-description">
          문서 작성부터 PDF 변환, 재무 계산, 서류 생성까지 한 흐름으로 정리했습니다.
        </p>
        <CategoryList />
      </div>
    </aside>
  );
}
