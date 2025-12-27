/**
 * Seed script to create test data for OAuth flow testing.
 * Run with: npx tsx apps/api/src/scripts/seed-test-data.ts
 */

import { db } from "@workspace/db"
import { organization, user } from "@workspace/db/schema/auth"
import { business } from "@workspace/db/schema/business"
import { businessUser } from "@workspace/db/schema/business-user"

async function seed() {
  console.log("Seeding test data...")

  // 1. Check if test org exists, create if not
  let org = await db.query.organization.findFirst({
    where: (org, { eq }) => eq(org.slug, "test-org"),
  })

  if (!org) {
    console.log("Creating test organization...")
    const [created] = await db
      .insert(organization)
      .values({
        id: "test-org-id",
        name: "Test Organization",
        slug: "test-org",
      })
      .returning()
    if (!created) throw new Error("Failed to create organization")
    org = created
  }
  console.log("Organization:", org.id)

  // 2. Check if test business exists, create if not
  let biz = await db.query.business.findFirst({
    where: (b, { eq }) => eq(b.slug, "test-business"),
  })

  if (!biz) {
    console.log("Creating test business...")
    const [created] = await db
      .insert(business)
      .values({
        organizationId: org.id,
        name: "Test Business",
        slug: "test-business",
      })
      .returning()
    if (!created) throw new Error("Failed to create business")
    biz = created
  }
  console.log("Business:", biz.id)

  // 3. Check if test business user exists, create if not
  let bizUser = await db.query.businessUser.findFirst({
    where: (u, { eq }) => eq(u.email, "test@example.com"),
  })

  if (!bizUser) {
    console.log("Creating test business user...")
    const [created] = await db
      .insert(businessUser)
      .values({
        businessId: biz.id,
        email: "test@example.com",
        name: "Test User",
        slug: "test-user",
        timezone: "America/New_York",
      })
      .returning()
    if (!created) throw new Error("Failed to create business user")
    bizUser = created
  }
  console.log("Business User:", bizUser.id)

  console.log("\n=== Test Data Ready ===")
  console.log(`Organization ID: ${org.id}`)
  console.log(`Business ID:     ${biz.id}`)
  console.log(`Business User ID: ${bizUser.id}`)
  console.log("\nTo test OAuth flow:")
  console.log(`curl -H "x-api-key: YOUR_API_KEY" "http://localhost:8080/v1/businesses/${biz.id}/users/${bizUser.id}/oauth/google"`)

  process.exit(0)
}

seed().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
