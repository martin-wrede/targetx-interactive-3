import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";

// --- Constants & Defaults ---
const TRACK_HEIGHT = 40;
const BAR_HEIGHT = 20;
const LABEL_WIDTH = 100;
const RESIZE_HANDLE_WIDTH = 8;
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const HEADER_HEIGHT = 50;
const PADDING_TOP = 10;
const CONTROLS_HEIGHT = 40;
const DEFAULT_WORKING_DAYS = [1, 2, 3, 4, 5]; // Mon, Tue, Wed, Thu, Fri
const MINIMUM_TIMELINE_DAYS = 31;

// --- Utility Functions for Working Day Calculations (Unchanged) ---
function addWorkingDays(date, daysToAdd, workingDays) {
  const newDate = new Date(date);
  newDate.setHours(12, 0, 0, 0);
  let daysAdded = 0;
  const increment = daysToAdd > 0 ? 1 : -1;
  while (daysAdded < Math.abs(daysToAdd)) {
    newDate.setDate(newDate.getDate() + increment);
    if (workingDays.includes(newDate.getDay())) {
      daysAdded++;
    }
  }
  return newDate;
}

function calculateWorkingDaysDuration(start, end, workingDays) {
  let count = 0;
  const current = new Date(start);
  const endDate = new Date(end);
  current.setHours(12, 0, 0, 0);
  endDate.setHours(12, 0, 0, 0);
  if (current > endDate) return 1;
  while (current <= endDate) {
    if (workingDays.includes(current.getDay())) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return Math.max(1, count);
}

export default function SVGTimeline({
  roadmapData = [],
  onTaskUpdate,
  workingDays = DEFAULT_WORKING_DAYS,
  showCompleted: showCompletedProp,
  onToggleShowCompleted: onToggleShowCompletedProp,
}) {
  // --- State and Refs (Unchanged) ---
  const [dragState, setDragState] = useState(null);
  const [tempUpdates, setTempUpdates] = useState({});
  const [containerWidth, setContainerWidth] = useState(0);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [selectionBox, setSelectionBox] = useState(null);
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  
  const [respectWeekends, setRespectWeekends] = useState(true);
  const [internalShowCompleted, setInternalShowCompleted] = useState(true);

  const [scalePercentage, setScalePercentage] = useState(100);
  
  const showCompleted = showCompletedProp !== undefined ? showCompletedProp : internalShowCompleted;
  const handleToggleShowCompleted = onToggleShowCompletedProp || (() => setInternalShowCompleted(p => !p));
  
  const visibleTasks = useMemo(() => {
    return showCompleted ? roadmapData : roadmapData.filter(task => !task.completed);
  }, [roadmapData, showCompleted]);

  // --- Setup Hooks (Unchanged) ---
    useEffect(() => {
    const observer = new ResizeObserver(entries => {
      if (entries[0]) setContainerWidth(entries[0].contentRect.width);
    });
    const currentContainer = containerRef.current;
    if (currentContainer) observer.observe(currentContainer);
    return () => {
      if (currentContainer) observer.unobserve(currentContainer);
    };
  }, []);

  const { timelineStartDate, pixelsPerDay, totalDays } = useMemo(() => {
    const validTasks = roadmapData.filter(task => task && task.start && task.end);
    if (validTasks.length === 0 || containerWidth === 0) {
      const startDate = new Date();
      return { timelineStartDate: startDate, pixelsPerDay: 20, totalDays: MINIMUM_TIMELINE_DAYS };
    }
    const allDates = validTasks.flatMap(task => [new Date(task.start), new Date(task.end)]);
    const validDates = allDates.filter(date => !isNaN(date.getTime()));
    if (validDates.length === 0) {
        const startDate = new Date();
        return { timelineStartDate: startDate, pixelsPerDay: 20, totalDays: MINIMUM_TIMELINE_DAYS };
    }
    const minDate = new Date(Math.min(...validDates));
    const maxDate = new Date(Math.max(...validDates));

    const startDate = new Date(minDate);
    startDate.setDate(minDate.getDate() - 2);

    const dataDrivenEndDate = new Date(maxDate);
    dataDrivenEndDate.setDate(maxDate.getDate() + 2);

    const minimumDurationEndDate = new Date(startDate);
    minimumDurationEndDate.setDate(startDate.getDate() + MINIMUM_TIMELINE_DAYS);

    const endDate = new Date(Math.max(dataDrivenEndDate, minimumDurationEndDate));

    const totalDaysValue = Math.max(1, (endDate - startDate) / MS_PER_DAY);
    const availableWidth = containerWidth - LABEL_WIDTH;
    const pixelsPerDayValue = availableWidth > 0 ? availableWidth / totalDaysValue : 0;

    return { timelineStartDate: startDate, pixelsPerDay: pixelsPerDayValue, totalDays: totalDaysValue };
  }, [roadmapData, containerWidth]);

  const dateToX = useCallback(date => ((new Date(date) - timelineStartDate) / MS_PER_DAY) * pixelsPerDay, [timelineStartDate, pixelsPerDay]);
  const getMousePosInSVG = useCallback(e => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const CTM = svg.getScreenCTM();
    return { x: (e.clientX - CTM.e) / CTM.a, y: (e.clientY - CTM.f) / CTM.d };
  }, []);

  const getTaskGeometry = useCallback((task) => {
    const yIndex = visibleTasks.findIndex(t => t.id === task.id);
    if (yIndex === -1) return null;
    const x = dateToX(task.start) + LABEL_WIDTH;
    const width = Math.max(pixelsPerDay / 2, dateToX(task.end) - dateToX(task.start) + pixelsPerDay);
    const y = yIndex * TRACK_HEIGHT + 10 + HEADER_HEIGHT + PADDING_TOP + CONTROLS_HEIGHT;
    return { x, y, width, height: BAR_HEIGHT };
  }, [visibleTasks, dateToX, pixelsPerDay]);
  
  // --- Event Handlers (Unchanged logic for mousedown, mousemove, mouseup) ---
  const handleMouseDown = (e, task, type) => {
    e.preventDefault();
    e.stopPropagation();
    const { x } = getMousePosInSVG(e);
    let currentSelection = selectedTaskIds;
    if (!e.shiftKey && !selectedTaskIds.includes(task.id)) {
        currentSelection = [task.id];
    } else if (e.shiftKey && !selectedTaskIds.includes(task.id)) {
        currentSelection = [...selectedTaskIds, task.id];
    }
    setSelectedTaskIds(currentSelection);
    
    document.body.style.cursor = type === 'move' ? 'grabbing' : 'ew-resize';
    const originalSelection = roadmapData.filter(t => currentSelection.includes(t.id));
    setDragState({ type, initialMouseX: x, originalSelection, singleTaskId: task.id });
    setTempUpdates({});
  };

  const handleContainerMouseDown = (e) => {
    e.preventDefault();
    const { y } = getMousePosInSVG(e);
    if (y < CONTROLS_HEIGHT + PADDING_TOP) {
      return;
    }
    setSelectedTaskIds([]);
    const { x } = getMousePosInSVG(e);
    setSelectionBox({ startX: x, startY: y, currentX: x, currentY: y });
  };

  const handleMouseMove = useCallback((e) => {
    const { x: currentMouseX, y: currentMouseY } = getMousePosInSVG(e);
    if (selectionBox && !dragState) {
      setSelectionBox(prev => ({ ...prev, currentX: currentMouseX, currentY: currentMouseY }));
      return;
    }
    if (!dragState || pixelsPerDay === 0) return;
    const dx = currentMouseX - dragState.initialMouseX;
    const dayDelta = Math.round(dx / pixelsPerDay);
    const newUpdates = {};
    if (respectWeekends) {
        if (dragState.type === 'move') {
            dragState.originalSelection.forEach(task => {
                const newStart = addWorkingDays(task.start, dayDelta, workingDays);
                const duration = calculateWorkingDaysDuration(task.start, task.end, workingDays);
                const newEnd = addWorkingDays(newStart, duration - 1, workingDays);
                newUpdates[task.id] = { ...task, start: newStart.toISOString().split('T')[0], end: newEnd.toISOString().split('T')[0] };
            });
        } else {
            const task = dragState.originalSelection.find(t => t.id === dragState.singleTaskId);
            if (!task) return;
            let newStart = new Date(task.start), newEnd = new Date(task.end);
            if (dragState.type === 'resize-start') newStart = addWorkingDays(task.start, dayDelta, workingDays);
            else if (dragState.type === 'resize-end') newEnd = addWorkingDays(task.end, dayDelta, workingDays);
            if (newStart > newEnd) newStart = newEnd;
            if (newEnd < newStart) newEnd = newStart;
            newUpdates[task.id] = { ...task, start: newStart.toISOString().split('T')[0], end: newEnd.toISOString().split('T')[0] };
        }
    } else {
        dragState.originalSelection.forEach(task => {
            if (dragState.type === 'move' || task.id === dragState.singleTaskId) {
                const originalStart = new Date(task.start), originalEnd = new Date(task.end);
                let newStart = new Date(originalStart), newEnd = new Date(originalEnd);
                if (dragState.type === 'move') {
                    newStart.setDate(originalStart.getDate() + dayDelta);
                    newEnd.setDate(originalEnd.getDate() + dayDelta);
                } else if (dragState.type === 'resize-start') {
                    newStart.setDate(originalStart.getDate() + dayDelta);
                    if (newStart > newEnd) newStart = newEnd;
                } else if (dragState.type === 'resize-end') {
                    newEnd.setDate(originalEnd.getDate() + dayDelta);
                    if (newEnd < newStart) newEnd = newStart;
                }
                newUpdates[task.id] = { ...task, start: newStart.toISOString().split('T')[0], end: newEnd.toISOString().split('T')[0] };
            }
        });
    }
    setTempUpdates(newUpdates);
  }, [dragState, selectionBox, getMousePosInSVG, pixelsPerDay, respectWeekends, workingDays]);

  const handleMouseUp = useCallback(() => {
    if (selectionBox) {
        const { startX, startY, currentX, currentY } = selectionBox;
        const box = { x1: Math.min(startX, currentX), y1: Math.min(startY, currentY), x2: Math.max(startX, currentX), y2: Math.max(startY, currentY) };
        const ids = visibleTasks.filter(task => {
            const geom = getTaskGeometry(task);
            return geom && box.x1 < geom.x + geom.width && box.x2 > geom.x && box.y1 < geom.y + geom.height && box.y2 > geom.y;
        }).map(task => task.id);
        setSelectedTaskIds(ids);
        setSelectionBox(null);
    }
    if (dragState) {
        if (onTaskUpdate && Object.keys(tempUpdates).length > 0) {
            const updatedData = roadmapData.map(task => tempUpdates[task.id] || task);
            onTaskUpdate(updatedData);
        }
        document.body.style.cursor = 'default';
        setDragState(null);
        setTempUpdates({});
    }
  }, [selectionBox, dragState, tempUpdates, roadmapData, onTaskUpdate, visibleTasks, getTaskGeometry]);

  // --- MODIFIED --- This function is rewritten for proportional group scaling
  const handleScaleApply = useCallback(() => {
    if (selectedTaskIds.length === 0 || isNaN(scalePercentage) || !onTaskUpdate) return;
    
    const scaleFactor = parseFloat(scalePercentage) / 100;
    if (scaleFactor < 0) return;

    const selectedTasks = roadmapData.filter(task => selectedTaskIds.includes(task.id));
    if (selectedTasks.length === 0) return;

    // 1. Find the entire group's start date (the anchor)
    const groupStartDate = new Date(Math.min(...selectedTasks.map(t => new Date(t.start).getTime())));

    const updates = {};

    // 2. Calculate new dates for each task based on its relative position
    selectedTasks.forEach(task => {
      const originalTaskStart = new Date(task.start);
      const originalTaskEnd = new Date(task.end);
      let newStartDate, newEndDate;

      if (respectWeekends) {
        // Calculate offset and duration in working days
        const offsetWorkingDays = calculateWorkingDaysDuration(groupStartDate, originalTaskStart, workingDays) - 1;
        const durationWorkingDays = calculateWorkingDaysDuration(originalTaskStart, originalTaskEnd, workingDays);

        // Scale them
        const newOffsetWorkingDays = Math.round(offsetWorkingDays * scaleFactor);
        const newDurationWorkingDays = Math.max(1, Math.round(durationWorkingDays * scaleFactor));

        // Calculate new dates from the anchor point
        newStartDate = addWorkingDays(groupStartDate, newOffsetWorkingDays, workingDays);
        newEndDate = addWorkingDays(newStartDate, newDurationWorkingDays - 1, workingDays);

      } else {
        // Calculate offset and duration in calendar days
        const offsetDays = (originalTaskStart.getTime() - groupStartDate.getTime()) / MS_PER_DAY;
        const durationDays = (originalTaskEnd.getTime() - originalTaskStart.getTime()) / MS_PER_DAY + 1;

        // Scale them
        const newOffsetDays = Math.round(offsetDays * scaleFactor);
        const newDurationDays = Math.max(1, Math.round(durationDays * scaleFactor));
        
        // Calculate new dates from the anchor point
        newStartDate = new Date(groupStartDate.getTime());
        newStartDate.setDate(newStartDate.getDate() + newOffsetDays);
        
        newEndDate = new Date(newStartDate.getTime());
        newEndDate.setDate(newEndDate.getDate() + newDurationDays - 1);
      }
      
      updates[task.id] = { ...task, start: newStartDate.toISOString().split('T')[0], end: newEndDate.toISOString().split('T')[0] };
    });
    
    // 3. Apply all updates at once
    const updatedData = roadmapData.map(task => updates[task.id] || task);
    onTaskUpdate(updatedData);
    setSelectedTaskIds([]);

  }, [selectedTaskIds, scalePercentage, roadmapData, onTaskUpdate, respectWeekends, workingDays]);

  useEffect(() => {
    if (!dragState && !selectionBox) return;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [dragState, selectionBox, handleMouseMove, handleMouseUp]);
  
  const height = (TRACK_HEIGHT * visibleTasks.length) + HEADER_HEIGHT + PADDING_TOP + CONTROLS_HEIGHT;
  const tasksToRender = useMemo(() => visibleTasks.map(task => tempUpdates[task.id] || task), [visibleTasks, tempUpdates]);
  const selectionBoxRect = useMemo(() => {
      if (!selectionBox) return null;
      const { startX, startY, currentX, currentY } = selectionBox;
      return { x: Math.min(startX, currentX), y: Math.min(startY, currentY), width: Math.abs(startX - currentX), height: Math.abs(startY - currentY) };
  }, [selectionBox]);

  const CheckboxToggle = ({ label, checked, onToggle, x, y }) => (
    <g transform={`translate(${x}, ${y})`} onClick={onToggle} style={{ cursor: 'pointer', userSelect: 'none' }}>
      <rect x="0" y="-7" width="14" height="14" rx="2" stroke="#333" strokeWidth="1.5" fill="white" />
      {checked && (<polyline points="3,0 6,4 11,-1" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>)}
      <text x="22" y="0" fontFamily="sans-serif" fontSize="12" fill="#333" textAnchor="start" dominantBaseline="middle">{label}</text>
    </g>
  );
  
  // --- The rest of the component's JSX is unchanged. ---
  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", boxSizing: 'border-box' }}>
      <svg ref={svgRef} width={containerWidth} height={height} style={{ border: "1px solid #ccc", display: 'block', borderRadius: '8px' }} onMouseDown={handleContainerMouseDown}>
        <defs>
            <style>{`.task-group, .resize-handle { pointer-events: all; } .tooltip-wrapper { position: relative; background: #333; color: #fff; padding: 6px 10px; border-radius: 5px; font-size: 12px; font-family: sans-serif; display: inline-block; white-space: nowrap; } .tooltip-wrapper::after { content: ''; position: absolute; bottom: -5px; left: 20px; border-width: 5px; border-style: solid; border-color: #333 transparent transparent transparent; } .svg-tooltip-container { opacity: 0; transition: opacity 0.2s; pointer-events: none; } g.task-group:hover .svg-tooltip-container { opacity: 1; }`}</style>
            <style>{`
                .scale-controls-wrapper {
                    font-family: sans-serif; font-size: 12px;
                    display: flex; align-items: center; gap: 8px;
                    transition: opacity 0.2s;
                }
                .scale-controls-wrapper[disabled] { opacity: 0.5; pointer-events: none; }
                .scale-input { width: 50px; padding: 4px; border: 1px solid #ccc; border-radius: 4px; }
                .scale-button { padding: 4px 8px; border: 1px solid #888; border-radius: 4px; background: #f0f0f0; cursor: pointer; }
                .scale-button:hover { background: #e0e0e0; }
            `}</style>
        </defs>
        
        <g transform={`translate(0, ${PADDING_TOP})`}>
          <g onMouseDown={(e) => e.stopPropagation()}>
            <foreignObject x={LABEL_WIDTH + 20} y={5} width="350" height="30">
                <div 
                  xmlns="http://www.w3.org/1999/xhtml"
                  className="scale-controls-wrapper"
                  disabled={selectedTaskIds.length === 0}
                >
                    <label htmlFor="scale-input-field">Scale task duration by:</label>
                    <input 
                        id="scale-input-field"
                        type="number"
                        min="0"
                        className="scale-input"
                        value={scalePercentage}
                        onChange={(e) => setScalePercentage(e.target.value)}
                        disabled={selectedTaskIds.length === 0}
                    />
                    <span>%</span>
                    <button 
                        className="scale-button"
                        onClick={handleScaleApply} 
                        disabled={selectedTaskIds.length === 0}
                    >
                        Apply
                    </button>
                </div>
            </foreignObject>

            {containerWidth > 750 && (
                <>
                <CheckboxToggle x={containerWidth - 180} y={15} label="Show also completed" checked={showCompleted} onToggle={handleToggleShowCompleted} />
                <CheckboxToggle x={containerWidth - 360} y={15} label="Respect free days" checked={respectWeekends} onToggle={() => setRespectWeekends(p => !p)} />
                </>
            )}
          </g>
          
          <g className="timeline-header" transform={`translate(${LABEL_WIDTH}, ${CONTROLS_HEIGHT})`}>
            {Array.from({ length: Math.ceil(totalDays) }).map((_, i) => {
                const date = new Date(timelineStartDate);
                date.setDate(date.getDate() + i);
                const x = dateToX(date);
                const isWeekend = !workingDays.includes(date.getDay());
                return (
                    <g key={`day-tick-${i}`}>
                        {isWeekend && <rect x={x} y={HEADER_HEIGHT - 30} width={pixelsPerDay} height={height - PADDING_TOP - CONTROLS_HEIGHT - (HEADER_HEIGHT - 30)} fill="#f9f9f9" />}
                        <line x1={x} y1={HEADER_HEIGHT - 30} x2={x} y2={height - PADDING_TOP - CONTROLS_HEIGHT} stroke="#e0e0e0" />
                        <text x={x + 4} y={HEADER_HEIGHT - 20} fontSize="10" fontFamily="sans-serif" fill={isWeekend ? "#c62828" : "#777"} fontWeight={isWeekend ? "bold" : "normal"}>{['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()]}</text>
                        <text x={x + 4} y={HEADER_HEIGHT - 5} fontSize="10" fontFamily="sans-serif" fill="#777">{date.getDate()}</text>
                    </g>
                );
            })}
          </g>
          
          <g className="timeline-body" transform={`translate(0, ${HEADER_HEIGHT + CONTROLS_HEIGHT})`}>
            {visibleTasks.map((task, i) => ( <text key={`label-${task.id}`} x={LABEL_WIDTH - 10} y={i * TRACK_HEIGHT + 25} textAnchor="end" fontSize="12" fill="#333" fontFamily="sans-serif">{task.task.length > 12 ? `${task.task.substring(0, 10)}...` : task.task}</text> ))}
            {visibleTasks.map((_, i) => ( <line key={`track-${i}`} x1={LABEL_WIDTH} x2={containerWidth} y1={(i + 1) * TRACK_HEIGHT} y2={(i + 1) * TRACK_HEIGHT} stroke="#e0e0e0" /> ))}
          </g>
        </g>
        
        <g onMouseDown={e => e.stopPropagation()}>
            {tasksToRender.filter(t => t && t.start && t.end).map(task => {
                const geom = getTaskGeometry(task);
                if (!geom) return null;
                const { x, y, width } = geom;
                const isSelected = selectedTaskIds.includes(task.id);
                return (
                    <g key={task.id} transform={`translate(${x}, ${y})`} className="task-group" onMouseDown={e => handleMouseDown(e, task, 'move')} style={{ cursor: 'grab' }}>
                        <rect x="0" y="0" width={width} height={BAR_HEIGHT} rx={4} fill={task.color} />
                        {isSelected && (<rect x="-1" y="-1" width={width + 2} height={BAR_HEIGHT + 2} rx="5" fill="none" stroke="#007bff" strokeWidth="2"/>)}
                        <rect className="resize-handle" x={-RESIZE_HANDLE_WIDTH / 2} y="0" width={RESIZE_HANDLE_WIDTH} height={BAR_HEIGHT} fill="transparent" style={{ cursor: 'ew-resize' }} onMouseDown={e => handleMouseDown(e, task, 'resize-start')}/>
                        <rect className="resize-handle" x={width - RESIZE_HANDLE_WIDTH / 2} y="0" width={RESIZE_HANDLE_WIDTH} height={BAR_HEIGHT} fill="transparent" style={{ cursor: 'ew-resize' }} onMouseDown={e => handleMouseDown(e, task, 'resize-end')}/>
                        <foreignObject x="5" y="-45" width="250" height="100" className="svg-tooltip-container">
                           <div xmlns="http://www.w3.org/1999/xhtml" className="tooltip-wrapper"><strong>Task:</strong> {task.task}<br /><strong>Dates:</strong> {task.start} to {task.end}</div>
                        </foreignObject>
                    </g>
                );
            })}
        </g>
        {selectionBoxRect && ( <rect {...selectionBoxRect} fill="#007bff" fillOpacity="0.2" stroke="#007bff" strokeWidth="1" strokeDasharray="3 3" style={{ pointerEvents: 'none' }}/> )}
      </svg>
    </div>
  );
}