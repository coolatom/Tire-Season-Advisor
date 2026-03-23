import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next'; // <-- 1. IMPORT THE HOOK
import { Thermometer, MapPin, CloudSun, Snowflake, Sun, RefreshCw, AlertTriangle, Loader, Send, Facebook, Github, Linkedin, AtSign, Cloudy, Umbrella, CloudRain, CloudSnow, Search, Map } from 'lucide-react';

// --- Helper Function to interpret Open-Meteo WMO codes ---
const getWmoCodeDescription = (code) => {
  const wmoMap = {
    0: { text: 'Clear sky', icon: Sun },
    1: { text: 'Mainly clear', icon: Sun },
    2: { text: 'Partly cloudy', icon: CloudSun },
    3: { text: 'Overcast', icon: Cloudy },
    45: { text: 'Fog', icon: Cloudy },
    48: { text: 'Depositing rime fog', icon: Cloudy },
    51: { text: 'Light drizzle', icon: Umbrella },
    53: { text: 'Moderate drizzle', icon: Umbrella },
    55: { text: 'Dense drizzle', icon: Umbrella },
    61: { text: 'Slight rain', icon: CloudRain },
    63: { text: 'Moderate rain', icon: CloudRain },
    65: { text: 'Heavy rain', icon: CloudRain },
    71: { text: 'Slight snow fall', icon: CloudSnow },
    73: { text: 'Moderate snow fall', icon: CloudSnow },
    75: { text: 'Heavy snow fall', icon: CloudSnow },
    80: { text: 'Slight rain showers', icon: CloudRain },
    81: { text: 'Moderate rain showers', icon: CloudRain },
    82: { text: 'Violent rain showers', icon: CloudRain },
    95: { text: 'Thunderstorm', icon: CloudRain },
  };
  return wmoMap[code] || { text: 'Unknown condition', icon: CloudSun };
};


const App = () => {
  const { t, i18n } = useTranslation(); // <-- 2. INITIALIZE THE HOOK

  const [location, setLocation] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tireRecommendation, setTireRecommendation] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // --- API KEYS ---
  const ACCUWEATHER_API_KEY = process.env.REACT_APP_ACCUWEATHER_API_KEY;
  const OPENWEATHER_API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY;

  const handleSearch = useCallback(async (e) => {
    e.preventDefault();
    if (!searchQuery) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResults(null);

    try {
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${searchQuery}&count=5&language=${i18n.language}&format=json`);
      if (!response.ok) throw new Error('Geocoding API failed');
      
      const data = await response.json();
      if (data.results) {
        setSearchResults(data.results);
      } else {
        setSearchError(t('cityNotFound'));
      }
    } catch (err) {
      console.error("Search failed:", err);
      setSearchError(t('searchError'));
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, t, i18n]);

  const handleLocationSelect = (selectedLocation) => {
    // Clear search UI
    setSearchQuery('');
    setSearchResults(null);
    setSearchError(null);
    // Fetch weather for the selected location
    fetchWeatherData(selectedLocation.latitude, selectedLocation.longitude);
  };

  const handleUseMyLocation = () => {
    // Clear search UI and use geolocation
    setSearchQuery('');
    setSearchResults(null);
    setSearchError(null);
    getUserLocation();
  };

  // --- 3. CREATE LANGUAGE TOGGLE FUNCTION ---
  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'uk' : 'en';
    i18n.changeLanguage(newLang);
  };

  const getTireRecommendation = useCallback((temperature) => {
    if (temperature > 10) {
      return {
        type: 'summer',
        message: t('summerTires'),
        color: 'bg-yellow-500',
        textColor: 'text-yellow-800',
        icon: Sun,
        description: t('summerTireDesc')
      };
    } else {
      return {
        type: 'winter',
        message: t('winterTires'),
        color: 'bg-blue-500',
        textColor: 'text-blue-100',
        icon: Snowflake,
        description: t('winterTireDesc')
      };
    }
  }, [t]); // Add `t` to dependency array

  // --- COMBINED FALLBACK FUNCTION (TIER 2) ---
  const fetchFallbackWeatherData = useCallback(async (lat, lon) => {
    console.log("AccuWeather failed. Attempting Tier 2 Fallback: Open-Meteo (Weather) + OWM (Location)...");

    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
    const owmGeocodingUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${OPENWEATHER_API_KEY}`;

    const [weatherResponse, geocodingResponse] = await Promise.all([
      fetch(openMeteoUrl),
      fetch(owmGeocodingUrl)
    ]);

    if (!weatherResponse.ok || !geocodingResponse.ok) {
      throw new Error('One or more fallback APIs failed.');
    }

    const weatherData = await weatherResponse.json();
    const geoData = await geocodingResponse.json();

    let locationName = `Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`;
    if (geoData && geoData.length > 0) {
      locationName = `${geoData[0].name}, ${geoData[0].country}`;
    }

    const temperatureC = weatherData.current.temperature_2m;
    const weatherCode = weatherData.current.weather_code;
    const { text: weatherText, icon: weatherIconComponent } = getWmoCodeDescription(weatherCode);

    const processedWeather = {
      temperature: temperatureC,
      condition: weatherText,
      iconComponent: weatherIconComponent,
      location: locationName,
      source: 'Fallback (Open-Meteo + OWM)'
    };

    setWeather(processedWeather);
    setTireRecommendation(getTireRecommendation(temperatureC));
    setLocation({ lat, lon });
    setError(null);
  }, [OPENWEATHER_API_KEY, getTireRecommendation]);


  // --- PRIMARY DATA FETCH FUNCTION (TIER 1) ---
  const fetchWeatherData = useCallback(async (lat, lon) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Attempting Tier 1: AccuWeather...");
      const locationResponse = await fetch(
        `https://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=${ACCUWEATHER_API_KEY}&q=${lat}%2C${lon}`
      );
      if (!locationResponse.ok) throw new Error('AccuWeather location fetch failed');
      
      const locationData = await locationResponse.json();
      const locationKey = locationData.Key;
      const locationName = `${locationData.EnglishName}, ${locationData.AdministrativeArea.EnglishName}`;
      
      const weatherResponse = await fetch(
        `https://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${ACCUWEATHER_API_KEY}&details=true`
      );
      if (!weatherResponse.ok) throw new Error('AccuWeather conditions fetch failed');
      
      const weatherData = await weatherResponse.json();
      const temperatureC = weatherData[0].Temperature.Metric.Value;
      const weatherText = weatherData[0].WeatherText;
      const icon = weatherData[0].WeatherIcon;
      
      const processedWeather = {
        temperature: temperatureC,
        condition: weatherText,
        icon: icon,
        location: locationName,
        source: 'AccuWeather'
      };
      
      setWeather(processedWeather);
      setTireRecommendation(getTireRecommendation(temperatureC));
      setLocation({ lat, lon });

    } catch (err) {
      console.error('Tier 1 (AccuWeather) Error:', err);
      try {
        await fetchFallbackWeatherData(lat, lon);
      } catch (fallbackErr) {
        console.error('Tier 2 (Fallback) also failed:', fallbackErr);
        setError(t('errorTitle'));
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFallbackWeatherData, getTireRecommendation, t]);

  const getUserLocation = useCallback(() => {
    setLoading(true);
    setError(null);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeatherData(latitude, longitude);
        },
        (err) => {
          setError(t('errorLocationServices'));
          setLoading(false);
        }
      );
    } else {
      setError(t('errorGeolocation'));
      setLoading(false);
    }
  }, [fetchWeatherData, t]);

  const refreshData = () => {
    if (location) {
      fetchWeatherData(location.lat, location.lon);
    }
  };

  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  const [darkMode, setDarkMode] = useState(false);
  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };
  
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') setDarkMode(true);
  }, []);
  
  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);
  
  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">{t('title')}</h1>
                    <p className="text-gray-600">{t('subtitle')}</p>
                  </div>
                  {/* ADD LANGUAGE AND DARK MODE BUTTONS */}
                  <div className="flex items-center space-x-2">
                    <button
                        onClick={toggleLanguage}
                        className="w-16 h-12 text-lg bg-white flex items-center justify-center px-4 py-3 rounded-2xl shadow-xl overflow-hidden"
                      >
                        {i18n.language === 'en' 
                            ? <img src="https://flagcdn.com/24x18/ua.png" alt="Ukrainian Flag" /> 
                            : <img src="https://flagcdn.com/24x18/gb.png" alt="British Flag" />
                        }
                    </button>
                    <button
                      onClick={toggleDarkMode}
                      className="w-16 h-12 text-lg bg-white flex items-center justify-center px-4 py-3 rounded-2xl shadow-xl overflow-hidden"
                    >
                      {darkMode ? '☀️' : '🌙'}
                  </button>
                  </div>
                </div>
              </div>

              <div className="mb-6 bg-white p-2 rounded-2xl shadow-lg">
                <form onSubmit={handleSearch} className="flex p-2 text-gray-800 items-center justify-between">
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchPlaceholder')}
                    className="flex max-set-w h-12 text-gray-800 border border-gray-50 rounded-2xl p-2 focus:outline-none"
                  />
                  <div className="flex items-center justify-between space-x-2">
                    <button 
                      type="submit" 
                      className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full" 
                      disabled={isSearching}
                    >
                      {isSearching ? <Loader className="animate-spin" /> : <Search />}
                    </button>
                    <button 
                      type="button" 
                      onClick={handleUseMyLocation} 
                      className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full" 
                      title={t('useMyLocation')}
                    >
                      <Map />
                    </button>
                  </div>
                </form>
                {searchError && <p className="text-red-500 mt-2 text-center">{searchError}</p>}
                {searchResults && (
                  <div className="mt-4 border-t pt-4">
                    <ul className="space-y-2">
                      {searchResults.map((result) => (
                        <li 
                          key={result.id} 
                          onClick={() => handleLocationSelect(result)}
                          className="p-3 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                        >
                          <p className="font-semibold text-gray-800">{result.name}, {result.admin1}</p>
                          <p className="text-sm text-gray-500">{result.country}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-6 h-6" />
                      <div>
                        <h2 className="text-xl font-semibold">{t('currentLocation')}</h2>
                        <p className="text-blue-100 text-sm">
                          {weather ? weather.location : t('detectingLocation')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={refreshData}
                      disabled={loading}
                      className="p-2 rounded-full hover:bg-opacity-30 transition-all duration-200 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                      <p className="text-gray-600">{t('fetchingWeather')}</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                      <p className="text-gray-700 mb-4">{error}</p>
                      <button
                        onClick={getUserLocation}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                      >
                        {t('tryAgainButton')}
                      </button>
                    </div>
                  ) : weather ? (
                    <>
                      <div className="flex items-center justify-center mb-6 text-gray-800">
                        {weather.source.includes('Fallback') && weather.iconComponent && (
                          React.createElement(weather.iconComponent, { className: "w-12 h-12 text-gray-700 mr-4" })
                        )}
                        {weather.source === 'AccuWeather' && (
                            <img src={`https://developer.accuweather.com/sites/default/files/${weather.icon < 10 ? '0' : ''}${weather.icon}-s.png`} alt={weather.condition} className="w-12 h-12 mr-4"/>
                        )}
                        <div className="flex items-center space-x-4">
                          <Thermometer className="w-12 h-12 text-red-500" />
                          <div>
                            <div className="text-5xl font-bold text-gray-800">
                              {Math.round(weather.temperature)}°C
                            </div>
                            <div className="text-gray-800">{weather.condition}</div>
                          </div>
                        </div>
                      </div>

                      {tireRecommendation && (
                        <div className="text-center mb-6">
                          <div className={`inline-flex items-center space-x-3 px-6 py-4 rounded-full ${tireRecommendation.color} ${tireRecommendation.textColor} bg-opacity-20`}>
                            <tireRecommendation.icon className="w-8 h-8" />
                            <span className="text-2xl font-bold">{tireRecommendation.message}</span>
                          </div>
                          <p className="text-gray-600 mt-3">{tireRecommendation.description}</p>
                        </div>
                      )}

                      <div className="bg-gray-50 rounded-xl p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('guidelinesTitle')}</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                            <span className="text-gray-800 font-medium">{t('guidelinesSummer')}</span>
                            <span className="text-gray-600">{t('guidelinesSummerTemp')}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                            <span className="text-gray-800 font-medium">{t('guidelinesWinter')}</span>
                            <span className="text-gray-600">{t('guidelinesWinterTemp')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-center">
                        <button
                          onClick={refreshData}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2 mx-auto"
                        >
                          <RefreshCw className="w-5 h-5" />
                          <span>{t('refreshButton')}</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <CloudSun className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">{t('waitingForLocation')}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center mt-8 text-gray-500 text-sm">
                <p>{t('poweredBy')}</p>
              </div>
            </div>
          </div>
          <div className="h-full flex flex-col justify-end items-center">
            <div className="text-center mt-6 text-gray-500 text-sm">
              <p>{t('developedBy')}</p>
              <div className="flex items-center space-x-10 p-3 rounded-full">
                <a href="https://github.com/coolatom" target="_blank" rel="noopener noreferrer" title="My page on GitHub">
                  <div className="p-2 rounded-full border-ua shadow-xl">
                    <Github className="w-5 h-5" />
                  </div>
                </a>
                <a href="https://www.linkedin.com/in/artemkucheriavyi" target="_blank" rel="noopener noreferrer" title="Artem Kucheriavyi profile on LinkedIn">
                  <div className="p-2 rounded-full border-ua border-blue-500 shadow-xl">
                    <Linkedin color="oklch(62.3% 0.214 259.815)" className="w-5 h-5" />
                  </div>
                </a>
                <a href="https://t.me/kartemo" target="_blank" rel="noopener noreferrer" title="Chat with me in Telegram">
                  <div className="p-2 rounded-full border-ua border-sky-500 shadow-xl">
                    <Send color="oklch(68.5% 0.169 237.323)" className="w-5 h-5" />
                  </div>
                </a>
                <a href="mailto:artemkucheriaviy@gmail.com?subject=Hello&body=I%20wanted%20to%20reach%20out%20about..." target="_blank" rel="noopener noreferrer" title="Or just send email to artemkucheriaviy@gmail.com">
                  <div className="p-2 rounded-full border-ua border-yellow-500 shadow-xl">
                    <AtSign color="oklch(79.5% 0.184 86.047)" className="w-5 h-5" />
                  </div>
                </a>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default App;