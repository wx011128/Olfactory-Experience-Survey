const {
  normalizeSubmission,
  readResponses,
  writeResponses,
} = require("./_responsesStore");

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(200).send(JSON.stringify(await readResponses(), null, 2));
    return;
  }

  if (req.method === "POST") {
    try {
      const body =
        typeof req.body === "string" && req.body
          ? JSON.parse(req.body)
          : req.body;
      const submission = normalizeSubmission(body);
      const responses = await readResponses();
      responses.push(submission);
      await writeResponses(responses);
      res.status(201).json({ ok: true, id: submission.id });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
    return;
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).json({ ok: false, error: "Method not allowed" });
};
