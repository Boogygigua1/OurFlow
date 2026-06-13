console.log("MAPS.JS LOADED");

function openGoogleMapsForJourney() {

    if (!activeJourney) {
        alert("No active journey found.");
        return;
    }

    const mapDestination =
        activeJourney.mapLink ||

        "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(
            activeJourney.destinationAddress ||
            activeJourney.destination
        );

    window.open(mapDestination, "_blank");
}
function openGoogleMapsToStartLocation() {

    if (!activeJourney?.startLocation) {
        alert("No starting location recorded.");
        return;
    }

    const origin =
        activeJourney?.destination ||
        activeJourney?.destinationAddress ||
        "";

    const mapUrl =
        "https://www.google.com/maps/dir/?api=1" +
        (origin
            ? "&origin=" +
            encodeURIComponent(origin)
            : "") +
        "&destination=" +
        encodeURIComponent(
            activeJourney.startLocation
        );

    window.open(mapUrl, "_blank");
}

function openGoogleMapsToParkingLocation() {

    if (!activeJourney?.parkingLocation) {
        alert("No parking location recorded.");
        return;
    }

    const origin =
    activeJourney?.verifiedDestinationAddress ||
    activeJourney?.destinationAddress ||
    activeJourney?.destinationDetail ||
    activeJourney?.destination ||
    "";

    const mapUrl =
        "https://www.google.com/maps/dir/?api=1" +
        (origin
            ? "&origin=" +
            encodeURIComponent(origin)
            : "") +
        "&destination=" +
        encodeURIComponent(
            activeJourney.parkingLocation
        );

    console.log(
        "PARKING MAP URL:",
        mapUrl
    );

    window.open(mapUrl, "_blank");
}

function openGoogleMapsToDestinationDetails(mode = "driving") {

    const destination =
        activeJourney?.verifiedDestinationAddress ||
        activeJourney?.destinationAddress ||
        activeJourney?.destinationDetail ||
        activeJourney?.destination;

    if (!destination) {
        alert("No destination details recorded.");
        return;
    }

    const origin =
        activeJourney?.startLocationAddress ||
        activeJourney?.startLocation ||
        "";

    console.log(
        "VERIFIED:",
        activeJourney.verifiedDestinationAddress
    );

    console.log(
        "DETAIL:",
        activeJourney.destinationDetail
    );

    console.log(
        "ADDRESS:",
        activeJourney.destinationAddress
    );

    console.log(
        "DESTINATION FIELD:",
        destination
    );

    console.log(
        "DESTINATION DEBUG",
        activeJourney.startLocation,
        destination
    );

    const mapUrl =
        "https://www.google.com/maps/dir/?api=1" +
        (origin
            ? "&origin=" +
            encodeURIComponent(origin)
            : "") +
        "&destination=" +
        encodeURIComponent(
            destination
        ) +
        "&travelmode=" +
        mode;

    console.log(
        "DESTINATION MAP URL:",
        mapUrl
    );

    window.open(mapUrl, "_blank");
}

async function getArrivalHelp(destination) {

    if (!activeJourney) {
        return;
    }

    activeJourney.arrivalTips =
        "Searching for arrival tips...";

    showActiveJourneyBox();

    const placeResponse = await fetch(
        "/api/searchPlace",
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json"
            },
            body: JSON.stringify({
                query:
                    destination +
                    " entrance parking directions"
            })
        }
    );

    const placeData =
        await placeResponse.json();

    activeJourney.arrivalTips =
        placeData.arrivalTip ||
        "Map search ready. Open Google Maps and check Street View, reviews, parking, and entrance details before leaving.";

    if (!activeJourney.timeline) {
        activeJourney.timeline = [];
    }

    activeJourney.timeline.push(
        "🚪 Arrival Help Saved: " +
        activeJourney.arrivalTips
    );

    activeJourney.mapLink =
        placeData.mapUrl;

    showActiveJourneyBox();
}