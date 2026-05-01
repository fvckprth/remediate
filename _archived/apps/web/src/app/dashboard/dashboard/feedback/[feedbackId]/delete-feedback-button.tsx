"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { deleteFeedback } from "@/actions/feedback";

export function DeleteFeedbackButton({ feedbackId }: { feedbackId: string }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button variant="danger" onClick={() => setConfirming(true)}>
        Delete
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
      <Button variant="danger" onClick={() => deleteFeedback(feedbackId)}>
        Confirm delete
      </Button>
    </div>
  );
}
