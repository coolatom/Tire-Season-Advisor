// src/i18n.js
import i18next from 'i18next'; // Changed 'i18n' to 'i18next'
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "title": "Tire Season Advisor",
      "subtitle": "Get the right tire recommendation based on current weather",
      "currentLocation": "Current Location",
      "detectingLocation": "Detecting your location...",
      "summerTires": "Use Summer Tires",
      "winterTires": "Use Winter Tires",
      "summerTireDesc": "Temperature is above 10°C - Summer tires provide optimal performance",
      "winterTireDesc": "Temperature is 10°C or below - Winter tires ensure better traction",
      "guidelinesTitle": "Tire Selection Guidelines",
      "guidelinesSummer": "Summer Tires",
      "guidelinesWinter": "Winter Tires",
      "guidelinesSummerTemp": "Temperature above 10°C",
      "guidelinesWinterTemp": "Temperature 10°C or below",
      "refreshButton": "Refresh Weather Data",
      "waitingForLocation": "Waiting for location data...",
      "fetchingWeather": "Fetching weather data...",
      "errorTitle": "Failed to fetch weather data from all available sources.",
      "errorLocationServices": "Unable to get your location. Please enable location services.",
      "errorGeolocation": "Geolocation is not supported by your browser.",
      "tryAgainButton": "Try Again",
      "lightMode": "☀️ Light",
      "darkMode": "🌙 Dark",
      "developedBy": "Developed by CoolAtom",
      "poweredBy": "Powered by AccuWeather & Open-Meteo + OpenWeather • Make sure to check local weather conditions and road regulations",
      "searchPlaceholder": "Search for a city...",
      "searchButton": "Search",
      "useMyLocation": "Use My Location",
      "cityNotFound": "City not found. Please try another name.",
      "searchError": "Could not perform search. Please try again.",
    }
  },
  uk: {
    translation: {
      "title": "Порадник сезонних шин",
      "subtitle": "Рекомендації щодо використання шин на основі поточної погоди",
      "currentLocation": "Поточне місцезнаходження",
      "detectingLocation": "Визначення вашого місцезнаходження...",
      "summerTires": "Використовуйте літні шини",
      "winterTires": "Використовуйте зимові шини",
      "summerTireDesc": "Температура вище 10°C - літні шини забезпечують оптимальну продуктивність",
      "winterTireDesc": "Температура 10°C або нижче - зимові шини забезпечують краще зчеплення",
      "guidelinesTitle": "Правила вибору шин",
      "guidelinesSummer": "Літні шини",
      "guidelinesWinter": "Зимові шини",
      "guidelinesSummerTemp": "Температура вище 10°C",
      "guidelinesWinterTemp": "Температура 10°C або нижче",
      "refreshButton": "Оновити дані про погоду",
      "waitingForLocation": "Очікування даних про місцезнаходження...",
      "fetchingWeather": "Отримання даних про погоду...",
      "errorTitle": "Не вдалося отримати дані про погоду з жодних із доступних джерел.",
      "errorLocationServices": "Неможливо отримати ваше місцезнаходження. Увімкніть геолокацію на пристрої.",
      "errorGeolocation": "Геолокація не підтримується вашим браузером.",
      "tryAgainButton": "Спробувати ще",
      "lightMode": "☀️ Світла",
      "darkMode": "🌙 Темна",
      "developedBy": "Розроблено CoolAtom",
      "poweredBy": "На основі AccuWeather та Open-Meteo + OpenWeather • Перевіряйте місцеві погодні умови та правила дорожнього руху",
      "searchPlaceholder": "Пошук міста...",
      "searchButton": "Пошук",
      "useMyLocation": "Моє місцезнаходження",
      "cityNotFound": "Місто не знайдено. Спробуйте іншу назву.",
      "searchError": "Не вдалося виконати пошук. Спробуйте ще раз.",
    }
  }
};

i18next // Changed 'i18n' to 'i18next'
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18next; // Changed 'i18n' to 'i18next'