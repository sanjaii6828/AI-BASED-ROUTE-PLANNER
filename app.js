let map = null;

let routeLayers = [];


// ============================================================
// TRANSPORT ICONS
// ============================================================

const transportIcons = {

    car: "🚗",

    bike: "🏍️",

    bus: "🚌",

    train: "🚆",

    flight: "✈️",

    walk: "🚶"

};


// ============================================================
// TRANSPORT NAMES
// ============================================================

const transportNames = {

    car: "Car",

    bike: "Bike",

    bus: "Bus",

    train: "Train",

    flight: "Flight",

    walk: "Walking"

};


// ============================================================
// PLAN ROUTE
// ============================================================

async function planRoute() {

    const startElement =
        document.getElementById("start");

    const destinationElement =
        document.getElementById("destination");

    const preferenceElement =
        document.getElementById("preference");

    const transportElement =
        document.getElementById("transport");


    const start =
        startElement.value.trim();

    const destination =
        destinationElement.value.trim();

    const preference =
        preferenceElement.value;

    const transport =
        transportElement
            ? transportElement.value
            : "car";


    // --------------------------------------------------------
    // CLEAR ERROR
    // --------------------------------------------------------

    hideError();


    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!start || !destination) {

        showError(
            "Please enter both start location and destination."
        );

        return;
    }


    // --------------------------------------------------------
    // SHOW LOADING
    // --------------------------------------------------------

    const loading =
        document.getElementById("loading");

    const planButton =
        document.getElementById("planButton");


    loading.classList.remove("hidden");

    planButton.disabled = true;


    try {

        // ----------------------------------------------------
        // SEND DATA TO FLASK
        // ----------------------------------------------------

        const response =
            await fetch(
                "/api/plan",
                {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        start: start,

                        destination: destination,

                        preference: preference,

                        transport: transport

                    })

                }
            );


        // ----------------------------------------------------
        // READ RESPONSE
        // ----------------------------------------------------

        const data =
            await response.json();


        // ----------------------------------------------------
        // CHECK RESPONSE
        // ----------------------------------------------------

        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to plan route."
            );

        }


        // ----------------------------------------------------
        // DISPLAY RESULT
        // ----------------------------------------------------

        displayResult(data);

    }


    catch (error) {

        console.error(
            "Route planning error:",
            error
        );


        showError(
            error.message ||
            "Something went wrong while planning the route."
        );

    }


    finally {

        // ----------------------------------------------------
        // HIDE LOADING
        // ----------------------------------------------------

        loading.classList.add(
            "hidden"
        );


        planButton.disabled =
            false;

    }
}


// ============================================================
// DISPLAY RESULT
// ============================================================

function displayResult(data) {

    // --------------------------------------------------------
    // VALIDATE ROUTE DATA
    // --------------------------------------------------------

    if (
        !data.routes ||
        data.routes.length === 0
    ) {

        showError(
            "No routes were returned."
        );

        return;
    }


    const selectedIndex =
        data.selected_route;


    const selectedRoute =
        data.routes[selectedIndex];


    if (!selectedRoute) {

        showError(
            "Selected route information is unavailable."
        );

        return;
    }


    // ========================================================
    // DISTANCE
    // ========================================================

    const distanceElement =
        document.getElementById(
            "distance"
        );


    distanceElement.textContent =
        Number(
            selectedRoute.distance
        ).toFixed(2)
        + " km";


    // ========================================================
    // TRAVEL TIME
    // ========================================================

    const durationElement =
        document.getElementById(
            "duration"
        );


    durationElement.textContent =
        formatDuration(
            selectedRoute.duration
        );


    // ========================================================
    // ROUTE COUNT
    // ========================================================

    const routeCountElement =
        document.getElementById(
            "routeCount"
        );


    routeCountElement.textContent =
        data.routes.length;


    // ========================================================
    // TRANSPORT
    // ========================================================

    const transportMode =
        data.transport &&
        data.transport.mode
            ? data.transport.mode
            : "car";


    const transportName =
        data.transport &&
        data.transport.name
            ? data.transport.name
            : (
                transportNames[
                    transportMode
                ] || "Car"
            );


    const transportIcon =
        transportIcons[
            transportMode
        ] || "🚗";


    // ========================================================
    // TRANSPORT RESULT
    // ========================================================

    const transportResult =
        document.getElementById(
            "transportResult"
        );


    if (transportResult) {

        transportResult.textContent =
            transportIcon +
            " " +
            transportName;

    }


    // ========================================================
    // TRANSPORT DESCRIPTION
    // ========================================================

    const transportDescription =
        document.getElementById(
            "transportDescription"
        );


    if (transportDescription) {

        transportDescription.textContent =
            selectedRoute.description ||
            "Estimated travel time for the selected transport.";

    }


    // ========================================================
    // JOURNEY DETAILS - TRANSPORT
    // ========================================================

    const transportDetails =
        document.getElementById(
            "transportDetails"
        );


    if (transportDetails) {

        transportDetails.textContent =
            transportIcon +
            " " +
            transportName;

    }


    // ========================================================
    // ROUTE PREFERENCE
    // ========================================================

    let preferenceText = "";

    let preferenceName = "";


    if (
        data.preference === "fastest"
    ) {

        preferenceName =
            "Fastest";

        preferenceText =
            "The route was selected based on the lowest estimated travel time.";

    }


    else if (
        data.preference === "shortest"
    ) {

        preferenceName =
            "Shortest";

        preferenceText =
            "The route was selected based on the shortest distance.";

    }


    else {

        preferenceName =
            "Balanced";

        preferenceText =
            "The route was selected using a balanced combination of distance and travel time.";

    }


    // ========================================================
    // RECOMMENDATION TEXT
    // ========================================================

    const recommendationText =
        document.getElementById(
            "recommendationText"
        );


    recommendationText.textContent =
        preferenceText;


    // ========================================================
    // PREFERENCE DETAILS
    // ========================================================

    const preferenceDetails =
        document.getElementById(
            "preferenceDetails"
        );


    if (preferenceDetails) {

        preferenceDetails.textContent =
            preferenceName;

    }


    // ========================================================
    // LOCATION NAMES
    // ========================================================

    const startName =
        document.getElementById(
            "startName"
        );


    startName.textContent =
        data.start.name;


    const destinationName =
        document.getElementById(
            "destinationName"
        );


    destinationName.textContent =
        data.destination.name;


    // ========================================================
    // SHOW RESULT SECTIONS
    // ========================================================

    document
        .getElementById(
            "resultSection"
        )
        .classList.remove(
            "hidden"
        );


    document
        .getElementById(
            "mapSection"
        )
        .classList.remove(
            "hidden"
        );


    document
        .getElementById(
            "detailsSection"
        )
        .classList.remove(
            "hidden"
        );


    // ========================================================
    // DRAW MAP
    // ========================================================

    drawMap(data);
}


// ============================================================
// DRAW MAP
// ============================================================

function drawMap(data) {

    // --------------------------------------------------------
    // CREATE MAP
    // --------------------------------------------------------

    if (map === null) {

        map =
            L.map("map");


        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {

                attribution:
                    "&copy; OpenStreetMap contributors"

            }
        ).addTo(map);

    }


    // --------------------------------------------------------
    // REMOVE OLD MAP LAYERS
    // --------------------------------------------------------

    routeLayers.forEach(
        layer => {

            map.removeLayer(
                layer
            );

        }
    );


    routeLayers = [];


    // ========================================================
    // START MARKER
    // ========================================================

    const startMarker =
        L.marker([
            data.start.lat,
            data.start.lon
        ])
        .addTo(map);


    startMarker.bindPopup(

        "<b>📍 Start</b><br>" +

        escapeHtml(
            data.start.name
        )

    );


    routeLayers.push(
        startMarker
    );


    // ========================================================
    // DESTINATION MARKER
    // ========================================================

    const destinationMarker =
        L.marker([
            data.destination.lat,
            data.destination.lon
        ])
        .addTo(map);


    destinationMarker.bindPopup(

        "<b>🏁 Destination</b><br>" +

        escapeHtml(
            data.destination.name
        )

    );


    routeLayers.push(
        destinationMarker
    );


    // ========================================================
    // SELECTED TRANSPORT
    // ========================================================

    const transportMode =
        data.transport &&
        data.transport.mode
            ? data.transport.mode
            : "car";


    const icon =
        transportIcons[
            transportMode
        ] || "🚗";


    const transportName =
        data.transport &&
        data.transport.name
            ? data.transport.name
            : "Car";


    // ========================================================
    // DRAW ROUTES
    // ========================================================

    data.routes.forEach(
        (route, index) => {

            // ------------------------------------------------
            // CHECK GEOMETRY
            // ------------------------------------------------

            if (
                !route.geometry ||
                !route.geometry.coordinates
            ) {

                return;

            }


            // ------------------------------------------------
            // CONVERT GEOJSON
            // ------------------------------------------------

            const coordinates =
                route.geometry.coordinates.map(
                    point => [

                        point[1],

                        point[0]

                    ]
                );


            // ------------------------------------------------
            // CHECK SELECTED ROUTE
            // ------------------------------------------------

            const isSelected =
                index ===
                data.selected_route;


            // ------------------------------------------------
            // CREATE LINE
            // ------------------------------------------------

            const line =
                L.polyline(
                    coordinates,
                    {

                        weight:
                            isSelected
                                ? 7
                                : 4,

                        opacity:
                            isSelected
                                ? 1
                                : 0.5

                    }
                )
                .addTo(map);


            // ------------------------------------------------
            // ROUTE POPUP
            // ------------------------------------------------

            const distance =
                Number(
                    route.distance
                ).toFixed(2);


            const duration =
                formatDuration(
                    route.duration
                );


            line.bindPopup(

                "<b>" +
                icon +
                " Route " +
                (index + 1) +
                "</b><br><br>" +

                "<b>Transport:</b> " +
                escapeHtml(
                    route.transport_name ||
                    transportName
                ) +

                "<br>" +

                "<b>Distance:</b> " +
                distance +
                " km" +

                "<br>" +

                "<b>Travel Time:</b> " +
                duration +

                "<br><br>" +

                (
                    route.description
                        ? escapeHtml(
                            route.description
                        )
                        : ""
                )

            );


            // ------------------------------------------------
            // ADD LINE TO LAYERS
            // ------------------------------------------------

            routeLayers.push(
                line
            );

        }
    );


    // ========================================================
    // FIT MAP TO ROUTES
    // ========================================================

    const allCoordinates = [];


    data.routes.forEach(
        route => {

            if (
                !route.geometry ||
                !route.geometry.coordinates
            ) {

                return;

            }


            route.geometry.coordinates.forEach(
                point => {

                    allCoordinates.push([

                        point[1],

                        point[0]

                    ]);

                }
            );

        }
    );


    // --------------------------------------------------------
    // ADD START / DESTINATION
    // --------------------------------------------------------

    allCoordinates.push([

        data.start.lat,

        data.start.lon

    ]);


    allCoordinates.push([

        data.destination.lat,

        data.destination.lon

    ]);


    // --------------------------------------------------------
    // FIT BOUNDS
    // --------------------------------------------------------

    if (
        allCoordinates.length > 0
    ) {

        const bounds =
            L.latLngBounds(
                allCoordinates
            );


        map.fitBounds(
            bounds,
            {

                padding: [
                    30,
                    30
                ]

            }
        );

    }


    // ========================================================
    // OPEN SELECTED ROUTE
    // ========================================================

    /*
       routeLayers contains:

       0 = Start marker
       1 = Destination marker
       2 = Route 1
       3 = Route 2
       4 = Route 3
       ...

    */

    const selectedLayer =
        routeLayers[
            data.selected_route + 2
        ];


    if (selectedLayer) {

        selectedLayer.openPopup();

    }


    // ========================================================
    // FIX MAP SIZE
    // ========================================================

    setTimeout(
        () => {

            if (map) {

                map.invalidateSize();

            }

        },
        300
    );
}


// ============================================================
// FORMAT TIME
// ============================================================

function formatDuration(minutes) {

    const numericMinutes =
        Number(minutes);


    if (
        isNaN(numericMinutes)
    ) {

        return "Unknown";

    }


    const totalMinutes =
        Math.max(
            0,
            Math.round(
                numericMinutes
            )
        );


    const hours =
        Math.floor(
            totalMinutes / 60
        );


    const mins =
        totalMinutes % 60;


    // --------------------------------------------------------
    // HOURS + MINUTES
    // --------------------------------------------------------

    if (hours > 0) {

        if (mins === 0) {

            return (
                hours +
                " hr"
            );

        }


        return (
            hours +
            " hr " +
            mins +
            " min"
        );

    }


    // --------------------------------------------------------
    // MINUTES ONLY
    // --------------------------------------------------------

    return (
        mins +
        " min"
    );
}


// ============================================================
// SHOW ERROR
// ============================================================

function showError(message) {

    const error =
        document.getElementById(
            "error"
        );


    error.textContent =
        message;


    error.classList.remove(
        "hidden"
    );
}


// ============================================================
// HIDE ERROR
// ============================================================

function hideError() {

    const error =
        document.getElementById(
            "error"
        );


    error.classList.add(
        "hidden"
    );
}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHtml(text) {

    if (
        text === null ||
        text === undefined
    ) {

        return "";
    }


    return String(text)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );
}
