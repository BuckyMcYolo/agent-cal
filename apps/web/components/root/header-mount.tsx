"use client"

import { useEffect } from "react"
import { useHeader, HeaderConfig } from "./header-provider"

type HeaderMountProps = HeaderConfig

export function HeaderMount({ title, subtitle, actions }: HeaderMountProps) {
  const { setHeader } = useHeader()

  useEffect(() => {
    setHeader({ title, subtitle, actions })
  }, [actions, setHeader, subtitle, title])

  return null
}
