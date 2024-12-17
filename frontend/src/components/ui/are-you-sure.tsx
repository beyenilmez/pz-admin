import { useState, forwardRef, useImperativeHandle, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AreYouSureDialogProps {
  title?: string;
  description?: string;
  cancelText?: string;
  acceptText?: string;
  onCancel?: () => void;
  onAccept?: () => void;
  children?: ReactNode;
}

export interface AreYouSureDialogRef {
  openDialog: () => void;
  closeDialog: () => void;
}

export const AreYouSureDialog = forwardRef<
  AreYouSureDialogRef,
  AreYouSureDialogProps
>(
  (
    {
      title = "Are you sure?",
      description = "",
      cancelText = "Cancel",
      acceptText = "Accept",
      onCancel,
      onAccept,
      children,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);

    const openDialog = () => setIsOpen(true);
    const closeDialog = () => setIsOpen(false);

    useImperativeHandle(ref, () => ({
      openDialog,
      closeDialog,
    }));

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <span></span>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">{children}</div>
          <DialogFooter className="sm:justify-end">
            <DialogClose asChild>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  closeDialog();
                  if (onCancel) {
                    onCancel();
                  }
                }}
              >
                {cancelText}
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                closeDialog();
                if (onAccept) {
                  onAccept();
                }
              }}
            >
              {acceptText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

AreYouSureDialog.displayName = "AreYouSureDialog";
