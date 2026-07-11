const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const root = path.resolve(__dirname, "..");

function createContext() {
    let resultHtml = "";
    let activeJourneyHtml = "";
    let questionFocused = false;

    const storage = {};

    const context = {
        window: {
            innerHeight: 700
        },
        activeJourney: {
            destination: "Chico State",
            startTime: "Now",
            notes: [
                "Keep this note"
            ],
            photos: [],
            questionsForDoctor: [],
            staffInstructions: [],
            medications: [],
            appointments: [],
            directories: [],
            timeline: [
                "Journey Started: Chico State"
            ]
        },
        savedJourneys: [],
        JOURNEY_LIMIT: 5,
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
                                top: 0,
                                bottom: 400
                            };
                        },
                        scrollIntoView() {}
                    };
                }

                if (id === "questionInput") {
                    return {
                        value: "",
                        focus() {
                            questionFocused = true;
                        }
                    };
                }

                return null;
            },
            querySelector() {
                return null;
            }
        },
        setTimeout(callback) {
            callback();
        },
        resetJourneySessionContext() {},
        markActiveJourneyContext() {},
        showJourneyUpgradeBox() {},
        alert(message) {
            throw new Error("Unexpected alert: " + message);
        },
        confirm() {
            return false;
        }
    };

    context.__getResultHtml = () => resultHtml;
    context.__getActiveJourneyHtml = () => activeJourneyHtml;
    context.__getStorage = () => storage;
    context.__wasQuestionFocused = () => questionFocused;

    vm.createContext(context);

    vm.runInContext(
        fs.readFileSync(path.join(root, "journey.js"), "utf8"),
        context,
        {
            filename: "journey.js"
        }
    );

    return context;
}

const cardContext =
    createContext();

cardContext.requestEndJourney();

assert(
    cardContext.__getResultHtml().includes("Save Journey") &&
        cardContext.__getResultHtml().includes("Ends the journey and saves it to the archive.") &&
        cardContext.__getResultHtml().includes("End Without Saving") &&
        cardContext.__getResultHtml().includes("Ends the active journey and returns to the home screen without saving.") &&
        cardContext.__getResultHtml().includes("Cancel") &&
        cardContext.__getResultHtml().includes("Returns to the active journey with no changes."),
    "End Journey card should show the three requested choices with descriptions."
);
assert(
    !cardContext.__getResultHtml().includes("Save / Keep Journey Active") &&
        !cardContext.__getResultHtml().includes("Save &amp; End Journey") &&
        !cardContext.__getResultHtml().includes("Return to Journey"),
    "End Journey card should not show removed choices."
);

const saveContext =
    createContext();

saveContext.requestEndJourney();
saveContext.saveAndEndJourney();

assert.strictEqual(
    saveContext.savedJourneys.length,
    1,
    "Save Journey should archive the journey."
);
assert.strictEqual(
    saveContext.activeJourney,
    null,
    "Save Journey should end the active journey."
);
assert.strictEqual(
    saveContext.__getStorage().activeJourney,
    undefined,
    "Save Journey should remove activeJourney from localStorage."
);
assert.strictEqual(
    JSON.parse(saveContext.__getStorage().savedJourneys).length,
    1,
    "Save Journey should persist the archive."
);

const discardContext =
    createContext();

discardContext.savedJourneys = [
    {
        destination: "Existing Archive"
    }
];
discardContext.localStorage.setItem(
    "savedJourneys",
    JSON.stringify(discardContext.savedJourneys)
);

discardContext.requestEndJourney();
discardContext.endJourneyWithoutSaving();

assert.strictEqual(
    discardContext.activeJourney,
    null,
    "End Without Saving should clear the active journey."
);
assert.strictEqual(
    discardContext.savedJourneys.length,
    1,
    "End Without Saving should not modify the archive array."
);
assert.strictEqual(
    JSON.parse(discardContext.__getStorage().savedJourneys).length,
    1,
    "End Without Saving should not modify savedJourneys storage."
);
assert.strictEqual(
    discardContext.__getStorage().activeJourney,
    undefined,
    "End Without Saving should remove activeJourney from localStorage."
);

const cancelContext =
    createContext();

const originalJourney =
    cancelContext.activeJourney;

cancelContext.requestEndJourney();
cancelContext.returnToJourney();

assert.strictEqual(
    cancelContext.activeJourney,
    originalJourney,
    "Cancel should keep the same active journey object."
);
assert.strictEqual(
    cancelContext.savedJourneys.length,
    0,
    "Cancel should not save to the archive."
);
assert.strictEqual(
    cancelContext.__getResultHtml(),
    "",
    "Cancel should close the confirmation card."
);
assert(
    cancelContext.__getActiveJourneyHtml().includes("Chico State"),
    "Cancel should return to the active journey view."
);
assert(
    cancelContext.__wasQuestionFocused(),
    "Cancel should focus the Ask OurFlow input."
);

console.log("End Journey UX regression passed");
