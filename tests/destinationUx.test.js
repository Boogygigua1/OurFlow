const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const root = path.resolve(__dirname, "..");

function createContext() {
    let resultHtml = "";
    let activeJourneyHtml = "";
    const storage = {};
    const questionInput = {
        value: ""
    };

    const context = {
        console,
        activeJourney: null,
        savedJourneys: [],
        pendingPhotoMemory: false,
        pendingPhotoClassification: "",
        pendingDestinationSearch: "",
        currentJourneyContextId: "test-context",
        conversationHistory: [],
        addConversationHistoryEntry() {},
        resetJourneySessionContext() {},
        markActiveJourneyContext() {},
        isWeatherQuestion() {
            return false;
        },
        showWeatherCard() {},
        isReturnIntent() {
            return false;
        },
        showActiveJourneyRecoveryCard() {},
        isRecoveryIntent() {
            return false;
        },
        isJourneySummaryRecall() {
            return false;
        },
        showQuickJourneySummary() {},
        showRecoveryChoices() {},
        showArrivalMode() {},
        openGoogleMapsToParkingLocation() {},
        openGoogleMapsToStartLocation() {},
        openGoogleMapsForJourney() {},
        requestEndJourney() {},
        openGoogleMapsToDestinationDetails() {},
        promptDestinationInternalDetails() {},
        isLocationIntakeCandidate() {
            return false;
        },
        detectLocationIntake() {
            return false;
        },
        requestCurrentLocationIntake() {},
        isPlaceIdentificationRequest() {
            return false;
        },
        getArrivalHelp: async () => {},
        fetch: async () => {
            throw new Error("AI fallback should not be called.");
        },
        alert(message) {
            throw new Error("Unexpected alert: " + message);
        },
        localStorage: {
            getItem(key) {
                return storage[key] || null;
            },
            setItem(key, value) {
                storage[key] = String(value);
            },
            removeItem(key) {
                delete storage[key];
            }
        },
        document: {
            getElementById(id) {
                if (id === "questionInput") {
                    return questionInput;
                }

                if (id === "result") {
                    return {
                        set innerHTML(value) {
                            resultHtml = value;
                        },
                        get innerHTML() {
                            return resultHtml;
                        },
                        scrollIntoView() {}
                    };
                }

                if (id === "activeJourneyBox") {
                    return {
                        set innerHTML(value) {
                            activeJourneyHtml = value;
                        },
                        get innerHTML() {
                            return activeJourneyHtml;
                        },
                        getBoundingClientRect() {
                            return {
                                top: 900,
                                bottom: 1200
                            };
                        },
                        scrollIntoView() {}
                    };
                }

                return null;
            },
            querySelector() {
                return null;
            }
        },
        window: {
            innerHeight: 700
        },
        setTimeout(callback) {
            callback();
        },
        clearTimeout
    };

    context.window.window = context.window;
    context.__setQuestion = value => {
        questionInput.value = value;
    };
    context.__getResultHtml = () => resultHtml;
    context.__getStoredActiveJourney = () =>
        JSON.parse(storage.activeJourney || "null");

    vm.createContext(context);

    [
        "memoryHelpers.js",
        "locationLogic.js",
        "journey.js",
        "ourflowCore.js"
    ].forEach(file => {
        vm.runInContext(
            fs.readFileSync(path.join(root, file), "utf8"),
            context,
            {
                filename: file
            }
        );
    });

    return context;
}

(async () => {
    const startContext =
        createContext();

    startContext.__setQuestion(
        "I'm on my way to Enloe Hospital"
    );

    await startContext.askOurFlow();

    assert.strictEqual(
        startContext.activeJourney.destination,
        "Enloe Hospital"
    );
    assert.strictEqual(
        startContext.__getStoredActiveJourney().destination,
        "Enloe Hospital"
    );

    const verifyContext =
        createContext();

    verifyContext.activeJourney = {
        destination: "Enloe Hospital",
        destinationAddress: "",
        verifiedDestinationAddress: "",
        notes: [],
        photos: [],
        questionsForDoctor: [],
        staffInstructions: [],
        medications: [],
        appointments: [],
        directories: [],
        timeline: [],
        startTime: "now"
    };

    verifyContext.saveVerifiedDestinationAddress(
        "1531 Esplanade, Chico, CA 95926"
    );

    const verifiedHtml =
        verifyContext.__getResultHtml();

    assert(
        !/Navigate/.test(verifiedHtml),
        "Destination Verified card should not show Navigate."
    );
    assert(
        /Add Inside Destination Details/.test(verifiedHtml),
        "Inside destination action should remain."
    );
    assert(
        /Continue Journey/.test(verifiedHtml),
        "Continue Journey should remain."
    );

    console.log("Destination UX regression passed");
})();
