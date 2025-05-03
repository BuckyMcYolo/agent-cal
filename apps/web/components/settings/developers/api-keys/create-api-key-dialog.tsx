"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import React, { useState } from "react"
import { toast } from "sonner"
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
import { Button } from "@workspace/ui/components/button"
import { Plus } from "lucide-react"
import { apiClient } from "@/lib/utils/api-client"
import { Badge } from "@workspace/ui/components/badge"

export function CreateApiKeyDialog() {
  const [createKeyDialogOpen, setCreateKeyDialogOpen] = useState(false)
  const [copyKeyDialogOpen, setCopyKeyDialogOpen] = useState(false)
  const [apiKey, setApiKey] = useState<{
    name: string
    key: string
    permissions: {
      all: ("read" | "write")[]
    }
  } | null>(null)

  const queryClient = useQueryClient()

  const apiKeySchema = z.object({
    name: z.string().min(1, "Name is required"),
    expiration: z.enum(["1d", "7d", "30d", "1y", "never"]),
    permissions: z.enum(["all", "read-only"]),
  })

  const convertToNumberInSeconds = (
    value: "1d" | "7d" | "30d" | "1y" | "never"
  ) => {
    switch (value) {
      case "1d":
        return 86400
      case "7d":
        return 604800
      case "30d":
        return 2592000
      case "1y":
        return 31536000
      default:
        return undefined
    }
  }

  type ApiKeyForm = z.infer<typeof apiKeySchema>

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
    createApiKey({
      name: data.name,
    })
  }

  const { mutate: createApiKey, isPending: isCreatingKey } = useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      const permissions: ("read" | "write")[] =
        getValues("permissions") === "all" ? ["read", "write"] : ["read"]

      const res = await apiClient["api-keys"].$post({
        json: {
          name: name,
          expiresIn: convertToNumberInSeconds(getValues("expiration")),
          permissions: permissions,
        },
      })
      if (res.status == 200) {
        const data = await res.json()
        return data
      } else if (res.status == 401) {
        const error = await res.json()
        throw new Error(error.message)
      }
    },
    mutationKey: ["create-api-key"],
    onSuccess: (data) => {
      toast.success("API key created successfully")
      queryClient.invalidateQueries({
        queryKey: ["api-keys-user"],
      })
      queryClient.invalidateQueries({
        queryKey: ["api-keys-org"],
      })
      setCreateKeyDialogOpen(false)
      reset()
      setCopyKeyDialogOpen(true)
      setApiKey({
        name: data?.name ?? "",
        key: data?.key ?? "",
        permissions: {
          all: data?.permissions?.all ?? [],
        },
      })
    },
    onError: (error) => {
      toast.error(`Error creating API key: ${error.message}`)
    },
  })
  return (
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
                    onCheckedChange={(checked: boolean) => {
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
                  setValue("permissions", value as ApiKeyForm["permissions"], {
                    shouldValidate: true,
                  })
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
      <AlertDialog open={copyKeyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save your key</AlertDialogTitle>
            <AlertDialogDescription>
              Please save your secret key in a safe place since you won't be
              able to view it again. Keep it secure, as anyone with your API key
              can make requests on your behalf. If you do lose it, you'll need
              to generate a new one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-4">
            <Label>API Key</Label>
            <div className="relative">
              <Input
                readOnly
                value={apiKey?.key}
                className="h-10 pr-20 rounded"
              />
              <Button
                size="sm"
                className="absolute right-1 top-1 h-8 active:bg-primary/75"
                onClick={() => {
                  navigator.clipboard.writeText(apiKey?.key ?? "")
                  toast.success("API key copied to clipboard")
                }}
              >
                Copy
              </Button>
            </div>

            <Label>Permissions</Label>
            <div>
              {apiKey?.permissions && (
                <div className="flex items-center">
                  {apiKey.permissions.all.includes("read") &&
                  apiKey.permissions.all.includes("write") ? (
                    <Badge>Read and Write</Badge>
                  ) : apiKey.permissions.all.includes("read") ? (
                    <Badge>Read Only</Badge>
                  ) : apiKey.permissions.all.includes("write") ? (
                    <Badge>Write Only</Badge>
                  ) : (
                    <span className="text-muted-foreground">No access</span>
                  )}
                </div>
              )}
              {!apiKey?.permissions && (
                <span className="text-muted-foreground">
                  No permissions assigned
                </span>
              )}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setCopyKeyDialogOpen(false)
                reset()
              }}
            >
              Close
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
