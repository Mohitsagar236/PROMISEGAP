import Link from "next/link";
import { BarChart3, BookOpenText, ClipboardCheck, FileText, Flag, Gauge, ListTodo, LogOut, Settings, ShieldCheck, Users } from "lucide-react";
import { logoutAction } from "@/app/actions";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/accounts", label: "Accounts", icon: Users },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/promises", label: "Promises", icon: Flag },
  { href: "/capabilities", label: "Capabilities", icon: ShieldCheck },
  { href: "/action-items", label: "Action items", icon: ListTodo },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/case-study", label: "Case study", icon: BookOpenText }
];

export function Sidebar({ user }: { user: { name: string; role: string; organization: { name: string } } }) {
  return (
    <aside className="sidebar">
      <Link href="/dashboard" className="brand">
        <div className="brand-mark">PG</div>
        <div>
          <strong>PromiseGap</strong>
          <span>Promise risk control</span>
        </div>
      </Link>
      <nav className="nav">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <Icon aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-user" style={{ marginTop: "auto" }}>
        <div className="sidebar-user-row">
          <div className="avatar">{user.name.slice(0, 1)}</div>
          <small>
            <strong style={{ color: "white" }}>{user.name}</strong>
            <br />
            {user.role}
          </small>
        </div>
        <small>{user.organization.name}</small>
        <form action={logoutAction} style={{ marginTop: 12 }}>
          <button className="button ghost" type="submit">
            <LogOut size={16} aria-hidden="true" />
            Logout
          </button>
        </form>
      </div>
    </aside>
  );
}
