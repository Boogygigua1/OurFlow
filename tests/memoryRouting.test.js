const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const root = path.resolve(__dirname, "..");

function createContext() {
    let resultHtml = "";
    const storage = {};
    const questionInput = {
        value: ""
    };
    const resultElement = {};
    const activeJourneyBox = {};

    Object.defineProperty(resultElement, "innerHTML", {
        set(value) {
            resultHtml = value;
        },
        get() {
            return resultHtml;
        }
    });

    Object.defineProperty(activeJourneyBox, "innerHTML", {
        set(value) {
            this.value = value;
        },
        get() {
            return this.value || "";
        }
    });

    const context = {
        console,
        alert(message) {
            throw new Error("Unexpected alert: " + message);
        },
        activeJourney: {
            destination: "Test Destination",
            destinationName: "Test Destination",
            destinationAddress: "",
            verifiedDestinationAddress: "",
            destinationDetail: "",
            currentLocation: "",
            travelMode: "",
            journeyStatus: "traveling",
            notes: [],
            photos: [],
            questionsForDoctor: [],
            staffInstructions: [],
            medications: [],
            appointments: [],
            directories: [],
            startTime: "now",
            startLocation: "",
            startLocationAddress: "",
            parkingLocation: "",
            parkingLocationAddress: "",
            parkingVerified: false,
            arrivalTips: "",
            mapLink: "",
            answers: [],
            timeline: [],
            endLocation: "",
            endTime: ""
        },
        savedJourneys: [],
        pendingParkingLocation: "",
        pendingParkingLocationAddress: "",
        pendingParkingGps: null,
        pendingLocationType: "",
        pendingPhotoMemory: false,
        pendingPhotoClassification: "",
        currentJourneyContextId: "test-context",
        conversationHistory: [],
        addConversationHistoryEntry() {},
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
                    return resultElement;
                }
                if (id === "activeJourneyBox") {
                    return activeJourneyBox;
                }
                return null;
            }
        },
        window: {},
        isWeatherQuestion() {
            return false;
        },
        showWeatherCard() {},
        isReturnIntent() {
            return false;
        },
        showActiveJourneyRecoveryCard() {},
        showActiveJourneyBox() {},
        markActiveJourneyContext() {},
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
        fetch: async () => ({
            json: async () => ({
                answer: "AI fallback"
            })
        }),
        setTimeout,
        clearTimeout
    };

    context.window.window = context.window;
    context.__getResultHtml = () => resultHtml;
    context.__setQuestion = value => {
        questionInput.value = value;
    };
    context.__getStoredActiveJourney = () =>
        JSON.parse(storage.activeJourney || "null");

    vm.createContext(context);

    [
        "memoryHelpers.js",
        "locationLogic.js",
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

async function runCase(input) {
    const context = createContext();
    context.__setQuestion(input);
    await context.askOurFlow();
    return context;
}

async function assertNotes(input) {
    const context = await runCase(input);
    assert.strictEqual(context.activeJourney.notes.length, 1, input);
    assert.strictEqual(context.activeJourney.staffInstructions.length, 0, input);
    assert.strictEqual(context.activeJourney.directories.length, 0, input);
}

async function assertPeoplePlace(input, extraAssert = () => {}) {
    const context = await runCase(input);
    assert(context.activeJourney.directories.length > 0, input);
    assert.strictEqual(context.activeJourney.staffInstructions.length, 0, input);
    extraAssert(context);
}

async function assertInsideDestination(input, extraAssert = () => {}) {
    const context = await runCase(input);
    assert.strictEqual(context.activeJourney.directories.length, 0, input);
    assert.strictEqual(context.activeJourney.staffInstructions.length, 0, input);
    assert.strictEqual(context.activeJourney.notes.length, 0, input);
    assert.strictEqual(context.activeJourney.arrivalTips, "", input);
    extraAssert(context);
}

async function assertQuestion(input) {
    const context = await runCase(input);
    assert.strictEqual(context.activeJourney.questionsForDoctor.length, 1, input);
    assert.strictEqual(context.activeJourney.notes.length, 0, input);
    assert.strictEqual(context.activeJourney.staffInstructions.length, 0, input);
}

async function assertMedication(input) {
    const context = await runCase(input);
    assert.strictEqual(context.activeJourney.medications.length, 1, input);
    assert.strictEqual(context.activeJourney.notes.length, 0, input);
    assert.strictEqual(context.activeJourney.staffInstructions.length, 0, input);
}

async function assertReminder(input) {
    const context = await runCase(input);
    assert.strictEqual(context.activeJourney.staffInstructions.length, 1, input);
    assert.strictEqual(context.activeJourney.notes.length, 0, input);
    assert.strictEqual(context.activeJourney.arrivalTips, "", input);
}

async function assertArrivalGuidance(input, extraAssert = () => {}) {
    const context = await runCase(input);
    assert(context.activeJourney.arrivalTips.includes(input), input);
    assert.strictEqual(context.activeJourney.destinationInsideNotes || "", "", input);
    assert.strictEqual(context.activeJourney.destinationDirectoryNote || "", "", input);
    assert.strictEqual(context.activeJourney.staffInstructions.length, 0, input);
    extraAssert(context);
}

async function assertParkingMemory(input, expectedText) {
    const context = await runCase(input);

    assert(
        context.activeJourney.parkingDescription.includes(expectedText),
        input
    );
    assert(
        context.activeJourney.parkingLocation.includes(expectedText),
        input
    );
    assert(
        /Parking Saved/.test(context.__getResultHtml()),
        input + " should save locally as parking memory."
    );
    assert(
        !/AI fallback/.test(context.__getResultHtml()),
        input + " should not reach AI fallback."
    );

    const storedJourney =
        context.__getStoredActiveJourney();

    assert(
        storedJourney.parkingDescription.includes(expectedText),
        input + " should persist saved parking text."
    );
}

async function assertAiFallback(input) {
    const context = await runCase(input);
    assert(
        /AI fallback/.test(context.__getResultHtml()),
        input + " should reach AI fallback."
    );
    assert.strictEqual(context.activeJourney.arrivalTips, "", input);
    assert.strictEqual(context.activeJourney.notes.length, 0, input);
    assert.strictEqual(context.activeJourney.staffInstructions.length, 0, input);
}

async function assertNotParkingMemory(input) {
    const context = await runCase(input);

    assert.strictEqual(
        context.activeJourney.parkingDescription || "",
        "",
        input + " should not be saved as parking memory."
    );
    assert.strictEqual(
        context.activeJourney.parkingLocation || "",
        "",
        input + " should not be saved as parking memory."
    );
}

(async () => {
    await assertNotes("The fountain lights up at night.");
    await assertNotes("The lobby was crowded.");
    await assertNotes("Parking is easier after 3 PM.");
    await assertNotes("The front entry is closed for construction.");
    await assertNotes("The front door is blocked.");
    await assertNotes("The main entrance is blocked.");

    await assertPeoplePlace("Amy is the receptionist.");
    await assertPeoplePlace("The receptionist's name is Anna.");
    await assertPeoplePlace("Megan is the nurse.");
    await assertPeoplePlace("Remember nurse Megan.");
    await assertPeoplePlace("Nurse Megan.");
    await assertPeoplePlace("Megan is my nurse.");
    await assertPeoplePlace("My nurse is Megan.");
    await assertPeoplePlace("Dr. Hood is my doctor.");
    await assertPeoplePlace("Anna is the receptionist.");

    await assertInsideDestination(
        "The anthropology office is in BSS 354.",
        context => {
            assert.strictEqual(
                context.activeJourney.destinationRoomSuite,
                "BSS 354"
            );
            assert.strictEqual(
                context.activeJourney.destinationDepartmentOffice,
                "anthropology office"
            );
        }
    );
    await assertInsideDestination(
        "The department phone number is 530-555-1234.",
        context => {
            assert.strictEqual(
                context.activeJourney.destinationPhone,
                "530-555-1234"
            );
        }
    );
    await assertInsideDestination(
        "The hematology department is on the first floor.",
        context => {
            assert.strictEqual(
                context.activeJourney.destinationDepartmentOffice,
                "hematology"
            );
            assert.strictEqual(
                context.activeJourney.destinationFloor,
                "first floor"
            );
            assert.strictEqual(
                context.activeJourney.destinationRoomSuite || "",
                ""
            );
        }
    );
    await assertInsideDestination(
        "The hematology department is on third floor.",
        context => {
            assert.strictEqual(
                context.activeJourney.destinationDepartmentOffice,
                "hematology"
            );
            assert.strictEqual(
                context.activeJourney.destinationFloor,
                "third floor"
            );
            assert.strictEqual(
                context.activeJourney.destinationRoomSuite || "",
                ""
            );
            const storedJourney =
                context.__getStoredActiveJourney();
            assert.strictEqual(
                storedJourney.destinationDepartmentOffice,
                "hematology"
            );
            assert.strictEqual(
                storedJourney.destinationFloor,
                "third floor"
            );
            assert.strictEqual(
                storedJourney.destinationRoomSuite || "",
                ""
            );
        }
    );

    await assertReminder("Remember to bring my transcripts.");
    await assertReminder("Call the office tomorrow.");
    await assertReminder("Ask for a receipt.");
    await assertQuestion("Need to ask about Lanier.");
    await assertMedication("Need to take ibuprofen.");

    await assertArrivalGuidance("Turn right at the library.");
    await assertArrivalGuidance("Take the elevator on the left.");
    await assertArrivalGuidance("Need to use the elevator on the left.");
    await assertArrivalGuidance("There's a waterfall near the entrance.");
    await assertArrivalGuidance("There's a museum on the first floor.");
    await assertArrivalGuidance(
        "Take the elevator to the third floor.",
        context => {
            assert.strictEqual(context.activeJourney.destinationFloor, "third floor");
        }
    );
    await assertArrivalGuidance(
        "Use the north entrance.",
        context => {
            assert.strictEqual(context.activeJourney.destinationEntrance, "north entrance");
        }
    );
    await assertArrivalGuidance("The office is past the fountain.");

    await assertParkingMemory(
        "Parking across from the Diamond Hotel in Chico, CA",
        "across from the Diamond Hotel in Chico, CA"
    );
    await assertParkingMemory(
        "I'm parked across from the Diamond Hotel in Chico",
        "across from the Diamond Hotel in Chico"
    );
    await assertParkingMemory(
        "Parking near the Diamond Hotel.",
        "near the Diamond Hotel"
    );
    await assertParkingMemory(
        "Parked behind the Diamond Hotel.",
        "behind the Diamond Hotel"
    );
    await assertParkingMemory(
        "My car is next to the Diamond Hotel",
        "next to the Diamond Hotel"
    );
    await assertParkingMemory(
        "Visitor parking across from the Diamond Hotel.",
        "across from the Diamond Hotel"
    );

    await assertAiFallback("Tell me a joke.");
    await assertNotParkingMemory("Does the Diamond Hotel have parking?");
    await assertNotParkingMemory("How much is parking at the Diamond Hotel?");

    const startContext =
        createContext();

    vm.runInContext(
        "pendingLocationClassification = \"I'm parked near Bidwell Presbyterian Church\"; saveLocationType('start');",
        startContext
    );

    assert.strictEqual(
        startContext.activeJourney.startLocation,
        "Near Bidwell Presbyterian Church"
    );

    const duplicateStartContext =
        await runCase(
            "save start location: You're parked I'm parked near Bidwell Presbyterian Church"
        );

    assert.strictEqual(
        duplicateStartContext.activeJourney.startLocation,
        "Near Bidwell Presbyterian Church"
    );

    console.log("Memory routing regression matrix passed");
})();
