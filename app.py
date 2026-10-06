from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)


# ============================================================
# GEOCODING
# Convert location name into latitude and longitude
# ============================================================

def geocode_location(location):

    url = "https://nominatim.openstreetmap.org/search"

    params = {
        "q": location,
        "format": "json",
        "limit": 1
    }

    headers = {
        "User-Agent": "AI-Travel-Route-Planner/1.0"
    }

    try:

        response = requests.get(
            url,
            params=params,
            headers=headers,
            timeout=10
        )

        response.raise_for_status()

        data = response.json()

        if not data:
            return None

        return {
            "lat": float(data[0]["lat"]),
            "lon": float(data[0]["lon"]),
            "display_name": data[0]["display_name"]
        }

    except requests.RequestException:

        return None


# ============================================================
# GET ROAD ROUTES
# OSRM Routing Service
# ============================================================

def get_routes(start, destination):

    url = (
        "https://router.project-osrm.org/route/v1/driving/"
        f"{start['lon']},{start['lat']};"
        f"{destination['lon']},{destination['lat']}"
    )

    params = {
        "alternatives": "true",
        "overview": "full",
        "geometries": "geojson"
    }

    try:

        response = requests.get(
            url,
            params=params,
            timeout=20
        )

        response.raise_for_status()

        data = response.json()

        if data.get("code") != "Ok":
            return []

        routes = []

        for route in data.get("routes", []):

            routes.append({
                "distance": route["distance"] / 1000,
                "duration": route["duration"] / 60,
                "geometry": route["geometry"]
            })

        return routes

    except requests.RequestException:

        return []


# ============================================================
# TRANSPORT MODE CALCULATION
# ============================================================

def calculate_transport(route, transport):

    distance = route["distance"]
    road_duration = route["duration"]

    # --------------------------------------------------------
    # CAR
    # --------------------------------------------------------

    if transport == "car":

        duration = road_duration

        return {
            "mode": "car",
            "name": "Car",
            "distance": distance,
            "duration": round(duration, 1),
            "description": "Estimated car travel time"
        }

    # --------------------------------------------------------
    # BIKE
    # --------------------------------------------------------

    elif transport == "bike":

        duration = road_duration * 1.15

        return {
            "mode": "bike",
            "name": "Bike",
            "distance": distance,
            "duration": round(duration, 1),
            "description": "Estimated bike travel time"
        }

    # --------------------------------------------------------
    # BUS
    # --------------------------------------------------------

    elif transport == "bus":

        duration = road_duration * 1.50

        return {
            "mode": "bus",
            "name": "Bus",
            "distance": distance,
            "duration": round(duration, 1),
            "description": "Estimated bus travel time including stops"
        }

    # --------------------------------------------------------
    # WALKING
    # Average walking speed = 5 km/hour
    # --------------------------------------------------------

    elif transport == "walk":

        duration = (distance / 5) * 60

        return {
            "mode": "walk",
            "name": "Walking",
            "distance": distance,
            "duration": round(duration, 1),
            "description": "Estimated walking time"
        }

    # --------------------------------------------------------
    # TRAIN
    # Estimated average train speed
    # --------------------------------------------------------

    elif transport == "train":

        # Approximate average train speed
        train_speed = 70

        duration = (distance / train_speed) * 60

        # Add station/boarding time
        duration += 30

        return {
            "mode": "train",
            "name": "Train",
            "distance": distance,
            "duration": round(duration, 1),
            "description": (
                "Estimated train travel time "
                "including station time"
            )
        }

    # --------------------------------------------------------
    # FLIGHT / AIRPORT
    # --------------------------------------------------------

    elif transport == "flight":

        # Approximate flight-related time
        #
        # Flight itself is faster, but airport processes
        # require additional time.

        if distance < 100:

            duration = 120

        else:

            flight_time = (distance / 700) * 60

            airport_time = 120

            duration = flight_time + airport_time

        return {
            "mode": "flight",
            "name": "Flight",
            "distance": distance,
            "duration": round(duration, 1),
            "description": (
                "Estimated flight journey time "
                "including airport processing"
            )
        }

    # --------------------------------------------------------
    # DEFAULT
    # --------------------------------------------------------

    return {
        "mode": "car",
        "name": "Car",
        "distance": distance,
        "duration": round(road_duration, 1),
        "description": "Estimated car travel time"
    }


# ============================================================
# NORMALIZE VALUE
# ============================================================

def normalize(value, minimum, maximum):

    if maximum == minimum:
        return 0

    return (
        (value - minimum)
        /
        (maximum - minimum)
    )


# ============================================================
# RECOMMEND ROUTE
# ============================================================

def recommend_route(routes, preference):

    if not routes:
        return None

    distances = [
        route["distance"]
        for route in routes
    ]

    durations = [
        route["duration"]
        for route in routes
    ]

    min_distance = min(distances)
    max_distance = max(distances)

    min_duration = min(durations)
    max_duration = max(durations)

    for route in routes:

        distance_score = normalize(
            route["distance"],
            min_distance,
            max_distance
        )

        time_score = normalize(
            route["duration"],
            min_duration,
            max_duration
        )

        # ----------------------------------------------------
        # SHORTEST
        # ----------------------------------------------------

        if preference == "shortest":

            route["score"] = distance_score

        # ----------------------------------------------------
        # FASTEST
        # ----------------------------------------------------

        elif preference == "fastest":

            route["score"] = time_score

        # ----------------------------------------------------
        # BALANCED
        # ----------------------------------------------------

        else:

            route["score"] = (
                0.5 * distance_score
                +
                0.5 * time_score
            )

    selected = min(
        routes,
        key=lambda route: route["score"]
    )

    return selected


# ============================================================
# HOME PAGE
# ============================================================

@app.route("/")
def home():

    return render_template("index.html")


# ============================================================
# ROUTE PLANNING API
# ============================================================

@app.route("/api/plan", methods=["POST"])
def plan_route():

    data = request.get_json()

    if not data:

        return jsonify({
            "success": False,
            "message": "No data received."
        }), 400

    # --------------------------------------------------------
    # LOCATION INPUT
    # --------------------------------------------------------

    start_location = data.get(
        "start",
        ""
    ).strip()

    destination_location = data.get(
        "destination",
        ""
    ).strip()

    # --------------------------------------------------------
    # TRANSPORT
    # --------------------------------------------------------

    transport = data.get(
        "transport",
        "car"
    ).lower()

    # All supported transport modes

    allowed_transport = [
        "car",
        "bike",
        "bus",
        "walk",
        "train",
        "flight"
    ]

    if transport not in allowed_transport:

        transport = "car"

    # --------------------------------------------------------
    # ROUTE PREFERENCE
    # --------------------------------------------------------

    preference = data.get(
        "preference",
        "balanced"
    )

    # --------------------------------------------------------
    # VALIDATE LOCATIONS
    # --------------------------------------------------------

    if (
        not start_location
        or not destination_location
    ):

        return jsonify({
            "success": False,
            "message": (
                "Please enter both start "
                "and destination."
            )
        }), 400

    # ========================================================
    # GEOCODE START LOCATION
    # ========================================================

    start = geocode_location(
        start_location
    )

    if start is None:

        return jsonify({
            "success": False,
            "message": (
                "Could not find start location: "
                f"{start_location}"
            )
        }), 404

    # ========================================================
    # GEOCODE DESTINATION
    # ========================================================

    destination = geocode_location(
        destination_location
    )

    if destination is None:

        return jsonify({
            "success": False,
            "message": (
                "Could not find destination: "
                f"{destination_location}"
            )
        }), 404

    # ========================================================
    # GET ROAD ROUTES
    # ========================================================

    routes = get_routes(
        start,
        destination
    )

    if not routes:

        return jsonify({
            "success": False,
            "message": "No route could be found."
        }), 404

    # ========================================================
    # APPLY TRANSPORT MODE
    # ========================================================

    transport_routes = []

    for route in routes:

        transport_info = calculate_transport(
            route,
            transport
        )

        new_route = {

            "distance": transport_info["distance"],

            "duration": transport_info["duration"],

            "geometry": route["geometry"],

            "transport": transport_info["mode"],

            "transport_name": transport_info["name"],

            "description": transport_info["description"]

        }

        transport_routes.append(
            new_route
        )

    # ========================================================
    # RECOMMEND ROUTE
    # ========================================================

    selected = recommend_route(
        transport_routes,
        preference
    )

    selected_index = (
        transport_routes.index(selected)
    )

    # ========================================================
    # TRANSPORT DISPLAY NAME
    # ========================================================

    transport_names = {

        "car": "Car",

        "bike": "Bike",

        "bus": "Bus",

        "walk": "Walking",

        "train": "Train",

        "flight": "Flight"

    }

    # ========================================================
    # FINAL RESPONSE
    # ========================================================

    result = {

        "success": True,

        "start": {

            "name": start["display_name"],

            "lat": start["lat"],

            "lon": start["lon"]

        },

        "destination": {

            "name": destination["display_name"],

            "lat": destination["lat"],

            "lon": destination["lon"]

        },

        "transport": {

            "mode": transport,

            "name": transport_names.get(
                transport,
                "Car"
            )

        },

        "routes": transport_routes,

        "selected_route": selected_index,

        "preference": preference

    }

    return jsonify(result)


# ============================================================
# RUN APPLICATION
# ============================================================

if __name__ == "__main__":

    app.run(
        debug=False,
        host="127.0.0.1",
        port=5000
    )