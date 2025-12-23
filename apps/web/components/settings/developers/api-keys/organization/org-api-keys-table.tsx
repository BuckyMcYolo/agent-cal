"use client"

import { useSuspenseQuery } from "@tanstack/react-query"
import { Switch } from "@workspace/ui/components/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { DateTime } from "luxon"
import { apiClient } from "@/lib/utils/api-client"
import DeleteApiKeyDialog from "../delete-api-key-dialog"
import UpdateApiKeyDialog from "../update-api-key-dialog"

export default function OrgAPIKeysTable() {
  const {
    data: apiKeys,
    isLoading,
    error,
  } = useSuspenseQuery({
    queryKey: ["api-keys-org"],
    queryFn: async () => {
      try {
        const res = await apiClient["api-keys"].org.$get({
          query: { page: "1", perPage: "10" },
        })
        if (res.status === 200) {
          const data = await res.json()
          // Transform the data to convert date strings back to Date objects
          return {
            ...data,
            data: data.data?.map((key) => ({
              ...key,
              createdAt: new Date(key.createdAt),
              updatedAt: new Date(key.updatedAt),
              lastRequest: key.lastRequest ? new Date(key.lastRequest) : null,
              expiresAt: key.expiresAt ? new Date(key.expiresAt) : null,
            })),
          }
        } else {
          const data = await res.json()
          throw new Error(data.message)
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error"
        throw new Error(errorMessage)
      }
    },
  })

  return (
    <div>
      <header className="pb-5">
        <h1 className="text-2xl font-bold">
          API Keys
          <span className="text-sm text-muted-foreground"> (Organization)</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage API keys for your organization. You can revoke keys from any
          user in your organization.
        </p>
      </header>

      <Table>
        <TableHeader className="bg-muted/50 rounded-xl">
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last Used</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>User</TableHead>
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
          ) : apiKeys?.meta.totalItems === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center p-4">
                No API keys found.
              </TableCell>
            </TableRow>
          ) : (
            apiKeys.data
              ?.sort((a, b) => b.createdAt.valueOf() - a.createdAt.valueOf())
              .map((key) => (
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
                  <TableCell>
                    <span>{key.user.name}</span>
                  </TableCell>
                  <TableCell className="w-[100px] capitalize">
                    {key.permissions
                      ? JSON.parse(key.permissions)?.all?.join(", ")
                      : ""}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="space-x-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Switch checked={key.enabled ?? true} disabled />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            {key.enabled ? "Enabled" : "Disabled"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                      {/* Update API Key */}
                      <UpdateApiKeyDialog
                        keyId={key.id}
                        keyName={key.name ?? "Untitled"}
                        keyPermissions={key.permissions ?? undefined}
                        keyEnabled={key.enabled ?? true}
                      />
                      {/* Delete API Key */}
                      <DeleteApiKeyDialog keyId={key.id} />
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
