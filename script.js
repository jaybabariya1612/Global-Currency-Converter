// DOM Elements
const amountInput = document.getElementById('amount');
const fromCurrencySelect = document.getElementById('from-currency');
const toCurrencySelect = document.getElementById('to-currency');
const convertBtn = document.querySelector('.convert-btn');
const swapBtn = document.querySelector('.swap-btn');
const clearBtn = document.querySelector('.clear-btn');
const amountDisplay = document.querySelector('.amount-display');
const fromCurrencyCode = document.querySelector('.from-currency-code');
const convertedAmount = document.querySelector('.converted-amount');
const toCurrencyCode = document.querySelector('.to-currency-code');
const rateInfo = document.querySelector('.rate-info span');
const inverseRate = document.querySelector('.inverse-rate');
const popularPairs = document.querySelectorAll('.popular-pair');
const detailsBtn = document.querySelector('.details-btn');
const historicalChart = document.querySelector('.historical-chart');
const closeChart = document.querySelector('.close-chart');
const timePeriods = document.querySelectorAll('.time-period');
const chartCanvas = document.getElementById('historyChart');
const saveFavoriteBtn = document.querySelector('.save-favorite');
const favoritesList = document.querySelector('.favorites-list');
const printAllRatesBtn = document.querySelector('.print-all-rates');
const viewAllCurrenciesBtn = document.querySelector('.view-all-currencies');
const allCurrenciesModal = document.querySelector('.all-currencies-modal');
const closeModalBtn = document.querySelector('.close-modal');
const currenciesGrid = document.querySelector('.currencies-grid');
const currencySearch = document.getElementById('currency-search');
const overlay = document.createElement('div');
overlay.className = 'overlay';
document.body.appendChild(overlay);

// API Configuration
const BASE_URL = 'https://api.frankfurter.app';
let chartInstance = null;
let favorites = JSON.parse(localStorage.getItem('currencyFavorites')) || [];

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    populateCurrencyDropdowns();
    updateExchangeRate();
    renderFavorites();
    renderAllCurrencies();
    
    // Set initial popular pairs
    fromCurrencyCode.textContent = fromCurrencySelect.value;
    toCurrencyCode.textContent = toCurrencySelect.value;
    
    // Check if current pair is favorite
    checkFavoriteStatus();
});

// Event Listeners
amountInput.addEventListener('input', () => {
    if (amountInput.value < 0) amountInput.value = 0;
    updateExchangeRate();
});

fromCurrencySelect.addEventListener('change', () => {
    updateFlag(fromCurrencySelect, document.querySelector('.from-currency .flag'));
    fromCurrencyCode.textContent = fromCurrencySelect.value;
    updateExchangeRate();
    checkFavoriteStatus();
});

toCurrencySelect.addEventListener('change', () => {
    updateFlag(toCurrencySelect, document.querySelector('.to-currency .flag'));
    toCurrencyCode.textContent = toCurrencySelect.value;
    updateExchangeRate();
    checkFavoriteStatus();
});

convertBtn.addEventListener('click', (e) => {
    e.preventDefault();
    convertBtn.classList.add('animate__animated', 'animate__pulse');
    setTimeout(() => {
        convertBtn.classList.remove('animate__animated', 'animate__pulse');
    }, 1000);
    updateExchangeRate();
});

swapBtn.addEventListener('click', () => {
    swapBtn.classList.add('animate__animated', 'animate__rotateIn');
    setTimeout(() => {
        swapBtn.classList.remove('animate__animated', 'animate__rotateIn');
    }, 1000);
    
    const temp = fromCurrencySelect.value;
    fromCurrencySelect.value = toCurrencySelect.value;
    toCurrencySelect.value = temp;
    
    updateFlag(fromCurrencySelect, document.querySelector('.from-currency .flag'));
    updateFlag(toCurrencySelect, document.querySelector('.to-currency .flag'));
    
    fromCurrencyCode.textContent = fromCurrencySelect.value;
    toCurrencyCode.textContent = toCurrencySelect.value;
    
    updateExchangeRate();
    checkFavoriteStatus();
});

clearBtn.addEventListener('click', () => {
    amountInput.value = '';
    amountInput.focus();
});

popularPairs.forEach(pair => {
    pair.addEventListener('click', () => {
        const from = pair.getAttribute('data-from');
        const to = pair.getAttribute('data-to');
        
        fromCurrencySelect.value = from;
        toCurrencySelect.value = to;
        
        updateFlag(fromCurrencySelect, document.querySelector('.from-currency .flag'));
        updateFlag(toCurrencySelect, document.querySelector('.to-currency .flag'));
        
        fromCurrencyCode.textContent = from;
        toCurrencyCode.textContent = to;
        
        updateExchangeRate();
        checkFavoriteStatus();
    });
});

detailsBtn.addEventListener('click', () => {
    historicalChart.classList.remove('hidden');
    overlay.classList.add('show');
    loadHistoricalData(7); // Default to 7 days
});

closeChart.addEventListener('click', () => {
    historicalChart.classList.add('hidden');
    overlay.classList.remove('show');
});

timePeriods.forEach(period => {
    period.addEventListener('click', () => {
        timePeriods.forEach(p => p.classList.remove('active'));
        period.classList.add('active');
        const days = parseInt(period.getAttribute('data-days'));
        loadHistoricalData(days);
    });
});

saveFavoriteBtn.addEventListener('click', () => {
    const fromCurrency = fromCurrencySelect.value;
    const toCurrency = toCurrencySelect.value;
    const pair = `${fromCurrency}_${toCurrency}`;
    
    const isFavorite = favorites.includes(pair);
    
    if (isFavorite) {
        // Remove from favorites
        favorites = favorites.filter(item => item !== pair);
        saveFavoriteBtn.classList.remove('active');
    } else {
        // Add to favorites
        favorites.push(pair);
        saveFavoriteBtn.classList.add('active');
    }
    
    localStorage.setItem('currencyFavorites', JSON.stringify(favorites));
    renderFavorites();
});

printAllRatesBtn.addEventListener('click', () => {
    generateAllRatesPDF();
});

viewAllCurrenciesBtn.addEventListener('click', () => {
    allCurrenciesModal.classList.add('show');
    overlay.classList.add('show');
});

closeModalBtn.addEventListener('click', () => {
    allCurrenciesModal.classList.remove('show');
    overlay.classList.remove('show');
});

overlay.addEventListener('click', () => {
    historicalChart.classList.add('hidden');
    allCurrenciesModal.classList.remove('show');
    overlay.classList.remove('show');
});

currencySearch.addEventListener('input', () => {
    const searchTerm = currencySearch.value.toLowerCase();
    const currencyCards = document.querySelectorAll('.currency-card');
    
    currencyCards.forEach(card => {
        const code = card.querySelector('.currency-code').textContent.toLowerCase();
        const name = card.querySelector('.currency-name').textContent.toLowerCase();
        
        if (code.includes(searchTerm) || name.includes(searchTerm)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
});

// Functions
function populateCurrencyDropdowns() {
    for (const currencyCode in countryList) {
        // From currency dropdown
        const fromOption = document.createElement('option');
        fromOption.value = currencyCode;
        fromOption.textContent = currencyCode;
        if (currencyCode === 'USD') fromOption.selected = true;
        fromCurrencySelect.appendChild(fromOption);
        
        // To currency dropdown
        const toOption = document.createElement('option');
        toOption.value = currencyCode;
        toOption.textContent = currencyCode;
        if (currencyCode === 'INR') toOption.selected = true;
        toCurrencySelect.appendChild(toOption);
    }
}

function updateFlag(selectElement, flagImage) {
    const currencyCode = selectElement.value;
    const countryCode = countryList[currencyCode];
    if (countryCode) {
        flagImage.src = `https://flagsapi.com/${countryCode}/flat/64.png`;
        flagImage.alt = `${currencyCode} flag`;
        flagImage.style.display = 'block';
    } else {
        flagImage.style.display = 'none';
    }
}

async function updateExchangeRate() {
    const amount = parseFloat(amountInput.value) || 1;
    const fromCurrency = fromCurrencySelect.value;
    const toCurrency = toCurrencySelect.value;
    
    if (fromCurrency === toCurrency) {
        convertedAmount.textContent = amount.toFixed(2);
        rateInfo.textContent = `1 ${fromCurrency} = 1 ${toCurrency}`;
        inverseRate.textContent = `1 ${toCurrency} = 1 ${fromCurrency}`;
        return;
    }
    
    try {
        const response = await fetch(`${BASE_URL}/latest?from=${fromCurrency}&to=${toCurrency}`);
        const data = await response.json();
        
        const rate = data.rates[toCurrency];
        const convertedValue = amount * rate;
        
        amountDisplay.textContent = amount.toFixed(2);
        convertedAmount.textContent = convertedValue.toFixed(2);
        rateInfo.textContent = `1 ${fromCurrency} = ${rate.toFixed(6)} ${toCurrency}`;
        inverseRate.textContent = `1 ${toCurrency} = ${(1 / rate).toFixed(6)} ${fromCurrency}`;
        
        // Animate result
        const resultSection = document.querySelector('.result-section');
        resultSection.classList.add('animate__animated', 'animate__fadeIn');
        setTimeout(() => {
            resultSection.classList.remove('animate__animated', 'animate__fadeIn');
        }, 1000);
    } catch (error) {
        console.error('Error fetching exchange rate:', error);
        convertedAmount.textContent = 'Error';
        rateInfo.textContent = 'Could not fetch exchange rate';
        inverseRate.textContent = '';
    }
}

async function loadHistoricalData(days) {
    const fromCurrency = fromCurrencySelect.value;
    const toCurrency = toCurrencySelect.value;
    
    if (fromCurrency === toCurrency) {
        // Don't show chart for same currency
        if (chartInstance) chartInstance.destroy();
        chartCanvas.innerHTML = '<p class="text-center">Cannot show history for same currency</p>';
        return;
    }
    
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);
        
        const formattedStartDate = formatDate(startDate);
        const formattedEndDate = formatDate(endDate);
        
        const response = await fetch(
            `${BASE_URL}/${formattedStartDate}..${formattedEndDate}?from=${fromCurrency}&to=${toCurrency}`
        );
        const data = await response.json();
        
        renderHistoryChart(data, fromCurrency, toCurrency);
    } catch (error) {
        console.error('Error fetching historical data:', error);
        if (chartInstance) chartInstance.destroy();
        chartCanvas.innerHTML = '<p class="text-center">Error loading historical data</p>';
    }
}

function renderHistoryChart(data, fromCurrency, toCurrency) {
    const dates = Object.keys(data.rates);
    const rates = dates.map(date => data.rates[date][toCurrency]);
    
    // Prepare chart data
    const chartData = {
        labels: dates,
        datasets: [{
            label: `${fromCurrency} to ${toCurrency}`,
            data: rates,
            borderColor: '#4361ee',
            backgroundColor: 'rgba(67, 97, 238, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true
        }]
    };
    
    // Chart configuration
    const config = {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Exchange Rate History (${fromCurrency} to ${toCurrency})`,
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `1 ${fromCurrency} = ${context.parsed.y.toFixed(6)} ${toCurrency}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    grid: {
                        color: '#e9ecef'
                    }
                }
            }
        }
    };
    
    // Destroy previous chart instance if exists
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    // Create new chart
    chartInstance = new Chart(chartCanvas, config);
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function renderFavorites() {
    favoritesList.innerHTML = '';
    
    favorites.forEach(pair => {
        const [fromCurrency, toCurrency] = pair.split('_');
        const favoriteItem = document.createElement('div');
        favoriteItem.className = 'favorite-item';
        favoriteItem.innerHTML = `
            ${fromCurrency} → ${toCurrency}
            <button class="remove-favorite" data-pair="${pair}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        favoriteItem.addEventListener('click', () => {
            fromCurrencySelect.value = fromCurrency;
            toCurrencySelect.value = toCurrency;
            
            updateFlag(fromCurrencySelect, document.querySelector('.from-currency .flag'));
            updateFlag(toCurrencySelect, document.querySelector('.to-currency .flag'));
            
            fromCurrencyCode.textContent = fromCurrency;
            toCurrencyCode.textContent = toCurrency;
            
            updateExchangeRate();
            checkFavoriteStatus();
        });
        
        const removeBtn = favoriteItem.querySelector('.remove-favorite');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            favorites = favorites.filter(item => item !== pair);
            localStorage.setItem('currencyFavorites', JSON.stringify(favorites));
            renderFavorites();
            checkFavoriteStatus();
        });
        
        favoritesList.appendChild(favoriteItem);
    });
}

function checkFavoriteStatus() {
    const fromCurrency = fromCurrencySelect.value;
    const toCurrency = toCurrencySelect.value;
    const pair = `${fromCurrency}_${toCurrency}`;
    
    if (favorites.includes(pair)) {
        saveFavoriteBtn.classList.add('active');
    } else {
        saveFavoriteBtn.classList.remove('active');
    }
}

async function generateAllRatesPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const fromCurrency = fromCurrencySelect.value;
    const date = new Date().toLocaleDateString();
    
    // Add title
    doc.setFontSize(18);
    doc.text(`All Exchange Rates for ${fromCurrency}`, 14, 20);
    doc.setFontSize(12);
    doc.text(`As of ${date}`, 14, 28);
    
    // Fetch all rates
    try {
        const response = await fetch(`${BASE_URL}/latest?from=${fromCurrency}`);
        const data = await response.json();
        
        // Prepare data for the table
        const rates = data.rates;
        const tableData = Object.entries(rates).map(([currency, rate]) => {
            return [currency, rate.toFixed(6), (1/rate).toFixed(6)];
        });
        
        // Add table
        doc.autoTable({
            startY: 35,
            head: [['Currency', `1 ${fromCurrency} =`, `1 Unit = ${fromCurrency}`]],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [67, 97, 238],
                textColor: 255
            },
            alternateRowStyles: {
                fillColor: [240, 240, 240]
            },
            margin: { top: 35 }
        });
        
        // Save the PDF
        doc.save(`ExchangeRates_${fromCurrency}_${date.replace(/\//g, '-')}.pdf`);
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Failed to generate PDF. Please try again.');
    }
}

function renderAllCurrencies() {
    currenciesGrid.innerHTML = '';
    
    for (const currencyCode in countryList) {
        const countryCode = countryList[currencyCode];
        const currencyName = new Intl.DisplayNames(['en'], { type: 'currency' }).of(currencyCode);
        
        const currencyCard = document.createElement('div');
        currencyCard.className = 'currency-card';
        currencyCard.innerHTML = `
            <img src="https://flagsapi.com/${countryCode}/flat/64.png" alt="${currencyCode} flag">
            <span class="currency-code">${currencyCode}</span>
            <span class="currency-name">${currencyName || currencyCode}</span>
        `;
        
        currencyCard.addEventListener('click', () => {
            fromCurrencySelect.value = currencyCode;
            updateFlag(fromCurrencySelect, document.querySelector('.from-currency .flag'));
            fromCurrencyCode.textContent = currencyCode;
            updateExchangeRate();
            checkFavoriteStatus();
            
            allCurrenciesModal.classList.remove('show');
            overlay.classList.remove('show');
        });
        
        currenciesGrid.appendChild(currencyCard);
    }
}

// Country code mapping for flags
const countryList = {
    AED: "AE",
    AFN: "AF",
    ALL: "AL",
    AMD: "AM",
    ANG: "AN",
    AOA: "AO",
    ARS: "AR",
    AUD: "AU",
    AWG: "AW",
    AZN: "AZ",
    BAM: "BA",
    BBD: "BB",
    BDT: "BD",
    BGN: "BG",
    BHD: "BH",
    BIF: "BI",
    BMD: "BM",
    BND: "BN",
    BOB: "BO",
    BRL: "BR",
    BSD: "BS",
    BTN: "BT",
    BWP: "BW",
    BYN: "BY",
    BZD: "BZ",
    CAD: "CA",
    CDF: "CD",
    CHF: "CH",
    CLP: "CL",
    CNY: "CN",
    COP: "CO",
    CRC: "CR",
    CUP: "CU",
    CVE: "CV",
    CZK: "CZ",
    DJF: "DJ",
    DKK: "DK",
    DOP: "DO",
    DZD: "DZ",
    EGP: "EG",
    ERN: "ER",
    ETB: "ET",
    EUR: "EU",
    FJD: "FJ",
    FKP: "FK",
    FOK: "FO",
    GBP: "GB",
    GEL: "GE",
    GGP: "GG",
    GHS: "GH",
    GIP: "GI",
    GMD: "GM",
    GNF: "GN",
    GTQ: "GT",
    GYD: "GY",
    HKD: "HK",
    HNL: "HN",
    HRK: "HR",
    HTG: "HT",
    HUF: "HU",
    IDR: "ID",
    ILS: "IL",
    IMP: "IM",
    INR: "IN",
    IQD: "IQ",
    IRR: "IR",
    ISK: "IS",
    JEP: "JE",
    JMD: "JM",
    JOD: "JO",
    JPY: "JP",
    KES: "KE",
    KGS: "KG",
    KHR: "KH",
    KID: "KI",
    KMF: "KM",
    KRW: "KR",
    KWD: "KW",
    KYD: "KY",
    KZT: "KZ",
    LAK: "LA",
    LBP: "LB",
    LKR: "LK",
    LRD: "LR",
    LSL: "LS",
    LYD: "LY",
    MAD: "MA",
    MDL: "MD",
    MGA: "MG",
    MKD: "MK",
    MMK: "MM",
    MNT: "MN",
    MOP: "MO",
    MRU: "MR",
    MUR: "MU",
    MVR: "MV",
    MWK: "MW",
    MXN: "MX",
    MYR: "MY",
    MZN: "MZ",
    NAD: "NA",
    NGN: "NG",
    NIO: "NI",
    NOK: "NO",
    NPR: "NP",
    NZD: "NZ",
    OMR: "OM",
    PAB: "PA",
    PEN: "PE",
    PGK: "PG",
    PHP: "PH",
    PKR: "PK",
    PLN: "PL",
    PYG: "PY",
    QAR: "QA",
    RON: "RO",
    RSD: "RS",
    RUB: "RU",
    RWF: "RW",
    SAR: "SA",
    SBD: "SB",
    SCR: "SC",
    SDG: "SD",
    SEK: "SE",
    SGD: "SG",
    SHP: "SH",
    SLL: "SL",
    SOS: "SO",
    SRD: "SR",
    SSP: "SS",
    STN: "ST",
    SYP: "SY",
    SZL: "SZ",
    THB: "TH",
    TJS: "TJ",
    TMT: "TM",
    TND: "TN",
    TOP: "TO",
    TRY: "TR",
    TTD: "TT",
    TVD: "TV",
    TWD: "TW",
    TZS: "TZ",
    UAH: "UA",
    UGX: "UG",
    USD: "US",
    UYU: "UY",
    UZS: "UZ",
    VES: "VE",
    VND: "VN",
    VUV: "VU",
    WST: "WS",
    XAF: "CM",
    XCD: "AG",
    XOF: "SN",
    XPF: "PF",
    YER: "YE",
    ZAR: "ZA",
    ZMW: "ZM",
    ZWL: "ZW"
};