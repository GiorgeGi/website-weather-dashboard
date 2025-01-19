// Function to get and display recent searches
function displayRecentSearches() {
    const recentSearches = JSON.parse(localStorage.getItem("recentSearches")) || []; // Retrieve recent searches from localStorage
    const recentList = document.getElementById("recent-list");
    recentList.innerHTML = ""; // Clear the current list

    recentSearches.forEach(city => {
        const button = document.createElement("button");
        button.textContent = city; // Set button text to city name
        button.addEventListener("click", () => {
            document.getElementById("city-input").value = city; // Set input field to clicked city
            getWeather(); // Trigger the weather fetch for the clicked city
        });
        recentList.appendChild(button); // Append the button to the list
    });
}

// Convert seconds to "hours and minutes" format
function formatDaylightDuration(seconds) {
    const hours = Math.floor(seconds / 3600); // Calculate hours
    const minutes = Math.floor((seconds % 3600) / 60); // Calculate minutes
    return `${hours}h ${minutes}m`; // Return the formatted string
}

// Extract the time from a datetime string (e.g., "2025-01-18T07:46" -> "07:46")
function formatTime(datetimeString) {
    return datetimeString.split("T")[1]; // Split the string and return the time part
}

// Function to handle the search button click
document.getElementById("search-btn").addEventListener("click", getWeather); // Add event listener to search button


// Function to fetch weather data for the entered city
function getWeather() {
    const city = document.getElementById("city-input").value;
    if (city === "") {
        alert("Please enter a city name!"); // Show alert if no city is entered
        return;
    }

    // Save city to local storage (if not already present)
    let recentSearches = JSON.parse(localStorage.getItem("recentSearches")) || [];
    if (!recentSearches.includes(city)) {
        if (recentSearches.length >= 20) {
            recentSearches.shift(); // Remove the oldest search if the list is too long
        }
        recentSearches.push(city); // Add new city to the list
        localStorage.setItem("recentSearches", JSON.stringify(recentSearches)); // Save to localStorage
    }

    // First API call to get coordinates
    fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}`)
        .then(response => response.json()) // Parse response to JSON
        .then(data => {
            if (!data.results || data.results.length === 0) {
                showWeatherBox("<p>City not found. Please try again.</p>"); // Show error if no city found
                return;
            }

            const latitude = data.results[0].latitude;
            const longitude = data.results[0].longitude;
            const locationName = data.results[0].name;
            const timezone = data.results[0].timezone;

            // Second API call to get weather data
            return fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relative_humidity_2m&timezone=${timezone}&daily=wind_direction_10m_dominant,uv_index_max,sunrise,sunset,daylight_duration`)
                .then(response => response.json()) // Parse weather data response to JSON
                .then(weatherData => {
                    const temperature = weatherData.current_weather.temperature;
                    const windspeed = weatherData.current_weather.windspeed;
                    const weatherCondition = getWeatherCondition(weatherData.current_weather.weathercode);
                    const humidity = weatherData.hourly.relative_humidity_2m[0]; // First hourly humidity value
                    const winddirection = weatherData.daily.wind_direction_10m_dominant[0];
                    const uvIndex = weatherData.daily.uv_index_max[0];
                    const sunrise = formatTime(weatherData.daily.sunrise[0]);
                    const sunset = formatTime(weatherData.daily.sunset[0]);
                    const daylightduration = formatDaylightDuration(weatherData.daily.daylight_duration[0]);

                    const weatherInfo = `
                        <h3>${locationName}</h3>
                        <p>TimeDate: <span id="city-time-${locationName}">Loading...</span></p>
                        <p>Temperature: ${temperature}°C</p>
                        <p>Wind Speed: ${windspeed} km/h</p>
                        <p>Humidity: ${humidity}%</p>
                        <p>Weather: ${weatherCondition}</p>
                    `;
                    showWeatherBox(weatherInfo, locationName, timezone, latitude, longitude, temperature, windspeed, weatherCondition, humidity, winddirection, uvIndex, sunrise, sunset, daylightduration); // Display the weather box with data
                })
                .catch(error => {
                    showWeatherBox("<p>Unable to fetch weather data. Please try again later.</p>"); // Handle errors during API fetch
                    console.error("Error fetching weather data:", error); // Log error to console
                });
        })
        .catch(error => {
            showWeatherBox("<p>Error fetching location data. Please try again later.</p>"); // Handle errors during location fetch
            console.error("Error fetching location data:", error); // Log error to console
        });

    // Update recent searches list after each search
    displayRecentSearches();
}


// Function to show the weather box
function showWeatherBox(content, locationName, timezone, latitude, longitude, temperature, windspeed, weatherCondition, humidity, winddirection, sunrise, sunset, daylightduration, uvIndex) {
    const weatherBox = document.createElement("div"); // Create weather box container
    weatherBox.classList.add("weather-box");

    const header = document.createElement("div"); // Create header for the weather box
    header.classList.add("weather-header");
    header.innerHTML = `<span>${locationName}</span><button class="minimize-btn">_</button><button class="close-btn">X</button>`;
    weatherBox.appendChild(header); // Append header to weather box

    const weatherContent = document.createElement("div"); // Create content section for the weather box
    weatherContent.classList.add("weather-content");
    weatherContent.innerHTML = content;
    weatherBox.appendChild(weatherContent); // Append content section to weather box

    const advancedButton = document.createElement("button"); // Add "Advanced..." button
    advancedButton.classList.add("advanced-btn");
    advancedButton.textContent = "Advanced...";
    advancedButton.addEventListener("click", () => openAdvancedWindow(locationName, latitude, longitude, temperature, windspeed, weatherCondition, humidity, winddirection, sunrise, sunset, daylightduration, uvIndex));
    weatherContent.appendChild(advancedButton); // Append "Advanced..." button to content section

    document.body.appendChild(weatherBox); // Add the weather box to the document body

    header.querySelector(".close-btn").addEventListener("click", () => { 
        weatherBox.style.display = "none"; // Close the weather box on clicking the "X" button
    });

    header.querySelector(".minimize-btn").addEventListener("click", () => { 
        weatherContent.style.display = weatherContent.style.display === "none" ? "block" : "none"; // Minimize or expand the content section
    });

    // Set up draggable feature
    let offsetX = 0; // X-axis offset for dragging
    let offsetY = 0; // Y-axis offset for dragging
    let isDragging = false; // Dragging status

    header.addEventListener("mousedown", (e) => { 
        isDragging = true; // Start dragging
        offsetX = e.clientX - weatherBox.offsetLeft; // Calculate X offset
        offsetY = e.clientY - weatherBox.offsetTop; // Calculate Y offset
    });

    document.addEventListener("mousemove", (e) => {
        if (isDragging) { 
            weatherBox.style.left = `${e.clientX - offsetX}px`; // Update box position (X-axis)
            weatherBox.style.top = `${e.clientY - offsetY}px`; // Update box position (Y-axis)
        }
    });

    document.addEventListener("mouseup", () => { 
        isDragging = false; // Stop dragging
    });

    updateTime(locationName, timezone); // Start updating the time for the location
}



// Function to open the advanced window with a map
function openAdvancedWindow(locationName, latitude, longitude, temperature, windspeed, weatherCondition, humidity, winddirection, uvIndex, sunrise, sunset, daylightduration) {
    const advancedOverlay = document.createElement("div"); // Create overlay for the advanced window
    advancedOverlay.classList.add("advanced-overlay");

    const advancedHeader = document.createElement("div"); // Create header for the advanced window
    advancedHeader.classList.add("advanced-header");
    advancedHeader.innerHTML = `<span>Advanced details for ${locationName}</span><button class="close-advanced-btn">X</button>`;
    advancedOverlay.appendChild(advancedHeader); // Append header to overlay

    // Add the map container
    const mapContainer = document.createElement("div");
    mapContainer.id = "map-container";
    mapContainer.style.width = "400px";
    mapContainer.style.height = "400px";
    mapContainer.style.position = "absolute";
    mapContainer.style.top = "90px";
    mapContainer.style.right = "20px";
    advancedOverlay.appendChild(mapContainer); // Append map container to overlay

    // Create the weather details box
    const weatherDetailsBox = document.createElement("div");
    weatherDetailsBox.classList.add("weather-details-box");
    weatherDetailsBox.style.height = "380px";
    weatherDetailsBox.style.width = "1380px";

    const detailsHeader = document.createElement("div"); // Create header for weather details
    detailsHeader.classList.add("details-header");
    detailsHeader.innerHTML = `<span>Weather Details for ${locationName}</span>`;
    weatherDetailsBox.appendChild(detailsHeader); // Append header to details box

    const detailsContent = document.createElement("div"); // Create content container for weather details
    detailsContent.classList.add("details-content");
    detailsContent.style.fontSize = "18px"; // Increase font size for readability
    detailsContent.style.lineHeight = "1.6"; // Adjust line height for better readability
    detailsContent.style.padding = "10px";

    // Add weather information to details content
    const weatherInfoColumn = document.createElement("div");
    weatherInfoColumn.classList.add("weather-info-column");
    weatherInfoColumn.innerHTML = `
        <p><strong>DateTime:</strong> <span id="city-time-${locationName}">Loading...</span></p>
        <p><strong>Temperature:</strong> ${temperature}°C</p>
        <p><strong>Wind Speed:</strong> ${windspeed} km/h</p>
        <p><strong>Wind Direction:</strong> ${winddirection}°</p>
        <p><strong>Humidity:</strong> ${humidity}%</p>
        <p><strong>Weather:</strong> ${weatherCondition}</p>
    `;

    // Add lunar data and UV index with color-coded highlighting
    const lunarDataColumn = document.createElement("div");
    lunarDataColumn.classList.add("lunar-data-column");

    let uvColor = ""; // Determine UV index color
    if (uvIndex <= 2) {
        uvColor = "green";
    } else if (uvIndex <= 5) {
        uvColor = "yellow";
    } else {
        uvColor = "red";
    }

    lunarDataColumn.innerHTML = `
        <p><strong>Sunrise:</strong> ${sunrise}</p>
        <p><strong>Sunset:</strong> ${sunset}</p>
        <p><strong>Daylight Duration:</strong> ${daylightduration}</p>
        <p><strong>UV Index:</strong> 
            <span style="background-color: ${uvColor}; padding: 4px; border-radius: 5px; color: white;">
                ${uvIndex}
            </span>
        </p>
    `;

    // Append columns to details content
    detailsContent.appendChild(weatherInfoColumn);
    detailsContent.appendChild(lunarDataColumn);

    weatherDetailsBox.appendChild(detailsContent); // Append details content to weather details box
    advancedOverlay.appendChild(weatherDetailsBox); // Append weather details box to overlay

    // Create the comments box
    const commentsBox = document.createElement("div");
    commentsBox.classList.add("comments-box");
    commentsBox.style.width = "300px";
    commentsBox.style.height = "370px";

    const commentsHeader = document.createElement("div"); // Add header for the comments section
    commentsHeader.classList.add("comments-header");
    commentsHeader.textContent = "Notes";

    const commentsContent = document.createElement("div"); // Create content section for comments
    commentsContent.classList.add("comments-content");
    commentsContent.contentEditable = "true"; // Allow users to edit comments
    commentsContent.style.width = "280px";

    // Retrieve and display saved comments from localStorage
    const storedComments = localStorage.getItem(`comments-${locationName}`);
    if (storedComments) {
        commentsContent.textContent = storedComments;
    } else {
        commentsContent.textContent = "Click here to add comments..."; // Placeholder text
        commentsContent.style.color = "gray"; // Placeholder style
    }

    // Add event listeners for placeholder behavior and saving comments
    commentsContent.addEventListener("focus", () => {
        if (commentsContent.textContent === "Click here to add comments...") {
            commentsContent.textContent = ""; // Remove placeholder text
            commentsContent.style.color = "black"; // Change text color to normal
        }
    });

    commentsContent.addEventListener("blur", () => {
        const currentText = commentsContent.textContent.trim();
        if (currentText === "") {
            commentsContent.textContent = "Click here to add comments..."; // Restore placeholder text
            commentsContent.style.color = "gray"; // Restore placeholder style
            localStorage.removeItem(`comments-${locationName}`); // Remove comment from localStorage
        } else {
            localStorage.setItem(`comments-${locationName}`, currentText); // Save comment to localStorage
        }
    });

    commentsBox.appendChild(commentsHeader);
    commentsBox.appendChild(commentsContent);
    advancedOverlay.appendChild(commentsBox); // Append comments box to overlay

    // Create and style the 5-day forecast box
    const forecastBox = document.createElement("div");
    forecastBox.classList.add("forecast-box");
    forecastBox.style.position = "absolute";
    forecastBox.style.height = "370px";
    forecastBox.style.width = "1477px";
    forecastBox.style.bottom = "20px";
    forecastBox.style.right = "20px";
    forecastBox.style.padding = "10px";
    forecastBox.style.backgroundColor = "#f0f0f0";
    forecastBox.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.5)";
    forecastBox.style.borderRadius = "8px";

    const forecastHeader = document.createElement("div"); // Add header for the forecast box
    forecastHeader.classList.add("forecast-header");
    forecastHeader.style.backgroundColor = "#007BFF";
    forecastHeader.style.color = "white";
    forecastHeader.style.padding = "10px";
    forecastHeader.textContent = "5-Day Forecast";
    forecastHeader.style.textAlign = "center";
    forecastHeader.style.marginBottom = "10px";

    const forecastContent = document.createElement("div"); // Add content section for the forecast
    forecastContent.classList.add("forecast-content");
    forecastContent.style.padding = "10px";
    forecastContent.style.overflowY = "auto";
    forecastContent.style.height = "calc(100% - 40px)"; // Account for header height

    // Fetch weather data for the next 5 days
    const weatherApiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,relative_humidity_2m_max,relative_humidity_2m_min,weathercode&timezone=auto`;

    fetch(weatherApiUrl)
        .then(response => response.json())
        .then(data => {
            const dailyData = data.daily;
            for (let i = 0; i < 5; i++) {
                const forecastSquare = document.createElement("div"); // Create forecast square for each day
                forecastSquare.classList.add("forecast-square");

                const nextDate = new Date(); // Calculate date for the forecast
                nextDate.setDate(nextDate.getDate() + (i + 1));

                const options = { weekday: 'short', month: 'short', day: 'numeric' };
                const formattedDate = nextDate.toLocaleDateString('en-US', options); // Format date

                // Extract daily weather data
                const temperatureMax = dailyData.temperature_2m_max[i];
                const humidityMax = dailyData.relative_humidity_2m_max[i];
                const weatherCode = dailyData.weathercode[i];
                const weatherDesc = getWeatherCondition(weatherCode); // Get weather description

                // Set content for the forecast square
                forecastSquare.innerHTML = `
                    <p class="forecast-date">${formattedDate}</p>
                    <p class="forecast-temp"><strong>Temp:</strong> ${temperatureMax}°C</p>
                    <p class="forecast-humidity"><strong>Humidity:</strong> ${humidityMax}%</p>
                    <p class="forecast-condition"><strong>Condition:</strong> ${weatherDesc}</p>
                `;
                forecastContent.appendChild(forecastSquare); // Append square to forecast content
            }
        })
        .catch(error => {
            console.error("Error fetching 5-day forecast:", error);
        });

    forecastBox.appendChild(forecastHeader);
    forecastBox.appendChild(forecastContent);
    advancedOverlay.appendChild(forecastBox); // Append forecast box to overlay

    document.body.appendChild(advancedOverlay); // Add advanced window to document

    const closeAdvancedBtn = advancedHeader.querySelector(".close-advanced-btn"); // Close button
    closeAdvancedBtn.addEventListener("click", () => {
        document.body.removeChild(advancedOverlay); // Remove advanced window
    });

    // Initialize Leaflet map for location coordinates
    const map = L.map(mapContainer.id).setView([latitude, longitude], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap'
    }).addTo(map);
    L.marker([latitude, longitude]).addTo(map).bindPopup(`${locationName}`).openPopup();



    // Add event listener to close the advanced window
    advancedHeader.querySelector(".close-advanced-btn").addEventListener("click", () => {
        document.body.removeChild(advancedOverlay);
    });
}



// Function to update the time every second
function updateTime(locationName, timezone) {
    setInterval(() => {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            weekday: 'long',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        });

        const formattedDate = formatter.format(now);
        document.getElementById(`city-time-${locationName}`).textContent = `${formattedDate}`;
    }, 1000);
}

// Function to convert weather codes to human-readable conditions
function getWeatherCondition(weatherCode) {
    const weatherConditions = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Fog",
        48: "Depositing rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Heavy drizzle",
        56: "Light freezing drizzle",
        57: "Heavy freezing drizzle",
        61: "Light rain",
        63: "Moderate rain",
        65: "Heavy rain",
        66: "Light freezing rain",
        67: "Heavy freezing rain",
        71: "Light snow",
        73: "Moderate snow",
        75: "Heavy snow",
        77: "Snow grains",
        80: "Light rain showers",
        81: "Moderate rain showers",
        82: "Heavy rain showers",
        85: "Light snow showers",
        86: "Heavy snow showers",
        95: "Thunderstorm",
        96: "Thunderstorm with light hail",
        99: "Thunderstorm with heavy hail"
    };

    return weatherConditions[weatherCode] || "Unknown weather";
}

// Initialize the recent searches list
displayRecentSearches();

// Add functionality to clear the recently searched cities
document.getElementById("clear-list-btn").addEventListener("click", () => {
    // Clear the list in the UI
    const recentList = document.getElementById("recent-list");
    recentList.innerHTML = ""; // Clears the list content

    // Clear the list from localStorage
    localStorage.removeItem("recentSearches");
});

// Select elements
const feedbackBtn = document.getElementById('feedback-btn');
const modal = document.getElementById('feedback-modal');
const modalcloseBtn = document.querySelector('.modal-close-btn');

// Open modal
feedbackBtn.addEventListener('click', () => {
    modal.style.display = 'flex';
});

// Close modal
modalcloseBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

// Close modal when clicking outside the modal content
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});
