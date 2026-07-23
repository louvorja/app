import { search } from "./_core.js";

export default async function handler(req, res) {
  try {
    const { query, lang, limit, offset } = req.query;
    const data = await search({
      query,
      lang,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}
