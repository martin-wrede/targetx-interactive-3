import React, { useState, useEffect, useRef } from 'react';

import PfeilLinks from '../assets/pfeil-links.svg';
import PfeilRechts from '../assets/pfeil-rechts.svg';

let timerID = 0;

export default function Gallery({ projectNumber }) {
  const [counter, setCounter] = useState(0);
  const [data, setData] = useState([]);
  const timerRef = useRef(null); // Use useRef to create a mutable reference
 
  const url  =  "/targetx-interactive-2/data-de.json"; 

  useEffect(() => {
    const getData = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(response.status);
        }
        const data = await response.json();
     //   console.log(data);
        setData(data);
      } catch (error) {
        console.error(error);
      }
    };
  
    getData();
  }, [url]);
  
  const images = data.length > 0 && data[`${projectNumber}`].gallery_image_names.map((image) => image);

  if (images.length === 0) {
    return null; // or render a loading indicator
  }

 // console.log('Images:', images);

  useEffect(() => {
    timerID += 1;

    timerRef.current = setInterval(() => {
      setCounter((currentCounter) => {
        if (currentCounter >= 10 * images.length - 1) {
          setCounter(0);
          timerID = 0;
        }
        if ((currentCounter - 8) % 10 === 0) {
          imageBlend(0);
        }
        if (currentCounter % 10 === 0) {
          imageBlend(1);
        }

        return currentCounter + 1;
      });
    }, 400);

    return () => {
      clearInterval(timerRef.current); // Use timerRef.current to clear the interval
    };
  }, []);

  function nextImageForward(nr) {
    setCounter((currentCounter) => {
      // if more than images.length, go back to 0
      if (currentCounter >= images.length * 10 - 10) {
        return setCounter(0);
      } else {
        let newCounter = currentCounter + nr * 10;
        return setCounter(newCounter);
      }
    });
  }

  function nextImageBackward(nr) {
    setCounter((currentCounter) => {
      // if less than 10, go back to the last set of images
      if (currentCounter < 10) {
        let newCounter = images.length * 10 + nr * 10;
        return setCounter(newCounter);
      } else {
        let newCounter = currentCounter + nr * 10;
        return setCounter(newCounter);
      }
    });
  }

  // Blend effect
  function imageBlend(toggle) {
    document.getElementById('layer1').style.opacity = toggle;
    document.getElementById('layer1').style.transitionDuration = '0.5s';
  }

  return (
    <div id="gallery1">
      {/* double check the counter, since the other is not 100% safe */}
      {counter > images.length * 10 - 1 && setCounter(0)}
      <div id="layer1">
        <img id="galleryimage" src={images[Math.floor(counter / 10)]} alt="Gallery" />
      </div>

      <div className="gallery-menu">
        <img
          src={PfeilLinks}
          id="backward"
          onClick={() => nextImageBackward(-1)}
          className="gallery-menu-icon"
        />
        <span className="gallery-text">
          {Math.floor(counter / 10) + 1}/{images.length}
        </span>
        <img
          src={PfeilRechts}
          id="forward"
          onClick={() => nextImageForward(1)}
          className="gallery-menu-icon"
        />
        {/* 
        <img src={Rechteck} id="stop" onClick={() => clearInterval(timerRef.current)} className='gallery-menu-icon' />
        */}
      </div>

      {/* {project} */}
    </div>
  );
}
