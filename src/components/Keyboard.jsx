import React from 'react';
import './stylesComp.css';

const Keyboard = ({ language, onAddCharacter, onDeleteCharacter }) => {
  // מקלדת עברית
  const hebrewLayout = [
    ['/', '\'', 'ק', 'ר', 'א', 'ט', 'ו', 'ן', 'ם', 'פ'],
    ['ש', 'ד', 'ג', 'כ', 'ע', 'י', 'ח', 'ל', 'ך', 'ף'],
    ['ז', 'ס', 'ב', 'ה', 'נ', 'מ', 'צ', 'ת', 'ץ', '.'],
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ']
  ];

  // מקלדת אנגלית
  const englishLayout = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ']
  ];

  // אימוג'ים
  const emojiLayout = [
    ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '☺️', '😊'],
    ['😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙'],
    ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '❣️', '💕', '💞'],
    ['👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '👌', '✌️', '🤞'],
    ['🎉', '🎊', '🎈', '🎂', '🎁', '🎄', '🎃', '🎗️', '🎟️', '🎫'],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ']
  ];

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
              className={`keyboard-key ${key === ' ' ? 'space-key' : ''}`}
              onClick={() => onAddCharacter(key)}
            >
              {key === ' ' ? 'רווח' : key}
            </button>
          ))}
          {rowIndex === 0 && (
            <button
              className="keyboard-key delete-key"
              onClick={onDeleteCharacter}
            >
              מחק
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default Keyboard;