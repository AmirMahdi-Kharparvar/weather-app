import React, { useState, useEffect } from "react";

function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], "☀️"],
    [[1], "🌤"],
    [[2], "⛅️"],
    [[3], "☁️"],
    [[45, 48], "🌫"],
    [[51, 56, 61, 66, 80], "🌦"],
    [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
    [[71, 73, 75, 77, 85, 86], "🌨"],
    [[95], "🌩"],
    [[96, 99], "⛈"],
  ]);
  const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
  return arr ? icons.get(arr) : "NOT FOUND";
}

function convertToFlag(countryCode) {
  return String.fromCodePoint(
    ...countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt())
  );
}

function formatDay(dateStr) {
  return new Intl.DateTimeFormat("en", { weekday: "short" }).format(new Date(dateStr));
}

function App() {
  const [location, setLocation] = useState(localStorage.getItem("location") || "");
  const [isLoading, setIsLoading] = useState(false);
  const [displayLocation, setDisplayLocation] = useState("");
  const [weather, setWeather] = useState({});

  useEffect(() => {
    if (location.length < 2) {
      setWeather({});
      return;
    }

    const fetchWeather = async () => {
      try {
        setIsLoading(true);

        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${location}`
        );
        const geoData = await geoRes.json();
        if (!geoData.results) throw new Error("Location not found");

        const { latitude, longitude, timezone, name, country_code } = geoData.results[0];
        setDisplayLocation(`${name} ${convertToFlag(country_code)}`);

        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
        );
        const weatherData = await weatherRes.json();
        setWeather(weatherData.daily);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
    localStorage.setItem("location", location);
  }, [location]);

  return (
    <div className="app">
      <h1>Classy Weather</h1>
      <Input location={location} onChangeLocation={setLocation} />
      {isLoading && <p className="loader">Loading...</p>}
      {weather.weathercode && <Weather weather={weather} location={displayLocation} />}
    </div>
  );
}

function Input({ location, onChangeLocation }) {
  return (
    <div>
      <input
        type="text"
        placeholder="Search from location..."
        value={location}
        onChange={(e) => onChangeLocation(e.target.value)}
      />
    </div>
  );
}

function Weather({ weather, location }) {
  const {
    temperature_2m_max: max,
    temperature_2m_min: min,
    time: dates,
    weathercode: codes,
  } = weather;

  return (
    <div>
      <h2>Weather {location}</h2>
      <ul className="weather">
        {dates.map((date, i) => (
          <Day date={date} max={max[i]} min={min[i]} code={codes[i]} key={date} isToday={i === 0} />
        ))}
      </ul>
    </div>
  );
}

function Day({ date, max, min, code, isToday }) {
  return (
    <li className="day">
      <span>{getWeatherIcon(code)}</span>
      <p>{isToday ? "Today" : formatDay(date)}</p>
      <p>
        {Math.floor(min)}&deg; &mdash; <strong>{Math.ceil(max)}&deg;</strong>
      </p>
    </li>
  );
}

export default App;
