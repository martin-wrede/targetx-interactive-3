import React, { useContext, useState } from 'react';
import Gallery from './Gallery';
import { Context } from '../Context';

export default function Daily() {
  const { data } = useContext(Context);
  

  let content= null;
 
  if (data[3] && data[3].content_chapter) {
    content = data[3].content_chapter.map((chapter, index) => (
      <div key={index}>
        <h1>{chapter.content_h1}</h1> 
       {/*
        <h2>{chapter.content_h2}</h2>
         */}
        <span>{chapter.content_h1_text}</span>
      <br /> 
      </div>
    ))
    }


  return (
    <div>
      <div className="content_container" id="main">
        <div className="content_main" id="content">
        {content}
        <br/>
        
 <iframe
              src="https://react-chatbot-air-prompt-2.pages.dev/?part1=none&part3=none"
              title="Task Assistant"
              width="100%"
              height="300"
               style={{ border: 'none' }}

            />
   
     
<br/>
 <h1>Workflows & Tools</h1>   
       
      {/*

       {data[2] && data[2].content_h1_2}
     <br/>   
     */}
   <h2>Design Thinking</h2>  
  {data[3] && data[3].content_h2}
       <br/>

  
       <img
          className="content-image"
          src= "/designthinking.jpg"
          title= "Design Thinking"
          alt="Design Thinking"
            
         
          style={{width:"400px",
            
          }}
          />
     <br />
       

     <h2> Image Generation</h2>
     <br />
         <iframe
            src="https://react-image-creator-airtable.pages.dev/"

            title="External Content"
              width="100%"
            height="400"
            style={{ border: '1px solid #ccc' }}
          ></iframe>
<br/>

{/* 
      <a href="/planner" className="roadmap-button">See Full Roadmap</a>
*/}
                              
 
        </div>
      </div>
      <div id="sidebar" className="content_sub">
       
        <br />
        <br />
            
                         
      
        {data[3] &&  <img src={`${data[3].sidebar_image}`} 
         title={`${data[3]. gallery_image_title}`}
        alt={`${data[3]. gallery_image_title}`}
        />}
   
        <br />
        <br />
      </div>
      
    </div>
  );
}
                            