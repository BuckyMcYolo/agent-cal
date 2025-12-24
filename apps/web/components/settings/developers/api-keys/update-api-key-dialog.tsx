"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { SquarePen } from "lucide-react"
import { useEffect, useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { apiClient } from "@/lib/utils/api-client"

export default function UpdateApiKeyDialog({
  keyId,
  keyName,
  keyPermissions,
  keyEnabled,
}: {
  keyId: string
  keyName: string
  keyPermissions?: string
  keyEnabled: boolean
}) {
  const [keyToEdit, setKeyToEdit] = useState<string | null>(null)

  const queryClient = useQueryClient()

  const parsedPermissions: string[] = JSON.parse(keyPermissions ?? "")?.all

  const apiKeySchema = z.object({
    name: z.string().min(1, "Name is required"),
    permissions: z.enum(["all", "read-only"]),
    enabled: z.boolean(),
  })

  type ApiKeyForm = z.infer<typeof apiKeySchema>

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, touchedFields, isValid },
    reset,
  } = useForm<ApiKeyForm>({
    resolver: zodResolver(apiKeySchema),
    mode: "all",
    defaultValues: {
      name: keyName,
      permissions: parsedPermissions
        ? parsedPermissions.includes("read") &&
          parsedPermissions.includes("write")
          ? "all"
          : "read-only"
        : "all",
      enabled: keyEnabled,
    },
  })

  useEffect(() => {
    if (keyToEdit === keyId) {
      reset({
        name: keyName,
        permissions: parsedPermissions
          ? parsedPermissions.includes("read") &&
            parsedPermissions.includes("write")
            ? "all"
            : "read-only"
          : "all",
        enabled: keyEnabled,
      })
    }
  }, [keyToEdit, keyId, keyName, keyEnabled, parsedPermissions, reset])

  const onSubmit: SubmitHandler<ApiKeyForm> = async (data) => {
    updateApiKey({ name: data.name })
  }

  const { mutate: updateApiKey, isPending: isUpdatingKey } = useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      const permissions: ("read" | "write")[] =
        getValues("permissions") === "all" ? ["read", "write"] : ["read"]

      const res = await apiClient["api-keys"][":id"].$patch({
        param: { id: keyId },
        json: {
          name,
          permissions,
          enabled: getValues("enabled"),
        },
      })

      if (res.status === 200) {
        return await res.json()
      }
      const error = await res.json()
      throw new Error(error.message)
    },
    mutationKey: ["update-api-key"],
    onSuccess: () => {
      toast.success("API key updated successfully")
      queryClient.invalidateQueries({ queryKey: ["api-keys"] })
      setKeyToEdit(null)
      reset()
    },
    onError: (error) => {
      toast.error(`Error updating API key: ${error.message}`)
    },
  })

  return (
    <AlertDialog open={keyToEdit === keyId}>
      <AlertDialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="size-7"
          onClick={() => setKeyToEdit(keyId)}
        >
          <SquarePen className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Edit API Key</AlertDialogTitle>
          <AlertDialogDescription>
            Edit the API key details and permissions.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="api-key-name">Name</Label>
            <Input
              defaultValue={keyName}
              {...register("name", { required: true })}
              error={Boolean(errors?.name?.message && touchedFields.name)}
              helperText={
                errors?.name?.message && touchedFields.name
                  ? errors.name.message
                  : undefined
              }
              type="text"
              placeholder="My API Key"
              className="border p-2 rounded"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="api-key-enabled">Enabled</Label>
            <Switch
              id="api-key-enabled"
              {...register("enabled")}
              defaultChecked={keyEnabled}
              onCheckedChange={(checked) => {
                setValue("enabled", checked, { shouldValidate: true })
              }}
            />
            <p className="text-sm text-muted-foreground">
              {getValues("enabled")
                ? "This API key is enabled and can be used."
                : "This API key is disabled and cannot be used."}
            </p>
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
                setKeyToEdit(null)
                reset()
              }}
            >
              Close
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={!isValid}
              type="submit"
              loading={isUpdatingKey}
            >
              Save changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
