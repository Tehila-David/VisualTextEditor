import React, { useState } from 'react';
import './Keyboard.css';

const Keyboard = ({
  language,
  onAddCharacter,
  onDeleteCharacter,
  onDeleteWord,
  onClearText,
  onUndo,
  onLanguageChange,
  currentLanguage,
  onStyleChange,
  onSearch,
  onReplace,
  applyStyleFromNow,
  onToggleApplyStyleFromNow
}) => {
  // State for current style settings
  const [selectedFont, setSelectedFont] = useState('Arial');
  const [selectedSize, setSelectedSize] = useState('16px');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [boldActive, setBoldActive] = useState(false);
  const [italicActive, setItalicActive] = useState(false);
  const [underlineActive, setUnderlineActive] = useState(false);

  // State for advanced options dialog
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  // Keyboard layouts definition
  const hebrewLayout = [
    ['/', 'י', 'ק', 'ר', 'א', 'ט', 'ו', 'ן', 'ם', 'פ', 'ש', '%'],
    ['ד', 'ג', 'כ', 'ע', 'י', 'ח', 'ל', 'ך', 'ף', 'ז', 'ס', '$'],
    [')', '(', 'ב', 'ה', 'נ', 'מ', 'צ', 'ת', 'ץ', '.', '#', '^'],
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '!', '@']
  ];

  const englishLayout = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'b', 'n',],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'v', 'm', 'c'],
    ['z', 'x', ';', '#', '$', '!', '@', ',', '.', '/', '%', '^'],
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '&', '*']
  ];

  const emojiLayout = [
    ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '☺️', '😊', '🙂', '😉'],
    ['😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '❤️', '💕', '💞', '💓'],
    ['💗', '💖', '💘', '💝', '💟', '❣️', '👍', '👌', '👏', '🙌', '🤝', '🙏'],
    ['👐', '🤲', '💪', '✌️', '🎉', '🎊', '🎂', '🎁', '🎄', '🎃', '🎗️', '🎟️']
  ];

  // Select current keyboard layout
  let currentLayout;
  switch (language) {
    case 'english':
      currentLayout = englishLayout;
      break;
    case 'emoji':
      currentLayout = emojiLayout;
      break;
    default:
      currentLayout = hebrewLayout;
  }

  // Font, size and color options
  const fonts = [
    { value: 'Arial', label: 'Arial' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'David', label: 'David' },
    { value: 'Miriam', label: 'Miriam' },
    { value: 'Courier New', label: 'Courier' }
  ];

  const sizes = [
    { value: '12px', label: '12px' },
    { value: '14px', label: '14px' },
    { value: '16px', label: '16px' },
    { value: '18px', label: '18px' },
    { value: '20px', label: '20px' },
    { value: '24px', label: '24px' },
    { value: '32px', label: '32px' }
  ];

  const colors = [
    { value: '#000000', label: 'שחור' },
    { value: '#FF0000', label: 'אדום' },
    { value: '#00FF00', label: 'ירוק' },
    { value: '#0000FF', label: 'כחול' },
    { value: '#FFA500', label: 'כתום' },
    { value: '#800080', label: 'סגול' },
    { value: '#A52A2A', label: 'חום' },
    { value: '#808080', label: 'אפור' }
  ];

  // Style change handlers
  const handleFontChange = (e) => {
    const font = e.target.value;
    setSelectedFont(font);
    onStyleChange({ fontFamily: font });
  };

  const handleSizeChange = (e) => {
    const size = e.target.value;
    setSelectedSize(size);
    onStyleChange({ fontSize: size });
  };

  const handleColorChange = (color) => {
    setSelectedColor(color);
    onStyleChange({ color });
  };

  const toggleBold = () => {
    const newState = !boldActive;
    setBoldActive(newState);
    onStyleChange({ fontWeight: newState ? 'bold' : 'normal' });
  };

  const toggleItalic = () => {
    const newState = !italicActive;
    setItalicActive(newState);
    onStyleChange({ fontStyle: newState ? 'italic' : 'normal' });
  };

  const toggleUnderline = () => {
    const newState = !underlineActive;
    setUnderlineActive(newState);
    onStyleChange({ textDecoration: newState ? 'underline' : 'none' });
  };

  // Advanced options handlers
  const handleSearch = () => {
    if (searchText && onSearch) {
      onSearch(searchText);
    }
  };

  const handleReplace = () => {
    if (searchText && replaceText && onReplace) {
      onReplace(searchText, replaceText);
    }
  };

  // Style scope handler
  const setStyleScope = (value) => {
    console.log("Changing style scope to:", value);
    if (onToggleApplyStyleFromNow) {
      onToggleApplyStyleFromNow(value);
    }
  };
  // Helper function to handle keyboard presses
  const handleKeyPress = (key) => {
    // Safety check to ensure the key is defined and valid
    if (key === undefined || key === null) {
      console.error("Key is undefined or null");
      return;
    }

    // Convert to string in case it's not already
    const charToAdd = String(key);

    // Ensure emojis are handled correctly
    if (currentLanguage === 'emoji') {
      // Use setTimeout to work around asynchronous state update issues
      onAddCharacter(charToAdd);
    } else {
      // For regular characters
      onAddCharacter(charToAdd);
    }
  };

  // סגנון אחיד לכל האייקונים
  const iconStyle = {
    marginLeft: '5px',
    fontSize: '10px' // גודל האייקון הגדול יותר
  };

  // סגנונות ספציפיים לאייקוני הסגנון
  const styleIconStyle = {
    fontSize: '12px' // אייקוני סגנון עם גודל זהה
  };

  // סגנון לאייקוני כפתורים
  const buttonIconStyle = {
    marginLeft: '7px',
    fontSize: '14px' // אייקונים גדולים יותר בכפתורים
  };

  return (
    <div className="keyboard-main">
      {/* Right sidebar - Styling options */}
      <div className="right-sidebar">
        <div className="style-section">
          <div className="section-title">
            <i className="fas fa-font" style={{...iconStyle, fontSize: '10px'}}></i>
            גופן
          </div>
          <div className="control-row">
            <select
              className="select-control"
              value={selectedFont}
              onChange={handleFontChange}
            >
              {fonts.map(font => (
                <option key={font.value} value={font.value}>{font.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="style-section">
          <div className="section-title">
            <i className="fas fa-text-height" style={{...iconStyle, fontSize: '10px'}}></i>
            גודל
          </div>
          <div className="control-row">
            <select
              className="select-control"
              value={selectedSize}
              onChange={handleSizeChange}
            >
              {sizes.map(size => (
                <option key={size.value} value={size.value}>{size.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="style-section">
          <div className="section-title">
            <i className="fas fa-palette" style={{...iconStyle, fontSize: '10px', color: selectedColor}}></i>
            צבע
          </div>
          <div className="control-row">
            <select
              className="select-control"
              value={selectedColor}
              onChange={e => handleColorChange(e.target.value)}
            >
              {colors.map(color => (
                <option key={color.value} value={color.value} style={{ backgroundColor: color.value, color: color.value === '#000000' ? '#ffffff' : '#000000' }}>
                  {color.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="style-section">
          <div className="section-title">סגנון</div>
          <div className="style-buttons">
            <button
              className={`style-button ${boldActive ? 'active' : ''}`}
              onClick={toggleBold}
              aria-label="Bold"
            >
              <i className="fas fa-bold" style={styleIconStyle}></i>
            </button>
            <button
              className={`style-button ${italicActive ? 'active' : ''}`}
              onClick={toggleItalic}
              aria-label="Italic"
            >
              <i className="fas fa-italic" style={styleIconStyle}></i>
            </button>
            <button
              className={`style-button ${underlineActive ? 'active' : ''}`}
              onClick={toggleUnderline}
              aria-label="Underline"
            >
              <i className="fas fa-underline" style={styleIconStyle}></i>
            </button>

            {/* Style scope buttons (Same row as Style buttons) */}
            <button
              className={`style-scope-button ${!applyStyleFromNow ? 'active' : ''}`}
              onClick={() => setStyleScope(false)}
              title="העיצוב יחול על כל הטקסט"
            >
              <i className="fas fa-align-justify" style={buttonIconStyle}></i>
              כל הטקסט
            </button>
            <button
              className={`style-scope-button ${applyStyleFromNow ? 'active' : ''}`}
              onClick={() => setStyleScope(true)}
              title="העיצוב יחול רק על טקסט חדש"
            >
              <i className="fas fa-long-arrow-alt-right" style={buttonIconStyle}></i>
              מכאן והלאה
            </button>
          </div>
        </div>
      </div>
      {/* Keyboard area */}
      <div className="keyboard-wrapper">
        <div className="keyboard">
          <div className="section-title">
            <i className="fas fa-keyboard" style={{...iconStyle, fontSize: '14px'}}></i>
            המקלדת שלי
          </div>
          {currentLayout.map((row, rowIndex) => (
            <div key={`row-${rowIndex}`} className="keyboard-row">
              {row.map((key, keyIndex) => (
                <button
                  key={`key-${rowIndex}-${keyIndex}`}
                  className="keyboard-key"
                  onClick={() => handleKeyPress(key)}
                  aria-label={key}
                >
                  {key}
                </button>
              ))}
            </div>
          ))}
          <div className="keyboard-actions">
            <button
              className="delete-key"
              onClick={onDeleteCharacter}
              aria-label="מחק תו"
            >
              <i className="fas fa-backspace" style={{...buttonIconStyle, fontSize: '18px'}}></i>
              מחק
            </button>
            <button
              className="space-key"
              onClick={() => handleKeyPress(' ')}
              aria-label="רווח"
            >
              רווח
            </button>
          </div>
        </div>
      </div>

      {/* Left sidebar - Actions and language */}
      <div className="left-sidebar">
        <div className="action-section">
          <div className="section-title">פעולות</div>
          <button
            className="action-button delete-word"
            onClick={onDeleteWord}
          >
            <i className="fas fa-eraser" style={buttonIconStyle}></i>
            מחק מילה
          </button>
          <button
            className="action-button clear-all"
            onClick={onClearText}
          >
            <i className="fas fa-trash" style={buttonIconStyle}></i>
            נקה הכל
          </button>
          <button
            className="action-button undo"
            onClick={onUndo}
          >
            <i className="fas fa-undo" style={buttonIconStyle}></i>
            ביטול
          </button>
          <button
            className="action-button advanced"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <i className="fas fa-cog" style={buttonIconStyle}></i>
            {showAdvanced ? 'הסתר פעולות מתקדמות' : 'פעולות מתקדמות'}
          </button>

          {/* Advanced options popup */}
          {showAdvanced && (
            <div className="advanced-popup">
              <div className="popup-header">
                <div className="popup-title">
                  <i className="fas fa-cog" style={iconStyle}></i>
                  פעולות מתקדמות
                </div>
              </div>
              <div className="popup-content">
                <div className="advanced-group">
                  <label>
                    <i className="fas fa-search" style={iconStyle}></i>
                    חיפוש:
                  </label>
                  <div className="input-action">
                    <input
                      type="text"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="הקלד טקסט לחיפוש"
                    />
                    <button onClick={handleSearch}>
                      <i className="fas fa-search" style={iconStyle}></i>
                      חפש
                    </button>
                  </div>
                </div>

                <div className="advanced-group">
                  <label>
                    <i className="fas fa-exchange-alt" style={iconStyle}></i>
                    החלפה:
                  </label>
                  <div className="input-action">
                    <input
                      type="text"
                      value={replaceText}
                      onChange={(e) => setReplaceText(e.target.value)}
                      placeholder="הקלד טקסט להחלפה"
                    />
                    <button onClick={handleReplace}>
                      <i className="fas fa-exchange-alt" style={iconStyle}></i>
                      החלף
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="action-section">
          <div className="section-title">
            <i className="fas fa-globe" style={{...iconStyle, fontSize: '15px'}}></i>
            שפה
          </div>
          <div className="control-row">
            <select
              className="select-control"
              value={currentLanguage}
              onChange={(e) => onLanguageChange(e.target.value)}
            >
              <option value="hebrew">עברית</option>
              <option value="english">English</option>
              <option value="emoji">אימוג'י</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Keyboard;