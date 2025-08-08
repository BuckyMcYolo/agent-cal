# Design Document

## Overview

This design document outlines the improvements to the availability detail functionality in AgentCal. The solution involves creating new API endpoints for individual availability schedule operations, updating the frontend to use real data instead of mock data, and enhancing the visual design of the availability detail page. The implementation will follow existing patterns in the codebase for consistency and maintainability.

## Architecture

### Backend Architecture

The backend will extend the existing availability API with two new endpoints:

- `GET /availability/:id` - Fetch individual availability schedule
- `PUT /availability/:id` - Update individual availability schedule

These endpoints will follow the same patterns as other resource-specific endpoints in the codebase, using Hono.js with OpenAPI documentation and Drizzle ORM for database operations.

### Frontend Architecture

The frontend will be updated to:

- Replace mock data with real API calls using TanStack Query
- Implement proper loading and error states
- Enhance the visual design with improved components and layout
- Maintain the existing edit functionality but connect it to real API endpoints

### Data Flow

1. User navigates to `/availability/:id` from the availability list
2. Frontend makes API call to `GET /availability/:id`
3. Data is cached using TanStack Query for optimal performance
4. User can edit the schedule, triggering `PUT /availability/:id`
5. Success/error feedback is provided to the user
6. Cache is invalidated and refreshed after successful updates

## Components and Interfaces

### API Routes

#### GET /availability/:id Route

```typescript
export const getAvailability = createRoute({
  path: "/availability/{id}",
  method: "get",
  summary: "Get Availability Schedule by ID",
  tags: ["Availability"],
  security: apiKeySecuritySchema,
  middleware: [authMiddleware],
  request: {
    params: UUIDParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: selectAvailabilitySchemaWithWeeklySlots,
      description: "Availability schedule with weekly slots",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "Availability schedule not found",
    }),
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description: "Forbidden - insufficient permissions",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})
```

#### PUT /availability/:id Route

```typescript
export const updateAvailability = createRoute({
  path: "/availability/{id}",
  method: "put",
  summary: "Update Availability Schedule",
  tags: ["Availability"],
  security: apiKeySecuritySchema,
  middleware: [authMiddleware],
  request: {
    params: UUIDParamsSchema,
    body: jsonContentRequired({
      schema: z.object({
        name: z.string().min(1).max(255).optional(),
        timeSlots: z
          .array(
            z.object({
              dayOfWeek: z.enum([
                "sunday",
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
              ]),
              startTime: timeSlotSchema,
              endTime: timeSlotSchema,
            })
          )
          .optional(),
      }),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: selectAvailabilitySchemaWithWeeklySlots,
      description: "Updated availability schedule",
    }),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent({
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      description: "Bad request, invalid input data",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "Availability schedule not found",
    }),
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description: "Forbidden - insufficient permissions",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})
```

### API Handlers

#### GET Handler Logic

1. Extract schedule ID from URL parameters
2. Validate user authentication and authorization
3. Query database for availability schedule with weekly slots
4. Check if user owns the schedule or has organization access
5. Return schedule data or appropriate error response

#### PUT Handler Logic

1. Extract schedule ID and update data from request
2. Validate user authentication and authorization
3. Validate input data (time slots, name, etc.)
4. Check if schedule exists and user has permission to update
5. Update schedule name if provided
6. Replace weekly slots if provided (delete existing, insert new)
7. Return updated schedule data or appropriate error response

### Frontend Components

#### Enhanced AvailabilityScheduleDetail Component

The component will be restructured with the following improvements:

**Data Fetching**

- Replace mock data with real API calls using `useSuspenseQuery`
- Implement proper error handling with error boundaries
- Add loading states during data fetching

**Visual Design Improvements**

- Reorganize layout with better visual hierarchy
- Improve time slot display with clearer formatting
- Add visual indicators for enabled/disabled days
- Enhance the schedule information card layout
- Improve mobile responsiveness

**Edit Functionality**

- Connect edit operations to real API endpoints
- Implement optimistic updates for better UX
- Add proper validation feedback
- Maintain edit state management

#### Component Structure

```typescript
interface AvailabilityScheduleDetailProps {
  params: { id: string }
}

interface TimeSlot {
  id?: string
  dayOfWeek: number
  startTime: string
  endTime: string
  enabled: boolean
}

interface AvailabilitySchedule {
  id: string
  name: string
  timeZone: string
  ownerId: string
  organizationId?: string
  createdAt: string
  updatedAt: string
  weeklySlots: WeeklyScheduleSlot[]
}
```

## Data Models

### Database Schema (Existing)

The existing database schema in `packages/db/src/schema/availability.ts` already supports the required functionality:

- `availabilitySchedule` table for main schedule data
- `weeklyScheduleSlot` table for weekly time slots
- Proper relations between tables
- UUID primary keys and foreign key constraints

### API Response Models

```typescript
// GET /availability/:id response
interface AvailabilityScheduleResponse {
  id: string
  name: string
  timeZone: string
  ownerId: string
  organizationId?: string
  createdAt: string
  updatedAt: string
  isDefault: boolean
  weeklySlots: WeeklyScheduleSlot[]
}

// PUT /availability/:id request body
interface UpdateAvailabilityRequest {
  name?: string
  timeSlots?: {
    dayOfWeek:
      | "sunday"
      | "monday"
      | "tuesday"
      | "wednesday"
      | "thursday"
      | "friday"
      | "saturday"
    startTime: string // HH:MM format
    endTime: string // HH:MM format
  }[]
}
```

## Error Handling

### Backend Error Handling

- **404 Not Found**: When availability schedule doesn't exist
- **403 Forbidden**: When user doesn't own the schedule and isn't an org admin
- **400 Bad Request**: When input validation fails (invalid time slots, overlapping times)
- **401 Unauthorized**: When user is not authenticated
- **500 Internal Server Error**: For unexpected server errors

### Frontend Error Handling

- **Network Errors**: Display user-friendly error messages with retry options
- **Validation Errors**: Show inline validation feedback for form fields
- **Permission Errors**: Redirect to availability list with error message
- **Loading States**: Show skeleton loaders during data fetching
- **Optimistic Updates**: Revert changes on API failure with error notification

### Error Recovery

- Implement retry mechanisms for transient failures
- Provide fallback UI states for error conditions
- Cache previous data to show stale content during errors
- Clear error states when user retries operations

## Testing Strategy

### Backend Testing

- **Unit Tests**: Test individual handler functions with mocked dependencies
- **Integration Tests**: Test API endpoints with real database connections
- **Authorization Tests**: Verify proper access control for different user roles
- **Validation Tests**: Test input validation and error responses
- **Database Tests**: Test database operations and constraint handling

### Frontend Testing

- **Component Tests**: Test component rendering with different data states
- **Integration Tests**: Test API integration with mocked responses
- **User Interaction Tests**: Test edit functionality and form submissions
- **Error State Tests**: Test error handling and recovery scenarios
- **Accessibility Tests**: Ensure proper keyboard navigation and screen reader support

### Test Scenarios

1. **Happy Path**: User successfully views and edits their availability schedule
2. **Permission Denied**: User attempts to access schedule they don't own
3. **Network Failure**: API calls fail due to network issues
4. **Validation Errors**: User submits invalid time slot data
5. **Concurrent Updates**: Multiple users editing the same schedule
6. **Mobile Usage**: Responsive design and touch interactions

## Visual Design Enhancements

### Layout Improvements

- **Header Section**: Clean title with timezone badge and action buttons
- **Weekly Schedule Card**: Organized day-by-day layout with clear time displays
- **Schedule Information Card**: Well-structured metadata display
- **Mobile Responsive**: Optimized layout for smaller screens

### Component Enhancements

- **Time Slot Display**: Clear start/end time formatting with visual separators
- **Day Toggle**: Improved switch components with better visual feedback
- **Time Selectors**: Enhanced dropdown menus with better time options
- **Loading States**: Skeleton loaders that match the final layout
- **Error States**: Friendly error messages with actionable recovery options

### Accessibility Improvements

- **Keyboard Navigation**: Proper tab order and keyboard shortcuts
- **Screen Reader Support**: Appropriate ARIA labels and descriptions
- **Color Contrast**: Ensure sufficient contrast for all text and UI elements
- **Focus Management**: Clear focus indicators and logical focus flow

### Consistency with Design System

- Use existing UI components from `@workspace/ui`
- Follow established color schemes and typography
- Maintain consistent spacing and layout patterns
- Align with overall application design language
