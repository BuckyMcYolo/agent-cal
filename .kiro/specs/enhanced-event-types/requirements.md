# Requirements Document

## Introduction

This feature rebuilds the event types management system based on the actual database schema to provide a comprehensive interface for creating and customizing meeting types. The system will allow users to configure all event type settings available in the schema through a clean, multi-tab interface (Overview, Availability, Advanced) that accurately reflects the data model.

## Requirements

### Requirement 1: Schema-Based Event Type Overview Management

**User Story:** As a user, I want to configure event type details using all available schema fields, so that I can fully customize my meeting types according to the data model.

#### Acceptance Criteria

1. WHEN a user accesses the event type overview page THEN the system SHALL display form fields for all basic schema properties: title, slug, description, length, hidden, listPosition
2. WHEN a user modifies the event title THEN the system SHALL automatically generate a URL-friendly slug that can be manually edited
3. WHEN a user selects a duration THEN the system SHALL only allow increments of 15 minutes as specified in the schema comments
4. WHEN a user toggles the hidden field THEN the system SHALL indicate whether the event type is available for booking
5. WHEN a user saves changes THEN the system SHALL validate all required fields according to the schema constraints
6. IF the URL slug conflicts with an existing event type THEN the system SHALL display an error message based on the unique constraints

### Requirement 2: Schema-Based Scheduling and Location Configuration

**User Story:** As a user, I want to configure scheduling settings and location type using the schema fields, so that I can control meeting logistics and timing.

#### Acceptance Criteria

1. WHEN a user accesses scheduling settings THEN the system SHALL display fields for schedulingType (ROUND_ROBIN, COLLECTIVE, INDIVIDUAL), minimumBookingNotice, beforeEventBuffer, afterEventBuffer
2. WHEN a user selects location type THEN the system SHALL provide options from the eventLocationTypeEnum (IN_PERSON, VIRTUAL, PHONE)
3. WHEN a user configures timezone settings THEN the system SHALL provide fields for timeZone and lockTimezone
4. WHEN a user sets buffer times THEN the system SHALL accept values in minutes as specified in the schema
5. WHEN a user saves scheduling settings THEN the system SHALL validate enum values against the schema definitions

### Requirement 3: Schema-Based Booking Limits and Controls

**User Story:** As a user, I want to configure booking limits and controls using all available schema fields, so that I can manage meeting frequency and approval processes.

#### Acceptance Criteria

1. WHEN a user accesses booking controls THEN the system SHALL provide toggles and fields for limitBookingFrequency, dailyFrequencyLimit, weeklyFrequencyLimit, monthlyFrequencyLimit
2. WHEN a user enables booking frequency limits THEN the system SHALL show input fields for the respective limit values
3. WHEN a user configures future booking limits THEN the system SHALL provide fields for limitFutureBookings and maxDaysInFuture
4. WHEN a user sets confirmation requirements THEN the system SHALL provide toggle for requiresConfirmation
5. WHEN a user configures guest settings THEN the system SHALL provide toggle for disableGuests as defined in the schema

### Requirement 4: Schema-Based AI Assistant Configuration

**User Story:** As a user, I want to configure AI assistant settings using the schema fields, so that I can enable automated booking capabilities.

#### Acceptance Criteria

1. WHEN a user accesses AI settings THEN the system SHALL provide toggles for aiEmailAssistantEnabled and aiPhoneAssistantEnabled
2. WHEN a user enables AI email assistant THEN the system SHALL update the aiEmailAssistantEnabled field in the database
3. WHEN a user enables AI phone assistant THEN the system SHALL update the aiPhoneAssistantEnabled field in the database
4. WHEN AI settings are configured THEN the system SHALL save the boolean values according to the schema defaults
5. WHEN AI settings are displayed THEN the system SHALL show the current state based on the database values

### Requirement 5: Schema-Based Availability Schedule Integration

**User Story:** As a user, I want to link availability schedules to my event types using the schema relationship, so that I can control when each event type can be booked.

#### Acceptance Criteria

1. WHEN a user accesses the availability tab THEN the system SHALL display the current availabilityScheduleId relationship
2. WHEN a user wants to change availability THEN the system SHALL provide options to select from existing availability schedules
3. WHEN no availability schedule is linked THEN the system SHALL indicate that default availability will be used
4. WHEN an availability schedule is selected THEN the system SHALL update the availabilityScheduleId foreign key
5. WHEN availability is displayed THEN the system SHALL show a preview of the linked schedule (future enhancement)

### Requirement 6: Schema-Based Event Type Management Interface

**User Story:** As a user, I want to manage event types using all schema fields in a clean interface, so that I can efficiently organize my meeting offerings.

#### Acceptance Criteria

1. WHEN a user views the event types list THEN the system SHALL display title, length, hidden status, and listPosition from the schema
2. WHEN a user wants to reorder event types THEN the system SHALL update the listPosition field for drag-and-drop functionality
3. WHEN a user toggles visibility THEN the system SHALL update the hidden field to control booking availability
4. WHEN a user creates a new event type THEN the system SHALL use the existing API with all schema fields
5. WHEN a user deletes an event type THEN the system SHALL use the existing delete API with proper validation

### Requirement 7: Simple and Clean User Interface

**User Story:** As a user, I want a simple, clean interface for managing event types, so that I can easily configure all schema fields without complexity.

#### Acceptance Criteria

1. WHEN a user accesses event type forms THEN the system SHALL provide a clean, organized layout with clear field labels
2. WHEN a user interacts with form fields THEN the system SHALL provide appropriate input types (text, number, select, toggle) based on schema field types
3. WHEN a user views enum fields THEN the system SHALL display dropdown options matching the schema enum values
4. WHEN a user saves changes THEN the system SHALL provide clear success/error feedback
5. WHEN a user navigates between tabs THEN the system SHALL maintain a consistent, simple design pattern
