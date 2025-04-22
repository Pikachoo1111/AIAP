const HACKCLUB_URL = 'https://ai.hackclub.com/chat/completions';

    document.getElementById("apSelect")
            .addEventListener("change", populateUnitsForAP);
    document.getElementById("generateBtn")
            .addEventListener("click", handleGenerate);

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
You may use latex, but use $...$ for inline math and for math in the question, and $$...$$ for many line math, not to occur in the question under any circumstances`;

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
        "AP Calculus BC": 10,
        "AP Physics 1": 7,
        "AP Biology": 8,
        "AP US History": 9,
        "AP Precalculus": 4,
        "AP Computer Science Principles": 5,
        "AP Chemistry": 9,
        "AP Computer Science A": 10
      };
      const count = apUnits[ap] || 4;
      unitSelect.innerHTML = "";
      for (let i = 1; i <= count; i++) {
        const opt = document.createElement("option");
        opt.value = `Unit ${i}`;
        opt.textContent = `Unit ${i}`;
        unitSelect.appendChild(opt);
      }
    }

    // initial populate
    populateUnitsForAP();
