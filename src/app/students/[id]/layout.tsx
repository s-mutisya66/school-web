import { AppShell } from "@/components/app-shell";

// Fees, attendance and report card all sit inside the same frame as the dashboards.
export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
