import React from 'react';
import './MultiTextDisplay.css';

const MultiTextDisplay = ({ 
  documents, 
  activeDocumentIndex, 
  onDocumentSelect, 
  onDocumentClose 
}) => {
  return (
    <div className="multi-text-display">
      {documents.length === 0 ? (
        <div className="empty-state">
          <p>אין מסמכים פתוחים. צור או פתח מסמך כדי להתחיל לעבוד.</p>
        </div>
      ) : (
        <div className="documents-container">
          {documents.map((doc, index) => (
            <div 
              key={index}
              className={`document-wrapper ${index === activeDocumentIndex ? 'active' : ''}`}
              onClick={() => onDocumentSelect(index)}
            >
              <div className="document-header">
                <span className="document-title">
                  {doc.name || `מסמך ${index + 1}`}
                </span>
                <button 
                  className="close-document-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDocumentClose(index);
                  }}
                  title="סגור מסמך"
                >
                  ✕
                </button>
              </div>
              <div 
                className="document-content"
                style={doc.style}
              >
                {doc.content || 'מסמך ריק'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiTextDisplay;