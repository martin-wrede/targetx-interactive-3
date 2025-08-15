import React, { useState, useContext } from "react";
import { Context } from '../../Context';

export default function Form(props) {
  const [age, setAge] = useState(20);
  const [gender, setGender] = useState("männlich");
  const [country, setCountry] = useState("Deutschland");

  const { aiData, language } = useContext(Context); // ✅ Get language from context

  const [promptInfo, setPromptInfo] = useState({
    problem: "",
    solution: "",
    result: "",
    period: "",
    startDate: "",
    dailyStartTime: "",
    dailyHours: "",
    workDays: [],
    industry: ""
  });

  const [gesamtPrompt, setGesamtPrompt] = useState("");

  const weekDays = [
    { id: 'monday', label: aiData.workDays?.monday || 'Montag', short: aiData.workDaysShort?.monday || 'Mo' },
    { id: 'tuesday', label: aiData.workDays?.tuesday || 'Dienstag', short: aiData.workDaysShort?.tuesday || 'Di' },
    { id: 'wednesday', label: aiData.workDays?.wednesday || 'Mittwoch', short: aiData.workDaysShort?.wednesday || 'Mi' },
    { id: 'thursday', label: aiData.workDays?.thursday || 'Donnerstag', short: aiData.workDaysShort?.thursday || 'Do' },
    { id: 'friday', label: aiData.workDays?.friday || 'Freitag', short: aiData.workDaysShort?.friday || 'Fr' },
    { id: 'saturday', label: aiData.workDays?.saturday || 'Samstag', short: aiData.workDaysShort?.saturday || 'Sa' },
    { id: 'sunday', label: aiData.workDays?.sunday || 'Sonntag', short: aiData.workDaysShort?.sunday || 'So' }
  ];

  const [workDays, setWorkDays] = useState(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);

  const handleWorkDayToggle = (dayId) => {
    setWorkDays(prev =>
      prev.includes(dayId)
        ? prev.filter(day => day !== dayId)
        : [...prev, dayId]
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);

    setPromptInfo({
      problem: formData.get("problem"),
      solution: formData.get("solution"),
      result: formData.get("result"),
      period: formData.get("period"),
      startDate: formData.get("startDate"),
      dailyStartTime: formData.get("dailyStartTime"),
      dailyHours: formData.get("dailyHours"),
      workDays: workDays,
      industry: formData.get("industry"),
    });

    const AIRole = aiData.aiRolePrompt;
    const AIROle2 = aiData.aiRolePrompt2;

    const workDaysString = workDays.map(dayId =>
      weekDays.find(day => day.id === dayId)?.label
    ).join(', ');

    const prompt = aiData.promptTemplate.problem + formData.get("problem")
      + aiData.promptTemplate.solution + formData.get("solution")
      + aiData.promptTemplate.result + formData.get("result")
      + aiData.promptTemplate.period + formData.get("period")
      + aiData.promptTemplate.startDate + formData.get("startDate")
      + aiData.promptTemplate.dailyStartTime + formData.get("dailyStartTime")
      + aiData.promptTemplate.dailyHours + formData.get("dailyHours")
      + aiData.promptTemplate.workDays + workDaysString
      + aiData.promptTemplate.industry + formData.get("industry");

    const fullPrompt = AIRole + "\n\n" + prompt + AIRole2;

    console.log("Sending prompt to AI:", fullPrompt);
    console.log("Language passed to AI:", language);

    try {
      const response = await fetch("/functions/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: fullPrompt,
          lang: language,
        }),
      });

      const result = await response.json();
      console.log("AI response:", result);

      setGesamtPrompt(result?.choices?.[0]?.message?.content || "");
    } catch (error) {
      console.error("AI error:", error);
      setGesamtPrompt(
        language === "en"
          ? "Error retrieving AI response."
          : "Fehler beim Abrufen der AI-Antwort."
      );
    }

    props.onPromptChange(fullPrompt);
  };

  return (
    <div>
      {aiData.personalDataLabel}
      <br /><br />

      <form onSubmit={handleSubmit}>
        {aiData.ageLabel}
        <br />
        <input
          type="text"
          name="age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />
        <br /><br />

        {aiData.genderLabel}
        <br />
        <input
          type="text"
          name="gender"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
        />
        <br /><br />

        {aiData.countryLabel}
        <br />
        <input
          type="text"
          name="country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        />
        <br /><br /><br />

        <label>
          <b>{aiData.question1}</b><br />
          <input type="text" name="problem" required />
        </label>
        <br /><br />

        <label>
          <b>{aiData.question2}</b><br />
          <input type="text" name="solution" required />
        </label>
        <br /><br />

        <label>
          <b>{aiData.question3}</b><br />
          <input type="number" name="period" min="1" required />
        </label>
        <br /><br />

        <label>
          <b>{aiData.question4}</b><br />
          <em>{aiData.question4Hint}</em><br />
          <input type="text" name="result" required />
        </label>
        <br /><br />

        <label>
          <b>{aiData.question5}</b><br />
          <em>{aiData.question5Hint}</em><br />
          <input type="date" name="startDate" required />
        </label>
        <br /><br />

        <label>
          <b>{aiData.question6}</b><br />
          <em>{aiData.question6Hint}</em><br />
          <input type="time" name="dailyStartTime" required />
        </label>
        <br /><br />

        <label>
          <b>{data.question7}</b><br />
          <input type="number" name="dailyHours" min="1" max="12" required />
        </label>
        <br /><br />

        <label>
          <b>{data.question8}</b><br />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '5px' }}>
            {weekDays.map(day => (
              <label key={day.id} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={workDays.includes(day.id)}
                  onChange={() => handleWorkDayToggle(day.id)}
                  style={{ marginRight: '5px' }}
                />
                <span>{day.short}</span>
              </label>
            ))}
          </div>
          <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
            {data.workDaysSelected || 'Selected'}: {workDays.length} {workDays.length === 1 ? (data.workDaysSingular || 'Tag') : (data.workDaysPlural || 'Tage')}
          </small>
        </label>
        <br /><br />

        <label>
          <b>{data.question9}</b><br />
          <em>{data.question9Hint}</em><br />
          <input type="text" name="industry" required />
        </label>
        <br /><br />

        <br />
        <button className="button" type="submit">
          {data.submitButton}
        </button>
      </form>

      <br />
     {gesamtPrompt && (
        <div style={{ marginTop: "2rem", whiteSpace: "pre-wrap" }}>
          <strong>{language === "en" ? "AI Response:" : "Antwort der KI:"}</strong><br />
          {gesamtPrompt}
        </div>
      )}
    </div>
  );
}

