export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: 'API key not configured' });

  try {
    const { budget, travelers, month, duration, city, preferences, tripType, lang, chosenCity, chosenCountry, exactDate, customNotes } = req.body;

    const isFr = lang === 'fr';
    const months = isFr
      ? ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]
      : ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const durs = isFr
      ? ["un week-end","1 semaine","10 jours","2 semaines","3 semaines","1 mois"]
      : ["a weekend","1 week","10 days","2 weeks","3 weeks","1 month"];

    const monthName = months[parseInt(month)] || month;
    const durName = durs[parseInt(duration)] || duration;

    const tripTypes = isFr
      ? { romantic: "romantique (en couple)", friends: "entre amis", solo: "solo", familyTrip: "en famille", roadtrip: "parcours / road trip" }
      : { romantic: "romantic (couple)", friends: "with friends", solo: "solo", familyTrip: "family", roadtrip: "road trip" };
    const tripTypeName = tripTypes[tripType] || (isFr ? "entre amis" : "with friends");

    const isRoadtrip = tripType === 'roadtrip';

    const prompt = isFr
      ? (isRoadtrip
        ? `Tu es un expert en voyages. Génère un ROAD TRIP / CIRCUIT multi-villes avec ces critères :
- Budget total : ${budget}€
- Nombre de voyageurs : ${travelers}
- Mois de départ : ${monthName}
- Durée : ${durName}
- Ville de départ : ${city || 'Paris'}
- Type de voyage : road trip / circuit
- Préférences : ${preferences?.length ? preferences.join(', ') : 'aucune en particulier'}
${exactDate ? `- Date exacte de départ : ${exactDate}` : ''}
${customNotes ? `- Demandes spéciales : ${customNotes}` : ''}
${chosenCity ? `- Région/pays de départ du road trip : ${chosenCity}, ${chosenCountry}. Le circuit doit commencer dans cette zone.` : ''}

IMPORTANT : Réponds UNIQUEMENT en JSON valide, sans texte avant ni après, sans backticks. Le JSON doit suivre exactement cette structure :
{
  "destination": {
    "country": "Pays ou Région",
    "city": "${chosenCity || 'Ville de départ du circuit'}",
    "description": "Description attractive du circuit en 2-3 phrases"
  },
  "stages": [
    {
      "city": "Nom de la ville-étape",
      "country": "Pays",
      "nights": 2,
      "description": "Ce qu'on fait dans cette étape en 1-2 phrases",
      "days": [
        {
          "title": "Titre du jour",
          "morning": "Description détaillée du matin avec lieux précis",
          "afternoon": "Description détaillée de l'après-midi avec lieux précis",
          "evening": "Description détaillée de la soirée avec lieux précis"
        }
      ]
    }
  ],
  "budget": {
    "flights": nombre,
    "hotel": nombre,
    "activities": nombre,
    "food": nombre,
    "transport": nombre
  },
  "tips": ["conseil 1", "conseil 2", "conseil 3"],
  "suggestedDates": "dates suggérées (ex: du 15 au 22 mars 2025)"
}

Règles :
- Propose 3 à 6 étapes (villes différentes) formant un circuit logique et géographiquement cohérent
- Le budget total doit être proche de ${budget}€
- Chaque étape a ses propres jours détaillés
- Inclus les trajets entre étapes dans les descriptions
- Donne des noms de lieux, restaurants et activités RÉELS
- Le total des jours doit correspondre à la durée "${durName}"
${exactDate ? '' : '- Propose des dates idéales de voyage dans le champ "suggestedDates"'}`
        : `Tu es un expert en voyages. Génère un voyage personnalisé avec ces critères :
- Budget total : ${budget}€
- Nombre de voyageurs : ${travelers}
- Mois de départ : ${monthName}
- Durée : ${durName}
- Ville de départ : ${city || 'Paris'}
- Type de voyage : ${tripTypeName}
- Préférences : ${preferences?.length ? preferences.join(', ') : 'aucune en particulier'}
${exactDate ? `- Date exacte de départ : ${exactDate}` : ''}
${customNotes ? `- Demandes spéciales : ${customNotes}` : ''}
${chosenCity ? `- Destination IMPOSÉE : ${chosenCity}, ${chosenCountry}. Tu DOIS faire le voyage pour cette ville.` : ''}

IMPORTANT : Réponds UNIQUEMENT en JSON valide, sans texte avant ni après, sans backticks. Le JSON doit suivre exactement cette structure :
{
  "destination": {
    "country": "Pays",
    "city": "Ville",
    "description": "Description attractive de 2-3 phrases"
  },
  "budget": {
    "flights": nombre,
    "hotel": nombre,
    "activities": nombre,
    "food": nombre,
    "transport": nombre
  },
  "days": [
    {
      "title": "Titre du jour",
      "morning": "Description détaillée du matin avec lieux précis",
      "afternoon": "Description détaillée de l'après-midi avec lieux précis",
      "evening": "Description détaillée de la soirée avec lieux précis"
    }
  ],
  "tips": ["conseil 1", "conseil 2", "conseil 3"],
  "suggestedDates": "dates suggérées (ex: du 15 au 22 mars 2025)"
}

Règles :
- Le budget total (flights+hotel+activities+food+transport) doit être proche de ${budget}€
- Propose exactement le bon nombre de jours selon la durée "${durName}"
- Donne des noms de lieux, restaurants et activités RÉELS et précis
- Les tips doivent être des conseils pratiques et utiles
- La destination doit être réaliste pour le budget donné
${exactDate ? '' : '- Propose des dates idéales de voyage dans le champ "suggestedDates"'}`)
      : (isRoadtrip
        ? `You are a travel expert. Generate a multi-city ROAD TRIP / CIRCUIT with these criteria:
- Total budget: ${budget}€
- Number of travelers: ${travelers}
- Departure month: ${monthName}
- Duration: ${durName}
- Departure city: ${city || 'Paris'}
- Trip type: road trip / circuit
- Preferences: ${preferences?.length ? preferences.join(', ') : 'none in particular'}
${exactDate ? `- Exact departure date: ${exactDate}` : ''}
${customNotes ? `- Special requests: ${customNotes}` : ''}
${chosenCity ? `- Road trip starting region/country: ${chosenCity}, ${chosenCountry}. The circuit should start in this area.` : ''}

IMPORTANT: Respond ONLY with valid JSON, no text before or after, no backticks. The JSON must follow exactly this structure:
{
  "destination": {
    "country": "Country or Region",
    "city": "${chosenCity || 'Circuit starting city'}",
    "description": "Attractive 2-3 sentence description of the circuit"
  },
  "stages": [
    {
      "city": "Stage city name",
      "country": "Country",
      "nights": 2,
      "description": "What to do at this stage in 1-2 sentences",
      "days": [
        {
          "title": "Day title",
          "morning": "Detailed morning description with specific places",
          "afternoon": "Detailed afternoon description with specific places",
          "evening": "Detailed evening description with specific places"
        }
      ]
    }
  ],
  "budget": {
    "flights": number,
    "hotel": number,
    "activities": number,
    "food": number,
    "transport": number
  },
  "tips": ["tip 1", "tip 2", "tip 3"],
  "suggestedDates": "suggested dates (e.g. March 15-22, 2025)"
}

Rules:
- Propose 3 to 6 stages (different cities) forming a logical and geographically coherent circuit
- Total budget must be close to ${budget}€
- Each stage has its own detailed days
- Include travel between stages in descriptions
- Give REAL and specific place names, restaurants and activities
- Total days must match the duration "${durName}"
${exactDate ? '' : '- Suggest ideal travel dates in a "suggestedDates" field'}`
        : `You are a travel expert. Generate a personalized trip with these criteria:
- Total budget: ${budget}€
- Number of travelers: ${travelers}
- Departure month: ${monthName}
- Duration: ${durName}
- Departure city: ${city || 'Paris'}
- Trip type: ${tripTypeName}
- Preferences: ${preferences?.length ? preferences.join(', ') : 'none in particular'}
${exactDate ? `- Exact departure date: ${exactDate}` : ''}
${customNotes ? `- Special requests: ${customNotes}` : ''}
${chosenCity ? `- REQUIRED destination: ${chosenCity}, ${chosenCountry}. You MUST plan the trip for this city.` : ''}

IMPORTANT: Respond ONLY with valid JSON, no text before or after, no backticks. The JSON must follow exactly this structure:
{
  "destination": {
    "country": "Country",
    "city": "City",
    "description": "Attractive 2-3 sentence description"
  },
  "budget": {
    "flights": number,
    "hotel": number,
    "activities": number,
    "food": number,
    "transport": number
  },
  "days": [
    {
      "title": "Day title",
      "morning": "Detailed morning description with specific places",
      "afternoon": "Detailed afternoon description with specific places",
      "evening": "Detailed evening description with specific places"
    }
  ],
  "tips": ["tip 1", "tip 2", "tip 3"],
  "suggestedDates": "suggested dates (e.g. March 15-22, 2025)"
}

Rules:
- Total budget (flights+hotel+activities+food+transport) must be close to ${budget}€
- Propose exactly the right number of days for duration "${durName}"
- Give REAL and specific place names, restaurants and activities
- Tips should be practical and useful
- Destination must be realistic for the given budget
${exactDate ? '' : '- Suggest ideal travel dates in a "suggestedDates" field'}`);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', errText);
      return res.status(500).json({ error: 'AI API error' });
    }

    const data = await response.json();
    // Gemini 2.5 peut renvoyer plusieurs parts (thinking + réponse), prendre la dernière part texte
    const parts = data.candidates?.[0]?.content?.parts || [];
    const text = parts.filter(p => p.text).map(p => p.text).pop() || '';

    if (!text) {
      console.error('Empty response from Gemini:', JSON.stringify(data).slice(0, 500));
      return res.status(500).json({ error: 'Empty AI response' });
    }

    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const trip = JSON.parse(cleaned);

    return res.status(200).json(trip);
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Failed to generate trip' });
  }
}
