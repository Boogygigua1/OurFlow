FEATURE INDEX

Last Updated:
2026-06-09

=================================================
Resolved Location Storage
=========================

Purpose:

Store both:

* Friendly Location Name
* Verified Address

Files:

Primary:
locationLogic.js
maps.js

Functions:

saveLocationType()

openGoogleMapsToStartLocation()

openGoogleMapsToParkingLocation()

Status:

Planned

Notes:

Current issue:
Google Maps works best with verified addresses.

Future model:

Name:
St. John's Church

Address:
234 W 5th St, Chico, CA

=================================================
Information Search
==================

Purpose:

Find departments, offices, buildings, and services.

Files:

ourflowCore.js
locationLogic.js
api/searchDestinationInfo.js

Functions:

askOurFlow()

saveInformationSearchAsDestination()

Status:

Working

=================================================
Travel Mode Navigation
======================

Purpose:

Walk, Bike, Drive routing.

Files:

maps.js

Functions:

openGoogleMapsToDestinationDetails()

Status:

Working

=================================================
Parking Memory
==============

Purpose:

Remember where the user parked.

Files:

locationLogic.js
maps.js

Functions:

saveLocationType()

openGoogleMapsToParkingLocation()

Status:

Working

=================================================
Photo Memory
============

Purpose:

Remember landmarks and visual references.

Files:

photos.js

Functions:

analyzeLandmarkImage()

savePhotoMemory()

savePhotoClassification()

Status:

Working

=================================================
Arrival Help
============

Purpose:

Help user find entrances, parking, and check-in locations.

Files:

maps.js
api/searchPlace.js

Functions:

getArrivalHelp()

Status:

Working

=================================================
Journey Archive
===============

Purpose:

Save and restore journeys.

Files:

journey.js

Functions:

saveJourney()

showSavedJourneys()

deleteJourney()

Status:

Working
