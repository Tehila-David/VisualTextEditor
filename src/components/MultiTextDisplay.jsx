import React from 'react';
import './MultiTextDisplay.css';

const MultiTextDisplay = ({ 
  documents, 
  activeDocumentIndex, 
  onDocumentSelect, 
  onDocumentClose,
  cursorPosition,
  applyStyleFromNow,
  currentStyle,
  onCursorChange
}) => {
  // פונקציית עזר להצגת תוכן המסמך עם סמן וסגנון "מכאן והלאה"
  const renderDocumentContent = (doc, index) => {
    // אם המסמך אינו פעיל או מצב "מכאן והלאה" אינו מופעל, מציגים את התוכן כרגיל
    if (index !== activeDocumentIndex || !applyStyleFromNow) {
      return (
        <div 
          className="document-content"
          style={doc.style}
        >
          {doc.content || 'פתק ריק'}
        </div>
      );
    }

    // אם מצב "מכאן והלאה" מופעל למסמך הפעיל, מציגים את התוכן עם סגנון מותאם
    const beforeCursor = doc.content.substring(0, cursorPosition);
    const afterCursor = doc.content.substring(cursorPosition);

    return (
      <div 
        className="document-content"
        style={doc.style}
      >
        <span>{beforeCursor}</span>
        <span className="cursor-position"></span>
        <span style={currentStyle}>{afterCursor}</span>
      </div>
    );
  };

  // פונקציה לטיפול בלחיצות עכבר על המסמך לעדכון מיקום הסמן
  const handleDocumentClick = (event, index) => {
    if (index === activeDocumentIndex && onCursorChange) {
      // אם יש פונקציית onCursorChange וזה המסמך הפעיל, נעדכן את מיקום הסמן
      // חישוב מיקום הלחיצה יחסית לאלמנט המסמך
      const element = event.currentTarget;
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left;
      
      // חישוב משוער של מיקום הסמן לפי העמדה שנלחצה
      // ברירת מחדל - נשים את הסמן בסוף המסמך
      const docContent = documents[index].content;
      let estimatedPosition = docContent.length;
      
      // חישוב פשוט - חלוקת רוחב האלמנט לפי מספר התווים
      // זה חישוב פשטני, אבל עובד לטובת הדגמה
      if (docContent.length > 0) {
        const charsPerPixel = docContent.length / rect.width;
        estimatedPosition = Math.round(x * charsPerPixel);
        // וידוא שהמיקום בגבולות המסמך
        estimatedPosition = Math.min(Math.max(0, estimatedPosition), docContent.length);
      }
      
      onCursorChange(estimatedPosition);
    }
  };

  return (
    <div className="multi-text-display">
      {documents.length === 0 ? (
        <div className="empty-state">
          <p>אין פתקים פתוחים. צור או פתח פתק כדי להתחיל לעבוד.</p>
        </div>
      ) : (
        <div className="documents-container">
          {documents.map((doc, index) => (
            <div 
              key={index}
              className={`document-wrapper ${index === activeDocumentIndex ? 'active' : ''}`}
              onClick={(e) => {
                onDocumentSelect(index);
                if (index === activeDocumentIndex) {
                  handleDocumentClick(e, index);
                }
              }}
            >
              <div className="document-header">
                <span className="document-title">
                  {doc.name || `פתק${index + 1}`}
                </span>
                <button 
                  className="close-document-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDocumentClose(index);
                  }}
                  title="סגור פתק"
                >
                  <i className="fas fa-times" /> 
                </button>
              </div>
              {renderDocumentContent(doc, index)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiTextDisplay;