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
import { Input } from "@workspace/ui/components/input"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

export default function APIKeysTable() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [apiKeyName, setApiKeyName] = useState("")

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

  const { mutate: createApiKey, isPending: isCreatingKey } = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.apiKey.create({
        name: apiKeyName,
      })
      if (error) {
        throw new Error(`Error: ${error?.statusText}`)
      }
    },
    mutationKey: ["create-api-key"],
    onSuccess: () => {
      toast.success("API key created successfully")
      queryClient.invalidateQueries({
        queryKey: ["api-keys"],
      })
    },
    onError: (error) => {
      toast.error(`Error creating API key: ${error.message}`)
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
      setDeleteDialogOpen(false)
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

      <div className="flex items-center justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              className="mb-4 mt-2"
              startIcon={<Plus className="size-4" />}
            >
              Create API key
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Create API Key</AlertDialogTitle>
              <AlertDialogDescription>
                This API key is tied to your user and can make requests against
                resources in your organization. If you are removed from the
                organization, this key will be disabled.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="api-key-name">Name</Label>
                <Input
                  type="text"
                  placeholder="My API Key"
                  value={apiKeyName}
                  onChange={(e) => setApiKeyName(e.target.value)}
                  className="border p-2 rounded"
                />{" "}
              </div>
              <div className="space-y-2">
                <Label>Expiration</Label>

                <Select>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Expiration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Expiration</SelectLabel>
                      <SelectItem value="1d">1 Day</SelectItem>
                      <SelectItem value="7d">7 Days</SelectItem>
                      <SelectItem value="30d">30 Days</SelectItem>
                      <SelectItem value="1y">1 Year</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="api-key-permissions">Permissions</Label>
                <Tabs defaultValue="all" className="">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="read-only">Read Only</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setApiKeyName("")
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  createApiKey()
                }}
                loading={isCreatingKey}
              >
                Create
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Name</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last Used</TableHead>
            <TableHead>Created By</TableHead>
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
                <TableCell>{key.userId}</TableCell>
                <TableCell className="w-[100px]">All</TableCell>

                <TableCell className="text-right">
                  <div className="space-x-2">
                    <Button size="icon" variant="ghost" className="size-7">
                      <SquarePen className="size-4" />
                    </Button>
                    <AlertDialog open={deleteDialogOpen}>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 hover:bg-destructive/10 dark:hover:bg-destructive/10"
                          onClick={() => {
                            setDeleteDialogOpen(true)
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
                              setDeleteDialogOpen(false)
                            }}
                          >
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            asChild
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
