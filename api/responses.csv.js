const { readResponses, toCsv } = require("./_responsesStore");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).send("Method not allowed");
    return;
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="responses.csv"');
  res.status(200).send(toCsv(await readResponses()));
};
