const scentKeys = ["A", "B", "C", "D"];
const viewDuration = 10;

const scoreItems = [
  ["fit", "香りは作品に合っていると感じましたか"],
  ["immersion", "作品の世界に入り込みやすくなりましたか"],
  ["impressionChange", "作品の印象は変化しましたか"],
  ["spaceImagination", "場所・空気・湿度・周囲の環境を想像しやすくなりましたか"],
  ["memoryAssociation", "個人的な記憶や別の場所を思い出しましたか"],
  ["discomfort", "香りに違和感はありましたか"],
  ["interpretationChange", "作品の意味や物語が変わったように感じましたか"],
];

const visualChecks = [
  "より自然に見えた",
  "より静かに見えた",
  "より明るく見えた",
  "より湿度を感じた",
  "より現実的に感じた",
  "より幻想的に感じた",
  "別の場所を想像した",
  "個人的な記憶を思い出した",
  "作品の印象が変わった",
  "特に変化はなかった",
  "違和感があった",
];

function artworkFigure(extraClass = "") {
  return `
    <figure class="artwork-full ${extraClass}">
      <img src="./assets/monet-water-lilies.jpg" alt="Claude Monet Water Lilies" />
      <figcaption>Claude Monet《睡蓮》</figcaption>
    </figure>
  `;
}

function optionList(includeNone = false) {
  const options = ['<option value="">選択してください</option>'];
  for (const key of scentKeys) options.push(`<option value="${key}">香り${key}</option>`);
  if (includeNone) options.push('<option value="特になし">特になし</option>');
  return options.join("");
}

function rating(name) {
  return `
    <div class="rating" role="radiogroup" data-required="true">
      ${[1, 2, 3, 4, 5]
        .map(
          (value) => `
            <label>
              <input type="radio" name="${name}" value="${value}" />
              <span>${value}</span>
            </label>
          `,
        )
        .join("")}
    </div>
  `;
}

function viewStep({ title, kicker, instruction, label }) {
  return `
    <section class="card step view-step" data-title="${title}" data-kind="view" data-duration="${viewDuration}">
      ${artworkFigure("view-artwork")}
      <div class="countdown-panel" aria-live="polite">
        <span class="countdown-number">${viewDuration}</span>
      </div>
    </section>
  `;
}

function scentFormStep(key, index) {
  return `
    <section class="card step form-step scent-card" data-title="香り${key}の回答" data-kind="form">
      <div class="section-kicker">${String(index + 2).padStart(2, "0")}</div>
      <h2>香り${key}を体験した後</h2>
      <p class="note">香り${key}を嗅ぎながら作品を見た直後の感覚を記録してください。</p>
      <div class="form-stack">
        ${scoreItems
          .map(
            ([scoreKey, label]) => `
              <fieldset class="score-block">
                <legend>${label}</legend>
                <div class="rating-labels">
                  <span>低い</span>
                  <span>高い</span>
                </div>
                ${rating(`scent_${key}_${scoreKey}`)}
              </fieldset>
            `,
          )
          .join("")}
        <fieldset>
          <legend>香り${key}を体験した後、作品はどのように見えましたか（複数選択可）</legend>
          <div class="checks" data-name="scent_${key}_visualChecks" data-required="true">
            ${visualChecks
              .map((item) => `<label><input type="checkbox" value="${item}" />${item}</label>`)
              .join("")}
          </div>
        </fieldset>
        <label>
          香り${key}によって、作品の見え方や感じ方が変わった点があれば書いてください。
          <textarea name="scent_${key}_comment" rows="4"></textarea>
        </label>
      </div>
    </section>
  `;
}

function restStep(afterKey) {
  return `
    <section class="step rest-step" data-title="休憩" data-kind="rest">
      <h2>少し休憩してください</h2>
      <p class="rest-lead">
        前の香りの影響を減らすため、次の香りに進む前に無臭の空気を吸ってください。
        準備ができたら下のボタンで次の香りに進んでください。
      </p>
    </section>
  `;
}

function generateDynamicSteps() {
  const steps = [];

  scentKeys.forEach((key, index) => {
    steps.push(
      viewStep({
        title: `香り${key}を感じながら作品を鑑賞してください`,
        kicker: String(index + 3).padStart(2, "0"),
        label: `Viewing · 香り${key}`,
        instruction: `香り${key}を嗅ぎながら、10秒間《睡蓮》を見てください。時間が終わると自動的に回答ページへ進みます。`,
      }),
      scentFormStep(key, index),
    );

    if (index < scentKeys.length - 1) {
      steps.push(restStep(key));
    }
  });

  document.querySelector("#dynamicSteps").innerHTML = steps.join("");
}

function selectedChecks(name) {
  return [...document.querySelectorAll(`.checks[data-name="${name}"] input:checked`)].map(
    (input) => input.value,
  );
}

function scoreValue(formData, key, scoreKey) {
  return formData.get(`scent_${key}_${scoreKey}`) || "";
}

function buildPayload(form) {
  const formData = new FormData(form);
  return {
    participantId: "",
    ageGroup: formData.get("ageGroup"),
    scentSensitivity: formData.get("scentSensitivity"),
    order: scentKeys,
    scents: Object.fromEntries(
      scentKeys.map((key) => [
        key,
        {
          scores: Object.fromEntries(
            scoreItems.map(([scoreKey]) => [scoreKey, scoreValue(formData, key, scoreKey)]),
          ),
          visualChecks: selectedChecks(`scent_${key}_visualChecks`),
          comment: formData.get(`scent_${key}_comment`),
        },
      ]),
    ),
    comparison: {
      bestFit: formData.get("bestFit"),
      mostChanged: formData.get("mostChanged"),
      bestSpace: formData.get("bestSpace"),
      bestMemory: formData.get("bestMemory"),
      mostDiscomfort: formData.get("mostDiscomfort"),
      experienceChanged: formData.get("experienceChanged"),
      finalComment: formData.get("finalComment"),
    },
  };
}

function setupComparisonOptions() {
  for (const select of document.querySelectorAll("select[name='bestFit'], select[name='mostChanged'], select[name='bestSpace'], select[name='bestMemory']")) {
    select.innerHTML = optionList(false);
  }
  document.querySelector("select[name='mostDiscomfort']").innerHTML = optionList(true);
}

function setupJapaneseValidationMessages() {
  const requiredControls = document.querySelectorAll("input[required], select[required], textarea[required]");
  requiredControls.forEach((control) => {
    control.addEventListener("invalid", () => {
      control.setCustomValidity("この項目を入力してください。");
    });
    control.addEventListener("input", () => {
      control.setCustomValidity("");
    });
    control.addEventListener("change", () => {
      control.setCustomValidity("");
    });
  });
}

let currentStep = 0;
let timerId = null;
let remainingSeconds = viewDuration;

generateDynamicSteps();
setupComparisonOptions();
setupJapaneseValidationMessages();

const steps = [...document.querySelectorAll(".step")];
const headerProgressBar = document.querySelector("#headerProgressBar");
const prevButton = document.querySelector("#prevStep");
const nextButton = document.querySelector("#nextStep");
const submitButton = document.querySelector("#submitStep");
const stepHint = document.querySelector("#stepHint");

function activeStep() {
  return steps[currentStep];
}

function clearCountdown() {
  if (timerId) {
    window.clearInterval(timerId);
    timerId = null;
  }
}

function goToStep(index) {
  currentStep = Math.max(0, Math.min(steps.length - 1, index));
  renderStep();
}

function startCountdown(step) {
  clearCountdown();
  remainingSeconds = Number(step.dataset.duration || viewDuration);
  const number = step.querySelector(".countdown-number");
  const updateNumber = () => {
    if (!number) return;
    number.textContent = remainingSeconds;
    number.classList.remove("is-fading");
    void number.offsetWidth;
    number.classList.add("is-fading");
  };
  updateNumber();

  timerId = window.setInterval(() => {
    if (remainingSeconds <= 1) {
      clearCountdown();
      goToStep(currentStep + 1);
      return;
    }
    remainingSeconds -= 1;
    updateNumber();
  }, 1000);
}

function renderStep() {
  clearCountdown();
  steps.forEach((step, index) => {
    step.classList.toggle("is-active", index === currentStep);
  });

  const step = activeStep();
  const kind = step.dataset.kind;
  document.body.classList.toggle("is-first-step", currentStep === 0);
  document.body.classList.toggle("is-form-step", kind === "form");
  document.body.classList.toggle("is-formal-start", kind === "intro");
  document.body.classList.toggle("is-rest-step", kind === "rest");
  document.body.classList.toggle("is-view-step", kind === "view");
  const progress = `${((currentStep + 1) / steps.length) * 100}%`;
  if (headerProgressBar) headerProgressBar.style.width = progress;

  prevButton.disabled = currentStep === 0 || kind === "view";
  prevButton.hidden = currentStep === 0 || kind === "intro" || kind === "rest";
  nextButton.hidden = kind === "view" || currentStep === steps.length - 1;
  submitButton.hidden = currentStep !== steps.length - 1;

  if (kind === "view") {
    stepHint.textContent = "作品を見てください。10秒後に自動で回答ページへ進みます。";
    startCountdown(step);
  } else if (kind === "intro") {
    nextButton.textContent = "正式体験に入る";
    stepHint.textContent = "";
  } else if (kind === "rest") {
    nextButton.textContent = "休憩をスキップして次へ";
    stepHint.textContent = "準備ができたら次の香りに進んでください。";
  } else {
    nextButton.textContent = currentStep === steps.length - 2 ? "比較へ" : "回答して次へ";
    stepHint.textContent = "このページの入力後、次へ進んでください。";
  }

  updateNavigationState();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function isCurrentStepComplete() {
  if (activeStep().dataset.kind !== "form") return true;
  const requiredControls = [
    ...activeStep().querySelectorAll(
      "select[required], textarea[required], input[required]:not([type='radio']):not([type='checkbox'])",
    ),
  ];
  const requiredOptionGroups = [
    ...activeStep().querySelectorAll(".rating[data-required='true'], .checks[data-required='true']"),
  ];
  return (
    requiredControls.every((control) => control.checkValidity()) &&
    requiredOptionGroups.every((group) => group.querySelector("input:checked"))
  );
}

function updateNavigationState() {
  const isComplete = isCurrentStepComplete();
  if (!nextButton.hidden) nextButton.disabled = !isComplete;
  if (!submitButton.hidden) submitButton.disabled = !isComplete;
}

function validateCurrentStep() {
  const requiredControls = [
    ...activeStep().querySelectorAll(
      "select[required], textarea[required], input[required]:not([type='radio']):not([type='checkbox'])",
    ),
  ];
  const requiredOptionGroups = [
    ...activeStep().querySelectorAll(".rating[data-required='true'], .checks[data-required='true']"),
  ];

  for (const control of requiredControls) {
    if (!control.checkValidity()) {
      control.reportValidity();
      return false;
    }
  }

  for (const group of requiredOptionGroups) {
    const isAnswered = Boolean(group.querySelector("input:checked"));
    group.classList.toggle("is-invalid", !isAnswered);
    if (!isAnswered) {
      group.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
  }

  return true;
}

prevButton.addEventListener("click", () => {
  goToStep(currentStep - 1);
});

nextButton.addEventListener("click", () => {
  if (activeStep().dataset.kind === "form" && !validateCurrentStep()) return;
  goToStep(currentStep + 1);
});

document.querySelector("#experimentForm").addEventListener("input", updateNavigationState);
document.querySelector("#experimentForm").addEventListener("change", (event) => {
  const optionGroup = event.target.closest?.(".checks, .rating");
  if (optionGroup) optionGroup.classList.remove("is-invalid");
  updateNavigationState();
});

document.querySelector("#experimentForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!validateCurrentStep()) return;
  const button = event.submitter;
  button.disabled = true;
  button.textContent = "送信中...";

  try {
    const response = await fetch("/api/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(event.currentTarget)),
    });

    if (!response.ok) throw new Error("送信に失敗しました");
    document.querySelector("#completeDialog").showModal();
  } catch (error) {
    alert(error.message);
    button.disabled = false;
    button.textContent = "回答を送信する";
  }
});

renderStep();
