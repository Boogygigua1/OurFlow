let pendingPhotoMemory = false;

let pendingPhotoClassification = "";

let landmarkImageData = "";

let landmarkThumbnailData = "";

let conversationHistory = [];

let activeJourney =
    JSON.parse(
        localStorage.getItem("activeJourney")
    ) || null;

let pendingParkingLocation = "";

let pendingParkingLocationAddress = "";

let pendingLocationClassification = "";

let pendingLocationType = "";

let pendingDestinationSearch = "";

let savedJourneys =
    JSON.parse(localStorage.getItem("savedJourneys")) || [];

let JOURNEY_LIMIT =
    parseInt(localStorage.getItem("journeyLimit")) || 5;

function resetJourneySessionContext() {

    conversationHistory = [];

    pendingPhotoMemory = false;

    pendingPhotoClassification = "";

    landmarkImageData = "";

    landmarkThumbnailData = "";

    pendingParkingLocation = "";

    pendingParkingLocationAddress = "";

    pendingLocationClassification = "";

    pendingLocationType = "";

    pendingDestinationSearch = "";

    if (typeof window !== "undefined") {
        window.pendingLocationIntakeCandidate = null;
    }
}
