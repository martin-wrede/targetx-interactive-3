import React, { useState, useEffect, useContext } from 'react';
import { Context } from '../Context';
import { Link } from 'react-router-dom';
import Logo from '../assets/BeautifulMindAI.svg';

import German from '../assets/german_flag_trans30.png';
import British from '../assets/british_flag_trans30.png';

// ✅ Extracted reusable language switcher
function LanguageSwitcher({ language, changeLanguage }) {
  return (
   
    <div className="language-switcher">
       {/*   */}
      <button 
      style={{backgroundImage:`url(${German})` ,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          width: '30px',
          height: '20px',
          border: 'none',
          cursor: 'pointer',}}
      
          className="button" onClick={() => changeLanguage("de")} disabled={language === "de"}>
       <span style={{color:"white", }} ><b></b>DE</span>
      </button>
  
      <button className="button"
      style={{backgroundImage:`url(${British})` ,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          width: '30px',
          height: '20px',
          border: 'none',
          cursor: 'pointer',
        }}

      onClick={() => changeLanguage("en")} disabled={language === "en"}>
        <span style={{color:"white", }} ><b></b>EN</span>
      </button>
    
    </div>
    
  );
}

export default function Header() {
  const [menuShown, setMenuShown] = useState(false);
  const [browserWidth, setBrowserWidth] = useState(window.outerWidth);
  const { language, changeLanguage } = useContext(Context);
 const { data } = useContext(Context);


  // ✅ Responsive state updates on resize
  useEffect(() => {
    const handleResize = (e) => {
      setBrowserWidth(e.target.outerWidth);
      // Hide menu if resizing to larger screen
      if (e.target.outerWidth > 650) {
        setMenuShown(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMenu = () => {
    if (browserWidth < 650) {
      setMenuShown((prev) => !prev);
    }
  };

  const isMobile = browserWidth < 650;

  return (
    <header id="header">
      <div className="logo-container logo">
        <Link to="/">
          <img id="logo" src={Logo} alt="DigitalMindAI" />
          <div style={{ opacity: "0", width: "100%", height: "100%" }}>targetx.de</div>
        </Link>
      </div>

      <nav id="nav1">
        {/* ✅ Conditional display of menu */}
        <div id="menu" style={{ display: isMobile && !menuShown ? 'none' : 'block', opacity: isMobile && !menuShown ? 0 : 1 }}>
          <ul>
            <li><Link to="/how-it-works">
               
            {/*  {data[1] &&  data[1].content_h1}   */}
              {
              language === "de" ? "Wie es geht" : "How it works"
              } 
          
           </Link></li>
        <li><Link to="/planner">
              {/*   {data[2] &&  data[2].content_h1}   */}
             {
              language === "de" ? "Starte den Planer" : "Start the Planner"
              }
        </Link></li>
        <li><Link to="/daily">
               {/*  {data[3] &&  data[3].content_h1}   */}
         {
              language === "de" ? "Tägliche Aufgaben" : "Daily Tasks"
              }
        </Link></li>
        <li><Link to="/about">
              {/*   {data[4] &&  data[4].content_h1}   */}
           {
              language === "de" ? "Über Mich" : "About Me"
              }
        </Link></li>
          </ul>
        </div>
      </nav>

      {/* ✅ Language switcher for mobile menu */}
      <div id="menu-sprachen-2">
        <LanguageSwitcher language={language} changeLanguage={changeLanguage} />
      </div>

      {/* ✅ Hamburger menu */}
      {isMobile && (
        <div id="button1" onClick={toggleMenu} className="menu-icon">
          <div className="menu-format">
            <div id="hamburger">
              <div className="hamburger-streifen"></div>
              <div className="hamburger-streifen"></div>
              <div className="hamburger-streifen"></div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Language switcher for desktop */}
      <div id="nav2">
        <div id="menu-sprachen-1">
          <LanguageSwitcher language={language} changeLanguage={changeLanguage} />
        </div>
      </div>
    </header>
  );
}
