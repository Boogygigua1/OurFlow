const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const root = path.resolve(__dirname, "..");

function createContext(options = {}) {
    let resultHtml = "";
    let activeJourneyHtml = "";
    let resultScrolled = false;
    let activeJourneyScrolled = false;
    const storage = {};
    const questionInput = {
        value: ""
    };
    const inputValues = {};

    const context = {
        console,
        activeJourney: null,
        savedJourneys: [],
        pendingParkingLocation: "",
        pendingParkingLocationAddress: "",
        pendingParkingGps: null,
        pendingLocationType: "",
        pendingPhotoMemory: false,
        pendingPhotoClassification: "",
        pendingDestinationSearch: "",
        currentJourneyContextId: "test-context",
        conversationHistory: [],
        JOURNEY_LIMIT: 10,
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
        buildOurFlowPayload(question) {
            return {
                question
            };
        },
        fetch: async () => {
            if (options.allowAiFallback) {
                return {
                    json: async () => ({
                        answer: "AI fallback"
                    })
                };
            }

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
                        scrollIntoView() {
                            resultScrolled = true;
                        }
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
                        scrollIntoView() {
                            activeJourneyScrolled = true;
                        }
                    };
                }

                if (Object.prototype.hasOwnProperty.call(inputValues, id)) {
                    return {
                        value: inputValues[id]
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
    context.__getActiveJourneyHtml = () => activeJourneyHtml;
    context.__wasResultScrolled = () => resultScrolled;
    context.__wasActiveJourneyScrolled = () => activeJourneyScrolled;
    context.__getStoredActiveJourney = () =>
        JSON.parse(storage.activeJourney || "null");
    context.__setInputValue = (id, value) => {
        inputValues[id] = value;
    };

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
    const detectorContext =
        createContext();

    [
        [
            "I’m headed off to Enloe Hospital.",
            "Enloe Hospital",
            ""
        ],
        [
            "I am headed to Enloe Hospital",
            "Enloe Hospital",
            ""
        ],
        [
            "Heading to Enloe Hospital",
            "Enloe Hospital",
            ""
        ],
        [
            "I’m taking the bus to Chico State.",
            "Chico State",
            "transit"
        ],
        [
            "I am hiking to Upper Bidwell Park.",
            "Upper Bidwell Park",
            "hiking"
        ],
        [
            "I'm driving to Enloe Hospital",
            "Enloe Hospital",
            "driving"
        ],
        [
            "I'm cycling to Chico State",
            "Chico State",
            "biking"
        ],
        [
            "I’m flying to Sacramento",
            "Sacramento",
            "traveling"
        ]
    ].forEach(([input, destination, travelMode]) => {
        const intent =
            detectorContext.detectJourneyStartIntent(input);

        assert(
            intent,
            input + " should be detected as journey-start intent."
        );
        assert.strictEqual(intent.destination, destination);
        assert.strictEqual(intent.travelMode, travelMode);
    });

    [
        "I'm going to ask Enloe Hospital a question",
        "I'm going to call the office",
        "I'm headed toward fixing the app",
        "I'm thinking about Enloe Hospital",
        "I worked at Enloe Hospital",
        "I was at Enloe Hospital yesterday",
        "Navigate to Enloe Hospital"
    ].forEach(input => {
        assert.strictEqual(
            detectorContext.detectJourneyStartIntent(input),
            null,
            input + " should not start a journey."
        );
    });

    [
        [
            "I\u2019m on my way to Enloe Hospital.",
            "Enloe Hospital",
            "",
            "on-my-way-to"
        ],
        [
            "I'm headed to Enloe Hospital.",
            "Enloe Hospital",
            "",
            "headed-to"
        ],
        [
            "I am off to Enloe Hospital.",
            "Enloe Hospital",
            "",
            "off-to"
        ],
        [
            "Hiking to Upper Bidwell Park.",
            "Upper Bidwell Park",
            "hiking",
            "travel-mode-to"
        ],
        [
            "I\u2019m hiking to Upper Bidwell Park.",
            "Upper Bidwell Park",
            "hiking",
            "travel-mode-to"
        ],
        [
            "I am hiking to Upper Bidwell Park.",
            "Upper Bidwell Park",
            "hiking",
            "travel-mode-to"
        ],
        [
            "I\u00e2\u20ac\u2122m hiking to Upper Bidwell Park.",
            "Upper Bidwell Park",
            "hiking",
            "travel-mode-to"
        ]
    ].forEach(([input, destination, travelMode, matchedPattern]) => {
        const intent =
            detectorContext.detectJourneyStartIntent(input);

        assert(
            intent,
            input + " should be detected by the runtime detector."
        );
        assert.strictEqual(intent.destination, destination);
        assert.strictEqual(intent.travelMode, travelMode);
        assert.strictEqual(intent.matchedPattern, matchedPattern);
    });

    [
        "I'm going to ask Enloe Hospital a question.",
        "I'm going to call the office.",
        "I'm going to ask my doctor about ibuprofen.",
        "I'm headed toward fixing the app.",
        "I'm going to bring my transcripts.",
        "I'm going to get coffee.",
        "I'm going to remember my forms."
    ].forEach(input => {
        assert.strictEqual(
            detectorContext.detectJourneyStartIntent(input),
            null,
            input + " should be rejected by the false-positive guard."
        );
        assert.strictEqual(
            detectorContext.getJourneyDestinationFromInput(input),
            "",
            input + " should not produce a destination."
        );
    });

    [
        [
            "I'm on my way to Enloe",
            "Enloe",
            ""
        ],
        [
            "I'm on my way to Enloe to ask Megan a question.",
            "Enloe",
            "Ask Megan a question"
        ],
        [
            "Start a journey to Chico State for my appointment",
            "Chico State",
            "My appointment"
        ],
        [
            "Start a journey to Avenue 9",
            "Avenue 9",
            ""
        ],
        [
            "Going to To Go Sushi",
            "To Go Sushi",
            ""
        ]
    ].forEach(([input, destination, purpose]) => {
        const intent =
            detectorContext.detectJourneyStartIntent(input);

        assert(
            intent,
            input + " should be detected as journey-start intent."
        );
        assert.strictEqual(intent.destination, destination);
        assert.strictEqual(intent.purpose || "", purpose);
    });

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
    assert(
        startContext.activeJourney.timeline.includes(
            "Destination Set: Enloe Hospital"
        ),
        "New journey destination should use Destination Set wording."
    );

    const purposeContext =
        createContext();

    purposeContext.__setQuestion(
        "I'm on my way to Enloe to ask Megan a question."
    );

    await purposeContext.askOurFlow();

    assert.strictEqual(
        purposeContext.activeJourney.destination,
        "Enloe"
    );
    assert.strictEqual(
        purposeContext.activeJourney.journeyPurpose,
        "Ask Megan a question"
    );
    assert.strictEqual(
        purposeContext.__getStoredActiveJourney().destination,
        "Enloe"
    );
    assert.strictEqual(
        purposeContext.__getStoredActiveJourney().journeyPurpose,
        "Ask Megan a question"
    );

    const appointmentContext =
        createContext();

    appointmentContext.__setQuestion(
        "Start a journey to Chico State for my appointment"
    );

    await appointmentContext.askOurFlow();

    assert.strictEqual(
        appointmentContext.activeJourney.destination,
        "Chico State"
    );
    assert.strictEqual(
        appointmentContext.activeJourney.journeyPurpose,
        "My appointment"
    );

    const avenueContext =
        createContext();

    avenueContext.__setQuestion(
        "Start a journey to Avenue 9"
    );

    await avenueContext.askOurFlow();

    assert.strictEqual(
        avenueContext.activeJourney.destination,
        "Avenue 9"
    );
    assert.strictEqual(
        avenueContext.activeJourney.journeyPurpose || "",
        ""
    );

    const sushiContext =
        createContext();

    sushiContext.__setQuestion(
        "Going to To Go Sushi"
    );

    await sushiContext.askOurFlow();

    assert.strictEqual(
        sushiContext.activeJourney.destination,
        "To Go Sushi"
    );
    assert.strictEqual(
        sushiContext.activeJourney.journeyPurpose || "",
        ""
    );

    const busContext =
        createContext();

    busContext.__setQuestion(
        "I'm taking the bus to Chico State."
    );

    await busContext.askOurFlow();

    assert.strictEqual(
        busContext.activeJourney.destination,
        "Chico State"
    );
    assert.strictEqual(
        busContext.activeJourney.travelMode,
        "transit"
    );

    const browserRouteStarts = [
        [
            "I\u2019m on my way to Enloe Hospital.",
            "Enloe Hospital",
            ""
        ],
        [
            "I'm headed to Enloe Hospital.",
            "Enloe Hospital",
            ""
        ],
        [
            "I am off to Enloe Hospital.",
            "Enloe Hospital",
            ""
        ],
        [
            "Hiking to Upper Bidwell Park.",
            "Upper Bidwell Park",
            "hiking"
        ],
        [
            "I\u2019m hiking to Upper Bidwell Park.",
            "Upper Bidwell Park",
            "hiking"
        ],
        [
            "I am hiking to Upper Bidwell Park.",
            "Upper Bidwell Park",
            "hiking"
        ]
    ];

    for (const [input, destination, travelMode] of browserRouteStarts) {
        const context =
            createContext();

        context.__setQuestion(input);

        await context.askOurFlow();

        assert.strictEqual(
            context.activeJourney.destination,
            destination,
            input + " should start locally through askOurFlow()."
        );
        assert.strictEqual(
            context.__getStoredActiveJourney().destination,
            destination,
            input + " should persist the local journey destination."
        );
        assert.strictEqual(
            context.activeJourney.travelMode || "",
            travelMode,
            input + " should preserve explicit travel mode."
        );
    }

    const browserRouteFalsePositives = [
        "I'm going to ask Enloe Hospital a question.",
        "I'm going to call the office.",
        "I'm going to ask my doctor about ibuprofen.",
        "I'm headed toward fixing the app."
    ];

    for (const input of browserRouteFalsePositives) {
        const context =
            createContext({
                allowAiFallback: true
            });

        context.__setQuestion(input);

        await context.askOurFlow();

        assert.strictEqual(
            context.activeJourney,
            null,
            input + " should not create an active journey."
        );
        assert.strictEqual(
            context.__getStoredActiveJourney(),
            null,
            input + " should not persist an active journey."
        );
    }

    const parkingFirstContext =
        createContext();

    parkingFirstContext.activeJourney = {
        destination: "Untitled Journey",
        destinationName: "",
        destinationDetail: "",
        destinationAddress: "",
        verifiedDestinationAddress: "",
        parkingLocation: "Across from the Diamond Hotel",
        parkingDescription: "You're parked across from the Diamond Hotel.",
        verifiedParkingAddress: "123 Parking St",
        parkingDetails: {
            garageLot: "Visitor Lot"
        },
        notes: [
            "Keep parking note"
        ],
        photos: [],
        questionsForDoctor: [],
        staffInstructions: [],
        medications: [],
        appointments: [],
        directories: [],
        answers: [],
        timeline: [
            "\uD83D\uDE97 Parking Saved: Across from the Diamond Hotel"
        ],
        startTime: "now"
    };

    parkingFirstContext.__setQuestion(
        "I'm headed to Chico State Anthropology Department"
    );

    await parkingFirstContext.askOurFlow();

    assert.strictEqual(
        parkingFirstContext.activeJourney.destination,
        "Chico State Anthropology Department",
        "Parking-first shell should accept the first real destination without warning."
    );
    assert.strictEqual(
        parkingFirstContext.activeJourney.parkingLocation,
        "Across from the Diamond Hotel"
    );
    assert.strictEqual(
        parkingFirstContext.activeJourney.verifiedParkingAddress,
        "123 Parking St"
    );
    assert.strictEqual(
        parkingFirstContext.activeJourney.parkingDetails.garageLot,
        "Visitor Lot"
    );
    assert(
        !/Journey Already Active/.test(parkingFirstContext.__getResultHtml()),
        "Parking-first shell should not show the active-journey warning."
    );
    assert.strictEqual(
        parkingFirstContext.__getStoredActiveJourney().destination,
        "Chico State Anthropology Department"
    );

    const activeContext =
        createContext();

    activeContext.activeJourney = {
        destination: "Existing Journey",
        destinationDetail: "Existing Journey",
        destinationAddress: "",
        verifiedDestinationAddress: "",
        parkingLocation: "Across from the old entrance",
        notes: [
            "Keep this note"
        ],
        photos: [
            {
                note: "Photo note"
            }
        ],
        questionsForDoctor: [],
        staffInstructions: [
            "Bring forms"
        ],
        medications: [],
        appointments: [],
        directories: [],
        answers: [],
        timeline: [],
        startTime: "now"
    };

    activeContext.__setQuestion(
        "I'm headed to Enloe Hospital"
    );

    await activeContext.askOurFlow();

    assert.strictEqual(
        activeContext.activeJourney.destination,
        "Existing Journey",
        "New journey-start phrases should not silently replace an active journey."
    );
    assert(
        /Journey Already Active/.test(activeContext.__getResultHtml()),
        "Active journey guard should show a visible choice."
    );
    assert(
        /continueCurrentJourneyWithDetectedDestination/.test(
            activeContext.__getResultHtml()
        ),
        "Continue Current Journey should use the destination merge handler."
    );
    assert(
        /requestEndJourney/.test(activeContext.__getResultHtml()),
        "End Current Journey behavior should remain available."
    );

    activeContext.continueCurrentJourneyWithDetectedDestination();

    assert.strictEqual(
        activeContext.activeJourney.destination,
        "Enloe Hospital",
        "Continue Current Journey should update the active destination."
    );
    assert.strictEqual(
        activeContext.activeJourney.destinationDetail,
        "Enloe Hospital"
    );
    assert(
        activeContext.activeJourney.timeline.includes(
            "Destination Updated: Enloe Hospital"
        ),
        "Replacing a meaningful destination should use Destination Updated wording."
    );
    assert.strictEqual(
        activeContext.activeJourney.parkingLocation,
        "Across from the old entrance",
        "Existing parking data should be preserved."
    );
    assert.deepStrictEqual(
        activeContext.activeJourney.notes,
        [
            "Keep this note"
        ]
    );
    assert.strictEqual(
        activeContext.activeJourney.photos[0].note,
        "Photo note"
    );
    assert.strictEqual(
        activeContext.__getStoredActiveJourney().destination,
        "Enloe Hospital"
    );

    const activeVerifiedContext =
        createContext();

    activeVerifiedContext.activeJourney = {
        destination: "Verified Destination",
        destinationDetail: "Verified Destination",
        destinationAddress: "123 Verified St",
        verifiedDestinationAddress: "123 Verified St",
        notes: [],
        photos: [],
        questionsForDoctor: [],
        staffInstructions: [],
        medications: [],
        appointments: [],
        directories: [],
        answers: [],
        timeline: [],
        startTime: "now"
    };

    activeVerifiedContext.__setQuestion(
        "I'm headed to Chico State Anthropology Department"
    );

    await activeVerifiedContext.askOurFlow();

    activeVerifiedContext.continueCurrentJourneyWithDetectedDestination();

    assert.strictEqual(
        activeVerifiedContext.activeJourney.destination,
        "Chico State Anthropology Department"
    );
    assert.strictEqual(
        activeVerifiedContext.activeJourney.verifiedDestinationAddress,
        "123 Verified St",
        "Continue Current Journey should not overwrite verified destination fields."
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
    assert(
        verifyContext.activeJourney.timeline.includes(
            "Destination Verified: 1531 Esplanade, Chico, CA 95926"
        ),
        "Destination verification should add the standardized event wording."
    );

    verifyContext.__setInputValue(
        "destinationBuilding",
        "Student Services Building"
    );
    verifyContext.__setInputValue(
        "destinationRoomSuite",
        "204"
    );
    verifyContext.__setInputValue(
        "destinationFloor",
        "second floor"
    );
    verifyContext.__setInputValue(
        "destinationContactPerson",
        "Amy"
    );

    verifyContext.saveDestinationInternalDetailsFromCard();

    assert.strictEqual(
        verifyContext.activeJourney.destinationBuilding,
        "Student Services Building",
        "Destination details should save Building from the form."
    );
    assert.strictEqual(
        verifyContext.activeJourney.destinationRoomSuite,
        "204",
        "Destination details should save plain numeric Room from the form."
    );
    assert.strictEqual(
        verifyContext.activeJourney.destinationFloor,
        "second floor",
        "Destination details should save additional populated fields from the form."
    );
    assert.strictEqual(
        verifyContext.activeJourney.destinationContactPerson,
        "Amy",
        "Destination details should save all populated form fields."
    );

    const storedInsideDestination =
        verifyContext.__getStoredActiveJourney();

    assert.strictEqual(
        storedInsideDestination.destinationRoomSuite,
        "204",
        "Destination details should persist Room to localStorage."
    );
    assert(
        verifyContext.__getActiveJourneyHtml().includes(
            "Student Services Building"
        ) &&
            verifyContext.__getActiveJourneyHtml().includes("204") &&
            verifyContext.__getActiveJourneyHtml().includes("second floor") &&
            verifyContext.__getActiveJourneyHtml().includes("Amy"),
        "Active Journey should display every populated destination detail field."
    );

    const verifyPurposeContext =
        createContext();

    verifyPurposeContext.activeJourney = {
        destination: "Enloe",
        destinationAddress: "",
        verifiedDestinationAddress: "",
        journeyPurpose: "Ask Megan a question",
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

    verifyPurposeContext.saveVerifiedDestinationPlace({
        destinationName: "Enloe Medical Center",
        destinationAddress: "1531 Esplanade, Chico, CA 95926",
        destinationPlaceId: "place-1",
        destinationGps: {
            latitude: 39.74,
            longitude: -121.85
        },
        googleMapsUri: "https://maps.example/enloe"
    });

    assert.strictEqual(
        verifyPurposeContext.activeJourney.destination,
        "Enloe Medical Center"
    );
    assert.strictEqual(
        verifyPurposeContext.activeJourney.journeyPurpose,
        "Ask Megan a question"
    );

    const saveRestoreContext =
        createContext();

    saveRestoreContext.activeJourney = {
        destination: "Enloe",
        destinationDetail: "Enloe",
        journeyPurpose: "Ask Megan a question",
        destinationAddress: "",
        verifiedDestinationAddress: "",
        parkingLocation: "Near Bidwell Presbyterian Church",
        notes: [],
        photos: [],
        questionsForDoctor: [],
        staffInstructions: [],
        medications: [],
        appointments: [],
        directories: [],
        answers: [],
        timeline: [],
        startTime: "now"
    };

    saveRestoreContext.saveParkingDetails({
        garageLot: "Main Garage",
        levelFloor: "Level 2",
        rowSection: "",
        spaceNumber: "145",
        entranceUsed: "West entrance",
        elevatorStairwell: "",
        nearbyLandmark: "Blue elevator"
    });

    assert.strictEqual(
        saveRestoreContext.activeJourney.parkingDetails.spaceNumber,
        "145"
    );

    saveRestoreContext.showParkingDetailsCard();

    assert(
        saveRestoreContext.__getResultHtml().includes("Add Parking Details") &&
            saveRestoreContext.__getResultHtml().includes("Main Garage"),
        "Parking details card should open with existing values for editing."
    );

    saveRestoreContext.__setInputValue(
        "parkingGarageLot",
        "South Lot"
    );
    saveRestoreContext.__setInputValue(
        "parkingLevelFloor",
        "Level 3"
    );
    saveRestoreContext.__setInputValue(
        "parkingRowSection",
        ""
    );
    saveRestoreContext.__setInputValue(
        "parkingSpaceNumber",
        "210"
    );
    saveRestoreContext.__setInputValue(
        "parkingEntranceUsed",
        "Main entrance"
    );
    saveRestoreContext.__setInputValue(
        "parkingElevatorStairwell",
        "Stairwell B"
    );
    saveRestoreContext.__setInputValue(
        "parkingNearbyLandmark",
        "Blue elevator"
    );

    saveRestoreContext.saveParkingDetailsFromCard();

    assert.strictEqual(
        saveRestoreContext.activeJourney.parkingDetails.garageLot,
        "South Lot"
    );
    assert.strictEqual(
        saveRestoreContext.activeJourney.parkingDetails.spaceNumber,
        "210"
    );

    const parkingVerificationContext =
        createContext();

    parkingVerificationContext.activeJourney = {
        destination: "Enloe",
        notes: [],
        photos: [],
        questionsForDoctor: [],
        staffInstructions: [],
        medications: [],
        appointments: [],
        directories: [],
        answers: [],
        timeline: [],
        startTime: "now"
    };

    parkingVerificationContext.showParkingMemoryReview(
        "I'm parked near Bidwell Presbyterian Church"
    );
    parkingVerificationContext.pendingParkingLocationAddress =
        "208 W 1st St, Chico, CA 95928";
    parkingVerificationContext.savePendingParking();

    assert(
        parkingVerificationContext.__getResultHtml().includes(
            "Parking Saved"
        ) &&
            parkingVerificationContext.__getResultHtml().includes(
                "Add Parking Details"
            ) &&
            parkingVerificationContext.__getResultHtml().includes(
                "&#8617;&#65039; Return to Parking"
            ) &&
            parkingVerificationContext.__getResultHtml().includes(
                "&#10145;&#65039; Continue Journey"
            ),
        "Parking verification should stay on the local Parking Saved card with Add Parking Details."
    );
    assert(
        !/[ðÃÅâ]/.test(parkingVerificationContext.__getResultHtml()),
        "Parking verification card should not contain mojibake."
    );
    assert.strictEqual(
        parkingVerificationContext.__getActiveJourneyHtml(),
        "",
        "Parking verification should not automatically redraw Active Journey."
    );
    assert.strictEqual(
        parkingVerificationContext.__wasResultScrolled(),
        true,
        "Parking verification should keep the local Parking Saved card in view."
    );
    assert.strictEqual(
        parkingVerificationContext.__wasActiveJourneyScrolled(),
        false,
        "Parking verification should not scroll to Active Journey."
    );

    const parkingCreatedContext =
        createContext();

    parkingCreatedContext.__setQuestion(
        "Parking near the Hotel Diamond in Chico CA"
    );

    await parkingCreatedContext.askOurFlow();

    assert(
        parkingCreatedContext.activeJourney.timeline.some(event =>
            event.includes("Parking Saved") &&
            event.includes("Near the Hotel Diamond in Chico, CA")
        ),
        "Parking-created journeys should start with a cleaned Parking Saved event."
    );

    const localParkingCardContext =
        createContext();

    localParkingCardContext.activeJourney = {
        destination: "Enloe",
        parkingDescription: "208 W 1st St, Chico, CA 95928",
        parkingLocation: "208 W 1st St, Chico, CA 95928",
        parkingAddress: "208 W 1st St, Chico, CA 95928",
        parkingLocationAddress: "208 W 1st St, Chico, CA 95928",
        verifiedParkingAddress: "208 W 1st St, Chico, CA 95928",
        parkingVerified: true,
        parkingDetails: {},
        notes: [],
        photos: [],
        questionsForDoctor: [],
        staffInstructions: [],
        medications: [],
        appointments: [],
        directories: [],
        answers: [],
        timeline: [],
        startTime: "now"
    };

    localParkingCardContext.window.parkingDetailsReturnToParkingCard = true;
    localParkingCardContext.showParkingDetailsCard();
    localParkingCardContext.__setInputValue(
        "parkingGarageLot",
        "South Lot"
    );
    localParkingCardContext.__setInputValue(
        "parkingLevelFloor",
        "Level 1"
    );
    localParkingCardContext.__setInputValue(
        "parkingRowSection",
        "A"
    );
    localParkingCardContext.__setInputValue(
        "parkingSpaceNumber",
        "12"
    );
    localParkingCardContext.__setInputValue(
        "parkingEntranceUsed",
        "Main entrance"
    );
    localParkingCardContext.__setInputValue(
        "parkingElevatorStairwell",
        "Elevator 2"
    );
    localParkingCardContext.__setInputValue(
        "parkingNearbyLandmark",
        "Blue sign"
    );

    localParkingCardContext.saveParkingDetailsFromCard();

    assert.strictEqual(
        localParkingCardContext.activeJourney.parkingDetails.spaceNumber,
        "12"
    );
    assert(
        localParkingCardContext.__getResultHtml().includes("Parking Saved") &&
            localParkingCardContext.__getResultHtml().includes(
                "Parking Details"
            ) &&
            localParkingCardContext.__getResultHtml().includes("Blue sign") &&
            localParkingCardContext.__getResultHtml().includes(
                "&#128663; Edit Parking Details"
            ),
        "Saving parking details from the confirmation card should return to the local parking card."
    );
    assert(
        !/[ðÃÅâ]/.test(localParkingCardContext.__getResultHtml()),
        "Parking details success card should not contain mojibake."
    );
    assert.strictEqual(
        localParkingCardContext.__getActiveJourneyHtml(),
        "",
        "Saving parking details from the confirmation card should not refresh Active Journey."
    );

    saveRestoreContext.activeJourney.parkingDescription =
        "You're parked across from the Diamond Hotel in Chico, CA.";
    saveRestoreContext.activeJourney.parkingLocation =
        "You're parked across from the Diamond Hotel in Chico, CA.";

    assert.strictEqual(
        saveRestoreContext.saveJourney(),
        true
    );
    assert.strictEqual(
        JSON.parse(saveRestoreContext.localStorage.getItem("savedJourneys"))[0]
            .journeyPurpose,
        "Ask Megan a question"
    );
    assert.strictEqual(
        JSON.parse(saveRestoreContext.localStorage.getItem("savedJourneys"))[0]
            .parkingDetails.nearbyLandmark,
        "Blue elevator"
    );

    saveRestoreContext.restoreJourney(0);

    assert.strictEqual(
        saveRestoreContext.activeJourney.journeyPurpose,
        "Ask Megan a question"
    );
    assert.strictEqual(
        saveRestoreContext.activeJourney.parkingDetails.garageLot,
        "South Lot"
    );
    assert.strictEqual(
        saveRestoreContext.activeJourney.parkingDescription,
        "You're parked across from the Diamond Hotel in Chico, CA."
    );

    console.log("Destination UX regression passed");
})();
