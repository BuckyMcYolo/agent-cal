import { useMutation, useQueryClient } from "@tanstack/react-query"
import { authClient } from "@workspace/auth/client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog"
import { Button } from "@workspace/ui/components/button"
import { Trash } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { useUser } from "@/hooks/use-user"
import { apiClient } from "@/lib/utils/api-client"

export default function DeleteApiKeyDialog({ keyId }: { keyId: string }) {
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null)
  const { user, isLoading } = useUser()

  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: async (keyId: string) => {
      if (user?.role === "admin") {
        const res = await apiClient["api-keys"].org[":id"].$delete({
          param: {
            id: keyId,
          },
        })
        if (res.status === 200) {
          const data = await res.json()
          return data
        } else {
          const data = await res.json()
          throw new Error(data.message)
        }
      } else {
        const { error } = await authClient.apiKey.delete({
          keyId,
        })
        if (error) {
          throw new Error(`Error: ${error?.statusText}`)
        }
      }
    },
    mutationKey: ["delete-api-key"],
    onSuccess: () => {
      toast.success("API key deleted successfully")
      queryClient.invalidateQueries({
        queryKey: ["api-keys-user"],
      })
      queryClient.invalidateQueries({
        queryKey: ["api-keys-org"],
      })
      setKeyToDelete(null)
    },
    onError: (error) => {
      toast.error(`Error deleting API key: ${error.message}`)
    },
  })
  return (
    <AlertDialog open={keyToDelete === keyId}>
      <AlertDialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="size-7 hover:bg-destructive/10 dark:hover:bg-destructive/10"
          onClick={() => {
            setKeyToDelete(keyId)
          }}
        >
          <Trash className="size-4 text-red-500" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want to delete this API key?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your API
            key.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex justify-end space-x-2">
          <AlertDialogCancel
            onClick={() => {
              setKeyToDelete(null)
            }}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              mutate(keyId)
            }}
            loading={isPending}
          >
            Delete
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
