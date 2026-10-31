import { Link } from "@tanstack/react-router";
import { LayoutDashboard, Award, FolderClock, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/certificate", label: "Certificate", icon: Award },
  { to: "/records", label: "Records", icon: FolderClock },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {nav.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact: to === "/" }}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[status=active]:bg-sidebar-primary data-[status=active]:text-sidebar-primary-foreground"
        >
          <Icon className="size-4.5 shrink-0" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Award className="size-5" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-bold tracking-tight">TechnoGlobe</p>
        <p className="text-[11px] text-muted-foreground">Certificate Suite</p>
      </div>
    </div>
  );
}

export default function AppShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-muted/40">
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <Brand />
        <div className="mt-8 flex-1">
          <NavLinks />
        </div>
        <p className="text-[11px] text-muted-foreground">
          Verified certificates by TechnoGlobe
        </p>
      </aside>

      {open ? (
        <div className="no-print fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 bg-sidebar p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <Brand />
              <button aria-label="Close menu" onClick={() => setOpen(false)}>
                <X className="size-5" />
              </button>
            </div>
            <div className="mt-8">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}

      <div className="print-root lg:pl-64">
        <header className="no-print sticky top-0 z-20 flex flex-col gap-3 border-b bg-background/85 px-4 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-start gap-3">
            <button
              className="rounded-md p-1.5 hover:bg-accent lg:hidden"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              <Menu className="size-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h1>
              {description ? (
                <p className="text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </header>

        <main className="px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
