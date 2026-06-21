function openGoogleMapsForJourney() {

    if (!activeJourney) {
        alert("No active journey found.");
        return;
    }

    const destination =
        activeJourney?.verifiedDestinationAddress ||
        activeJourney?.destinationAddress ||
        activeJourney?.destinationDetail ||
        activeJourney?.destination ||
        "";

    const mapUrl =
        "https://www.google.com/maps/dir/?api=1" +

        (
            activeJourney?.startLocation
                ? "&origin=" +
                encodeURIComponent(
                    activeJourney.startLocation
                )
                : ""
        ) +

        "&destination=" +
        encodeURIComponent(destination);

    window.open(mapUrl, "_blank");
}

function openGoogleMapsToStartLocation() {

    if (!activeJourney?.startLocation) {
        alert("No starting location recorded.");
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
            activeJourney.parkingLocationAddress ||
            activeJourney.parkingLocation
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
    activeJourney?.parkingLocationAddress ||
    activeJourney?.parkingLocation ||
    activeJourney?.startLocationAddress ||
    activeJourney?.startLocation ||
    "";

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

    activeJourney.mapLink =
        placeData.mapUrl;

    showActiveJourneyBox();
}