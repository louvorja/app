import { getBookToc } from "./_core.js";

export default async function handler(req, res) {
  try {
    const { bookId } = req.query;
    if (!bookId) {
      res.status(400).json({ error: 'Parâmetro "bookId" é obrigatório.' });
      return;
    }
    const data = await getBookToc(bookId);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}
