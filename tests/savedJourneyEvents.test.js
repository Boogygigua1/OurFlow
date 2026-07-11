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
            destination: "Enloe Hospital",
            startTime: "July 11, 2026, 11:01 AM",
            endTime: "Later",
            duration: 12,
            timeline: [
                "Journey Started: Enloe Hospital",
                {
                    timestamp: "10:15 AM",
                    category: "Arrival Guidance",
                    text: "Take the elevator on the left."
                }
            ],
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
    resultHtml.includes("Enloe Hospital — July 11, 2026"),
    "Saved journey list should show a clear trip title with destination and date."
);
assert(
    resultHtml.includes("<details") &&
        resultHtml.includes("Saved Journey Summary") &&
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
        expandedHtml.includes("<span>2</span>"),
    "Saved journey detail should render an expandable Events section."
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

console.log("Saved Journey events expansion passed");
