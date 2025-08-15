// --- START OF FILE RoadmapEdit-daily-block-view.jsx ---


import React, { useState, useContext, useEffect, useMemo } from 'react';

// --- UPDATED: Imported all necessary icons from Heroicons ---
import {
  CheckCircleIcon as CheckCircleSolid,
  PlusIcon as PlusSolid,
  CalendarDaysIcon as  CalendarDaysSolid,
  RectangleStackIcon as RectangleStackSolid
} from '@heroicons/react/24/solid';
import {
  CheckCircleIcon as CheckCircleOutline,
  XCircleIcon as XCircleOutline,
    PlusCircleIcon as PlusCircleOutline,
  CalendarDaysIcon as  CalendarDaysOutline,
  RectangleStackIcon as RectangleStackOutline,
  TrashIcon  as  TrashOutline,
  PencilSquareIcon  as PencilSquareOutline,
  XMarkIcon as XMarkOutline,
  CheckIcon  as CheckOutline,
} from '@heroicons/react/24/outline';


import './RoadmapEdit.css'; // Your dedicated CSS for edit components
import { Context } from '../../Context';

// --- NEW: Helper function to expand multi-day tasks into daily instances ---
const expandTasksToDailyView = (tasks) => {
  const dailyTasks = [];
  tasks.forEach(task => {
    const duration = task.durationDays || 1;
    if (duration <= 1) {
      // For single-day tasks, just add the original task with a link to itself
      dailyTasks.push({ ...task, originalId: task.id, isExpanded: false });
    } else {
      // For multi-day tasks, create an entry for each day
      for (let i = 0; i < duration; i++) {
        const taskDate = new Date(task.date);
        taskDate.setDate(taskDate.getDate() + i);
        
        dailyTasks.push({
          ...task,
          id: `${task.id}-day-${i}`, // Create a new, unique ID for React's key
          originalId: task.id,       // Keep track of the original task
          date: taskDate.toISOString().split('T')[0], // The specific date for this instance
          task: `${task.task} (Day ${i + 1}/${duration})`, // Clarify in the title
          durationDays: 1, // Each expanded task is now just 1 day long
          isExpanded: true, // A flag to identify these instances
        });
      }
    }
  });
  return dailyTasks;
};


// Helper functions (Unchanged)
const formatDate = (dateStr, language = 'de') => {
  const date = new Date(dateStr);
  const daysDE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const daysEN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthsDE = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  const monthsEN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = language === 'de' ? daysDE : daysEN;
  const months = language === 'de' ? monthsDE : monthsEN;
  return {
    dayName: days[date.getDay()],
    day: date.getDate(),
    month: months[date.getMonth()],
    year: date.getFullYear(),
    fullDate: date.toLocaleDateString()
  };
};

const calculateEndTime = (startTime, hours) => {
  if (!startTime) return 'N/A';
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const totalMinutes = startHour * 60 + startMinute + (hours * 60);
  const endHour = Math.floor(totalMinutes / 60);
  const endMinute = totalMinutes % 60;
  return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
};

const formatDateForInput = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toISOString().split('T')[0];
};

// --- UPDATED: generateICS is now conditional based on the export view mode ---
const generateICS = (roadmapData, labels, exportAsDaily) => {
  const icsHeader = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//AI Coach//Roadmap//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH`;
  const icsFooter = `END:VCALENDAR`;
  let events = '';
  
  // CORRECTED: Use the actual emoji character. Calendar files are plain text
  // and cannot render React components.
  const checkmarkEmoji = '✅';

  if (exportAsDaily) {
    // --- DAILY VIEW EXPORT: Create a separate timed event for each day ---
    const dailyTasks = expandTasksToDailyView(roadmapData);
    events = dailyTasks.map(item => {
      if (!item.date) return '';
      const date = new Date(item.date);
      const [startHour, startMinute] = (item.dailyStartTime || '10:00').split(':').map(Number);
      const duration = item.dailyHours || 1;
      
      const startDate = new Date(date);
      startDate.setHours(startHour, startMinute, 0, 0);
      const endDate = new Date(startDate);
      endDate.setTime(startDate.getTime() + (duration * 60 * 60 * 1000));
      
      const startDateStr = startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const endDateStr = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      const isCompleted = item.completed;
      const summary = `${labels?.calendarEventPrefix || 'AI Coach'}: ${isCompleted ? checkmarkEmoji + ' ' : ''}${item.task}`;
      const description = `${labels?.taskLabel || 'Task'}: ${isCompleted ? '[Completed] ' : ''}${item.task}\\n\\n${labels?.startTimeLabel || 'START TIME'}: ${item.dailyStartTime || '10:00'}\\n${labels?.durationLabel || 'DURATION'}: ${item.dailyHours || 1} ${labels?.hoursLabel || 'hours'}\\n\\n${labels?.motivationLabel || 'Motivation'}: ${item.motivation}`;
      
      return `BEGIN:VEVENT\nUID:${item.id}@aicoach.com\nDTSTART:${startDateStr}\nDTEND:${endDateStr}\nSUMMARY:${summary}\nDESCRIPTION:${description}\nCATEGORIES:AI Coach,Personal Development\nSTATUS:CONFIRMED\nTRANSP:OPAQUE\nEND:VEVENT\n`;
    }).join('');

  } else {
    // --- TASK BLOCK EXPORT: Create a single all-day event spanning multiple days ---
    events = roadmapData.map(item => {
      if (!item.date) return '';
      
      const durationDays = item.durationDays || 1;
      const startDate = new Date(item.date);
      startDate.setUTCHours(0, 0, 0, 0); // Normalize to UTC start of day
      
      const endDate = new Date(startDate);
      endDate.setUTCDate(startDate.getUTCDate() + durationDays); // For all-day events, end date is exclusive

      const formatDateForICS = (d) => d.toISOString().split('T')[0].replace(/-/g, '');
      const startDateStr = formatDateForICS(startDate);
      const endDateStr = formatDateForICS(endDate);
      
      const isCompleted = item.completed;
      const summary = `${labels?.calendarEventPrefix || 'AI Coach'}: ${isCompleted ? checkmarkEmoji + ' ' : ''}${item.task}`;
      const totalHours = (item.dailyHours || 1) * durationDays;
      const description = `${labels?.taskLabel || 'Task'}: ${isCompleted ? '[Completed] ' : ''}${item.task}\\n\\n${labels?.taskDurationDaysLabel || 'DURATION'}: ${durationDays} day(s)\\n${labels?.taskDurationLabel || 'TOTAL DURATION'}: ${totalHours.toFixed(1)} ${labels?.hoursLabel || 'hours'}\\n\\n${labels?.motivationLabel || 'Motivation'}: ${item.motivation}`;
      
      return `BEGIN:VEVENT\nUID:${item.id}@aicoach.com\nDTSTART;VALUE=DATE:${startDateStr}\nDTEND;VALUE=DATE:${endDateStr}\nSUMMARY:${summary}\nDESCRIPTION:${description}\nCATEGORIES:AI Coach,Personal Development\nSTATUS:CONFIRMED\nTRANSP:OPAQUE\nEND:VEVENT\n`;
    }).join('');
  }
  
  return `${icsHeader}\n${events}${icsFooter}`;
};


const generateGoogleCalendarUrl = (task, data) => {
  const labels = data.roadmapLabels;
  const date = new Date(task.date);
  const [startHour, startMinute] = (task.dailyStartTime || '10:00').split(':').map(Number);
  const duration = task.dailyHours || 1;
  const startDate = new Date(date);
  startDate.setHours(startHour, startMinute, 0, 0);
  const endDate = new Date(startDate);
  endDate.setTime(startDate.getTime() + (duration * 60 * 60 * 1000));
  const startDateStr = startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const endDateStr = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const isCompleted = !!task.completed; 
  // CORRECTED: Use the actual emoji character here as well.
  const prefix = isCompleted ? '✅ ' : '';
  const label = isCompleted ? '[Completed] ' : '';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${prefix}${labels?.calendarEventPrefix || ''}: ${task.task}`,
    dates: `${startDateStr}/${endDateStr}`,
    details: `${label}${labels?.taskLabel || 'Task'}: ${task.task}\n\n${labels?.startTimeLabel || 'START TIME'}: ${task.dailyStartTime || '10:00'}\n${labels?.durationLabel || 'DURATION'}: ${task.dailyHours || 1} ${labels?.hoursLabel || 'hours'}\n\n${labels?.motivationLabel || 'Motivation'}: ${task.motivation}`,
    location: isCompleted ? `[Completed] ${labels?.calendarLocation || 'Personal Development'}` : labels?.calendarLocation || 'Personal Development'
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

// --- UPDATED: Component now accepts `isToday` prop to control UI elements ---
export default function Roadmap({ roadmapData, onRoadmapUpdate, titleDisplay2, titleDisplay3, isToday = false }) {
  const { data } = useContext(Context);
  const [editingTask, setEditingTask] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [localTasks, setLocalTasks] = useState([]);
  const [confirmationDialog, setConfirmationDialog] = useState(null);
  const [showDailyTasks, setShowDailyTasks] = useState(false);
  const [newTaskObject, setNewTaskObject] = useState(null); // --- MODIFIED: State for the temporary new task

  useEffect(() => {
    const initialTasks = (roadmapData || []).map((task, index) => ({
      ...task,
      id: task.id || `task-${new Date(task.date).getTime()}-${index}-${Math.random()}`,
      completed: !!task.completed,
      durationDays: task.durationDays || 1, 
    }));
    setLocalTasks(initialTasks);
  }, [roadmapData]);
  
  // --- MODIFIED: Combined sorted tasks with the temporary new task for display ---
  const displayedTasks = useMemo(() => {
    const sorted = [...localTasks].sort((a, b) => new Date(a.date) - new Date(b.date));
    const expandedTasks = showDailyTasks ? expandTasksToDailyView(sorted) : sorted;
    
    if (newTaskObject) {
      // If creating a new task, show it at the top, but don't expand it.
      return [newTaskObject, ...expandedTasks];
    }
    return expandedTasks;
  }, [localTasks, showDailyTasks, newTaskObject]);

  // --- MODIFIED: Logic to create a temporary task for editing, without saving it first ---
  const addNewTask = () => {
    // Prevent adding a new task if one is already being created or edited.
    if (newTaskObject || editingTask) return;

    const newId = `task-new-${Date.now()}`;
    const defaultData = {
      date: new Date().toISOString().split('T')[0],
      dailyStartTime: '10:00',
      dailyHours: 1,
      durationDays: 1,
      task: '', // Start with an empty task description
      motivation: '',
    };
    
    const tempTask = { id: newId, ...defaultData, completed: false, isNew: true };
    
    setNewTaskObject(tempTask);
    setEditingTask(newId);
    setEditedData(defaultData);
  };

  // --- MODIFIED: Prevent editing another task while creating a new one ---
  const startEditing = (task) => {
    if (newTaskObject) return;

    const originalTaskId = task.originalId || task.id;
    const taskToEdit = localTasks.find(t => t.id === originalTaskId);
    if (!taskToEdit) return;

    setEditingTask(originalTaskId);
    setEditedData({
      date: taskToEdit.date,
      dailyStartTime: taskToEdit.dailyStartTime || '10:00',
      dailyHours: taskToEdit.dailyHours || 1,
      durationDays: taskToEdit.durationDays || 1,
      task: taskToEdit.task || '',
      motivation: taskToEdit.motivation || ''
    });
  };
  
  const toggleTaskComplete = (idToToggle) => {
    if (onRoadmapUpdate) {
      const updatedTasks = localTasks.map(task =>
        task.id === idToToggle ? { ...task, completed: !task.completed } : task
      );
      onRoadmapUpdate(updatedTasks);
    }
  };

  // --- MODIFIED: Handles canceling both new and existing task edits ---
  const cancelEditing = () => {
    if (newTaskObject && editingTask === newTaskObject.id) {
      setNewTaskObject(null);
    }
    setEditingTask(null);
    setEditedData({});
  };

  // --- MODIFIED: Handles saving both new and existing tasks ---
  const saveTask = (idToSave) => {
    if (newTaskObject && idToSave === newTaskObject.id) {
      // Saving a new task
      const finalNewTask = { id: newTaskObject.id, ...editedData, completed: false };
      const updatedTasks = [...localTasks, finalNewTask].sort((a, b) => new Date(a.date) - new Date(b.date));
      if (onRoadmapUpdate) onRoadmapUpdate(updatedTasks);
      setNewTaskObject(null);
    } else {
      // Updating an existing task
      const updatedTasks = localTasks.map(task =>
        task.id === idToSave 
          ? { ...task, ...editedData }
          : task
      ).sort((a, b) => new Date(a.date) - new Date(b.date));
      if (onRoadmapUpdate) onRoadmapUpdate(updatedTasks);
    }
    
    setEditingTask(null);
    setEditedData({});
  };

  const showDeleteConfirmation = (task) => {
    const originalTask = localTasks.find(t => t.id === (task.originalId || task.id));
    setConfirmationDialog({ task: originalTask });
  };
  const cancelDelete = () => setConfirmationDialog(null);

  const confirmDelete = () => {
    if (!confirmationDialog) return;
    const { id } = confirmationDialog.task;
    const updatedTasks = localTasks.filter(t => t.id !== id);
    if (onRoadmapUpdate) onRoadmapUpdate(updatedTasks);
    setConfirmationDialog(null);
  };

  const updateEditedData = (field, value) => setEditedData(prev => ({ ...prev, [field]: value }));

  // --- UPDATED: Pass the current view mode to the ICS generator ---
  const downloadICS = () => {
    const icsContent = generateICS(localTasks, data.roadmapLabels, showDailyTasks);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = data.roadmapLabels?.icsFileName || 'ai-coach-roadmap.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && confirmationDialog) cancelDelete();
    };
    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [confirmationDialog]);
 
  const language = data.language || 'de';

  const totalTasks = localTasks.length;
  const completedTasksCount = localTasks.filter(t => t.completed).length;

  const totalHours = localTasks.reduce((sum, item) => {
    const durationInDays = item.durationDays || 1;
    return sum + ((item.dailyHours || 0) * durationInDays);
  }, 0);

  const completedHours = localTasks.reduce((sum, item) => {
    if (item.completed) {
      const durationInDays = item.durationDays || 1;
      return sum + ((item.dailyHours || 0) * durationInDays);
    }
    return sum;
  }, 0);

  const tasksPercentage = totalTasks > 0 ? (completedTasksCount / totalTasks) * 100 : 0;
  const hoursPercentage = totalHours > 0 ? (completedHours / totalHours) * 100 : 0;

  return (
    <div className="container">
       {confirmationDialog && (
         <div className="confirmation-overlay" onClick={cancelDelete}>
           <div className="confirmation-dialog" onClick={(e) => e.stopPropagation()}>
             <div className="confirmation-title">{data.roadmapLabels?.deleteConfirmTitle || 'Delete Task?'}</div>
             <div className="confirmation-message">{data.roadmapLabels?.deleteConfirmMessage || 'Are you sure you want to delete this task? This action cannot be undone.'}</div>
             <div className="confirmation-task-preview">"{confirmationDialog.task.task}"</div>
             <div className="confirmation-buttons">
               <button onClick={confirmDelete} className="confirm-button">{data.roadmapLabels?.deleteConfirmYes || 'Yes, Delete'}</button>
               <button onClick={cancelDelete} className="cancel-confirm-button">{data.roadmapLabels?.deleteConfirmNo || 'Cancel'}</button>
             </div>
           </div>
         </div>
       )}

       <div className="header">
        <div className="headerTitle">
          <h1 style={{display:titleDisplay3 }} className="title">{data.roadmapLabels?.title || 'Roadmap'}</h1>
          <h1 style={{display: titleDisplay2}} className="title">{data.roadmapLabels?.title2 || 'Daily Task'}</h1>
        </div>
        <p className="subtitle">{data.roadmapLabels?.subtitle || 'Your personalized learning roadmap'}</p>
        <div className="header-actions">
           {/* --- UPDATED: Conditionally render buttons based on the isToday prop --- */}
           {!isToday && (
            <>
              <button onClick={() => setShowDailyTasks(prev => !prev)} className="viewToggleButton">
                {showDailyTasks ? 
                  <><RectangleStackOutline 
                  
                  
                  style={{width:"25px"}} 
                  className="h-5 w-5 mr-1" /> {data.roadmapLabels?.showTaskBlocks || 'Show Task Blocks'}</> :
                  <><CalendarDaysOutline 
                    style={{width:"25px"}} 
                  className="h-5 w-5 mr-1" /> {data.roadmapLabels?.showDailyView || 'Show Daily View'}</>
                }
              </button>
              <button onClick={addNewTask} className="addNewButton">
                <PlusCircleOutline 
                style={{width:"25px"}}              
                  className="h-5 w-5 mr-1" /> {data.roadmapLabels?.addNewTask || 'Add New Task'}
              </button>
            </>
           )}
           
           <br/> <br/>

          <button style={{marginBottom:"10px"}} onClick={downloadICS} className="exportButton">
            <CalendarDaysOutline  className="h-5 w-5 mr-1" /> {data.roadmapLabels?.downloadICS || 'Download ICS'}
          </button>
           
           {/* --- UPDATED: Text is now dynamic based on the view mode --- */}
           {showDailyTasks ? '(as Daily View)' : '(as Task Blocks)'}
        </div>
      </div>

      <div className="grid">
        {displayedTasks.map((item) => {
          const dateInfo = formatDate(item.date, language);
          const isNew = !!item.isNew; // Check if it's the temporary new task
          const isCompleted = item.completed;
          const originalTaskId = item.originalId || item.id;
          const isEditing = editingTask === originalTaskId;

          const currentData = isEditing ? editedData : item;
          const endTime = calculateEndTime(currentData.dailyStartTime, currentData.dailyHours);
          const totalTaskHours = (currentData.dailyHours || 1) * (currentData.durationDays || 1);
          
          return (
            <div key={item.id} className={`card ${isCompleted ? 'cardCompleted' : ''} ${isNew ? 'card-new' : ''}`}>
            <div className="cardHeader">
                <div className="dateInfo">
                  {isEditing ? (
                    <div className="editable-date-container">
                      <input type="date" value={formatDateForInput(currentData.date)} onChange={(e) => updateEditedData('date', e.target.value)} className="date-input" disabled={item.isExpanded} />
                    </div>
                  ) : (
                    <>
                      <div className="dayName">{dateInfo.dayName}</div>
                      <div className="day">{dateInfo.day}</div>
                      <div className="monthYear">{dateInfo.month} {dateInfo.year}</div>
                    </>
                  )}
                </div>

                {/* --- UPDATED: Replaced emojis with Heroicons --- */}
                <button
                    onClick={() => toggleTaskComplete(originalTaskId)}
                    className={`icon-button complete-button-edit header-center-button ${isCompleted ? 'active' : 'inactive'}`}
                    title={isCompleted ? "Mark as Incomplete" : "Mark as Complete"}
                    disabled={isNew}
                >
                    {isCompleted ? 
                      <CheckCircleSolid 
                      className="h-6 w-6 text-green-500" /> : 
                      <CheckCircleOutline className="h-6 w-6 text-gray-400" />
                    }
                </button>
               
                  
 
                <button  onClick={() => showDeleteConfirmation(item)}          className="icon-button edit-button" title="delete"
                         disabled={isNew || item.isExpanded}
                  >
                      <TrashOutline
                      style={{width:"25px"}}
                      className="h-5 w-5" />
                    </button>
                  
                {/** 
                <button
                    onClick={() => showDeleteConfirmation(item)}
                    className="icon-button delete-button"
                   
                    title="Delete"
                    disabled={isNew || item.isExpanded}
                >

                    <TrashOutline
                     style={{width:"25px"}}
                    className="h-5 w-5" />
                </button>
                */}
                   
                    
              </div>
              
              <div className="timeSection">
                <div className="timeInfo">
                  <div className="timeLabel">{data.roadmapLabels?.dailyStartTimeLabel || 'DAILY START TIME'}</div>
                  {isEditing ? (
                    <input type="time" value={currentData.dailyStartTime || '10:00'} onChange={(e) => updateEditedData('dailyStartTime', e.target.value)} className="time-input" />
                  ) : (
                    <div className="timeValue">{currentData.dailyStartTime || '10:00'}</div>
                  )}
                </div>
                <div className="timeInfo">
                  <div className="timeLabel">{data.roadmapLabels?.dailyEndTimeLabel || 'DAILY END TIME'}</div>
                  <div className="timeValue">{endTime}</div>
                </div>
                <div className="timeInfo">
                  <div className="timeLabel">{data.roadmapLabels?.dailyDurationLabel || 'DAILY DURATION'}</div>
                  {isEditing ? (
                    <div className="duration-input-container">
                      <input type="number" value={currentData.dailyHours || 1} onChange={(e) => updateEditedData('dailyHours', parseFloat(e.target.value) || 1)} className="number-input" min="0.5" step="0.5" />
                      <span>{data.roadmapLabels?.hoursShort || 'h'}</span>
                    </div>
                  ) : (
                    <div className="timeValue">{currentData.dailyHours || 1}{data.roadmapLabels?.hoursShort || 'h'}</div>
                  )}
                </div>
              </div>

              {/* Hide the multi-day duration row for new tasks or when in daily view */}
              {!item.isExpanded && !isNew && (
                <div className="timeSection">
                    <div className="timeInfo">
                    <div className="timeLabel">{data.roadmapLabels?.taskDurationDaysLabel || 'TASK DURATION (DAYS)'}</div>
                    {isEditing ? (
                        <div className="duration-input-container">
                        <input type="number" value={currentData.durationDays || 1} onChange={(e) => updateEditedData('durationDays', parseInt(e.target.value, 10) || 1)} className="number-input" min="1" step="1" />
                        </div>
                    ) : (
                        <div className="timeValue">{currentData.durationDays || 1} day(s)</div>
                    )}
                    </div>
                    <div className="timeInfo">
                    <div className="timeLabel">{data.roadmapLabels?.taskDurationLabel || 'TASK DURATION'}</div>
                    <div className="timeValue timeValue-calculated">{totalTaskHours.toFixed(1)} {data.roadmapLabels?.hoursLabel || 'Hours'}</div>
                    </div>
                    <div className="timeInfo placeholder"></div>
                </div>
              )}
              { /* Show duration days input for new tasks */ }
              {isNew && isEditing && (
                 <div className="timeSection">
                    <div className="timeInfo">
                        <div className="timeLabel">{data.roadmapLabels?.taskDurationDaysLabel || 'TASK DURATION (DAYS)'}</div>
                        <div className="duration-input-container">
                            <input type="number" value={currentData.durationDays || 1} onChange={(e) => updateEditedData('durationDays', parseInt(e.target.value, 10) || 1)} className="number-input" min="1" step="1" />
                        </div>
                    </div>
                    <div className="timeInfo placeholder"></div>
                    <div className="timeInfo placeholder"></div>
                 </div>
              )}


              <div className="taskSection">
                <div className="sectionTitle">
                  {data.roadmapLabels?.taskLabel || 'TASK'}
                  {isEditing ? (
                    <div className="button-container">
                      <button onClick={() => saveTask(originalTaskId)} className="icon-button save-button" title="Save">
                        <CheckCircleOutline className="h-5 w-5" />
                      </button>
                      <button onClick={cancelEditing} className="icon-button cancel-button" title="Cancel">
                        <XCircleOutline  className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => startEditing(item)} className="icon-button edit-button" title="Edit">
                      <PencilSquareOutline  
                      style={{width:"25px"}}
                      className="h-5 w-5" />
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <textarea value={currentData.task || ''} onChange={(e) => updateEditedData('task', e.target.value)} className="edit-input" placeholder="Enter task description..." autoFocus />
                ) : (
                  <div className={`taskText ${isCompleted ? 'taskCompleted' : ''}`}>{item.task}</div>
                )}
              </div>

              <div className="taskSection">
                <div className="sectionTitle">{data.roadmapLabels?.motivationLabel || 'MOTIVATION'}</div>
                {isEditing ? (
                  <textarea value={currentData.motivation || ''} onChange={(e) => updateEditedData('motivation', e.target.value)} className="text-area" placeholder="Motivation..." />
                ) : (
                  <div className="motivationText">{currentData.motivation}</div>
                )}
              </div>
                
              <a href={generateGoogleCalendarUrl(item, data)} target="_blank" rel="noopener noreferrer" className={`googleCalendarLink ${isNew ? 'disabled-link' : ''}`}>
                <CalendarDaysOutline 
                 style={{width:"30px"}}
                  className="h-5 w-5 mr-1"/> {data.roadmapLabels?.addToGoogleCalendar || 'Add to Google Calendar'}
              </a>
            </div>
          );
        })}
      </div>
      
      <div className="progressContainer">
        <h2 className="progressTitle">{data.roadmapLabels?.progressTitle || 'Progress Overview'}</h2>
        <div style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          lineHeight: '1.4'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '120px', flexShrink: 0 }}>
              <div>{completedTasksCount.toFixed(1)} / {totalTasks.toFixed(1)}</div>
              <div>{data.roadmapLabels?.tasksCompleted || 'Tasks Completed'}</div>
            </div>
            <div style={{
              width: '160px',
              height: '21px',
              backgroundColor: '#D9D9D9',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${tasksPercentage}%`,
                height: '100%',
                backgroundColor: '#FFFACD',
                transition: 'width 0.3s'
              }}></div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '120px', flexShrink: 0 }}>
              <div>{completedHours.toFixed(1)} / {totalHours.toFixed(1)}</div>
              <div>{data.roadmapLabels?.completedHours || 'Completed Hours'}</div>
            </div>
            <div style={{
              width: '160px',
              height: '21px',
              backgroundColor: '#D9D9D9',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${hoursPercentage}%`,
                height: '100%',
                backgroundColor: '#FF69B4',
                transition: 'width 0.3s'
              }}></div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '120px', flexShrink: 0 }}>
              <div>{totalHours.toFixed(1)}</div>
              <div>{data.roadmapLabels?.totalHours || 'Total Hours'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}