export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: 'API key not configured' });

  try {
    const { budget, travelers, month, duration, city, preferences, tripType, lang } = req.body;

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
      ? { romantic: "romantique (en couple)", friends: "entre amis", solo: "solo", familyTrip: "en famille" }
      : { romantic: "romantic (couple)", friends: "with friends", solo: "solo", familyTrip: "family" };
    const tripTypeName = tripTypes[tripType] || (isFr ? "entre amis" : "with friends");

    const prompt = isFr
      ? `Tu es un expert en voyages. Génère un voyage personnalisé avec ces critères :
- Budget total : ${budget}€
- Nombre de voyageurs : ${travelers}
- Mois de départ : ${monthName}
- Durée : ${durName}
- Ville de départ : ${city || 'Paris'}
- Type de voyage : ${tripTypeName}
- Préférences : ${preferences?.length ? preferences.join(', ') : 'aucune en particulier'}

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
  "tips": ["conseil 1", "conseil 2", "conseil 3"]
}

Règles :
- Le budget total (flights+hotel+activities+food+transport) doit être proche de ${budget}€
- Propose exactement le bon nombre de jours selon la durée "${durName}"
- Donne des noms de lieux, restaurants et activités RÉELS et précis
- Les tips doivent être des conseils pratiques et utiles
- La destination doit être réaliste pour le budget donné`
      : `You are a travel expert. Generate a personalized trip with these criteria:
- Total budget: ${budget}€
- Number of travelers: ${travelers}
- Departure month: ${monthName}
- Duration: ${durName}
- Departure city: ${city || 'Paris'}
- Trip type: ${tripTypeName}
- Preferences: ${preferences?.length ? preferences.join(', ') : 'none in particular'}

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
  "tips": ["tip 1", "tip 2", "tip 3"]
}

Rules:
- Total budget (flights+hotel+activities+food+transport) must be close to ${budget}€
- Propose exactly the right number of days for duration "${durName}"
- Give REAL and specific place names, restaurants and activities
- Tips should be practical and useful
- Destination must be realistic for the given budget`;

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
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const trip = JSON.parse(cleaned);

    return res.status(200).json(trip);
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Failed to generate trip' });
  }
}
