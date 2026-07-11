const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const root = path.resolve(__dirname, "..");

let resultHtml = "";
const detailsElements = {};

function getDetailsElement(id) {
    if (!detailsElements[id]) {
        detailsElements[id] = {
            style: {
                display: "none"
            },
            innerHTML: ""
        };
    }

    return detailsElements[id];
}

const context = {
    window: {
        innerHeight: 700
    },
    activeJourney: null,
    savedJourneys: [
        {
            destinationName: "Enloe Health Medical Center",
            destination: "Enloe",
            destinationDetail: "Enloe",
            originalDestinationRequest: "Enloe",
            verifiedDestinationAddress: "1531 Esplanade, Chico, CA 95926",
            journeyPurpose: "Ask Megan a question",
            parkingLocation: "Near Bidwell Presbyterian Church",
            parkingDetails: {
                garageLot: "Main Garage",
                levelFloor: "Level 2",
                rowSection: "",
                spaceNumber: "145",
                entranceUsed: "West entrance",
                elevatorStairwell: "",
                nearbyLandmark: "Blue elevator"
            },
            startTime: "July 11, 2026, 11:01 AM",
            endTime: "Later",
            duration: 12,
            timeline: [
                "Journey Started: Enloe Hospital",
                {
                    timestamp: "10:15 AM",
                    category: "Arrival Guidance",
                    text: "Take the elevator on the left."
                },
                "Photo Note Added: Museum on the first floor",
                "Directory Added from Photo: Museum on the first floor"
            ],
            notes: [],
            photos: [],
            staffInstructions: [],
            questionsForDoctor: [],
            medications: [],
            appointments: [],
            directories: []
        },
        {
            destination: "Chico State",
            destinationDetail: "Chico State",
            startTime: "July 12, 2026, 9:30 AM",
            timeline: [],
            notes: [],
            photos: [],
            staffInstructions: [],
            questionsForDoctor: [],
            medications: [],
            appointments: [],
            directories: []
        },
        {
            destination: "Legacy Clinic",
            startTime: "",
            timeline: [],
            notes: [],
            photos: [],
            staffInstructions: [],
            questionsForDoctor: [],
            medications: [],
            appointments: [],
            directories: []
        }
    ],
    JOURNEY_LIMIT: 5,
    localStorage: {
        getItem() {
            return null;
        },
        setItem() {}
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

            if (id.startsWith("journey-")) {
                return getDetailsElement(id);
            }

            if (id === "activeJourneyBox") {
                return {
                    innerHTML: "",
                    getBoundingClientRect() {
                        return {
                            top: 900,
                            bottom: 1200
                        };
                    }
                };
            }

            return null;
        },
        querySelector() {
            return null;
        }
    },
    resetJourneySessionContext() {},
    markActiveJourneyContext() {},
    showActiveJourneyBox() {},
    showJourneyUpgradeBox() {},
    alert(message) {
        throw new Error("Unexpected alert: " + message);
    },
    confirm() {
        return false;
    },
    setTimeout(callback) {
        callback();
    }
};

vm.createContext(context);

vm.runInContext(
    fs.readFileSync(path.join(root, "journey.js"), "utf8"),
    context,
    {
        filename: "journey.js"
    }
);

context.showSavedJourneys();

assert(
    resultHtml.includes("Events:"),
    "Saved journey list should still show the event count summary."
);
assert(
    resultHtml.includes("Enloe Health Medical Center") &&
        resultHtml.includes("July 11, 2026"),
    "Verified saved journey should show verified destination name and date."
);
assert(
    !resultHtml.includes("Saved Journey Summary"),
    "Saved journey summary should not use a generic card title."
);
assert(
    resultHtml.includes("Chico State") &&
        resultHtml.includes("July 12, 2026"),
    "Unverified saved journey should fall back to clean destination and date."
);
assert(
    resultHtml.includes("Legacy Clinic") &&
        resultHtml.includes("Date unknown"),
    "Older saved journeys should still render with available fields."
);
assert(
    resultHtml.includes("Purpose:") &&
        resultHtml.includes("Ask Megan a question"),
    "Journey purpose should remain a separate preview row."
);
assert(
    resultHtml.includes("<details") &&
        resultHtml.includes("Tap to view complete journey") &&
        resultHtml.includes("Tap to collapse"),
    "Saved journey list should render a native expandable summary affordance."
);
assert(
    resultHtml.includes("ontoggle=\"toggleJourney(0, this)\""),
    "Saved journey summary should reuse the existing expansion behavior."
);
assert(
    resultHtml.includes("saved-journey-detail-slot") &&
        resultHtml.indexOf("Restore Journey") >
            resultHtml.indexOf("</summary>"),
    "Restore/Delete controls should stay outside the summary tap target."
);

context.toggleJourney(0);

const expandedHtml =
    detailsElements["journey-0"].innerHTML;

assert(
    expandedHtml.includes("<span>Events</span>") &&
        expandedHtml.includes("<span>3</span>"),
    "Saved journey detail should render an expandable Events section without duplicate photo-directory entries."
);
assert(
    expandedHtml.includes("Journey Started") &&
        expandedHtml.includes("Enloe Hospital"),
    "Saved journey Events section should show string timeline entries."
);
assert(
    expandedHtml.includes("10:15 AM") &&
        expandedHtml.includes("Arrival Guidance") &&
        expandedHtml.includes("Take the elevator on the left."),
    "Saved journey Events section should show timestamp, category, and text when available."
);
assert(
    expandedHtml.includes("Photo Note Added") &&
        expandedHtml.includes("Museum on the first floor") &&
        !expandedHtml.includes("Directory Added from Photo"),
    "Saved journey Events section should hide exact duplicate Directory Added from Photo entries."
);
assert(
    expandedHtml.includes("Garage / Lot") &&
        expandedHtml.includes("Main Garage") &&
        expandedHtml.includes("Space Number") &&
        expandedHtml.includes("145") &&
        expandedHtml.includes("Nearby Landmark") &&
        expandedHtml.includes("Blue elevator"),
    "Saved journey detail should display saved parking details."
);
assert(
    !expandedHtml.includes("Row / Section"),
    "Saved journey detail should omit empty parking detail fields."
);

context.toggleJourney(0, { open: false });

assert.strictEqual(
    detailsElements["journey-0"].innerHTML,
    "",
    "Closing the native saved journey details should clear expanded content."
);

context.toggleJourney(0, { open: true });

assert(
    !expandedHtml.includes("<span>Saved Journey</span>") &&
        !expandedHtml.includes("<strong>2</strong>"),
    "Expanded saved journey detail should not duplicate the event count in the summary panel."
);

context.savedJourneys[0].timeline = [];
context.toggleJourney(0);
context.toggleJourney(0);

assert(
    !detailsElements["journey-0"].innerHTML.includes("<span>Events</span>"),
    "Saved journey Events section should be hidden when no events exist."
);

context.restoreJourney(1);

assert.strictEqual(
    context.activeJourney.destination,
    "Chico State",
    "Restore Journey should still restore the selected saved journey."
);

context.confirm = () => true;
context.deleteJourney(2);

assert.strictEqual(
    context.savedJourneys.length,
    2,
    "Delete Journey should still remove the selected saved journey."
);

console.log("Saved Journey events expansion passed");
