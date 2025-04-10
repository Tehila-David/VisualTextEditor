import React, { useState } from 'react';
import './ToolBar.css';

const ToolBar = ({ 
  onStyleChange, 
  onLanguageChange, 
  currentLanguage,
  onUndo,
  onClear,
  onDeleteWord
}) => {
  const [showFontOptions, setShowFontOptions] = useState(false);
  const [showSizeOptions, setShowSizeOptions] = useState(false);
  const [showColorOptions, setShowColorOptions] = useState(false);
  const [selectedFont, setSelectedFont] = useState('Arial');
  const [selectedSize, setSelectedSize] = useState('16px');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const fonts = ['Arial', 'Times New Roman', 'Courier New', 'David', 'Miriam', 'Guttman Yad', 'Guttman-Aharoni'];
  const sizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px'];
  const colors = ['#000000', '#ff0000', '#0000ff', '#008000', '#ffa500', '#800080', '#a52a2a', '#808080'];

  const handleFontChange = (font) => {
    setSelectedFont(font);
    onStyleChange({ fontFamily: font });
    setShowFontOptions(false);
  };

  const handleSizeChange = (size) => {
    setSelectedSize(size);
    onStyleChange({ fontSize: size });
    setShowSizeOptions(false);
  };

  const handleColorChange = (color) => {
    setSelectedColor(color);
    onStyleChange({ color: color });
    setShowColorOptions(false);
  };

  const handleLanguageChange = (language) => {
    onLanguageChange(language);
  };

  const handleBoldToggle = () => {
    onStyleChange({ fontWeight: 'bold' });
  };

  const handleItalicToggle = () => {
    onStyleChange({ fontStyle: 'italic' });
  };

  const handleUnderlineToggle = () => {
    onStyleChange({ textDecoration: 'underline' });
  };

  const handleSubmitSearch = () => {
    // הלוגיקה לחיפוש והחלפה תימצא ברכיב האב
    console.log(`Search for: ${searchTerm}, Replace with: ${replaceTerm}`);
  };

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <button onClick={() => setShowFontOptions(!showFontOptions)} className="toolbar-button">
          גופן: {selectedFont}
        </button>
        {showFontOptions && (
          <div className="dropdown-menu">
            {fonts.map((font) => (
              <div
                key={font}
                className="dropdown-item"
                onClick={() => handleFontChange(font)}
                style={{ fontFamily: font }}
              >
                {font}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="toolbar-section">
        <button onClick={() => setShowSizeOptions(!showSizeOptions)} className="toolbar-button">
          גודל: {selectedSize}
        </button>
        {showSizeOptions && (
          <div className="dropdown-menu">
            {sizes.map((size) => (
              <div
                key={size}
                className="dropdown-item"
                onClick={() => handleSizeChange(size)}
              >
                {size}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="toolbar-section">
        <button onClick={() => setShowColorOptions(!showColorOptions)} className="toolbar-button">
          צבע
        </button>
        {showColorOptions && (
          <div className="dropdown-menu color-menu">
            {colors.map((color) => (
              <div
                key={color}
                className="color-option"
                style={{ backgroundColor: color }}
                onClick={() => handleColorChange(color)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="toolbar-section style-buttons">
        <button onClick={handleBoldToggle} className="toolbar-button">B</button>
        <button onClick={handleItalicToggle} className="toolbar-button"><i>I</i></button>
        <button onClick={handleUnderlineToggle} className="toolbar-button"><u>U</u></button>
      </div>

      <div className="toolbar-section language-buttons">
        <button 
          onClick={() => handleLanguageChange('hebrew')} 
          className={`toolbar-button ${currentLanguage === 'hebrew' ? 'active' : ''}`}
        >
          עברית
        </button>
        <button 
          onClick={() => handleLanguageChange('english')} 
          className={`toolbar-button ${currentLanguage === 'english' ? 'active' : ''}`}
        >
          English
        </button>
        <button 
          onClick={() => handleLanguageChange('emoji')} 
          className={`toolbar-button ${currentLanguage === 'emoji' ? 'active' : ''}`}
        >
          אימוג'י
        </button>
      </div>

      <div className="toolbar-section edit-buttons">
        <button onClick={onDeleteWord} className="toolbar-button">מחק מילה</button>
        <button onClick={onClear} className="toolbar-button">נקה הכל</button>
        <button onClick={onUndo} className="toolbar-button">ביטול</button>
      </div>

      <div className="toolbar-section">
        <button onClick={() => setShowSearch(!showSearch)} className="toolbar-button">
          חיפוש והחלפה
        </button>
        {showSearch && (
          <div className="search-container">
            <input
              type="text"
              placeholder="חפש..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <input
              type="text"
              placeholder="החלף ב..."
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
            />
            <button onClick={handleSubmitSearch}>בצע</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolBar;