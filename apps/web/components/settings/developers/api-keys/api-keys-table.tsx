"use client"

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import { authClient } from "@workspace/auth/client"
import { Button } from "@workspace/ui/components/button"
import {
  Table,
  TableCaption,
  TableBody,
  TableCell,
  TableFooter,
  TableHeader,
  TableHead,
  TableRow,
} from "@workspace/ui/components/table"
import { PenBox, Plus, SquarePen, Trash } from "lucide-react"
import { DateTime } from "luxon"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogHeader,
  AlertDialogCancel,
  AlertDialogFooter,
} from "@workspace/ui/components/alert-dialog"
import { toast } from "sonner"
import { useState } from "react"
import { CreateApiKeyDialog } from "./create-api-key-dialog"

export default function APIKeysTable() {
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null)

  const queryClient = useQueryClient()

  const {
    data: apiKeys,
    isLoading,
    error,
  } = useSuspenseQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const res = await authClient.apiKey.list({
        fetchOptions: {
          onError(context) {
            throw new Error(context.error.message)
          },
        },
      })
      return res.data
    },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await authClient.apiKey.delete({
        keyId,
      })
      if (error) {
        throw new Error(`Error: ${error?.statusText}`)
      }
    },
    mutationKey: ["delete-api-key"],
    onSuccess: () => {
      toast.success("API key deleted successfully")
      queryClient.invalidateQueries({
        queryKey: ["api-keys"],
      })
      setKeyToDelete(null)
    },
    onError: (error) => {
      toast.error(`Error deleting API key: ${error.message}`)
    },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold">API Keys</h1>
      <p className="text-sm text-muted-foreground">
        Manage your API keys and permissions.
      </p>

      <CreateApiKeyDialog />
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Name</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last Used</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead className="w-[100px]">Permissions</TableHead>
            <TableHead className="text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center">
                Loading...
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center">
                {error.message}
              </TableCell>
            </TableRow>
          ) : apiKeys?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center p-4">
                No API keys found.
              </TableCell>
            </TableRow>
          ) : (
            apiKeys?.map((key) => (
              <TableRow key={key.id} className="hover:bg-transparent">
                <TableCell className="font-medium">{key.name}</TableCell>
                <TableCell>
                  {DateTime.fromJSDate(key.createdAt).toFormat("ff")}
                </TableCell>
                <TableCell>
                  {key.lastRequest
                    ? DateTime.fromJSDate(key.lastRequest).toFormat("ff")
                    : "Never"}
                </TableCell>
                <TableCell>
                  {key.expiresAt === null
                    ? "Never"
                    : DateTime.fromJSDate(key.expiresAt).toFormat("ff")}
                </TableCell>
                <TableCell className="w-[100px] capitalize">
                  {key.permissions
                    ? JSON.parse(key.permissions)?.all?.join(", ")
                    : ""}
                </TableCell>

                <TableCell className="text-right">
                  <div className="space-x-2">
                    <Button size="icon" variant="ghost" className="size-7">
                      <SquarePen className="size-4" />
                    </Button>
                    <AlertDialog open={keyToDelete === key.id}>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 hover:bg-destructive/10 dark:hover:bg-destructive/10"
                          onClick={() => {
                            setKeyToDelete(key.id)
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
                            This action cannot be undone. This will permanently
                            delete your API key.
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
                              mutate(key.id)
                            }}
                            loading={isPending}
                          >
                            Delete
                          </AlertDialogAction>
                        </div>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
