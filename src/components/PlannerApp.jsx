
// --- START OF FILE App.jsx ---

import React, { useState, useEffect, useContext, useMemo } from 'react';

 import Form from './chatbot/Form';
 import ChatInterface from './chatbot/ChatInterface';
import RoadmapEdit from './chatbot/RoadmapEdit';
import  SVGTimeline from './chatbot/SVGTimeline';
import { useUndoRedo } from '../hooks/useUndoRedo'; 
import { Context } from '../Context';
import * as fileUtils from './utils/fileUtils';
import './PlannerApp.css';


// --- NEW: Helper function copied from RoadmapEdit to be used here ---
const expandTasksToDailyView = (tasks) => {
  const dailyTasks = [];
  if (!tasks) return dailyTasks;
  
  tasks.forEach(task => {
    const duration = task.durationDays || 1;
    if (duration <= 1) {
      dailyTasks.push({ ...task, originalId: task.id, isExpanded: false });
    } else {
      for (let i = 0; i < duration; i++) {
        const taskDate = new Date(task.date);
        taskDate.setHours(12,0,0,0); // Avoid timezone issues
        taskDate.setDate(taskDate.getDate() + i);
        
        dailyTasks.push({
          ...task,
          id: `${task.id}-day-${i}`, 
          originalId: task.id,
          date: taskDate.toISOString().split('T')[0],
          task: `${task.task} (Day ${i + 1}/${duration})`,
          durationDays: 1,
          isExpanded: true,
        });
      }
    }
  });
  return dailyTasks;
};


// This function remains the same
const calculateDateFromOffset = (startDateString, dayOffset, workDays) => {
  if (!startDateString || workDays.length === 0) {
      console.warn("calculateDateFromOffset called with invalid inputs. Falling back to today's date.");
      return new Date().toISOString().split('T')[0];
  }

  const workDayNumbers = workDays.map(day => {
    const map = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0 };
    return map[day];
  });


  let currentDate = new Date(startDateString);
  currentDate.setHours(12, 0, 0, 0); 
  let daysCounted = 0;
  let safetyNet = 0; 
  
  while (daysCounted < dayOffset && safetyNet < 3650) {
    if (workDayNumbers.includes(currentDate.getDay())) {
      daysCounted++;
    }
    if (daysCounted < dayOffset) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    safetyNet++;
  }
  return currentDate.toISOString().split('T')[0];
};

/**
 * UPDATED FUNCTION: Rescales task day_offsets to fit a target duration.
 * Now handles both stretching and compressing the timeline.
 * @param {Array} tasks - The array of task objects from the AI.
 * @param {number} targetTotalWorkDays - The total number of work days the plan should cover.
 * @returns {Array} The tasks with their day_offset values recalculated.
 */
const rescaleTaskOffsets = (tasks, targetTotalWorkDays) => {
  if (!tasks || tasks.length === 0) {
    return [];
  }

  const offsets = tasks.map(t => t.day_offset);
  const minAiDay = Math.min(...offsets);
  const maxAiDay = Math.max(...offsets);
  // Ensure aiPlanDuration is at least 1 to avoid division by zero
  const aiPlanDuration = Math.max(1, maxAiDay - minAiDay + 1);

  // --- THIS IS THE KEY CHANGE ---
  // The old logic prevented compression. This new logic allows it.
  // We only skip rescaling if the plan is a single day or already matches the target.
  if (aiPlanDuration === 1 || aiPlanDuration === targetTotalWorkDays) {
    return tasks;
  }
  
  const rescaledTasks = tasks.map(task => {
    // How far through the AI plan is this task (from 0.0 to 1.0)?
    // If the plan is 1 day long, avoid division by zero.
    const relativePosition = aiPlanDuration > 1 
      ? (task.day_offset - minAiDay) / (aiPlanDuration - 1)
      : 0;
    
    // Map that relative position onto the new timeline (stretching or compressing)
    const newOffset = 1 + Math.round(relativePosition * (targetTotalWorkDays - 1));
    
    return { ...task, day_offset: newOffset };
  });

  return rescaledTasks;
};


export default  function PlannerApp() {
 
  
   const { aiData } = useContext(Context);

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [gesamtPrompt, setGesamtPrompt] = useState("");
  // const [roadmapData, setRoadmapData] = useState([]);
  const [roadmapToday, setRoadmapToday] = useState([]);
  const [roadmapContext, setRoadmapContext] = useState('');
  
  const [projectStartDate, setProjectStartDate] = useState('');
  const [workDays, setWorkDays] = useState(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
  const [projectPeriod, setProjectPeriod] = useState(4); 
  const initialRoadmapData = []; 
  const {
    state: roadmapData,
    setState: setRoadmapData,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo(initialRoadmapData);
  
  // This function is passed to the timeline and other components.
  // When they call it, a new state is automatically saved to our history.
  const handleTaskUpdate = (newRoadmapData) => {
    setRoadmapData(newRoadmapData);
  };
  
  // Example state for the 'Show Completed' toggle, managed locally
  const [showCompleted, setShowCompleted] = React.useState(true);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const contextString = `Current Project Plan (as JSON):\n${JSON.stringify(roadmapData, null, 2)}`;
    setRoadmapContext(contextString);
  }, [roadmapData]);
  
  // --- MODIFIED: This logic is now much simpler and more accurate ---
  useEffect(() => {
    // 1. First, expand all multi-day tasks into a flat list of single-day instances.
    const allDailyInstances = expandTasksToDailyView(roadmapData);
    
    // 2. Then, simply filter that list for tasks that match today's date.
    const tasksForToday = allDailyInstances.filter(task => task.date === today);

    // 3. Set the state. The `RoadmapEdit` component will now receive correctly formatted daily tasks.
    setRoadmapToday(tasksForToday);
  }, [roadmapData, today]);

// [THE FIX] Define the constant here
const MS_PER_DAY = 1000 * 60 * 60 * 24;
 // [THE FIX] Replace your existing handleRoadmapUpdate with this one.
  const handleRoadmapUpdate = (updatedData) => {
    // 1. Check if the data is coming from a component that uses start/end format.
    const isStartEndFormat = updatedData.length > 0 && updatedData[0].hasOwnProperty('start');

    let processedData;

    if (isStartEndFormat) {
      // 2. If it's from SVGTimeline (start/end), convert it to the app's native format.
      processedData = updatedData.map(task => {
        // Guard against any malformed tasks
        if (!task.start || !task.end) {
          console.warn("Skipping task update due to missing start/end date:", task);
          return task;
        }

        const startDate = new Date(task.start);
        const endDate = new Date(task.end);
        
        // Calculate duration in days. The `+ 1` makes it inclusive.
        // (e.g., July 1 to July 1 is 1 day, not 0).
        const durationMs = endDate.getTime() - startDate.getTime();
        const durationDays = Math.round(durationMs / MS_PER_DAY) + 1;
        
        // Create a new object to avoid direct state mutation issues.
        const newTask = { ...task };
        
        // Set the properties that the rest of the app (like RoadmapEdit) expects.
        newTask.date = task.start; // The primary date is the start date.
        newTask.durationDays = Math.max(1, durationDays);

        // It's good practice to clean up the temporary properties.
        delete newTask.start;
        delete newTask.end;
        delete newTask.track; // 'track' is also temporary for the SVG timeline.

        return newTask;
      });
    } else {
      // 3. If it's not start/end, assume it's from RoadmapEdit and already in the correct format.
      processedData = updatedData;
    }

    // 4. Now that ALL data is in the consistent `{ date, durationDays, ... }` format, we can sort it.
    processedData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // 5. Update the central state. This will trigger a re-render for ALL components.
    setRoadmapData(processedData);
  };

  const processAIResponse = (content) => {
    const defaultMotivation = aiData?.chat_defaultMotivation || 'Erreiche dein Ziel!';
    const icsContents = fileUtils.extractIcsContent(content);
    const jsonContents = fileUtils.extractJsonContent(content);
    
    let allNewEvents = [];
    
    if (jsonContents.length > 0) {
      jsonContents.forEach(jsonString => {
         try {
            let tasksWithOffsets = JSON.parse(jsonString);

            if (Array.isArray(tasksWithOffsets)) {
              // Calculate the total number of work days the user wants the project to span
              const targetTotalWorkDays = projectPeriod * workDays.length;
              
              // Rescale the AI's plan to fit the user's desired duration
              const rescaledTasks = rescaleTaskOffsets(tasksWithOffsets, targetTotalWorkDays);

              const newEvents = rescaledTasks.map(task => ({
                task: task.task,
                dailyHours: task.dailyHours || 1,
                date: calculateDateFromOffset(projectStartDate, task.day_offset, workDays), 
                dailyStartTime: task.dailyStartTime || '10:00',
                motivation: task.motivation || defaultMotivation, 
              }));
              allNewEvents.push(...newEvents);
            }
          } catch (e) {
            console.error("Failed to parse AI JSON response:", e);
            setMessages(prev => [...prev, { role: 'system', content: `Error: The AI's response was not in the expected format and could not be imported. Please try again. Details: ${e.message}` }]);
          }
      });
    } else if (icsContents.length > 0) {
      icsContents.forEach(ics => {
        allNewEvents.push(...fileUtils.parseIcsToRoadmapData(ics, defaultMotivation));
      });
    }

    if (allNewEvents.length > 0) {
      // Sort first by date, then by original task order to keep clustered tasks sequential
      allNewEvents.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) {
            return dateA - dateB;
        }
        // If dates are the same, we don't have an original index, so keep it stable.
        return 0;
      });
      setRoadmapData(allNewEvents);
      setTimeout(() => {
        const successMessage = (aiData?.chat_autoImportSuccess || 'Automatisch {count} Termine importiert!').replace('{count}', allNewEvents.length);
        setMessages(prev => [...prev, { role: 'system', content: successMessage }]);
      }, 500);
    }

    const icsDownloadLinks = icsContents.map((ics, i) => fileUtils.createIcsDownloadLink(ics, `kalender-${i+1}.ics`));
    const jsonDownloadLinks = jsonContents.map((json, i) => fileUtils.createJsonDownloadLink(json, `roadmap-${i+1}.json`));
    
    return {
      content: content.replace(/```json\n?([\s\S]*?)```/g, "✅ Plan successfully imported! See the updated roadmap and timeline below."),
      downloadLinks: [...jsonDownloadLinks, ...icsDownloadLinks],
      importedEvents: allNewEvents.length,
    };
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    for (const file of files) {
      try {
        const content = await file.text();
        let fileType = 'text';
        let parsedEvents = [];
        const defaultMotivation = aiData?.chat_defaultMotivation || 'Erreiche dein Ziel!';

        if (file.name.endsWith('.ics')) {
          fileType = 'calendar';
          parsedEvents = fileUtils.parseIcsToRoadmapData(content, defaultMotivation);
        } else if (file.name.endsWith('.json')) {
          fileType = 'json';
          parsedEvents = fileUtils.parseJsonToRoadmapData(content, defaultMotivation);
        }

        if (parsedEvents.length > 0) {
          setRoadmapData(parsedEvents);
        }

        setUploadedFiles(prev => [...prev, {
          id: Date.now() + Math.random(), name: file.name, content, type: fileType, size: file.size
        }]);
      } catch (error) {
        console.error('Error reading file:', error);
      }
    }
    event.target.value = '';
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() && uploadedFiles.length === 0) return;

    const fileContext = uploadedFiles.map(f => `[Datei: ${f.name}]\n${f.content}`).join('\n\n---\n\n');
    const messageContent = `${inputMessage}\n\n${fileContext}`.trim();
    const userMessage = { role: 'user', content: messageContent };
    
    const conversationHistory = [...messages]; 

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          messages: conversationHistory,
          files: uploadedFiles,
          prompt: gesamtPrompt,
          roadmap: roadmapContext,
        }),
      });
      
       if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }

      const responseData = await response.json();
      const aiContent = responseData.choices?.[0]?.message?.content || 'Fehler: Keine Antwort erhalten.';
      
      const processed = processAIResponse(aiContent);
      const assistantMessage = { role: 'assistant', ...processed };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: `Fehler bei der Verarbeitung Ihrer Anfrage. Details: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  
// Create the data specifically for SVGTimeline
  const timelineCompatibleData = useMemo(() => {
    return roadmapData
      // [FIX] Filter out any tasks that don't have a valid date property
      .filter(task => task && task.date && typeof task.date === 'string')
      .map((task, index) => {
        const startDate = new Date(task.date);
        const endDate = new Date(startDate);
        
        // Calculate end date based on duration. Defaults to 1 day.
        // Subtract 1 because a 1-day task starts and ends on the same day.
        const durationInDays = Math.max(1, task.durationDays || 1);
        endDate.setDate(startDate.getDate() + durationInDays - 1);

        return {
          // Keep original data
          ...task,
          // Add/overwrite properties needed by SVGTimeline
          id: task.id || `task-${index}`,
          track: index + 1, // Assign a track number
          start: task.date,
          end: endDate.toISOString().split('T')[0],
          // Provide a default color scheme
          color: ['#3ecf8e', '#ffc107', '#ff7043', '#42a5f5'][index % 4]
        };
      });
  }, [roadmapData]); // This will re-calculate only when roadmapData changes

  return (
    <div className="app-container">
   
      <div id="part1" style={{ display: "block" }}>
        <h2>{aiData?.app_Headline1}</h2>
        <div id="form-all-id">
          <Form 
            onPromptChange={setGesamtPrompt} 
            onStartDateChange={setProjectStartDate}
            onWorkDaysChange={setWorkDays}
            onPeriodChange={setProjectPeriod} 
          />
        </div>
        {gesamtPrompt && (
          <div className="active-prompt-display">
            <strong>{aiData?.chat_activePromptLabel || 'Aktiver Prompt'}:</strong> Ready to generate plan.
          </div>
        )}
        
        <ChatInterface
            data={aiData}
            messages={messages}
            isLoading={isLoading}
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            uploadedFiles={uploadedFiles}
            handleFileUpload={handleFileUpload}
            deleteFile={deleteFile}
            sendMessage={sendMessage}
        />
      </div>

      <div id="part2" style={{ display: "block" }}>
        {roadmapToday.length > 0 ? (
          <RoadmapEdit 
            titleDisplay2='block' 
            titleDisplay3='none' 
            roadmapData={roadmapToday} 
            isToday={true} 
            onRoadmapUpdate={handleRoadmapUpdate} 
          />
        ) : (
          <div className="info-box">
            {(aiData?.chat_noTasksToday || 'No Tasks for today! ({today})').replace('{today}', today)}
          </div>
        )}
      </div>

      <div id="part3" style={{ display:  "block"}}>
        <h2>{aiData?.app_Headline3}</h2>
        <p className="info-box">
          <strong>ℹ️ {aiData?.chat_infoLabel || 'Info'}:</strong>
          {' '}
          {(aiData?.chat_roadmapInfo || 'Der Projektplan wird automatisch aktualisiert, wenn die KI Kalenderdaten erstellt. Aktuell werden {count} Termine angezeigt.').replace('{count}', roadmapData.length)}
        </p>
        <RoadmapEdit
          roadmapData={roadmapData}
          onRoadmapUpdate={handleRoadmapUpdate}
          titleDisplay2='none'
          titleDisplay3='block'
        />
      </div>

   <div id="part4" style={{ display:  "block" }} 
    className="component-wrapper"
   >
        <h2>Interactive SVG Timeline</h2>
           <div className="controls-bar" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={undo} disabled={!canUndo}>
          Undo
        </button>
        <button onClick={redo} disabled={!canRedo}>
          Redo
        </button>
      </div>
        <SVGTimeline 
        //   roadmapData={roadmapData} 
      
         roadmapData={timelineCompatibleData} 
          onTaskUpdate={handleRoadmapUpdate} 
             
        showCompleted={showCompleted}
        onToggleShowCompleted={() => setShowCompleted(p => !p)}

           style={{ minWidth: "100%" }}
        />
            
      </div> 
      <br/>
       <br/>
        <br/>
    </div>
  );
}