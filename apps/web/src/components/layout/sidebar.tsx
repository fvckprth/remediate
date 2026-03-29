import Link from "next/link";
import { UserMenu } from "./user-menu";

export function Sidebar({ userName, userImage }: { userName?: string | null; userImage?: string | null }) {
  return (
    <aside className="flex h-screen w-56 flex-col border-r border-border bg-background px-4 py-6">
      <Link href="/dashboard" className="text-lg font-bold tracking-tight">
        Remediate
      </Link>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        <Link
          href="/dashboard"
          className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-surface transition-colors"
        >
          Projects
        </Link>
      </nav>

      <UserMenu userName={userName} userImage={userImage} />
    </aside>
  );
}
