import React from 'react';
import './Keyboard.css';

const Keyboard = ({ language, onAddCharacter, onDeleteCharacter }) => {
  // מקלדת עברית
// הגדרת שורות המקלדת העברית ללא שורת רווח
const hebrewLayout = [
  ['/', 'י', 'ק', 'ר', 'א', 'ט', 'ו', 'ן', 'ם', 'פ'],
  ['ש', 'ד', 'ג', 'כ', 'י', 'ח', 'ל', 'ך', 'ף', 'ר'],
  ['ז', 'ס', 'ב', 'ה', 'נ', 'מ', 'צ', 'ת', 'ץ', '.'],
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['!', '@', '#', '$', '%', '^', '&', '*', ')', '(']
];

  // מקלדת אנגלית
  const englishLayout = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'],
    
  ];

  // אימוג'ים
  const emojiLayout = [
    ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '☺️', '😊'],
    ['😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙'],
    ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '❣️', '💕', '💞'],
    ['👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '👌', '✌️', '🤞'],
    ['🎉', '🎊', '🎈', '🎂', '🎁', '🎄', '🎃', '🎗️', '🎟️', '🎫']
  ];

  // שורה נוספת רק עבור הרווח
  const spaceRow = [' ']; // רק רווח אחד

  let currentLayout;
  switch(language) {
    case 'english':
      currentLayout = englishLayout;
      break;
    case 'emoji':
      currentLayout = emojiLayout;
      break;
    default:
      currentLayout = hebrewLayout;
  }
  return (
    <div className="keyboard">
      {currentLayout.map((row, rowIndex) => (
        <div key={`row-${rowIndex}`} className="keyboard-row">
          {row.map((key, keyIndex) => (
            <button
              key={`key-${rowIndex}-${keyIndex}`}
              className="keyboard-key"
              onClick={() => onAddCharacter(key)}
            >
              {key === ' ' ? 'רווח' : key}
            </button>
          ))}
        </div>
      ))}
      {/* שורת הרווח */}
      <div className="keyboard-row">
        <button
          className="keyboard-key space-key"
          onClick={() => onAddCharacter(' ')}
        >
          רווח
        </button>
      </div>
    </div>
  );
};

export default Keyboard;