const HACKCLUB_URL = 'https://ai.hackclub.com/chat/completions';

document.getElementById("apSelect").addEventListener("change", populateUnitsForAP);

// document.getElementById("generateBtn").addEventListener("click", handleGenerate);

async function generateFRQ() {
  const ap = document.getElementById("apSelect").value;
  const unit = document.getElementById("unitSelect").value;
  const output = document.getElementById("output");
  output.textContent = "Generating FRQ...";

  const prompt = `Generate one free-response question (FRQ) for ${ap}, ${unit}.
The FRQ should be clearly worded and require a short paragraph or a few steps of work to answer.
Include a "rubric" with four criteria scored from 1 to 10, each with a distinct name and point value for clarity.
Clearly indicate a model answer for the question.
Provide a brief explanation for why this is the correct approach or answer.
Return the response as a valid JSON object with the following schema:

${JSON.stringify({
    question: "The FRQ question text",
    rubric: {
      criterion_1: { description: "Criterion 1 description", points: "point value" },
      criterion_2: { description: "Criterion 2 description", points: "point value" },
      criterion_3: { description: "Criterion 3 description", points: "point value" },
      criterion_4: { description: "Criterion 4 description", points: "point value" }
    },
    answer: "Model answer to the FRQ, use LaTeX where appropriate",
    explanation: "Explanation of the answer or approach, with multi-line LaTeX if necessary"
  }, null, 2)}

Only use plain text, do not format anything in Markdown or HTML or LaTex. 
Everything should be readable from a plain text box`;

  try {
    const res = await fetch(HACKCLUB_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }

    const payload = await res.json();
    let content = payload.choices[0].message.content;

    // Strip markdown code fences
    content = content.replace(/```(?:json)?\s*([\s\S]*?)\s*```/, '$1');

    // Extract JSON block
    const first = content.indexOf('{');
    const last = content.lastIndexOf('}');
    if (first >= 0 && last >= 0) {
      content = content.slice(first, last + 1);
    }

    // First parse attempt
    try {
      return parseFRQ(content);
    } catch (e1) {
      console.warn('Initial JSON parse failed, sanitizing...', e1);
      // Sanitize and retry
      const sanitized = sanitizeJson(content);
      return parseFRQ(sanitized);
    }
  } catch (e) {
    console.error('generateFRQ error:', e);
    document.getElementById("output").textContent = `Error generating FRQ: ${e.message}`;
    return null;
  } finally {
    output.textContent = "";
  }
}

function parseFRQ(text) {
  const frq = JSON.parse(text);
  const validationError = validateFRQ(frq);
  if (validationError) throw new Error(validationError);
  return frq;
}

function sanitizeJson(input) {
  // 1. Ensure all keys are double-quoted
  input = input.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');

  // 2. Escape backslashes and quotes in LaTeX blocks $$...$$
  input = input.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    const escaped = math.replace(/\\/g, '\\\\').replace(/"/g, '\\\"').replace(/\n/g, ' ');
    return `"$$${escaped}$$"`;
  });

  // 3. Escape inline math $...$
  input = input.replace(/\$([^$]*?)\$/g, (_, math) => {
    const escaped = math.replace(/\\/g, '\\\\').replace(/"/g, '\\\"');
    return `"$${escaped}$"`;
  });

  // 4. Escape literal newlines inside strings
  input = input.replace(/"((?:[^"\\]|\\.)*)"/g, (match, group) => {
    const escaped = group.replace(/\r?\n/g, '\\n');
    return `"${escaped}"`;
  });

  // 5. Remove trailing commas
  input = input.replace(/,\s*([}\]])/g, '$1');

  return input;
}

function validateFRQ(frq) {
  if (!frq) return "FRQ object is null or undefined";
  if (typeof frq !== 'object') return "FRQ is not an object";
  if (!frq.question || typeof frq.question !== 'string') return "Missing or invalid 'question'";
  if (!frq.rubric || typeof frq.rubric !== 'object') return "Missing or invalid 'rubric'";
  if (!frq.answer || typeof frq.answer !== 'string') return "Missing or invalid 'answer'";
  if (!frq.explanation || typeof frq.explanation !== 'string') return "Missing or invalid 'explanation'";
  return null;
}

async function handleGenerate() {
  const quizDiv = document.getElementById("quiz");
  quizDiv.innerHTML = "";
  const frq = await generateFRQ();
  if (!frq) return;

  const qEl = document.createElement("p");
  qEl.innerHTML = `<strong>Question:</strong> ${frq.question}`;
  quizDiv.appendChild(qEl);

  // Create answer input field
  const inputField = document.createElement("textarea");
  inputField.placeholder = "Your answer...";
  inputField.rows = 4;
  inputField.style.width = "100%";
  quizDiv.appendChild(inputField);

  // Create submit button
  const submitBtn = document.createElement("button");
  submitBtn.textContent = "Submit Answer";
  submitBtn.style.marginTop = "10px";
  quizDiv.appendChild(submitBtn);

  // Hidden model answer and explanation
  const aEl = document.createElement("p");
  aEl.innerHTML = `<strong>Model Answer:</strong> ${frq.answer}`;
  aEl.style.display = "none";
  quizDiv.appendChild(aEl);

  const eEl = document.createElement("p");
  eEl.innerHTML = `<strong>Explanation:</strong> ${frq.explanation}`;
  eEl.style.display = "none";
  quizDiv.appendChild(eEl);

  const rubricEl = document.createElement("div");
  rubricEl.innerHTML = `<strong>Rubric:</strong>`;
  const list = document.createElement("ul");

  Object.entries(frq.rubric).forEach(([key, val]) => {
    const li = document.createElement("li");
    li.textContent = `${val.points} pts - ${val.description}`;
    list.appendChild(li);
  });

  rubricEl.appendChild(list);
  rubricEl.style.display = "none";
  quizDiv.appendChild(rubricEl);

  submitBtn.addEventListener("click", () => {
    aEl.style.display = "block";
    eEl.style.display = "block";
    rubricEl.style.display = "block";
    MathJax.typeset();
  });

  MathJax.typeset();
}


function populateUnitsForAP() {
  const unitSelect = document.getElementById("unitSelect");
  const ap = document.getElementById("apSelect").value;
  const apUnits = {
    "AP Calculus BC": [
      "Limits and Continuity",
      "Derivatives",
      "Applications of Derivatives",
      "Integrals",
      "Applications of Integrals",
      "Differential Equations",
      "Applications of Differential Equations",
      "Parametric, Polar, and Vector Functions",
      "Series",
      "Additional BC Topics"
    ],
    "AP Physics 1": [
      "Kinematics",
      "Forces and Newton’s Laws",
      "Work, Energy, and Power",
      "Systems of Particles and Linear Momentum",
      "Rotation",
      "Oscillations",
      "Gravitation"
    ],
    "AP Biology": [
      "Chemistry of Life",
      "Cell Structure and Function",
      "Cell Energetics",
      "Cell Communication and Cell Cycle",
      "Heredity",
      "Gene Expression and Regulation",
      "Natural Selection",
      "Ecology"
    ],
    "AP US History": [
      "1491–1607",
      "1607–1754",
      "1754–1800",
      "1800–1848",
      "1844–1877",
      "1865–1898",
      "1890–1945",
      "1945–1980",
      "1980–Present"
    ],
    "AP Precalculus": [
      "Polynomial and Rational Functions",
      "Exponential and Logarithmic Functions",
      "Trigonometric and Polar Functions",
      "Functions Involving Parameters, Vectors, and Matrices"
    ],
    "AP Computer Science Principles": [
      "Creative Development",
      "Data",
      "Algorithms and Programming",
      "Computer Systems and Networks",
      "Impact of Computing"
    ],
    "AP Chemistry": [
      "Atomic Structure and Properties",
      "Molecular and Ionic Compound Structure and Properties",
      "Intermolecular Forces and Properties",
      "Chemical Reactions",
      "Kinetics",
      "Thermodynamics",
      "Equilibrium",
      "Acids and Bases",
      "Applications of Thermodynamics"
    ],
    "AP Computer Science A": [
      "Primitive Types",
      "Using Objects",
      "Boolean Expressions and if Statements",
      "Iteration",
      "Writing Classes",
      "Array",
      "ArrayList",
      "2D Array",
      "Inheritance",
      "Recursion"
    ]
  };
  const units = apUnits[ap] || [];
  unitSelect.innerHTML = "";
  units.forEach((topic, index) => {
    const opt = document.createElement("option");
    opt.value = `Unit ${index+1}`;
    opt.textContent = `Unit ${index+1}: ${topic}`;
    unitSelect.appendChild(opt);
  });
}

populateUnitsForAP();
