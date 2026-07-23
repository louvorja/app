import { getChapter } from "./_core.js";

export default async function handler(req, res) {
  try {
    const { bookId, para } = req.query;
    if (!bookId || !para) {
      res.status(400).json({ error: 'Parâmetros "bookId" e "para" são obrigatórios.' });
      return;
    }
    const data = await getChapter(bookId, para);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}
