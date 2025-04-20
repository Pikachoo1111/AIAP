const API_KEY = 'AIzaSyC_lV04Q41nSNg9k5qpL6aZUXM897eWtYU';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
document.getElementById("apSelect").addEventListener("change", populateUnitsForAP);

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
If neccesary, do not use latex and use plain text instead. 
This text is going to be shown in a plaintext html field and requires completely compatibility with that`;

    const endpoint = `${BASE_URL}?key=${API_KEY}`;

    const body = {
        contents: [{
            parts: [{ text: prompt }]
        }],
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
        },
    };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        }

        let responseText = (await response.json()).candidates[0].content.parts[0].text;
        const firstBrace = responseText.indexOf('{');
        const lastBrace = responseText.lastIndexOf('}');
        if (firstBrace > -1 && lastBrace > -1) {
            responseText = responseText.substring(firstBrace, lastBrace + 1);
        }

        const mcq = JSON.parse(responseText);
        const validationError = validateMCQ(mcq);
        if (validationError) throw new Error("Invalid JSON structure: " + validationError);

        return mcq;

    } catch (error) {
        console.error('generateMCQ error:', error);
        output.textContent = `Error generating MCQ: ${error.message}`;
    }
}

function validateMCQ(mcq) {
    if (!mcq) return "MCQ object is null or undefined";
    if (typeof mcq !== 'object') return "MCQ is not an object";
    if (!mcq.question || typeof mcq.question !== 'string') return "Missing or invalid 'question' property";
    if (!mcq.choices || typeof mcq.choices !== 'object') return "Missing or invalid 'choices' property";

    const choices = mcq.choices;
    if (["A", "B", "C", "D"].some(k => typeof choices[k] !== 'string')) {
        return "Missing or invalid choices (A, B, C, D)";
    }

    if (!mcq.answer || !['A', 'B', 'C', 'D'].includes(mcq.answer)) {
        return "Invalid 'answer' value (must be A, B, C, or D)";
    }

    if (!mcq.explanation || typeof mcq.explanation !== 'string') {
        return "Missing or invalid 'explanation' property";
    }

    return null;
}

async function handleGenerate() {
    const quizDiv = document.getElementById("quiz");
    quizDiv.innerHTML = "";
    const mcq = await generateMCQ();
    if (!mcq) return;

    const questionEl = document.createElement("p");
    questionEl.textContent = mcq.question;
    quizDiv.appendChild(questionEl);

    const form = document.createElement("form");
    form.onsubmit = function(e) {
      e.preventDefault();
      const selected = form.querySelector("input[name='choice']:checked");
      if (!selected) return;

      const result = document.createElement("p");
      result.style.fontWeight = "bold";
      if (selected.value === mcq.answer) {
        result.textContent = `Correct! ${mcq.explanation}`;
        result.style.color = "green";
      } else {
        result.textContent = `Incorrect. Correct answer: ${mcq.answer}. ${mcq.explanation}`;
        result.style.color = "red";
      }
      quizDiv.appendChild(result);
      form.querySelectorAll("input").forEach(input => input.disabled = true);
    };

    for (const letter of ["A", "B", "C", "D"]) {
      const label = document.createElement("label");
      label.style.display = "block";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "choice";
      input.value = letter;
      label.appendChild(input);
      label.append(` ${letter}: ${mcq.choices[letter]}`);
      form.appendChild(label);
    }

    const submitBtn = document.createElement("button");
    submitBtn.textContent = "Submit Answer";
    form.appendChild(document.createElement("br"));
    form.appendChild(submitBtn);

    quizDiv.appendChild(form);
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

    const unitCount = apUnits[ap] || 4;

    unitSelect.innerHTML = "";
    for (let i = 1; i <= unitCount; i++) {
        const option = document.createElement("option");
        option.value = `Unit ${i}`;
        option.textContent = `Unit ${i}`;
        unitSelect.appendChild(option);
    }
}
