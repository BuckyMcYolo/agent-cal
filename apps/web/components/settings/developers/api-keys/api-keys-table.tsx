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
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { SubmitHandler, useForm } from "react-hook-form"
import { Switch } from "@workspace/ui/components/switch"

const apiKeySchema = z.object({
  name: z.string().min(1, "Name is required"),
  expiration: z.enum(["1d", "7d", "30d", "1y", "never"]),
  permissions: z.enum(["all", "read-only"]),
})

const convertToNumberInMS = (value: "1d" | "7d" | "30d" | "1y" | "never") => {
  switch (value) {
    case "1d":
      return 86400000
    case "7d":
      return 604800000
    case "30d":
      return 2592000000
    case "1y":
      return 31536000000
    default:
      return undefined
  }
}

type ApiKeyForm = z.infer<typeof apiKeySchema>

export default function APIKeysTable() {
  const [createKeyDialogOpen, setCreateKeyDialogOpen] = useState(false)
  const [keyConfirmationDialogOpen, setKeyConfirmationDialogOpen] =
    useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isSubmitting, touchedFields, isValid },
    reset,
  } = useForm<ApiKeyForm>({
    resolver: zodResolver(apiKeySchema),
    mode: "all",
    defaultValues: {
      name: "",
      expiration: "never",
      permissions: "all",
    },
  })

  const onCreateKey: SubmitHandler<ApiKeyForm> = async (data) => {
    console.log("data", data)
    createApiKey({
      name: data.name,
    })
  }

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
    mutationFn: async ({ name }: { name: string }) => {
      const permissions =
        getValues("permissions") === "all"
          ? { all: ["read", "write"] }
          : { all: ["read"] }

      const { error } = await authClient.apiKey.create({
        name: name,
        expiresIn: convertToNumberInMS(getValues("expiration")),
        permissions: permissions,
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
        <AlertDialog open={createKeyDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button
              className="mb-4 mt-2"
              startIcon={<Plus className="size-4" />}
              onClick={() => {
                setCreateKeyDialogOpen(true)
                reset()
              }}
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
            <form
              className="flex flex-col gap-4"
              onSubmit={handleSubmit(onCreateKey)}
            >
              <div className="space-y-2">
                <Label htmlFor="api-key-name">Name</Label>
                <Input
                  {...register("name")}
                  error={Boolean(errors?.name?.message && touchedFields.name)}
                  helperText={
                    errors?.name?.message && touchedFields.name
                      ? errors.name.message
                      : undefined
                  }
                  type="text"
                  placeholder="My API Key"
                  className="border p-2 rounded"
                />{" "}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Expiration</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="never-expire"
                      checked={getValues("expiration") === "never"}
                      onCheckedChange={(checked) => {
                        setValue("expiration", checked ? "never" : "1d", {
                          shouldValidate: true,
                        })
                      }}
                    />
                    <Label className="text-sm text-muted-foreground">
                      Never expire
                    </Label>
                  </div>
                </div>

                <Select
                  value={getValues("expiration")}
                  onValueChange={(value) => {
                    setValue("expiration", value as ApiKeyForm["expiration"], {
                      shouldValidate: true,
                    })
                  }}
                  disabled={getValues("expiration") === "never"}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Expiration" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectGroup>
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
                <Tabs
                  defaultValue={getValues("permissions")}
                  onValueChange={(value) => {
                    setValue(
                      "permissions",
                      value as ApiKeyForm["permissions"],
                      { shouldValidate: true }
                    )
                  }}
                >
                  <TabsList className="grid w-full md:w-1/2 h-8 grid-cols-2">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="read-only">Read Only</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => {
                    setCreateKeyDialogOpen(false)
                    reset()
                  }}
                >
                  Close
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={!isValid}
                  type="submit"
                  loading={isCreatingKey}
                >
                  Create
                </AlertDialogAction>
              </AlertDialogFooter>{" "}
            </form>
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
