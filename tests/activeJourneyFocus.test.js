const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const root = path.resolve(__dirname, "..");

let activeJourneyHtml = "";
let activeJourneyTopScrolls = 0;
let activeJourneyVisible = false;
const sections = {};

function getSection(key) {
    if (!sections[key]) {
        sections[key] = {
            open: false,
            scrolled: false,
            highlighted: false,
            tagName:
                key === "notes" || key === "photos"
                    ? "DETAILS"
                    : "SECTION",
            classList: {
                add() {
                    sections[key].highlighted = true;
                },
                remove() {}
            },
            scrollIntoView() {
                sections[key].scrolled = true;
            }
        };
    }

    return sections[key];
}

const context = {
    window: {
        innerHeight: 700
    },
    activeJourney: {
        destination: "Chico State",
        startTime: "Now",
        notes: ["The fountain lights up at night."],
        verifiedDestinationAddress: "1531 Esplanade, Chico, CA",
        arrivalTips:
            "Enloe Hospital Address: 1531 Esplanade, Chico, CA. Take the elevator on the left.",
        destinationDepartmentOffice: "hematology",
        destinationRoomSuite: "hematology department",
        destinationFloor: "third floor",
        photos: [
            {
                note: "Bidwell Presbyterian Church"
            }
        ],
        staffInstructions: [],
        questionsForDoctor: [],
        medications: [],
        appointments: [],
        directories: [],
        timeline: []
    },
    savedJourneys: [],
    JOURNEY_LIMIT: 5,
    localStorage: {
        getItem() {
            return null;
        },
        setItem() {}
    },
    document: {
        getElementById(id) {
            if (id === "activeJourneyBox") {
                return {
                    set innerHTML(value) {
                        activeJourneyHtml = value;
                    },
                    get innerHTML() {
                        return activeJourneyHtml;
                    },
                    getBoundingClientRect() {
                        return activeJourneyVisible
                            ? {
                                top: 0,
                                bottom: 400
                            }
                            : {
                                top: 900,
                                bottom: 1200
                            };
                    },
                    scrollIntoView() {
                        activeJourneyTopScrolls += 1;
                    }
                };
            }

            if (id === "result") {
                return {
                    scrollIntoView() {}
                };
            }

            return null;
        },
        querySelector(selector) {
            const match =
                selector.match(/data-journey-section="([^"]+)"/);

            return match
                ? getSection(match[1])
                : null;
        }
    },
    setTimeout(callback) {
        callback();
    },
    resetJourneySessionContext() {},
    alert(message) {
        throw new Error("Unexpected alert: " + message);
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

context.showActiveJourneyBox();
assert.strictEqual(
    activeJourneyTopScrolls,
    0,
    "Untargeted refresh should not scroll to the top."
);
assert(
    activeJourneyHtml.includes("Take the elevator on the left."),
    "Clean arrival guidance should remain visible."
);
assert(
    !activeJourneyHtml.includes("Enloe Hospital Address"),
    "Verified address text should not appear in Arrival Guidance."
);
assert(
    !activeJourneyHtml.includes("Room</span>"),
    "Department text should not render as Room."
);
assert(
    activeJourneyHtml.includes("Department") &&
    activeJourneyHtml.includes("hematology") &&
    activeJourneyHtml.includes("third floor"),
    "Inside destination department and floor should render."
);

context.showActiveJourneyBox("notes");
assert.strictEqual(
    Boolean(sections.notes),
    false,
    "Hidden Active Journey should not steal focus after save."
);

activeJourneyVisible = true;

context.showActiveJourneyBox("notes");
assert.strictEqual(sections.notes.open, true);
assert.strictEqual(sections.notes.scrolled, true);
assert.strictEqual(sections.notes.highlighted, true);

context.showActiveJourneyBox("photos");
assert.strictEqual(sections.photos.open, true);
assert.strictEqual(sections.photos.scrolled, true);

console.log("Active Journey focus behavior passed");
