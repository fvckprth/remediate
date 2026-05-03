"use client";

import { Remediate } from "remediate";
import { Agentation } from "agentation";

export function GlobalWidgets() {
  return (
    <>
      <Remediate
        endpoint="/api/feedback"
        onError={(err) => console.error("[remediate] submit failed", err)}
      />
      {process.env.NODE_ENV === "development" && (
        <Agentation className="agentation-top" />
      )}
    </>
  );
}
