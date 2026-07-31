import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";

export function Badge({ children, tone }: { children: React.ReactNode; tone?: string }) {
  const classTone = tone?.split(" ")[0] ?? String(children).split(" ")[0];
  return <span className={`badge ${classTone}`}>{children}</span>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  note,
  icon: Icon
}: {
  label: string;
  value: React.ReactNode;
  note?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="card metric">
      <div className="metric-row">
        <span>{label}</span>
        {Icon ? (
          <div className="metric-icon">
            <Icon size={18} aria-hidden="true" />
          </div>
        ) : null}
      </div>
      <strong>{value}</strong>
      {note ? <p className="metric-note">{note}</p> : null}
    </div>
  );
}

export function EmptyState({ title, body, href, action }: { title: string; body: string; href?: string; action?: string }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p>{body}</p>
      {href && action ? (
        <Link className="button secondary" href={href}>
          {action}
        </Link>
      ) : null}
    </div>
  );
}

export function DateCell({ value }: { value?: Date | string | null }) {
  return <span>{formatDate(value)}</span>;
}

export function MiniBar({ value, max = 100 }: { value: number; max?: number }) {
  const width = Math.max(4, Math.min(100, (value / max) * 100));
  return (
    <div className="bar" aria-label={`${value} of ${max}`}>
      <span style={{ width: `${width}%` }} />
    </div>
  );
}

export function ChartRow({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="chart-row">
      <span>{label}</span>
      <MiniBar value={value} max={max} />
      <strong>{value}</strong>
    </div>
  );
}
