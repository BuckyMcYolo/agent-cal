# Design Document

## Overview

This design rebuilds the event types management system to accurately reflect the database schema, providing a clean and comprehensive interface for configuring all available event type settings. The system will use a flexible multi-tab layout (Overview, Availability, Advanced, and additional tabs as needed) with forms that directly map to schema fields, ensuring data consistency and full feature utilization.

## Architecture

### Component Structure

```
EventTypesListPage
├── EventTypesList
│   ├── DragAndDropProvider (for reordering)
│   ├── EventTypeCard (draggable items)
│   └── ReorderHandler (updates listPosition)
└── CreateEventTypeDialog

EventTypeDetailPage
├── EventTypeLayout (existing)
│   ├── Navigation Tabs (flexible - can add more as needed)
│   │   ├── Overview
│   │   ├── Availability
│   │   ├── Advanced
│   │   └── [Additional tabs as schema grows]
│   └── Mobile-responsive sidebar
├── OverviewTab
│   ├── BasicDetailsForm (title, slug, description, length)
│   ├── VisibilitySettings (hidden - no manual listPosition editing)
│   └── LocationTypeSelector (locationType enum)
├── AvailabilityTab
│   ├── ScheduleSelector (availabilityScheduleId)
│   ├── TimezoneSettings (timeZone, lockTimezone)
│   └── SchedulingTypeSelector (schedulingType enum)
└── AdvancedTab
    ├── BookingLimitsForm (frequency limits, future booking limits)
    ├── BufferTimesForm (beforeEventBuffer, afterEventBuffer)
    ├── BookingControlsForm (requiresConfirmation, disableGuests)
    └── AIAssistantToggles (aiEmailAssistantEnabled, aiPhoneAssistantEnabled)
```

### Data Flow

1. **Load Event Type**: Fetch event type data using existing API
2. **Form State Management**: Use React Hook Form with Zod validation based on schema
3. **Real-time Updates**: Update form state and validate on change
4. **Save Changes**: Use existing update API (to be enhanced) with schema validation
5. **Error Handling**: Display validation errors and API errors inline
6. **Drag-and-Drop**: Update listPosition values when reordering on list page

## Components and Interfaces

### Core Components

#### EventTypeOverviewForm

```typescript
interface EventTypeOverviewFormData {
  title: string
  slug: string
  description?: string
  length: number
  hidden: boolean
  // listPosition is managed internally via drag-and-drop, not user-editable
  locationType: "IN_PERSON" | "VIRTUAL" | "PHONE"
}

interface EventTypeListItem {
  id: string
  title: string
  length: number
  hidden: boolean
  listPosition: number
  // Used for drag-and-drop reordering on the list page
}
```

#### EventTypeAvailabilityForm

```typescript
interface EventTypeAvailabilityFormData {
  availabilityScheduleId?: string
  timeZone?: string
  lockTimezone: boolean
  schedulingType: "ROUND_ROBIN" | "COLLECTIVE" | "INDIVIDUAL"
  minimumBookingNotice: number
}
```

#### EventTypeAdvancedForm

```typescript
interface EventTypeAdvancedFormData {
  // Booking Limits
  limitBookingFrequency: boolean
  dailyFrequencyLimit?: number
  weeklyFrequencyLimit?: number
  monthlyFrequencyLimit?: number

  // Future Booking Limits
  limitFutureBookings: boolean
  maxDaysInFuture?: number

  // Buffer Times
  beforeEventBuffer: number
  afterEventBuffer: number

  // Booking Controls
  requiresConfirmation: boolean
  disableGuests: boolean

  // AI Assistants
  aiEmailAssistantEnabled: boolean
  aiPhoneAssistantEnabled: boolean
}
```

### Form Validation

Using Zod schemas that mirror the database schema:

```typescript
const eventTypeOverviewSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  length: z.number().min(15).multipleOf(15), // 15-minute increments
  hidden: z.boolean(),
  locationType: z.enum(["IN_PERSON", "VIRTUAL", "PHONE"]),
})
```

## Data Models

### Event Type Schema Mapping

The forms will directly map to the existing event type schema fields:

**Basic Fields (Overview Tab)**

- `title` → Text input with auto-slug generation
- `slug` → Text input with validation
- `description` → Textarea
- `length` → Number input (15-minute increments)
- `hidden` → Toggle switch
- `listPosition` → Managed internally, updated via drag-and-drop on list page
- `locationType` → Select dropdown with enum values

**Scheduling Fields (Availability Tab)**

- `schedulingType` → Select dropdown with enum values
- `minimumBookingNotice` → Number input (minutes)
- `timeZone` → Timezone selector
- `lockTimezone` → Toggle switch
- `availabilityScheduleId` → Schedule selector (dropdown of available schedules)

**Advanced Fields (Advanced Tab)**

- `limitBookingFrequency` → Toggle with conditional fields
- `dailyFrequencyLimit`, `weeklyFrequencyLimit`, `monthlyFrequencyLimit` → Number inputs
- `limitFutureBookings` → Toggle with conditional field
- `maxDaysInFuture` → Number input
- `beforeEventBuffer`, `afterEventBuffer` → Number inputs (minutes)
- `requiresConfirmation` → Toggle switch
- `disableGuests` → Toggle switch
- `aiEmailAssistantEnabled`, `aiPhoneAssistantEnabled` → Toggle switches

## Error Handling

### Validation Strategy

1. **Client-side Validation**: Real-time validation using Zod schemas
2. **Server-side Validation**: API validation using existing schema validation
3. **Unique Constraint Handling**: Special handling for slug uniqueness
4. **Enum Validation**: Ensure dropdown values match schema enums

### Error Display

- **Field-level Errors**: Display validation errors below each input
- **Form-level Errors**: Display API errors at the top of forms
- **Success Feedback**: Show success toast on successful save
- **Unsaved Changes**: Warn users before navigation with unsaved changes

## Testing Strategy

### Component Testing

1. **Form Rendering**: Test that all schema fields are rendered correctly
2. **Validation**: Test client-side validation for all field types
3. **Enum Handling**: Test dropdown options match schema enums
4. **Conditional Fields**: Test that dependent fields show/hide correctly
5. **Auto-generation**: Test slug auto-generation from title
6. **Drag-and-Drop**: Test reordering functionality and listPosition updates

### Integration Testing

1. **API Integration**: Test form submission with existing APIs
2. **Data Loading**: Test loading existing event type data
3. **Error Handling**: Test API error display and handling
4. **Navigation**: Test tab navigation and state persistence

### User Experience Testing

1. **Form Flow**: Test complete form filling and submission process
2. **Mobile Experience**: Test responsive design on mobile devices
3. **Accessibility**: Test keyboard navigation and screen reader compatibility
4. **Performance**: Test form responsiveness with large datasets

## Implementation Notes

### Existing API Integration

The design leverages existing APIs:

- **GET /event-types**: For loading event type data
- **POST /event-types**: For creating new event types (needs enhancement)
- **PUT /event-types/{id}**: To be created for updating event types
- **DELETE /event-types/{id}**: Existing delete functionality

### Schema Consistency

All form fields and validation rules directly correspond to the database schema, ensuring:

- No data loss or transformation issues
- Consistent validation between client and server
- Full utilization of available schema features
- Easy maintenance when schema changes

### Tab Structure Flexibility

The design supports flexible tab organization:

- Start with core tabs: Overview, Availability, Advanced
- Additional tabs can be added as needed (e.g., Integrations, Notifications, Workflows, etc.)
- Tab content is modular and can be reorganized based on user feedback
- Mobile navigation adapts to any number of tabs
- Each tab can focus on related schema fields for better organization

### Progressive Enhancement

The design allows for future enhancements:

- Additional schema fields can be easily added to forms
- New enum values automatically appear in dropdowns
- Complex relationships (like availability schedules) can be enhanced
- AI assistant features can be expanded with additional configuration options
- Drag-and-drop functionality can be extended to other list management features
