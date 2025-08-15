import React, { useContext } from 'react';
import Gallery from './Gallery';
import { Context } from '../Context';

export default function Home() {
  const { data } = useContext(Context);
   if (!data || !data[0]) return <div>Loading...</div>;


    const content = data[0];


  return (
    <div>
       <div className="content_container" id="main">
        <div className="content_main" id="content">
      <h1  style={{fontSize: "26px", color:"orange"}}>   {content.content_h1}</h1>
    
     
       <img
          className="content-image"
          src= "/Home_01.jpg"
          title= "Solo-Preneur"
          alt="Solo-Preneur"
          />
   
   {/** 
    * 
      <h1  style={{fontSize: "26px", color:"orange"}}>Stay on Track with an <br />AI Accountability Coach</h1>
       
   
         <Gallery  projectNumber="0"  />
         
*/}
<br/>
<br/>
 {content.content_h1_text}
<br/><br/>
       <button onClick={() => window.open(content.button1_url)}>
            {content.button1}
          </button>
      </div>
      <div id="sidebar" className="content_sub">
        <br/> <br/> <br/><br/>

<span style={{fontSize: "16px"}}>
        <strong  >
          {/*
        Most people don’t fail at productivity, <br/> they fail at staying emotionally connected to their goals. 
     
     - Accountability AI für 19 €/Monat
     
     */}
 <br/>
      <br/>
         {content.sidebar_h2}
 <br/> <br/>
        
        </strong>
     
       
        
        </span>
          </div> </div>
         </div>
  )
}
