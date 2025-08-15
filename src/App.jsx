import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './components/Home';
import HowItWorks from './components/HowItWorks';
 import PlannerApp from './components/PlannerApp';
// import PlannerApp from './components/PlannerApptest';
import Daily from './components/Daily';
import About from './components/About';

 import './App.css';

function App() {
  return (
      <div className="App" id="wrapper">
        
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/planner" element={<PlannerApp />} />
             <Route path="/daily" element={<Daily />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
    
  );
}

export default App;
