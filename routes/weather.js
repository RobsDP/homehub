const express = require('express');
const router = express.Router();

// Tabela WMO Weather Codes para descrição em português
const weatherCodeMap = {
    0: { label: 'Céu Limpo', icon: 'sun' },
    1: { label: 'Principalmente Limpo', icon: 'sun' },
    2: { label: 'Parcialmente Nublado', icon: 'cloud-sun' },
    3: { label: 'Nublado', icon: 'cloud' },
    45: { label: 'Nevoeiro', icon: 'cloud-fog' },
    48: { label: 'Nevoeiro com Geada', icon: 'cloud-fog' },
    51: { label: 'Garoa Leve', icon: 'cloud-drizzle' },
    53: { label: 'Garoa Moderada', icon: 'cloud-drizzle' },
    55: { label: 'Garoa Intensa', icon: 'cloud-drizzle' },
    61: { label: 'Chuva Fraca', icon: 'cloud-rain' },
    63: { label: 'Chuva Moderada', icon: 'cloud-rain' },
    65: { label: 'Chuva Forte', icon: 'cloud-rain' },
    80: { label: 'Pancadas de Chuva', icon: 'cloud-lightning' },
    95: { label: 'Tempestade', icon: 'cloud-lightning' }
};

router.get('/', async (req, res) => {
    const city = req.query.city || 'São Paulo';

    try {
        // 1. Obter latitude e longitude via Open-Meteo Geocoding
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=pt&format=json`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            return res.status(404).json({ error: 'Cidade não encontrada.' });
        }

        const { latitude, longitude, name, admin1 } = geoData.results[0];

        // 2. Buscar previsão do tempo atual e próximos 3 dias
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=4`;

        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();

        const current = weatherData.current;
        const daily = weatherData.daily;

        const weatherInfo = {
            city: `${name} - ${admin1 || ''}`,
            temperature: Math.round(current.temperature_2m),
            apparentTemperature: Math.round(current.apparent_temperature),
            humidity: current.relative_humidity_2m,
            windSpeed: current.wind_speed_10m,
            code: current.weather_code,
            description: weatherCodeMap[current.weather_code]?.label || 'Tempo Variável',
            icon: weatherCodeMap[current.weather_code]?.icon || 'sun',
            forecast: daily.time.slice(1, 4).map((date, idx) => ({
                date,
                max: Math.round(daily.temperature_2m_max[idx + 1]),
                min: Math.round(daily.temperature_2m_min[idx + 1]),
                code: daily.weather_code[idx + 1],
                description: weatherCodeMap[daily.weather_code[idx + 1]]?.label || 'Instável'
            }))
        };

        res.json(weatherInfo);
    } catch (error) {
        // Fallback gracioso em caso de ausência de internet ou timeout
        res.json({
            fallback: true,
            city: `${city} (Modo Offline)`,
            temperature: '--',
            apparentTemperature: '--',
            humidity: '--',
            windSpeed: '--',
            description: 'Sem conexão com serviço meteorológico',
            icon: 'cloud-off',
            forecast: []
        });
    }
});

module.exports = router;