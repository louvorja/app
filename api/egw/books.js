import { listBooks } from "./_core.js";

export default async function handler(req, res) {
  try {
    const { lang, limit, page } = req.query;
    const data = await listBooks({ lang, limit: limit ? Number(limit) : undefined, page });
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}
