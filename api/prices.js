export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const CLIENT_ID = process.env.AMADEUS_CLIENT_ID;
  const CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET;
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return res.status(200).json({ flights: null, hotel: null });
  }

  const BASE = process.env.AMADEUS_BASE_URL || 'https://test.api.amadeus.com';

  try {
    const { departureCity, destinationCity, month, duration, exactDate, travelers } = req.body || {};

    if (!destinationCity) return res.status(200).json({ flights: null, hotel: null });

    const token = await getToken(BASE, CLIENT_ID, CLIENT_SECRET);
    if (!token) return res.status(200).json({ flights: null, hotel: null });

    const [originCode, destCode] = await Promise.all([
      resolveIATA(BASE, token, departureCity || 'Paris'),
      resolveIATA(BASE, token, destinationCity),
    ]);

    if (!originCode || !destCode) {
      return res.status(200).json({ flights: null, hotel: null });
    }

    const { departureDate, returnDate } = computeDates(month, duration, exactDate);

    const adults = Math.min(Math.max(parseInt(travelers) || 1, 1), 9);

    const [flightResult, hotelResult] = await Promise.all([
      withTimeout(searchFlights(BASE, token, originCode, destCode, departureDate, returnDate, adults), 8000),
      withTimeout(searchHotels(BASE, token, destCode, departureDate, returnDate, adults), 8000),
    ]);

    return res.status(200).json({
      flights: flightResult,
      hotel: hotelResult,
    });
  } catch (err) {
    console.error('Prices error:', err.message || err);
    return res.status(200).json({ flights: null, hotel: null });
  }
}

// --- Helpers ---

const IATA_MAP = {
  'paris': 'PAR', 'london': 'LON', 'londres': 'LON', 'new york': 'NYC',
  'rome': 'ROM', 'roma': 'ROM', 'barcelona': 'BCN', 'barcelone': 'BCN',
  'tokyo': 'TYO', 'dubai': 'DXB', 'bangkok': 'BKK', 'istanbul': 'IST',
  'amsterdam': 'AMS', 'berlin': 'BER', 'madrid': 'MAD', 'lisbon': 'LIS',
  'lisbonne': 'LIS', 'prague': 'PRG', 'vienna': 'VIE', 'vienne': 'VIE',
  'athens': 'ATH', 'athènes': 'ATH', 'marrakech': 'RAK', 'montreal': 'YMQ',
  'montréal': 'YMQ', 'sydney': 'SYD', 'singapore': 'SIN', 'singapour': 'SIN',
  'milan': 'MIL', 'milano': 'MIL', 'nice': 'NCE', 'lyon': 'LYS',
  'marseille': 'MRS', 'toulouse': 'TLS', 'bordeaux': 'BOD', 'nantes': 'NTE',
  'lille': 'LIL', 'strasbourg': 'SXB', 'bruxelles': 'BRU', 'brussels': 'BRU',
  'geneva': 'GVA', 'genève': 'GVA', 'zurich': 'ZRH', 'dublin': 'DUB',
  'edinburgh': 'EDI', 'édimbourg': 'EDI', 'copenhagen': 'CPH', 'copenhague': 'CPH',
  'stockholm': 'STO', 'oslo': 'OSL', 'helsinki': 'HEL', 'warsaw': 'WAW',
  'varsovie': 'WAW', 'budapest': 'BUD', 'bucharest': 'BUH', 'bucarest': 'BUH',
  'cairo': 'CAI', 'le caire': 'CAI', 'tunis': 'TUN', 'casablanca': 'CMN',
  'dakar': 'DSS', 'nairobi': 'NBO', 'cape town': 'CPT', 'le cap': 'CPT',
  'mumbai': 'BOM', 'delhi': 'DEL', 'new delhi': 'DEL', 'beijing': 'PEK',
  'pékin': 'PEK', 'shanghai': 'SHA', 'hong kong': 'HKG', 'seoul': 'SEL',
  'séoul': 'SEL', 'osaka': 'OSA', 'kuala lumpur': 'KUL', 'jakarta': 'JKT',
  'bali': 'DPS', 'denpasar': 'DPS', 'phuket': 'HKT', 'hanoi': 'HAN',
  'ho chi minh': 'SGN', 'buenos aires': 'BUE', 'rio de janeiro': 'RIO',
  'são paulo': 'SAO', 'sao paulo': 'SAO', 'bogota': 'BOG', 'bogotá': 'BOG',
  'lima': 'LIM', 'mexico': 'MEX', 'cancun': 'CUN', 'cancún': 'CUN',
  'los angeles': 'LAX', 'san francisco': 'SFO', 'miami': 'MIA', 'chicago': 'CHI',
  'toronto': 'YTO', 'vancouver': 'YVR', 'reykjavik': 'REK', 'malaga': 'AGP',
  'málaga': 'AGP', 'porto': 'OPO', 'florence': 'FLR', 'firenze': 'FLR',
  'venice': 'VCE', 'venise': 'VCE', 'naples': 'NAP', 'napoli': 'NAP',
  'dubrovnik': 'DBV', 'split': 'SPU', 'santorini': 'JTR', 'mykonos': 'JMK',
  'palma': 'PMI', 'majorque': 'PMI', 'ibiza': 'IBZ', 'tenerife': 'TFS',
};

const DURATION_DAYS = [3, 7, 10, 14, 21, 30];

async function getToken(base, clientId, clientSecret) {
  try {
    const resp = await fetch(`${base}/v1/security/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.access_token || null;
  } catch {
    return null;
  }
}

async function resolveIATA(base, token, cityName) {
  const key = cityName.toLowerCase().trim();
  if (IATA_MAP[key]) return IATA_MAP[key];

  try {
    const resp = await fetch(
      `${base}/v1/reference-data/locations?subType=CITY,AIRPORT&keyword=${encodeURIComponent(cityName)}&page%5Blimit%5D=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.data?.[0]?.iataCode || null;
  } catch {
    return null;
  }
}

function computeDates(month, duration, exactDate) {
  const durationDays = DURATION_DAYS[parseInt(duration)] || 7;
  let depDate;

  if (exactDate) {
    depDate = new Date(exactDate);
    if (isNaN(depDate.getTime())) {
      depDate = null;
    }
  }

  if (!depDate) {
    const m = parseInt(month);
    const now = new Date();
    const year = (m <= now.getMonth()) ? now.getFullYear() + 1 : now.getFullYear();
    depDate = new Date(year, m, 15);
  }

  // Ensure departure is in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (depDate <= today) {
    depDate = new Date(today);
    depDate.setDate(depDate.getDate() + 1);
  }

  const retDate = new Date(depDate);
  retDate.setDate(retDate.getDate() + durationDays);

  const fmt = (d) => d.toISOString().split('T')[0];
  return { departureDate: fmt(depDate), returnDate: fmt(retDate) };
}

async function searchFlights(base, token, origin, dest, depDate, retDate, adults) {
  try {
    const url = `${base}/v2/shopping/flight-offers?originLocationCode=${origin}&destinationLocationCode=${dest}&departureDate=${depDate}&returnDate=${retDate}&adults=${adults}&max=5&currencyCode=EUR`;

    const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) return null;

    const data = await resp.json();
    const offers = data.data;
    if (!Array.isArray(offers) || offers.length === 0) return null;

    const cheapest = offers.reduce((min, o) =>
      parseFloat(o.price?.grandTotal || 0) < parseFloat(min.price?.grandTotal || 0) ? o : min
    );

    if (!cheapest.price?.grandTotal) return null;

    return {
      price: Math.round(parseFloat(cheapest.price.grandTotal)),
      pricePerPerson: Math.round(parseFloat(cheapest.price.grandTotal) / adults),
      airline: cheapest.validatingAirlineCodes?.[0] || null,
      outbound: cheapest.itineraries?.[0]?.segments?.[0]?.departure?.at || null,
      inbound: cheapest.itineraries?.[1]?.segments?.[0]?.departure?.at || null,
      source: 'amadeus',
    };
  } catch {
    return null;
  }
}

async function searchHotels(base, token, cityCode, checkIn, checkOut, adults) {
  try {
    // Step 1: Get hotel IDs
    const listUrl = `${base}/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}&radius=20&radiusUnit=KM&ratings=3,4&hotelSource=ALL`;
    const listResp = await fetch(listUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!listResp.ok) return null;

    const listData = await listResp.json();
    const hotels = listData.data;
    if (!Array.isArray(hotels) || hotels.length === 0) return null;

    // Take first 20 (API limit)
    const hotelIds = hotels.slice(0, 20).map(h => h.hotelId).join(',');

    // Step 2: Get offers
    const offersUrl = `${base}/v3/shopping/hotel-offers?hotelIds=${hotelIds}&checkInDate=${checkIn}&checkOutDate=${checkOut}&adults=${adults}&currency=EUR&bestRateOnly=true`;
    const offersResp = await fetch(offersUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!offersResp.ok) return null;

    const offersData = await offersResp.json();
    const hotelOffers = offersData.data;
    if (!Array.isArray(hotelOffers) || hotelOffers.length === 0) return null;

    let cheapest = null;
    for (const hotel of hotelOffers) {
      const offer = hotel.offers?.[0];
      if (!offer?.price?.total) continue;
      const totalPrice = parseFloat(offer.price.total);
      if (isNaN(totalPrice)) continue;
      if (!cheapest || totalPrice < cheapest.totalPrice) {
        const nights = Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000));
        cheapest = {
          totalPrice: Math.round(totalPrice),
          pricePerNight: Math.round(totalPrice / nights),
          hotelName: hotel.hotel?.name || null,
          rating: hotel.hotel?.rating ? parseInt(hotel.hotel.rating) : null,
          source: 'amadeus',
        };
      }
    }

    return cheapest;
  } catch {
    return null;
  }
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms)),
  ]).catch(() => null);
}
