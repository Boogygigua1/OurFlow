function getBestDestinationForMaps() {

    return (
        activeJourney?.verifiedDestinationAddress ||
        activeJourney?.destinationAddress ||
        activeJourney?.destinationDetail ||
        activeJourney?.destination ||
        ""
    );
}

function getBestParkingForMaps() {

    return (
        activeJourney?.parkingLocationAddress ||
        activeJourney?.parkingLocation ||
        ""
    );
}

function getBestStartForMaps() {

    return (
        activeJourney?.startLocationAddress ||
        activeJourney?.startLocation ||
        ""
    );
}

function buildGoogleMapsDirectionsUrl({
    origin,
    destination,
    mode
}) {

    let mapUrl =
        "https://www.google.com/maps/dir/?api=1";

    if (origin) {
        mapUrl +=
            "&origin=" +
            encodeURIComponent(origin);
    }

    mapUrl +=
        "&destination=" +
        encodeURIComponent(destination || "");

    if (mode) {
        mapUrl +=
            "&travelmode=" +
            encodeURIComponent(mode);
    }

    return mapUrl;
}

function openGoogleMapsToDestination(mode = "driving") {

    const destination =
        getBestDestinationForMaps();

    if (!destination) {
        alert("No destination details recorded.");
        return;
    }

    const origin =
        getBestStartForMaps();

    const mapUrl =
        buildGoogleMapsDirectionsUrl({
            origin,
            destination,
            mode
        });

    window.open(mapUrl, "_blank");
}

function openGoogleMapsFromParkingToDestination(mode = "walking") {

    const origin =
        getBestParkingForMaps();

    if (!origin) {
        alert("No parking location recorded.");
        return;
    }

    const destination =
        getBestDestinationForMaps();

    if (!destination) {
        alert("No destination details recorded.");
        return;
    }

    const mapUrl =
        buildGoogleMapsDirectionsUrl({
            origin,
            destination,
            mode
        });

    window.open(mapUrl, "_blank");
}

function openGoogleMapsBackToParking(mode = "walking") {

    const destination =
        getBestParkingForMaps();

    if (!destination) {
        alert("No parking location recorded.");
        return;
    }

    const origin =
        getBestDestinationForMaps();

    const mapUrl =
        buildGoogleMapsDirectionsUrl({
            origin,
            destination,
            mode
        });

    window.open(mapUrl, "_blank");
}

function openGoogleMapsForJourney() {

    if (!activeJourney) {
        alert("No active journey found.");
        return;
    }

    const destination =
        getBestDestinationForMaps();

    const mapUrl =
        buildGoogleMapsDirectionsUrl({
            origin: getBestStartForMaps(),
            destination
        });

    window.open(mapUrl, "_blank");
}

function openGoogleMapsToStartLocation() {

    const destination =
        getBestStartForMaps();

    if (!destination) {
        alert("No starting location recorded.");
        return;
    }

    const origin =
        getBestDestinationForMaps();

    const mapUrl =
        buildGoogleMapsDirectionsUrl({
            origin,
            destination
        });

    window.open(mapUrl, "_blank");
}

function openGoogleMapsToParkingLocation() {

    const destination =
        getBestParkingForMaps();

    if (!destination) {
        alert("No parking location recorded.");
        return;
    }

    const origin =
        getBestDestinationForMaps();

    const mapUrl =
        buildGoogleMapsDirectionsUrl({
            origin,
            destination
        });

    window.open(mapUrl, "_blank");
}

function openGoogleMapsToDestinationDetails(mode = "driving") {

    const destination =
        getBestDestinationForMaps();

    if (!destination) {
        alert("No destination details recorded.");
        return;
    }

    const origin =
        getBestParkingForMaps() ||
        getBestStartForMaps();

    const mapUrl =
        buildGoogleMapsDirectionsUrl({
            origin,
            destination,
            mode
        });


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
