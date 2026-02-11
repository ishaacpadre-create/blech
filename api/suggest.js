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
      ? `Tu es un expert en voyages. Propose exactement 3 destinations DIFFÉRENTES (dans des pays différents) pour un voyage avec ces critères :
- Budget total : ${budget}€
- Nombre de voyageurs : ${travelers}
- Mois de départ : ${monthName}
- Durée : ${durName}
- Ville de départ : ${city || 'Paris'}
- Type de voyage : ${tripTypeName}
- Préférences : ${preferences?.length ? preferences.join(', ') : 'aucune en particulier'}

IMPORTANT : Réponds UNIQUEMENT en JSON valide, sans texte avant ni après, sans backticks. Le JSON doit suivre exactement cette structure :
{
  "suggestions": [
    {
      "city": "Ville",
      "country": "Pays",
      "description": "Description attractive de 2 phrases",
      "estimatedBudget": nombre,
      "matchReason": "1 phrase expliquant pourquoi cette destination correspond aux préférences"
    }
  ]
}

Règles :
- Propose exactement 3 destinations dans 3 pays DIFFÉRENTS
- Chaque estimatedBudget doit être réaliste et proche de ${budget}€
- Les destinations doivent être réalistes et accessibles depuis ${city || 'Paris'}
- Varie les styles : une destination classique, une originale, une surprenante`
      : `You are a travel expert. Propose exactly 3 DIFFERENT destinations (in different countries) for a trip with these criteria:
- Total budget: ${budget}€
- Number of travelers: ${travelers}
- Departure month: ${monthName}
- Duration: ${durName}
- Departure city: ${city || 'Paris'}
- Trip type: ${tripTypeName}
- Preferences: ${preferences?.length ? preferences.join(', ') : 'none in particular'}

IMPORTANT: Respond ONLY with valid JSON, no text before or after, no backticks. The JSON must follow exactly this structure:
{
  "suggestions": [
    {
      "city": "City",
      "country": "Country",
      "description": "Attractive 2-sentence description",
      "estimatedBudget": number,
      "matchReason": "1 sentence explaining why this destination matches the preferences"
    }
  ]
}

Rules:
- Propose exactly 3 destinations in 3 DIFFERENT countries
- Each estimatedBudget must be realistic and close to ${budget}€
- Destinations must be realistic and accessible from ${city || 'Paris'}
- Vary the styles: one classic, one original, one surprising`;

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
