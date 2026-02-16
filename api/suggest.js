export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: 'API key not configured' });

  try {
    const { budget, travelers, month, duration, city, preferences, tripType, lang, exactDate, customNotes, noFlight, noHotel, continent, multiDest } = req.body;

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
      ? `Tu es un expert en voyages. Propose exactement 3 ${isRoadtrip ? 'itinéraires road trip DIFFÉRENTS' : 'destinations DIFFÉRENTES (dans des pays différents)'} pour un voyage avec ces critères :
- Budget total : ${budget}€
- Nombre de voyageurs : ${travelers}
- Mois de départ : ${monthName}
- Durée : ${durName}
- Ville de départ : ${city || 'Paris'}
- Type de voyage : ${tripTypeName}
- Préférences : ${preferences?.length ? preferences.join(', ') : 'aucune en particulier'}
${exactDate ? `- Date exacte de départ : ${exactDate}` : ''}
${customNotes ? `- Demandes spéciales : ${customNotes}` : ''}
${noFlight ? '- PAS DE VOL : le voyageur se déplace par ses propres moyens (voiture, train, etc.)' : ''}
${noHotel ? "- PAS D'HÔTEL : le voyageur a son propre hébergement (ne pas inclure de frais d'hôtel)" : ''}
${continent ? `- Continent souhaité : ${continent}` : ''}
${multiDest ? `- Villes/étapes souhaitées par le voyageur : ${multiDest}` : ''}

IMPORTANT : Réponds UNIQUEMENT en JSON valide, sans texte avant ni après, sans backticks. Le JSON doit suivre exactement cette structure :
{
  "suggestions": [
    {
      "city": "${isRoadtrip ? 'Ville principale ou point fort du parcours (1 seule ville pour la photo)' : 'Ville'}",
      "country": "${isRoadtrip ? 'Tous les pays traversés séparés par des virgules (ex: France, Espagne, Portugal)' : 'Pays'}",
      "description": "${isRoadtrip ? 'Description du parcours complet avec les étapes principales (ex: Départ de Lyon → Côte d\'Azur → Gênes → Cinque Terre → Florence). 2-3 phrases.' : 'Description attractive de 2 phrases'}",
      "estimatedBudget": nombre,
      "rating": "note de 1 à 5 (avec 1 décimale, ex: 4.2) basée sur la qualité/popularité de la destination",
      "matchReason": "1 phrase expliquant pourquoi ${isRoadtrip ? 'cet itinéraire' : 'cette destination'} correspond aux préférences",
      "suggestedDates": "dates idéales suggérées (ex: du 15 au 22 mars)"
    }
  ]
}

Règles :
${isRoadtrip
  ? `- Propose exactement 3 itinéraires road trip DIFFÉRENTS traversant chacun AU MOINS 2 pays
- Chaque itinéraire doit être un vrai parcours avec 4 à 8 étapes/villes à travers plusieurs pays
- Le champ "city" doit contenir UNE seule ville (la plus emblématique du parcours) pour l'image
- Le champ "country" doit lister TOUS les pays traversés séparés par des virgules
- La description doit détailler le parcours complet avec les étapes (ville → ville → ville)
- Les 3 itinéraires doivent être variés : directions et pays différents`
  : `- Propose exactement 3 destinations dans 3 pays DIFFÉRENTS
- Varie les styles : une destination classique, une originale, une surprenante`}
- Chaque estimatedBudget doit être réaliste et proche de ${budget}€
- Les destinations doivent être réalistes et accessibles depuis ${city || 'Paris'}
${noFlight ? '- Sans vol : propose des destinations accessibles en voiture/train depuis ' + (city || 'Paris') + ', estimatedBudget sans frais de vol' : ''}
${noHotel ? "- Sans hôtel : le budget ne doit pas inclure d'hébergement" : ''}
${continent ? '- Toutes les destinations doivent être en ' + continent : ''}
${multiDest ? '- Intègre ces villes/étapes dans les propositions : ' + multiDest : ''}
- Pour suggestedDates : ${exactDate ? 'utilise la date exacte fournie' : 'propose les meilleures dates dans le mois indiqué'}`
      : `You are a travel expert. Propose exactly 3 ${isRoadtrip ? 'DIFFERENT road trip itineraries' : 'DIFFERENT destinations (in different countries)'} for a trip with these criteria:
- Total budget: ${budget}€
- Number of travelers: ${travelers}
- Departure month: ${monthName}
- Duration: ${durName}
- Departure city: ${city || 'Paris'}
- Trip type: ${tripTypeName}
- Preferences: ${preferences?.length ? preferences.join(', ') : 'none in particular'}
${exactDate ? `- Exact departure date: ${exactDate}` : ''}
${customNotes ? `- Special requests: ${customNotes}` : ''}
${noFlight ? '- NO FLIGHTS: traveler has own transport (car, train, etc.)' : ''}
${noHotel ? '- NO HOTEL: traveler has own accommodation (do not include hotel costs)' : ''}
${continent ? `- Preferred continent: ${continent}` : ''}
${multiDest ? `- Cities/stops requested by the traveler: ${multiDest}` : ''}

IMPORTANT: Respond ONLY with valid JSON, no text before or after, no backticks. The JSON must follow exactly this structure:
{
  "suggestions": [
    {
      "city": "${isRoadtrip ? 'Main city or highlight of the route (1 single city for the photo)' : 'City'}",
      "country": "${isRoadtrip ? 'All countries crossed separated by commas (e.g. France, Spain, Portugal)' : 'Country'}",
      "description": "${isRoadtrip ? 'Full route description with main stops (e.g. Departure from Lyon → French Riviera → Genoa → Cinque Terre → Florence). 2-3 sentences.' : 'Attractive 2-sentence description'}",
      "estimatedBudget": number,
      "rating": "rating from 1 to 5 (with 1 decimal, e.g. 4.2) based on destination quality/popularity",
      "matchReason": "1 sentence explaining why this ${isRoadtrip ? 'itinerary' : 'destination'} matches the preferences",
      "suggestedDates": "suggested ideal dates (e.g. March 15-22)"
    }
  ]
}

Rules:
${isRoadtrip
  ? `- Propose exactly 3 DIFFERENT road trip itineraries each crossing AT LEAST 2 countries
- Each itinerary must be a real route with 4 to 8 stops/cities across multiple countries
- The "city" field must contain ONE single city (the most iconic of the route) for the image
- The "country" field must list ALL countries crossed separated by commas
- The description must detail the full route with stops (city → city → city)
- The 3 itineraries must be varied: different directions and countries`
  : `- Propose exactly 3 destinations in 3 DIFFERENT countries
- Vary the styles: one classic, one original, one surprising`}
- Each estimatedBudget must be realistic and close to ${budget}€
- Destinations must be realistic and accessible from ${city || 'Paris'}
${noFlight ? '- No flights: suggest destinations reachable by car/train from ' + (city || 'Paris') + ', estimatedBudget without flight costs' : ''}
${noHotel ? '- No hotel: budget should not include accommodation costs' : ''}
${continent ? '- All destinations must be in ' + continent : ''}
${multiDest ? '- Incorporate these cities/stops in the proposals: ' + multiDest : ''}
- For suggestedDates: ${exactDate ? 'use the exact date provided' : 'suggest the best dates within the indicated month'}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
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
    const result = JSON.parse(cleaned);

    return res.status(200).json(result);
  } catch (err) {
    console.error('Server error:', err.message || err);
    return res.status(500).json({ error: 'Failed to generate suggestions' });
  }
}
