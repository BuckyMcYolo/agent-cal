# Implementation Plan

- [x] 1. Create enhanced event type overview form

  - Build form component with all schema fields (title, slug, description, length, hidden, locationType)
  - Implement auto-slug generation from title
  - Add form validation using Zod schema matching database constraints
  - Create location type selector with enum values (IN_PERSON, VIRTUAL, PHONE)
  - Add toggle for hidden field to control event type visibility
  - _Requirements: 1.1, 1.2, 1.5, 1.6_

- [x] 2. Build availability tab interface

  - Create availability schedule selector component for availabilityScheduleId relationship
  - Implement timezone selector with timeZone field and lockTimezone toggle
  - Build scheduling type selector with enum values (ROUND_ROBIN, COLLECTIVE, INDIVIDUAL)
  - Add minimum booking notice input field (in minutes)
  - Display current availability schedule information when linked
  - _Requirements: 5.1, 5.2, 5.4, 2.1, 2.4_

- [x] 3. Implement advanced settings tab

  - Create booking frequency limits section with toggles and conditional inputs
  - Build future booking limits controls (limitFutureBookings, maxDaysInFuture)
  - Add buffer time inputs for beforeEventBuffer and afterEventBuffer
  - Implement booking controls (requiresConfirmation, disableGuests toggles)
  - Create AI assistant toggles for aiEmailAssistantEnabled and aiPhoneAssistantEnabled
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3_

- [x] 4. Add drag-and-drop reordering to event types list

  - Install and configure drag-and-drop library (@dnd-kit)
  - Make event type cards draggable on the main list page
  - Implement reorder handler that updates listPosition values
  - Add visual feedback during drag operations
  - Ensure mobile-friendly drag-and-drop experience
  - _Requirements: 6.2, 6.1_

- [x] 5. Enhance form validation and error handling

  - Implement real-time validation for all form fields
  - Add specific error messages for schema constraint violations
  - Handle unique constraint errors for slug conflicts
  - Create unsaved changes warning system
  - Add success feedback for form submissions
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 6. Create API route for updating event types

  - Build PUT /event-types/{id} endpoint with full schema support
  - Add validation for all updateable fields
  - Implement proper authorization checks
  - Handle partial updates and field validation
  - Add support for listPosition updates from drag-and-drop
  - _Requirements: 1.5, 2.5, 3.5, 6.2_

- [x] 7. Integrate forms with API endpoints

  - Connect overview form to create/update APIs
  - Wire availability form to update endpoint
  - Link advanced form to update endpoint
  - Implement proper loading states during API calls
  - Add error handling for API failures
  - _Requirements: 1.5, 2.5, 3.5, 4.4, 4.5_

- [x] 8. Optimize mobile responsiveness

  - Ensure all form fields work well on mobile devices
  - Test tab navigation on smaller screens
  - Optimize drag-and-drop for touch interfaces
  - Verify form submission flow on mobile
  - Test accessibility with screen readers
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 9. Add form state management and persistence

  - Implement React Hook Form for all tabs
  - Add form state persistence between tab switches
  - Create proper form reset functionality
  - Handle form dirty state tracking
  - Implement auto-save or draft functionality (optional)
  - _Requirements: 1.5, 8.4_

- [ ] 10. Create comprehensive form testing
  - Write component tests for all form sections
  - Test validation rules and error display
  - Verify enum dropdown options match schema
  - Test drag-and-drop functionality
  - Add integration tests for API interactions
  - _Requirements: All requirements validation_
