// Create an array to hold the breadcrumb items
interface BreadcrumbItem {
  label: string
  href: string
  isCurrentPage: boolean
}

export const generateBreadcrumbs = (pathname: string) => {
  const pathSegments = pathname.split("/").filter((segment) => segment !== "")

  const breadcrumbs: BreadcrumbItem[] = []

  let baseSegment = ""
  let segment = ""

  if (pathSegments.length > 0) {
    baseSegment = pathSegments[0] ?? ""
    const formattedBaseLabel = baseSegment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())

    breadcrumbs.push({
      label: formattedBaseLabel,
      href: `/${baseSegment}`,
      isCurrentPage: pathSegments.length === 1,
    })
  }

  if (pathSegments.length > 1) {
    let currentPath = `/${pathSegments[0]}`

    for (let i = 1; i < pathSegments.length; i++) {
      segment = pathSegments[i] ?? ""
      currentPath += `/${segment}`

      const formattedLabel = segment
        .replace(/-/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())

      breadcrumbs.push({
        label: formattedLabel,
        href: currentPath,
        isCurrentPage: i === pathSegments.length - 1,
      })
    }
  }

  return breadcrumbs
}
