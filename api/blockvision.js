export default async function handler(req, res) {
  const { address } = req.query;
  const apiKey = process.env.VITE_BLOCKVISION_API_KEY || process.env.BLOCKVISION_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch(`https://api.blockvision.org/v2/monad/account/tokens?address=${address}`, {
      headers: {
        'X-API-Key': apiKey,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tokens' });
  }
}
