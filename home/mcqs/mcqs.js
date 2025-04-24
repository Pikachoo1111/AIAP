const HACKCLUB_URL = 'https://ai.hackclub.com/chat/completions';

    document.getElementById("apSelect")
            .addEventListener("change", populateUnitsForAP);
    // document.getElementById("generateBtn")
            // .addEventListener("click", handleGenerate);

    async function generateMCQ() {
      const ap = document.getElementById("apSelect").value;
      const unit = document.getElementById("unitSelect").value;
      const output = document.getElementById("output");
      output.textContent = "Generating MCQ…";

      const prompt = `Generate one multiple-choice question for ${ap}, ${unit}.
The question should have four options (A, B, C, and D).
Clearly indicate the correct answer (A, B, C, or D).
Provide a brief explanation for why the answer is correct.
Return the response as a JSON object with the following schema:

{
  "question": "The question text",
  "choices": {
    "A": "Choice A text",
    "B": "Choice B text",
    "C": "Choice C text",
    "D": "Choice D text"
  },
  "answer": "Correct answer (A, B, C, or D)",
  "explanation": "Explanation of the correct answer"
}

Ensure the JSON response is valid and parsable.  
Do not include any text outside of the JSON structure. 
Make the question completely unrelated to any previous questions that have been created. 
Change all numbers and ensure that question styles are unique, so that no two questions are the same. 
Do not include any text outside of the JSON structure. 
You may use latex, but use $...$ for inline math and for math in the question, and $$...$$ for many line math, not to occur in the question under any circumstances
Ensure that the LaTex is valid, and uses the formatting of teh latest MathJax version.`;

      try {
        const res = await fetch(HACKCLUB_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { role: 'user', content: prompt }
            ]
          })
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`HTTP ${res.status}: ${errText}`);
        }

        const payload = await res.json();
        let content = payload.choices[0].message.content;

        // Trim off any stray text around the braces
        const first = content.indexOf('{');
        const last = content.lastIndexOf('}');
        if (first >= 0 && last >= 0) {
          content = content.slice(first, last + 1);
        }
        content = content.replace(/\\/g, '\\\\');


        const mcq = JSON.parse(content);
        const validationError = validateMCQ(mcq);
        if (validationError) {
          throw new Error("Invalid JSON structure: " + validationError);
        }
        return mcq;

      } catch (e) {
        console.error('generateMCQ error:', e);
        document.getElementById("output")
                .textContent = `Error generating MCQ: ${e.message}`;
      }
    }

    function validateMCQ(mcq) {
      if (!mcq) return "MCQ object is null or undefined";
      if (typeof mcq !== 'object') return "MCQ is not an object";
      if (!mcq.question || typeof mcq.question !== 'string')
        return "Missing or invalid 'question' property";
      if (!mcq.choices || typeof mcq.choices !== 'object')
        return "Missing or invalid 'choices' property";

      const c = mcq.choices;
      if (["A","B","C","D"].some(k => typeof c[k] !== 'string'))
        return "Missing or invalid choices (A, B, C, D)";
      if (!mcq.answer || !['A','B','C','D'].includes(mcq.answer))
        return "Invalid 'answer' value (must be A, B, C, or D)";
      if (!mcq.explanation || typeof mcq.explanation !== 'string')
        return "Missing or invalid 'explanation' property";
      return null;
    }

    async function handleGenerate() {
      const quizDiv = document.getElementById("quiz");
      quizDiv.innerHTML = "";
      const mcq = await generateMCQ();
      if (!mcq) return;

      // show question
      const qEl = document.createElement("p");
      qEl.textContent = mcq.question;
      quizDiv.appendChild(qEl);

      // build form
      const form = document.createElement("form");
      form.onsubmit = e => {
        e.preventDefault();
        const sel = form.querySelector("input[name='choice']:checked");
        if (!sel) return;
        const res = document.createElement("p");
        res.style.fontWeight = "bold";

        if (sel.value === mcq.answer) {
          res.textContent = `Correct! ${mcq.explanation}`;
          res.style.color = "green";
        } else {
          res.textContent = `Incorrect. Correct answer: ${mcq.answer}. ${mcq.explanation}`;
          res.style.color = "red";
        }
        quizDiv.appendChild(res);
        form.querySelectorAll("input").forEach(i => i.disabled = true);
        MathJax.typeset();

      };

      for (let L of ["A","B","C","D"]) {
        const label = document.createElement("label");
        label.style.display = "block";
        const inp = document.createElement("input");
        inp.type = "radio";
        inp.name = "choice";
        inp.value = L;
        label.appendChild(inp);
        label.append(` ${L}: ${mcq.choices[L]}`);
        form.appendChild(label);
      }

      form.appendChild(document.createElement("br"));
      const btn = document.createElement("button");
      btn.textContent = "Submit Answer";
      form.appendChild(btn);
      quizDiv.appendChild(form);
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
        const unitNum = index + 1;
        opt.value = `Unit ${unitNum}`;
        opt.textContent = `Unit ${unitNum}: ${topic}`;
        unitSelect.appendChild(opt);
      });
    }
    
    // initial populate
    populateUnitsForAP();
