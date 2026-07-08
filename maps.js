function selectMapAddress(candidates) {

    const match =
        candidates.find(candidate =>
            candidate.value &&
            String(candidate.value).trim()
        );

    return match || {
        value: "",
        source: ""
    };
}

function formatGpsForMaps(gps) {

    if (
        !gps ||
        typeof gps.latitude !== "number" ||
        typeof gps.longitude !== "number"
    ) {
        return "";
    }

    return gps.latitude + "," + gps.longitude;
}

function getDestinationMapSelection() {

    return selectMapAddress([
        {
            value: activeJourney?.verifiedDestinationAddress,
            source: "verifiedDestinationAddress"
        },
        {
            value: activeJourney?.destinationAddress,
            source: "destinationAddress"
        },
        {
            value: activeJourney?.destinationDetail,
            source: "destinationDetail"
        },
        {
            value: activeJourney?.destination,
            source: "destination"
        }
    ]);
}

function getParkingMapSelection() {

    return selectMapAddress([
        {
            value: activeJourney?.verifiedParkingAddress,
            source: "verifiedParkingAddress"
        },
        {
            value: activeJourney?.parkingLocationAddress,
            source: "parkingLocationAddress"
        },
        {
            value: activeJourney?.parkingAddress,
            source: "parkingAddress"
        },
        {
            value: formatGpsForMaps(activeJourney?.parkingGps),
            source: "parkingGps"
        }
    ]);
}

function getStartMapSelection() {

    return selectMapAddress([
        {
            value: activeJourney?.verifiedStartAddress,
            source: "verifiedStartAddress"
        },
        {
            value: activeJourney?.startLocationAddress,
            source: "startLocationAddress"
        },
        {
            value: activeJourney?.startAddress,
            source: "startAddress"
        },
        {
            value: formatGpsForMaps(activeJourney?.startGps),
            source: "startGps"
        },
        {
            value: activeJourney?.startLocation,
            source: "startLocation"
        }
    ]);
}

function getBestDestinationForMaps() {

    return getDestinationMapSelection().value;
}

function getBestParkingForMaps() {

    return getParkingMapSelection().value;
}

function getBestStartForMaps() {

    return getStartMapSelection().value;
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

    const destinationSelection =
        getDestinationMapSelection();

    const startSelection =
        getStartMapSelection();

    const destination =
        destinationSelection.value;

    if (!destination) {
        alert("No destination details recorded.");
        return;
    }

    const origin =
        startSelection.value;

    const mapUrl =
        buildGoogleMapsDirectionsUrl({
            origin,
            destination,
            mode
        });

    window.open(mapUrl, "_blank");
}

function openGoogleMapsFromParkingToDestination(mode = "walking") {

    const parkingSelection =
        getParkingMapSelection();

    const destinationSelection =
        getDestinationMapSelection();

    const origin =
        parkingSelection.value;

    if (!origin) {
        alert("No verified parking address yet. Add or verify an address first.");
        return;
    }

    const destination =
        destinationSelection.value;

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

    const parkingSelection =
        getParkingMapSelection();

    const destinationSelection =
        getDestinationMapSelection();

    const destination =
        parkingSelection.value;

    if (!destination) {
        alert("No verified parking address yet. Add or verify an address first.");
        return;
    }

    const origin =
        destinationSelection.value;

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

    const destinationSelection =
        getDestinationMapSelection();

    const startSelection =
        getStartMapSelection();

    const destination =
        destinationSelection.value;

    if (!destination) {
        alert("No destination details recorded.");
        return;
    }

    const mapUrl =
        buildGoogleMapsDirectionsUrl({
            origin: startSelection.value,
            destination
        });

    window.open(mapUrl, "_blank");
}

function openGoogleMapsToStartLocation() {

    const startSelection =
        getStartMapSelection();

    const destinationSelection =
        getDestinationMapSelection();

    const destination =
        startSelection.value;

    if (!destination) {
        alert("No starting address or GPS location saved yet.");
        return;
    }

    const origin =
        destinationSelection.value;

    const mapUrl =
        buildGoogleMapsDirectionsUrl({
            origin,
            destination
        });

    window.open(mapUrl, "_blank");
}

function openGoogleMapsToParkingLocation() {

    const parkingSelection =
        getParkingMapSelection();

    const destinationSelection =
        getDestinationMapSelection();

    const destination =
        parkingSelection.value;

    if (!destination) {
        alert("No parking address or GPS location saved yet.");
        return;
    }

    const origin =
        destinationSelection.value;

    const mapUrl =
        buildGoogleMapsDirectionsUrl({
            origin,
            destination
        });

    window.open(mapUrl, "_blank");
}

function openGoogleMapsToDestinationDetails(mode = "driving") {

    const destinationSelection =
        getDestinationMapSelection();

    const parkingSelection =
        getParkingMapSelection();

    const startSelection =
        getStartMapSelection();

    const destination =
        destinationSelection.value;

    if (!destination) {
        alert("No destination details recorded.");
        return;
    }

    const origin =
        parkingSelection.value ||
        startSelection.value;

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
