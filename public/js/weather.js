async function fetchWeather(cityQuery = null) {
    const cityInput = document.getElementById('weather-city-input');
    const city = cityQuery || (cityInput && cityInput.value) || 'São Paulo';

    try {
        const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
        const data = await res.json();

        document.getElementById('weather-city').textContent = data.city;
        document.getElementById('weather-desc').textContent = data.description;
        document.getElementById('weather-temp').textContent = `${data.temperature}°C`;
        document.getElementById('weather-apparent').textContent = `${data.apparentTemperature}°C`;
        document.getElementById('weather-humidity').textContent = `${data.humidity}%`;

        const forecastEl = document.getElementById('weather-forecast');
        forecastEl.innerHTML = '';

        if (data.forecast && data.forecast.length > 0) {
            data.forecast.forEach(f => {
                const dateObj = new Date(f.date + 'T00:00:00');
                const dayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' });

                const dayDiv = document.createElement('div');
                dayDiv.className = 'bg-white/10 rounded-lg p-1.5';
                dayDiv.innerHTML = `
          <p class="font-bold capitalize text-white">${dayName}</p>
          <p class="text-white/80">${f.max}° / ${f.min}°</p>
        `;
                forecastEl.appendChild(dayDiv);
            });
        }

        lucide.createIcons();
    } catch (err) {
        console.error('Erro ao buscar clima:', err);
    }
}