# AI Based Travel Route Planner

## Project Description

AI Based Travel Route Planner is a web application that helps users find suitable routes between two locations. It displays route maps, travel distance, and estimated travel time using location services and mapping APIs. Users can select different transport options and choose their preferred route based on distance or travel time.

## Features

* Enter start and destination locations.
* View routes on an interactive map.
* Calculate travel distance and estimated travel time.
* Select transport options: Car, Bike, Bus, Train, Flight, and Walking.
* Choose route preferences: Fastest, Shortest, or Balanced.
* Display route details and location markers.
* Simple and user-friendly interface.

## Technologies Used

* **Frontend:** HTML, CSS, JavaScript
* **Backend:** Python, Flask
* **Map:** Leaflet.js, OpenStreetMap
* **Geocoding:** OpenStreetMap Nominatim API
* **Routing:** OSRM API

## Project Structure

```text
AI-BASED-TRAVEL-ROUTE-PLANNER/
│
├── app.py
├── app.js
├── index.html
├── style.css
├── requirements.txt
├── .gitignore
└── README.md
```

> If your HTML file is inside a `templates` folder and your JavaScript and CSS files are inside a `static` folder, update the project structure in this README to match your actual folders.

## Installation and Setup

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

### 2. Open the Project Folder

```bash
cd AI-BASED-TRAVEL-ROUTE-PLANNER
```

### 3. Create a Virtual Environment

```bash
python -m venv venv
```

Activate it on Windows:

```powershell
venv\Scripts\Activate.ps1
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

### 5. Run the Application

```bash
python app.py
```

### 6. Open in Your Browser

Visit:

```text
http://127.0.0.1:5000
```

## How to Use

1. Start the application.
2. Enter your starting location.
3. Enter your destination.
4. Select your preferred transport mode.
5. Choose Fastest, Shortest, or Balanced.
6. Click **Plan Route**.
7. View the route information and map.

## Important Notes

* An active internet connection is required to access the mapping and routing services.
* Travel times for some transport options may be estimates rather than live schedules.
* Train and flight options do not necessarily represent actual railway tracks, flight paths, or live timetables.
* Route availability depends on the external mapping services.

## Future Enhancements

* Live traffic information.
* Real-time train and flight schedules.
* Public transport integration.
* Fuel cost and fare estimation.
* GPS-based current location.
* User accounts and saved journeys.

## Author

Developed as an academic project to demonstrate web development, mapping services, route planning, and transport-time estimation.
