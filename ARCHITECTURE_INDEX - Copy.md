ARCHITECTURE INDEX

Last Updated:
2026-06-09

=================================================
PROJECT STRUCTURE
=================

index.html

Loads:

state.js
ourflowCore.js
app.js
photos.js
mic.js
journey.js
maps.js
locationLogic.js

---

state.js

Purpose:

Global application memory.

Stores:

activeJourney
savedJourneys
conversationHistory
pendingDestinationSearch
pendingParkingLocation
pendingPhotoMemory

---

app.js

Purpose:

General UI helpers and utility functions.

---

mic.js

Purpose:

Speech recognition and voice input.

---

photos.js

Purpose:

Photo capture and photo memory.

Handles:

Photo upload
Photo analysis
Photo classification
Photo notes

---

locationLogic.js

Purpose:

Location classification engine.

Handles:

Parking
Starting Location
Destination Details
Location Type Selection

---

maps.js

Purpose:

Google Maps integration.

Handles:

Journey Maps
Parking Maps
Start Location Maps
Destination Maps
Arrival Help

---

journey.js

Purpose:

Journey archive system.

Handles:

Save Journey
View Journey
Delete Journey
Journey Summaries
Active Journey Box

---

ourflowCore.js

Purpose:

Primary application engine.

Contains:

Journey Start Engine

Journey End Engine

Arrival Mode Engine

Information Search Engine

Navigation Engine

Parking Memory Engine

Starting Location Engine

Destination Memory Engine

Directory Memory Engine

Notes Engine

Questions Engine

Medication Engine

Appointment Engine

Instruction Engine

Photo Memory Engine

AI Integration Engine

=================================================
API STRUCTURE
=============

askOurFlow.js

Purpose:

OpenAI Integration

Handles:

Journey Context
Image Analysis
Navigation Assistance
Safety Rules
AI Responses

---

searchPlace.js

Purpose:

Arrival Preparation Service

Returns:

Arrival Tips
Google Search URL
Google Maps URL

---

searchDestinationInfo.js

Purpose:

Destination Routing Service

Maps destinations to search domains.

Examples:

Chico State -> csuchico.edu

Butte College -> butte.edu

Enloe -> enloe.org

DMV -> dmv.ca.gov
