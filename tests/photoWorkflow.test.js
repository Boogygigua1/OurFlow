const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const root = path.resolve(__dirname, "..");

let resultHtml = "";
let activeJourneyRefreshes = [];
const storage = {};

const context = {
    console,
    pendingPhotoMemory: false,
    pendingPhotoClassification: "",
    landmarkImageData: "data:image/jpeg;base64,full-photo",
    landmarkThumbnailData: "",
    activeJourney: {
        destination: "Enloe Hospital",
        photos: [
            {
                timestamp: "now",
                title: "",
                analysis: "",
                thumbnail: "data:image/jpeg;base64,thumb"
            }
        ],
        timeline: [],
        notes: [],
        questionsForDoctor: [],
        staffInstructions: [],
        medications: [],
        appointments: [],
        directories: []
    },
    savedJourneys: [],
    window: {
        innerHeight: 700,
        landmarkThumbnailPromise:
            Promise.resolve("data:image/jpeg;base64,new-thumb")
    },
    localStorage: {
        getItem(key) {
            return storage[key] || null;
        },
        setItem(key, value) {
            storage[key] = String(value);
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
                    innerHTML: "",
                    getBoundingClientRect() {
                        return {
                            top: 900,
                            bottom: 1200
                        };
                    }
                };
            }

            if (id === "questionInput") {
                return {
                    focus() {}
                };
            }

            return null;
        },
        querySelector() {
            return null;
        }
    },
    Image: function ImageStub() {
        Object.defineProperty(this, "src", {
            set() {
                setTimeout(() => {
                    if (this.onerror) {
                        this.onerror();
                    }
                }, 0);
            }
        });
    },
    showActiveJourneyBox(sectionKey) {
        activeJourneyRefreshes.push(sectionKey || "");
    },
    isActiveJourneyCurrentlyVisible() {
        return false;
    },
    markActiveJourneyContext() {},
    alert(message) {
        throw new Error("Unexpected alert: " + message);
    },
    setTimeout,
    clearTimeout
};

context.window.window = context.window;

vm.createContext(context);

vm.runInContext(
    fs.readFileSync(path.join(root, "photos.js"), "utf8"),
    context,
    {
        filename: "photos.js"
    }
);

(async () => {
    context.savePhotoMemory("Room 145");

    assert(
        /Photo Note Saved/.test(resultHtml) &&
            /Room 145/.test(resultHtml) &&
            /Save As Parking/.test(resultHtml) &&
            /Continue Journey/.test(resultHtml),
        "Saving a photo note should keep the photo workflow card visible."
    );
    assert.strictEqual(
        context.activeJourney.photos[0].note,
        "Room 145"
    );
    assert.strictEqual(
        activeJourneyRefreshes.length,
        0,
        "Photo note save should not refresh or scroll Active Journey."
    );

    context.activeJourney.photos = [];
    context.landmarkThumbnailData = "";
    activeJourneyRefreshes = [];

    await context.saveJourneyPhoto();

    assert.strictEqual(
        context.activeJourney.photos[0].thumbnail,
        "data:image/jpeg;base64,new-thumb",
        "Photo save should wait for the generated thumbnail before persisting."
    );
    assert(
        JSON.parse(storage.activeJourney).photos[0].thumbnail
            .startsWith("data:image/"),
        "Persisted activeJourney should contain an actual image data URL thumbnail."
    );
    assert(
        /Photo Saved/.test(resultHtml) &&
            /data:image\/jpeg;base64,new-thumb/.test(resultHtml),
        "Photo saved card should show the real thumbnail."
    );
    assert.strictEqual(
        activeJourneyRefreshes.length,
        0,
        "Photo save should keep the user on the photo confirmation screen."
    );

    context.activeJourney.photos = [];
    context.landmarkThumbnailData = "";
    context.window.landmarkThumbnailPromise =
        Promise.resolve("");
    context.landmarkImageData =
        "data:image/jpeg;base64,full-photo";
    resultHtml = "";

    await context.saveJourneyPhoto();

    assert.strictEqual(
        context.activeJourney.photos[0].thumbnail,
        "",
        "Thumbnail failure should not persist the full photo data URL."
    );
    assert(
        /preview could not be created/.test(resultHtml),
        "Thumbnail failure should show a calm non-blocking message."
    );

    console.log("Photo workflow regression passed");
})();
