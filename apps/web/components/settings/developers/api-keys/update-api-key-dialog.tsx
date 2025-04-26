import { apiClient } from "@/lib/utils/api-client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { authClient } from "@workspace/auth/client"
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
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { SquarePen } from "lucide-react"
import React, { useEffect, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

export default function UpdateApiKeyDialog({
  keyId,
  keyName,
  keyPermissions,
}: {
  keyId: string
  keyName: string
  keyPermissions?: string
}) {
  const [keyToEdit, setKeyToEdit] = useState<string | null>(null)

  const queryClient = useQueryClient()

  const parsedPermissions: string[] = JSON.parse(keyPermissions ?? "")?.all

  const apiKeySchema = z.object({
    name: z.string().min(1, "Name is required"),
    permissions: z.enum(["all", "read-only"]),
  })

  type ApiKeyForm = z.infer<typeof apiKeySchema>

  console.log(keyName)

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
      })
    }
  }, [keyToEdit])

  const onCreateKey: SubmitHandler<ApiKeyForm> = async (data) => {
    updateApiKey({
      name: data.name,
    })
  }

  const { mutate: updateApiKey, isPending: isUpdatingKey } = useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      const permissions: ("read" | "write")[] =
        getValues("permissions") === "all" ? ["read", "write"] : ["read"]

      const res = await apiClient["api-keys"][":id"].$patch({
        param: {
          id: keyId,
        },
        json: {
          name,
          permissions: permissions,
        },
      })
      if (res.status == 200) {
        const data = await res.json()
        return data
      } else if (res.status == 401) {
        const error = await res.json()
        throw new Error(error.message)
      } else {
        const error = await res.json()
        throw new Error(error.error)
      }
    },
    mutationKey: ["update-api-key"],
    onSuccess: (data) => {
      toast.success("API key updated successfully")
      queryClient.invalidateQueries({
        queryKey: ["api-keys"],
      })
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
          onClick={() => {
            setKeyToEdit(keyId)
          }}
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
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit(onCreateKey)}
        >
          <div className="space-y-2">
            <Label htmlFor="api-key-name">Name</Label>
            <Input
              defaultValue={keyName}
              {...register("name", {
                required: true,
              })}
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
          </AlertDialogFooter>{" "}
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
