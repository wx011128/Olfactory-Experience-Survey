async function loadResponses() {
  const response = await fetch("/api/responses");
  const data = await response.json();
  document.querySelector("#responseCount").textContent = `${data.length}件`;
  document.querySelector("#responseRows").innerHTML = data
    .slice()
    .reverse()
    .map(
      (item) => `
        <tr>
          <td>${new Date(item.createdAt).toLocaleString("ja-JP")}</td>
          <td>${escapeHtml(item.participantId || "-")}</td>
          <td>${escapeHtml((item.order || []).join(" → "))}</td>
          <td>${escapeHtml(item.comparison?.bestFit || "-")}</td>
          <td>${escapeHtml(item.comparison?.mostChanged || "-")}</td>
          <td>${escapeHtml(item.comparison?.finalComment || "-")}</td>
        </tr>
      `,
    )
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

loadResponses();
