import React, { useState } from 'react';

const GenerateMCQs = () => {
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Logging the data being sent
    console.log('Submitting data:', { subject, topic });

    // Set loading state
    setLoading(true);
    setError('');
    app.options('*', cors());
    try {
      // Sending request to the backend API
      const response = await fetch('https://orange-space-engine-p5vg5545x6jhr5vg-3001.app.github.dev/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, topic }),
      });

      // Log the full response object
      console.log('Response received:', response);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error from backend:', errorData.details); // Log error details from the backend
        setError('Failed to generate questions.');
        setLoading(false);
        return;
      }

      // If successful, parse and set the questions
      const data = await response.json();
      console.log('Generated Questions:', data); // Log the questions received from the backend
      setQuestions(data.questions);
    } catch (err) {
      console.error('Request failed:', err); // Log network or request errors
      setError('An error occurred while fetching the questions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Generate MCQs</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Subject:
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
        </label>
        <br />
        <label>
          Topic:
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
          />
        </label>
        <br />
        <button type="submit" disabled={loading}>Generate</button>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div>
        <h3>Generated Questions</h3>
        {questions.length > 0 ? (
          <ul>
            {questions.map((q, index) => (
              <li key={index}>
                <p>{q.question}</p>
                <ul>
                  {q.choices.map((choice, idx) => (
                    <li key={idx}>{choice}</li>
                  ))}
                </ul>
                <p>Answer: {q.answer}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No questions generated yet.</p>
        )}
      </div>
    </div>
  );
};

export default GenerateMCQs;
