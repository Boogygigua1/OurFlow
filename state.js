let pendingPhotoMemory = false;

let pendingPhotoClassification = "";

let landmarkImageData = "";

let conversationHistory = [];

let activeJourney =
    JSON.parse(
        localStorage.getItem("activeJourney")
    ) || null;

let pendingParkingLocation = "";

let pendingLocationClassification = "";

let pendingLocationType = "";

let pendingDestinationSearch = "";

let savedJourneys =
    JSON.parse(localStorage.getItem("savedJourneys")) || [];

let JOURNEY_LIMIT =
    parseInt(localStorage.getItem("journeyLimit")) || 5;