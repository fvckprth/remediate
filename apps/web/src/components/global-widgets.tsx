"use client";

import { Remediate } from "remediate";
import { Agentation } from "agentation";

export function GlobalWidgets() {
  return (
    <>
      <Remediate onSubmit={(payload) => console.log(payload)} />
      {process.env.NODE_ENV === "development" && (
        <Agentation className="agentation-top" />
      )}
    </>
  );
}
