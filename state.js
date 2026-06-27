let pendingPhotoMemory = false;

let pendingPhotoClassification = "";

let landmarkImageData = "";

let landmarkThumbnailData = "";

let conversationHistory = [];

const LOCAL_STORAGE_LIMITS = {
    activeJourney: 2 * 1024 * 1024,
    savedJourneys: 5 * 1024 * 1024,
    profile: 512 * 1024
};

const PROFILE_STORAGE_KEYS = [
    "profile",
    "ourflowProfile",
    "profileMemory",
    "ourflowProfileMemory",
    "userProfile"
];

function safeReadLocalStorageJson(key, fallback, maxChars, isValid) {

    try {

        const raw =
            localStorage.getItem(key);

        if (!raw) {
            return fallback;
        }

        if (
            maxChars &&
            raw.length > maxChars
        ) {
            console.warn(
                "Ignoring oversized localStorage data:",
                key
            );
            return fallback;
        }

        const parsed =
            JSON.parse(raw);

        if (
            isValid &&
            !isValid(parsed)
        ) {
            console.warn(
                "Ignoring invalid localStorage data:",
                key
            );
            return fallback;
        }

        return parsed;

    } catch (error) {

        console.warn(
            "Ignoring unreadable localStorage data:",
            key,
            error
        );

        return fallback;
    }
}

function safeReadLocalStorageNumber(key, fallback) {

    const value =
        parseInt(localStorage.getItem(key), 10);

    return Number.isFinite(value)
        ? value
        : fallback;
}

function readSafeProfileState() {

    const profileState = {};

    PROFILE_STORAGE_KEYS.forEach(key => {

        profileState[key] =
            safeReadLocalStorageJson(
                key,
                null,
                LOCAL_STORAGE_LIMITS.profile,
                value => (
                    value === null ||
                    typeof value === "object"
                )
            );
    });

    return profileState;
}

const profileState =
    readSafeProfileState();

let activeJourney =
    safeReadLocalStorageJson(
        "activeJourney",
        null,
        LOCAL_STORAGE_LIMITS.activeJourney,
        value => (
            value === null ||
            (
                typeof value === "object" &&
                !Array.isArray(value)
            )
        )
    );

let pendingParkingLocation = "";

let pendingParkingLocationAddress = "";

let pendingLocationClassification = "";

let pendingLocationType = "";

let pendingDestinationSearch = "";

let savedJourneys =
    safeReadLocalStorageJson(
        "savedJourneys",
        [],
        LOCAL_STORAGE_LIMITS.savedJourneys,
        Array.isArray
    );

let JOURNEY_LIMIT =
    safeReadLocalStorageNumber(
        "journeyLimit",
        5
    );

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
