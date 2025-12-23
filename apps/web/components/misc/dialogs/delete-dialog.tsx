"use client"

import { useState, type ReactNode } from "react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog"
import { Button } from "@workspace/ui/components/button"

interface DeleteDialogProps {
  trigger: ReactNode
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onDelete: () => void
  loading: boolean
}

export const DeleteDialog = ({
  trigger,
  title,
  description,
  confirmText = "Delete",
  cancelText = "Cancel",
  onDelete,
  loading,
}: DeleteDialogProps) => {
  const [open, setOpen] = useState(false)

  const handleConfirm = async () => {
    try {
      onDelete()
    } catch (error) {
    } finally {
      setOpen(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelText}</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            loading={loading}
            className="ml-2"
          >
            {loading ? "Deleting..." : confirmText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
