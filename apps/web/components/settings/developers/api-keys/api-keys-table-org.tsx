"use client"

import { useSuspenseQuery } from "@tanstack/react-query"
import { authClient } from "@workspace/auth/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from "@workspace/ui/components/table"
import { DateTime } from "luxon"
import { CreateApiKeyDialog } from "./create-api-key-dialog"
import DeleteApiKeyDialog from "./delete-api-key-dialog"
import UpdateApiKeyDialog from "./update-api-key-dialog"

export default function APIKeysTable() {
  const {
    data: apiKeys,
    isLoading,
    error,
  } = useSuspenseQuery({
    queryKey: ["api-keys-org"],
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

  return (
    <div>
      <h1 className="text-2xl font-bold">API Keys</h1>
      <p className="text-sm text-muted-foreground">
        Manage your API keys and permissions.
      </p>

      <CreateApiKeyDialog />
      <Table>
        <TableHeader className="bg-muted/50 rounded-xl">
          <TableRow>
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
            apiKeys
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
                  <TableCell className="w-[100px] capitalize">
                    {key.permissions
                      ? JSON.parse(key.permissions)?.all?.join(", ")
                      : ""}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="space-x-2">
                      {/* Update API Key */}
                      <UpdateApiKeyDialog
                        keyId={key.id}
                        keyName={key.name ?? "Untitled"}
                        keyPermissions={key.permissions}
                        keyEnabled={key.enabled}
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
