// Initialize Lucide icons
lucide.createIcons();

// DOM Elements
const dateDisplay = document.getElementById('date-display');
const temperatureDisplay = document.getElementById('temperature');
const weatherIcon = document.getElementById('weather-icon');
const weatherText = document.getElementById('weather-text');
const precipProbDisplay = document.getElementById('precip-prob');
const humidityDisplay = document.getElementById('humidity');
const windSpeedDisplay = document.getElementById('wind-speed');
const hourlyInfoRow = document.getElementById('hourly-info-row');
const dailyList = document.getElementById('daily-list');
const refreshBtn = document.getElementById('refresh-btn');
const refreshIcon = document.getElementById('refresh-icon');
const citySelect = document.getElementById('city-select');
const openGlobeBtn = document.getElementById('open-globe-btn');
const closeGlobeBtn = document.getElementById('close-globe-btn');
const globeModal = document.getElementById('globe-modal');
const globeContainer = document.getElementById('globe-container');

const localTimeDisplay = document.getElementById('local-time-display');
const japanTimeDisplay = document.getElementById('japan-time-display');
let clockInterval;

let hourlyChartInstance = null;

// City Coordinates map
const CITIES = {
    sapporo: { lat: 43.0621, lon: 141.3544, tz: 'Asia/Tokyo' },
    sendai: { lat: 38.2682, lon: 140.8694, tz: 'Asia/Tokyo' },
    tokyo: { lat: 35.6895, lon: 139.6917, tz: 'Asia/Tokyo' },
    nagoya: { lat: 35.1815, lon: 136.9066, tz: 'Asia/Tokyo' },
    osaka: { lat: 34.6937, lon: 135.5023, tz: 'Asia/Tokyo' },
    hiroshima: { lat: 34.3853, lon: 132.4553, tz: 'Asia/Tokyo' },
    fukuoka: { lat: 33.5902, lon: 130.4017, tz: 'Asia/Tokyo' },
    naha: { lat: 26.2124, lon: 127.6809, tz: 'Asia/Tokyo' },
    new_york: { lat: 40.7128, lon: -74.0060, tz: 'America/New_York' },
    london: { lat: 51.5074, lon: -0.1278, tz: 'Europe/London' },
    paris: { lat: 48.8566, lon: 2.3522, tz: 'Europe/Paris' },
    sydney: { lat: -33.8688, lon: 151.2093, tz: 'Australia/Sydney' },
    beijing: { lat: 39.9042, lon: 116.4074, tz: 'Asia/Shanghai' },
    cairo: { lat: 30.0444, lon: 31.2357, tz: 'Africa/Cairo' },
    rio: { lat: -22.9068, lon: -43.1729, tz: 'America/Sao_Paulo' },
    moscow: { lat: 55.7558, lon: 37.6173, tz: 'Europe/Moscow' },
    mumbai: { lat: 19.0760, lon: 72.8777, tz: 'Asia/Kolkata' }
};

let currentLat = CITIES.hiroshima.lat;
let currentLon = CITIES.hiroshima.lon;
let currentTz = CITIES.hiroshima.tz;

let myGlobe = null;

// Globe Functions
function initGlobe() {
    if (myGlobe) return; // Initialize only once
    
    // Prepare data
    const gData = Object.keys(CITIES).map(key => {
        const city = CITIES[key];
        const option = Array.from(citySelect.options).find(opt => opt.value === key);
        return {
            id: key,
            lat: city.lat,
            lng: city.lon,
            name: option ? option.text : key,
            tz: city.tz
        };
    });

    myGlobe = Globe()(globeContainer)
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
        .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
        .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
        .htmlElementsData(gData)
        .htmlElement(d => {
            const el = document.createElement('div');
            el.innerHTML = `
                <div style="width: 8px; height: 8px; background: rgba(255, 255, 255, 0.9); border-radius: 50%; margin: 0 auto; box-shadow: 0 0 6px rgba(0,0,0,0.8);"></div>
                <div style="color: white; font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 600; text-shadow: 0 2px 6px rgba(0,0,0,0.9); white-space: nowrap; margin-top: 4px;">${d.name}</div>
            `;
            el.style.display = 'flex';
            el.style.flexDirection = 'column';
            el.style.alignItems = 'center';
            el.style.transform = 'translate(-50%, -4px)'; // Center the dot on the coordinate
            el.style.cursor = 'pointer';
            el.style.pointerEvents = 'auto';
            el.onclick = () => {
                currentLat = d.lat;
                currentLon = d.lng;
                currentTz = d.tz;
                citySelect.value = d.id;
                fetchWeather();
                updateClocks();
                closeGlobe();
            };
            return el;
        });

    // Handle resize
    window.addEventListener('resize', () => {
        if (!globeModal.classList.contains('hidden') && myGlobe) {
            myGlobe.width(window.innerWidth).height(window.innerHeight);
        }
    });
    
    // Initial resize to fit screen
    myGlobe.width(window.innerWidth).height(window.innerHeight);
    
    // Set initial point of view (Zoom in to about double size)
    myGlobe.pointOfView({ lat: currentLat, lng: currentLon, altitude: 0.6 });
}

function openGlobe() {
    globeModal.classList.remove('hidden');
    // Delay slightly to ensure container is visible before sizing
    setTimeout(() => {
        if (!myGlobe) {
            initGlobe();
        } else {
            myGlobe.width(window.innerWidth).height(window.innerHeight);
        }
        myGlobe.pointOfView({ lat: currentLat, lng: currentLon, altitude: 0.6 }, 1000);
    }, 50);
}

function closeGlobe() {
    globeModal.classList.add('hidden');
}

// Clock Functions
function updateClocks() {
    const now = new Date();
    
    // Local Time
    const localOptions = { timeZone: currentTz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    localTimeDisplay.textContent = new Intl.DateTimeFormat('ja-JP', localOptions).format(now);
    
    // Japan Time
    const jpOptions = { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    japanTimeDisplay.textContent = `日本時間: ${new Intl.DateTimeFormat('ja-JP', jpOptions).format(now)}`;
}

function startClocks() {
    if (clockInterval) clearInterval(clockInterval);
    updateClocks();
    clockInterval = setInterval(updateClocks, 1000);
}

// Set current date (Japan Time)
function setDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    // Use Japanese locale
    dateDisplay.textContent = today.toLocaleDateString('ja-JP', options);
}

// Weather Code Mapping (WMO Weather interpretation codes)
function getWeatherCondition(code) {
    const conditions = {
        0: { text: '快晴', icon: 'sun', colors: ['#4facfe', '#00f2fe'] },
        1: { text: '晴れ', icon: 'sun', colors: ['#4facfe', '#00f2fe'] },
        2: { text: '一部曇り', icon: 'cloud-sun', colors: ['#6a85b6', '#bac8e0'] },
        3: { text: '曇り', icon: 'cloud', colors: ['#8e9eab', '#eef2f3'] },
        45: { text: '霧', icon: 'cloud-fog', colors: ['#757f9a', '#d7dde8'] },
        48: { text: '霧氷', icon: 'cloud-fog', colors: ['#757f9a', '#d7dde8'] },
        51: { text: '小雨（霧雨）', icon: 'cloud-drizzle', colors: ['#3a7bd5', '#3a6073'] },
        53: { text: '雨（霧雨）', icon: 'cloud-drizzle', colors: ['#3a7bd5', '#3a6073'] },
        55: { text: '大雨（霧雨）', icon: 'cloud-drizzle', colors: ['#3a7bd5', '#3a6073'] },
        56: { text: '弱い氷雨', icon: 'cloud-hail', colors: ['#1e3c72', '#2a5298'] },
        57: { text: '強い氷雨', icon: 'cloud-hail', colors: ['#1e3c72', '#2a5298'] },
        61: { text: '小雨', icon: 'cloud-rain', colors: ['#2b5876', '#4e4376'] },
        63: { text: '雨', icon: 'cloud-rain', colors: ['#2b5876', '#4e4376'] },
        65: { text: '大雨', icon: 'cloud-rain', colors: ['#2b5876', '#4e4376'] },
        66: { text: '弱い氷雨', icon: 'cloud-hail', colors: ['#1e3c72', '#2a5298'] },
        67: { text: '強い氷雨', icon: 'cloud-hail', colors: ['#1e3c72', '#2a5298'] },
        71: { text: '小雪', icon: 'snowflake', colors: ['#e0eafc', '#cfdef3'] },
        73: { text: '雪', icon: 'snowflake', colors: ['#e0eafc', '#cfdef3'] },
        75: { text: '大雪', icon: 'snowflake', colors: ['#e0eafc', '#cfdef3'] },
        77: { text: '風花', icon: 'snowflake', colors: ['#e0eafc', '#cfdef3'] },
        80: { text: 'にわか雨', icon: 'cloud-showers-heavy', colors: ['#141E30', '#243B55'] },
        81: { text: '激しいにわか雨', icon: 'cloud-showers-heavy', colors: ['#141E30', '#243B55'] },
        82: { text: '猛烈なにわか雨', icon: 'cloud-showers-heavy', colors: ['#141E30', '#243B55'] },
        85: { text: '軽いにわか雪', icon: 'cloud-snow', colors: ['#8e9eab', '#eef2f3'] },
        86: { text: '激しいにわか雪', icon: 'cloud-snow', colors: ['#8e9eab', '#eef2f3'] },
        95: { text: '雷雨', icon: 'cloud-lightning', colors: ['#141E30', '#243B55'] },
        96: { text: '雷雨（雹を伴う）', icon: 'cloud-lightning', colors: ['#141E30', '#243B55'] },
        99: { text: '激しい雷雨（雹を伴う）', icon: 'cloud-lightning', colors: ['#141E30', '#243B55'] },
    };

    return conditions[code] || { text: '不明', icon: 'help-circle', colors: ['#4facfe', '#00f2fe'] };
}

// Update background gradient based on weather condition
function updateBackground(colors) {
    document.documentElement.style.setProperty('--bg-gradient-start', colors[0]);
    document.documentElement.style.setProperty('--bg-gradient-end', colors[1]);
}

// Update Season Class
function updateSeason() {
    const urlParams = new URLSearchParams(window.location.search);
    const forceSeason = urlParams.get('season');
    const month = new Date().getMonth() + 1; // 1-12
    let seasonClass = '';

    if (forceSeason) {
        seasonClass = `season-${forceSeason}`;
    } else if (month >= 3 && month <= 5) {
        seasonClass = 'season-spring';
    } else if (month >= 6 && month <= 8) {
        seasonClass = 'season-summer';
    } else if (month >= 9 && month <= 11) {
        seasonClass = 'season-autumn';
    } else {
        seasonClass = 'season-winter';
    }

    // Remove previous seasons
    document.body.classList.remove('season-spring', 'season-summer', 'season-autumn', 'season-winter');
    // Add current season
    document.body.classList.add(seasonClass);
}

// Fetch weather data
async function fetchWeather() {
    try {
        refreshIcon.classList.add('spin');

        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${currentLat}&longitude=${currentLon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=14&timezone=Asia%2FTokyo`);

        if (!response.ok) {
            throw new Error('Weather data fetch failed');
        }

        const data = await response.json();
        const current = data.current;

        // Update UI
        temperatureDisplay.textContent = Math.round(current.temperature_2m);
        if (data.daily && data.daily.precipitation_probability_max) {
            precipProbDisplay.textContent = `${data.daily.precipitation_probability_max[0]}%`;
        } else {
            precipProbDisplay.textContent = '--%';
        }
        humidityDisplay.textContent = `${current.relative_humidity_2m}%`;
        windSpeedDisplay.textContent = `${current.wind_speed_10m}m/s`;

        const condition = getWeatherCondition(current.weather_code);
        weatherText.textContent = condition.text;

        // Update Icon
        weatherIcon.setAttribute('data-lucide', condition.icon);
        lucide.createIcons();

        // Update Background
        updateBackground(condition.colors);

        // Update Hourly Forecast (next 12 hours)
        updateHourlyForecast(data.hourly);

        // Update Daily Forecast (14 days)
        if (data.daily) {
            updateDailyForecast(data.daily);
        }

    } catch (error) {
        console.error('Error fetching weather:', error);
        weatherText.textContent = '取得エラー';
    } finally {
        setTimeout(() => {
            refreshIcon.classList.remove('spin');
        }, 500); // Give the spin animation time to show at least once
    }
}

// Update Hourly Forecast UI
function updateHourlyForecast(hourlyData) {
    hourlyInfoRow.innerHTML = '';

    // Find current hour index
    const now = new Date();
    const currentHourString = now.toISOString().slice(0, 13) + ':00'; // Format: "YYYY-MM-DDTHH:00"

    // Fallback: if we can't find the exact hour, we just start from index 0 or use current hour from device
    let startIndex = 0;
    const currentHourNum = now.getHours();

    // Open-Meteo returns data starting from 00:00 of the requested day
    // We can just calculate the index based on the current hour
    startIndex = currentHourNum;

    // Display next 12 hours
    const hoursToShow = 12;

    const labels = [];
    const temps = [];

    for (let i = startIndex; i < startIndex + hoursToShow && i < hourlyData.time.length; i++) {
        const timeString = hourlyData.time[i];
        const dateObj = new Date(timeString);
        const hours = dateObj.getHours();

        // Format time (e.g., "14:00")
        const formattedTime = `${hours.toString().padStart(2, '0')}:00`;
        const timeLabel = i === startIndex ? '現在' : formattedTime;
        const temp = Math.round(hourlyData.temperature_2m[i]);
        const code = hourlyData.weather_code[i];
        const precipProb = hourlyData.precipitation_probability[i];
        const iconName = getWeatherCondition(code).icon;

        labels.push(timeLabel);
        temps.push(temp);

        // Create HTML elements for icons and probability
        const itemDiv = document.createElement('div');
        itemDiv.className = 'hourly-info-item';

        itemDiv.innerHTML = `
            <span class="hourly-time">${timeLabel}</span>
            <i data-lucide="${iconName}" class="hourly-item-icon"></i>
            <span class="hourly-precip">${precipProb}%</span>
            <span class="hourly-temp" style="opacity: 0;">${temp}°</span> <!-- Placeholder for spacing if needed, but not used since we have chart -->
        `;

        hourlyInfoRow.appendChild(itemDiv);
    }

    // Re-initialize icons for newly added elements
    lucide.createIcons();

    // Setup or Update Chart.js
    const canvas = document.getElementById('hourly-chart');
    const ctx = canvas.getContext('2d');

    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, 100);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

    if (hourlyChartInstance) {
        // Update existing chart
        hourlyChartInstance.data.labels = labels;
        hourlyChartInstance.data.datasets[0].data = temps;
        hourlyChartInstance.options.scales.y.suggestedMin = Math.min(...temps) - 2;
        hourlyChartInstance.options.scales.y.suggestedMax = Math.max(...temps) + 2;
        hourlyChartInstance.update();
    } else {
        // Create new chart
        Chart.defaults.color = 'rgba(255, 255, 255, 0.8)';
        Chart.defaults.font.family = "'Outfit', sans-serif";

        hourlyChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '気温',
                    data: temps,
                    borderColor: 'rgba(255, 255, 255, 1)',
                    backgroundColor: gradient,
                    borderWidth: 3,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: 'rgba(255, 255, 255, 1)',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    fill: true,
                    tension: 0.4 // Smooth curve
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        displayColors: false,
                        callbacks: {
                            label: function (context) {
                                return context.parsed.y + '°C';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: false, // Hide x-axis labels because we have custom HTML above
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        display: false, // Hide y-axis
                        suggestedMin: Math.min(...temps) - 2,
                        suggestedMax: Math.max(...temps) + 2,
                        grid: {
                            display: false
                        }
                    }
                },
                layout: {
                    padding: {
                        top: 50, /* Make room for the HTML row above */
                        bottom: 10,
                        left: 0,
                        right: 0
                    }
                },
                animation: {
                    duration: 800,
                    easing: 'easeOutQuart'
                }
            },
            plugins: [{
                // Custom plugin to draw the temperature text on top of points
                id: 'pointText',
                afterDatasetsDraw: function (chart) {
                    const ctx = chart.ctx;
                    chart.data.datasets.forEach((dataset, i) => {
                        const meta = chart.getDatasetMeta(i);
                        if (!meta.hidden) {
                            meta.data.forEach((element, index) => {
                                // Draw the text
                                const dataString = dataset.data[index].toString() + '°';
                                ctx.fillStyle = '#ffffff';
                                const fontSize = 14;
                                const fontStyle = 'bold';
                                const fontFamily = "'Outfit', sans-serif";
                                ctx.font = Chart.helpers.fontString(fontSize, fontStyle, fontFamily);
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'bottom';
                                ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                                ctx.shadowBlur = 4;
                                ctx.shadowOffsetX = 0;
                                ctx.shadowOffsetY = 1;

                                const position = element.tooltipPosition();
                                ctx.fillText(dataString, position.x, position.y - 8);

                                // Reset shadow
                                ctx.shadowBlur = 0;
                                ctx.shadowOffsetX = 0;
                                ctx.shadowOffsetY = 0;
                            });
                        }
                    });
                }
            }]
        });
    }
}

// Update Daily Forecast UI
function updateDailyForecast(dailyData) {
    dailyList.innerHTML = '';

    // Day names in Japanese
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

    for (let i = 0; i < dailyData.time.length; i++) {
        const timeString = dailyData.time[i];
        const dateObj = new Date(timeString);

        // Format date (e.g., "2/22")
        const month = dateObj.getMonth() + 1;
        const date = dateObj.getDate();
        const formattedDate = `${month}/${date}`;

        // Format day name
        const dayName = i === 0 ? '今日' : i === 1 ? '明日' : `${dayNames[dateObj.getDay()]}曜日`;

        const tempMax = Math.round(dailyData.temperature_2m_max[i]);
        const tempMin = Math.round(dailyData.temperature_2m_min[i]);
        const code = dailyData.weather_code[i];
        const precipProb = dailyData.precipitation_probability_max[i];
        const iconName = getWeatherCondition(code).icon;

        // Create HTML elements
        const itemDiv = document.createElement('div');
        itemDiv.className = 'daily-item';

        itemDiv.innerHTML = `
            <div class="daily-date">
                <span class="daily-day-name">${dayName}</span>
                <span class="daily-day-date">${formattedDate}</span>
            </div>
            <div class="daily-precip">${precipProb}%</div>
            <i data-lucide="${iconName}" class="daily-item-icon"></i>
            <div class="daily-temps">
                <span class="daily-temp-max">${tempMax}°</span>
                <span class="daily-temp-min">${tempMin}°</span>
            </div>
        `;

        dailyList.appendChild(itemDiv);
    }

    // Re-initialize icons for newly added elements
    lucide.createIcons();
}

// Initialize
function init() {
    setDate();
    startClocks();
    fetchWeather();
}

// Event Listeners
refreshBtn.addEventListener('click', fetchWeather);
citySelect.addEventListener('change', (e) => {
    const city = CITIES[e.target.value];
    if (city) {
        currentLat = city.lat;
        currentLon = city.lon;
        currentTz = city.tz;
        fetchWeather();
        updateClocks();
    }
});
openGlobeBtn.addEventListener('click', openGlobe);
closeGlobeBtn.addEventListener('click', closeGlobe);

// Run on load
document.addEventListener('DOMContentLoaded', () => {
    updateSeason();
    init();
});
