import React from 'react';
import './stylesComp.css';

const TextDisplay = ({ text, style }) => {
  return (
    <div className="text-display">
      <div 
        className="text-content" 
        style={style}
      >
        {text || 'הטקסט יופיע כאן...'}
      </div>
    </div>
  );
};

export default TextDisplay;