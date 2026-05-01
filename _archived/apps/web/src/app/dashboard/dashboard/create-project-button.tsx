"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger, DialogContent, DialogClose } from "@/components/ui/dialog";
import { createProject } from "@/actions/projects";

export function CreateProjectButton() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button>New Project</Button>
      </DialogTrigger>
      <DialogContent title="Create project">
        <form action={createProject}>
          <Input
            name="name"
            placeholder="Project name"
            required
            autoFocus
          />
          <div className="mt-4 flex justify-end gap-2">
            <DialogClose>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
