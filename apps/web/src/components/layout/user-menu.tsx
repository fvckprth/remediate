"use client";

import { signOut } from "next-auth/react";

export function UserMenu({
  userName,
  userImage,
}: {
  userName?: string | null;
  userImage?: string | null;
}) {
  return (
    <div className="flex items-center gap-3 border-t border-border pt-4">
      {userImage ? (
        <img
          src={userImage}
          alt=""
          className="h-8 w-8 rounded-full"
        />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-xs font-medium">
          {userName?.charAt(0)?.toUpperCase() ?? "?"}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium">{userName ?? "User"}</p>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="text-xs text-muted hover:text-foreground transition-colors cursor-pointer"
      >
        Sign out
      </button>
    </div>
  );
}
