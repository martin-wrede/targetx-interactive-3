import React, { useContext } from 'react';
import { Context } from '../Context';

export default function ImageGeneration() {
  const { data } = useContext(Context);

  let content = null;
  if (data[6] && data[6].content_chapter) {
    content = data[6].content_chapter.map((chapter, index) => (
      <div key={index}>
        <h1>{chapter.content_h1}</h1>
        {/* <h2>{chapter.content_h2}</h2> */}
        <span>{chapter.content_h1_text}</span>
        <br />
      </div>
    ));
  }

  return (
    <div>
      <br />
      <div className="content_container" id="main">
        <div className="content_main" id="content">
          <h1>Image Generation</h1>
          {content}
          <br />
          {/* Example iframe usage */}
          <iframe
            src="https://react-image-creator-2.pages.dev/"

            title="External Content"
            width="100%"
            height="400"
            style={{ border: '1px solid #ccc' }}
          ></iframe>
        </div>

        <div id="sidebar" className="content_sub">
          <span className="text-markierung">
            {data[6] && data[6].sidebar_h2}
          </span>
          <br />
          <br />
          {data[6] && <img src={data[6].sidebar_image} alt="Sidebar visual" />}
        </div>
      </div>
    </div>
  );
}
