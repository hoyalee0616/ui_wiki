interface SectionTitleProps {
  title: string;
  action?: string;
}

export function SectionTitle({ title, action }: SectionTitleProps) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      {action ? <button type="button">{action}</button> : null}
    </div>
  );
}
