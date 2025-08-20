import React, { useContext } from 'react';
import Gallery from './Gallery';
 
import { Context } from '../Context';

export default function HowItWorks() {
  
  const { data } = useContext(Context);

  let content= null;
 
 
  if (data[1] && data[1].content_chapter) {
    content = data[1].content_chapter.map((chapter, index) => (
      <div key={index}>
        <h1>{chapter.content_h1}</h1> 
       
        <h2>{chapter.content_h2}</h2>
         
        <span>{chapter.content_h2_sub}</span> <br/><br/>
      
      <span>{chapter.content_h2_text1}</span> <br/> 
             <span>{chapter.content_h2_text3}</span> <br/> 
               <span>{chapter.content_h2_text4}</span><br/>
               <span>{chapter.content_h2_text5}</span> <br/>  
      
      <br /> 
      </div>
    ))
    }



   
  return (
    <div>
      <div className="content_container" id="main">
        <div className="content_main" id="content">
        
        {content}
        
 


     
{/* 
 Die meisten Menschen scheitern nicht an ihrer Produktivität, sondern daran, emotional mit ihren Zielen verbunden zu bleiben. AccountabilityAI ist ein KI-Coach für 19 $/Monat, der wie ein kleiner James Clear in Ihrer Tasche funktioniert. Er meldet sich täglich bei Ihnen, feuert Sie an und mahnt Sie sanft, wenn Sie abzuschweifen beginnen. Im Gegensatz zu Aufgaben-Apps verfolgt er nicht nur Ihre Fortschritte, sondern lernt Ihre Muster, versteht, was Sie motiviert, und behält Ihre Ziele im Auge, auch wenn niemand sonst zusieht. Für Fernarbeiter, die sich nach Schwung und Bedeutung sehnen, ist es die Struktur hinter ihren Ambitionen.
Ich würde dies ausbauen, indem ich mich direkt an die ehrgeizbesessene Ecke des Internets wende... Indie-Hacker, Produktivitäts-YouTuber, Kohorten-Kurs-Junkies und Solo-Gründer, die bereits James Clear gelesen und fünf ungelesene Notion-Vorlagen über Ziele haben. Beginnen Sie damit, es zu einer Bewegung zu machen, nicht zu einem Produkt: „ein Mini-James-Clear für die Hosentasche“, ‚eine KI, die sich darum kümmert, ob du deine Ziele erreichst‘. Zeigen Sie Check-Ins, Siege und echte Fortschritts-Screenshots.
Verschaffen Sie sich eine frühe Traktion durch Schöpfer (Ali Abdaal, Thomas Frank, Tiago Forte-Style) via Rev Share Deal, sie haben Vertrauen und Reichweite. Bauen Sie eine Gemeinschaft auf, die sich um die Momentum Streaks kümmert, nicht nur um die Zielverfolgung. Nutzen Sie öffentliche Verantwortungsschleifen (wöchentliche Fortschrittsberichte, die auf X geteilt werden, Mini-Ranglisten in Slack-Gruppen), um eine virale Bindung zu schaffen. Sobald die individuelle Ebene gefestigt ist, erweitern Sie sie auf Teams: „Geben Sie Ihrem Team einen KI-Coach, der ihnen hilft, persönliche Ziele zu erreichen, die tatsächlich passen.
*/}
<br/>
   
          
  	  

          {/*
 Es gibt zahlreiche Daten und Studien, die belegen, 
 dass der Einsatz von KI-Tools die Projektlaufzeiten in der Softwareentwicklung
 , insbesondere bei Prototypen und Apps, erheblich verkürzen und den benötigten
  Personalaufwand reduzieren kann. <br/>Die Einschätzung, dass dies von Monaten mit einem ganzen Team auf Wochen mit 1-2 Personen reduziert werden kann, wird durch die Forschung gestützt.
   */}     
  </div>
      </div>
   
      <div id="sidebar" className="content_sub">
        
  	      
        <br />
        <br />
          
        {data[1] &&  <img src={`${data[1].sidebar_image}`} 
         title={`${data[1]. gallery_image_title}`}
        alt={`${data[1]. gallery_image_title}`}
        />}
   
        <br />
        <br />
      </div>
      
    </div>
  );
}