# Requirements Document

## Introduction

AzMaNa is a private event invitation platform. It has two sides: an Admin application for event organizers to create events, manage guest lists, and track RSVPs; and a guest-facing invite page accessed through a unique, unguessable per-guest link. Each event can be presented in Hebrew (RTL) or English (LTR). Admins seed a small number of accounts (no public signup), generate per-guest links to copy into WhatsApp manually, and view aggregated RSVP answers. Guests open their personal link, see the event details localized and personalized, and submit how many attendees will arrive.

The platform targets small scale (a handful of events, modest guest counts) and prioritizes a fast path to launch: Next.js full-stack, Supabase/Postgres, deployed on Vercel.

## Glossary

- **AzMaNa_Platform**: The complete system, including the Admin application, the guest invite experience, and the backend services.
- **Admin_App**: The authenticated interface used by organizers to manage events and guests. Presented in English only.
- **Invite_Page**: The public, guest-facing web page rendered in the context of a single guest via a unique link.
- **Admin_User**: An authenticated organizer with a seeded account (email and password).
- **Guest**: A person invited to an event, identified by a unique mobile number within that event.
- **Event**: A record created by an Admin_User containing display settings, a guest list, and an active/inactive state.
- **Guest_Token**: An unguessable, random, unique identifier associated with one Guest for one Event, embedded in the invite link.
- **Invite_Link**: A URL containing a Guest_Token that opens the Invite_Page in the context of a specific Guest.
- **Predicted_Guests**: An Admin_User-supplied estimate of how many people a Guest will bring.
- **Attendee_Count**: The number of attendees a Guest confirms will arrive, an integer from 0 to 10 inclusive.
- **RSVP**: A Guest's submitted Attendee_Count for an Event.
- **Event_Language**: The per-event language setting, either Hebrew or English, controlling the Invite_Page language and text direction.
- **Navigation_Link**: A link generated from an event address that opens an external map/navigation application (for example Waze or Google Maps).

## Requirements

### Requirement 1: Admin Authentication

**User Story:** As an Admin_User, I want to log in with email and password, so that only authorized organizers can manage events.

#### Acceptance Criteria

1. WHEN an Admin_User submits a valid email and password, THE Admin_App SHALL establish an authenticated session and display the event list.
2. IF an Admin_User submits credentials that do not match a seeded account, THEN THE Admin_App SHALL reject the login attempt and display an authentication-failure message.
3. WHILE an Admin_User has no authenticated session, THE Admin_App SHALL redirect any request for an admin page to the login page.
4. WHEN an authenticated Admin_User selects log out, THE Admin_App SHALL terminate the session and display the login page.

### Requirement 2: Event Creation and Settings

**User Story:** As an Admin_User, I want to create an event with display and localization settings, so that guests receive a personalized, localized invitation.

#### Acceptance Criteria

1. WHEN an authenticated Admin_User submits a new event with an Event_Language, an image, a full address, and a greeting, THE Admin_App SHALL create the Event and associate the Event with the Admin_User who created the Event.
2. THE Admin_App SHALL require an Event_Language value of either Hebrew or English for every Event.
3. WHEN an Admin_User provides a full address for an Event, THE AzMaNa_Platform SHALL generate a Navigation_Link that opens an external map application at that address.
4. IF an Admin_User submits an Event with a missing required field among Event_Language, image, address, or greeting, THEN THE Admin_App SHALL reject the submission and identify each missing field.
5. WHEN an authenticated Admin_User edits an existing Event the Admin_User created, THE Admin_App SHALL persist the updated settings.

### Requirement 3: Guest List Management

**User Story:** As an Admin_User, I want to manage a guest list for each event, so that each guest can receive a personalized invitation.

#### Acceptance Criteria

1. WHEN an authenticated Admin_User adds a Guest to an Event with a first name, last name, mobile number, Predicted_Guests value, and family relation, THE Admin_App SHALL add the Guest to that Event's guest list.
2. IF an Admin_User adds a Guest whose mobile number already exists within the same Event, THEN THE Admin_App SHALL reject the addition and display a duplicate-mobile-number message.
3. WHEN an authenticated Admin_User edits or removes a Guest on an Event the Admin_User created, THE Admin_App SHALL persist the change to that Event's guest list.
4. THE Admin_App SHALL require a Predicted_Guests value that is an integer of 0 or greater for every Guest.

### Requirement 4: Invite Link Generation and Distribution

**User Story:** As an Admin_User, I want to generate per-guest invite links and select multiple guests at once, so that I can share invitations through WhatsApp.

#### Acceptance Criteria

1. WHEN an Admin_User adds a Guest to an Event, THE AzMaNa_Platform SHALL assign a unique, unguessable Guest_Token to that Guest for that Event.
2. WHEN an authenticated Admin_User requests the Invite_Link for a Guest, THE Admin_App SHALL present the Invite_Link containing that Guest's Guest_Token for manual copying.
3. WHEN an authenticated Admin_User selects multiple Guests, THE Admin_App SHALL present the Invite_Link for each selected Guest.

### Requirement 5: Guest Invite Page Access

**User Story:** As a Guest, I want to open my personal invite link, so that I can view the event invitation addressed to me.

#### Acceptance Criteria

1. WHEN a request arrives with a Guest_Token that matches a Guest on an active Event, THE AzMaNa_Platform SHALL render the Invite_Page in the context of that Guest.
2. IF a request arrives for the Invite_Page without a valid Guest_Token, THEN THE AzMaNa_Platform SHALL deny access to any event content.
3. IF a request arrives with a Guest_Token belonging to an inactive Event, THEN THE AzMaNa_Platform SHALL display a default unavailable-event message instead of event content.
4. WHILE the Event_Language is Hebrew, THE Invite_Page SHALL present content in Hebrew with right-to-left layout.
5. WHILE the Event_Language is English, THE Invite_Page SHALL present content in English with left-to-right layout.

### Requirement 6: Invite Page Content

**User Story:** As a Guest, I want the invite page to show the event details and a personalized greeting, so that I understand the invitation and how to attend.

#### Acceptance Criteria

1. WHEN THE Invite_Page renders for a Guest, THE Invite_Page SHALL display the Event image.
2. WHEN THE Invite_Page renders for a Guest, THE Invite_Page SHALL display the Event full address and a Navigation_Link that opens an external map application at that address.
3. WHEN THE Invite_Page renders for a Guest, THE Invite_Page SHALL display a greeting that includes the Guest first name and last name.

### Requirement 7: Guest RSVP Submission

**User Story:** As a Guest, I want to set how many attendees will arrive and submit, so that the organizer knows my party size.

#### Acceptance Criteria

1. WHEN THE Invite_Page renders the Attendee_Count control, THE Invite_Page SHALL default the Attendee_Count to the Guest's Predicted_Guests value bounded to the range 0 to 10.
2. WHILE a Guest adjusts the Attendee_Count control, THE Invite_Page SHALL constrain the Attendee_Count to a minimum of 0 and a maximum of 10.
3. WHEN a Guest submits the Attendee_Count, THE AzMaNa_Platform SHALL record the value as that Guest's RSVP for the Event.
4. WHEN a Guest with an existing RSVP submits a new Attendee_Count, THE AzMaNa_Platform SHALL replace the previous RSVP with the new value.

### Requirement 8: Event List and Activation

**User Story:** As an Admin_User, I want to view the events I created and control their active state, so that I manage which invitations guests can access.

#### Acceptance Criteria

1. WHEN an authenticated Admin_User opens the event list, THE Admin_App SHALL display the Events the Admin_User created.
2. WHEN an authenticated Admin_User sets an Event the Admin_User created to active, THE AzMaNa_Platform SHALL allow Guests with valid Guest_Tokens to view that Event's Invite_Page.
3. WHEN an authenticated Admin_User sets an Event the Admin_User created to inactive, THE AzMaNa_Platform SHALL block Guest access to that Event's Invite_Page content.
4. WHERE an Event has recorded RSVPs, THE Admin_App SHALL display each Guest's Attendee_Count and the total confirmed Attendee_Count for the Event.
