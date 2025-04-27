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
  // Helper function to find segment index and relative position
  const findSegmentAndPosition = (doc, position) => {
    let cumulativeLength = 0;
    
    for (let i = 0; i < doc.textSegments.length; i++) {
      const segmentLength = doc.textSegments[i].text.length;
      if (cumulativeLength + segmentLength > position) {
        return {
          segmentIndex: i,
          localPosition: position - cumulativeLength
        };
      }
      cumulativeLength += segmentLength;
    }
    
    // If we got here, cursor is probably at the end of document
    return {
      segmentIndex: doc.textSegments.length - 1,
      localPosition: doc.textSegments.length > 0 ? doc.textSegments[doc.textSegments.length - 1].text.length : 0
    };
  };

  // Helper function to render document content with multi-style segments
  const renderDocumentContent = (doc, index) => {
    // If document is empty, show message
    if (!doc.textSegments || doc.textSegments.length === 0) {
      return (
        <div className="document-content" style={doc.defaultStyle || {}}>
          פתק ריק
        </div>
      );
    }

    // If not active document, show segments without cursor
    if (index !== activeDocumentIndex) {
      return (
        <div className="document-content">
          {doc.textSegments.map((segment, idx) => (
            <span key={idx} style={segment.style || doc.defaultStyle}>
              {segment.text}
            </span>
          ))}
        </div>
      );
    }

    // If active document, find cursor position
    const { segmentIndex, localPosition } = findSegmentAndPosition(doc, cursorPosition);
    
    return (
      <div className="document-content">
        {doc.textSegments.map((segment, idx) => {
          // If this is the segment with cursor, split it
          if (idx === segmentIndex) {
            const beforeCursor = segment.text.substring(0, localPosition);
            const afterCursor = segment.text.substring(localPosition);
            
            return (
              <React.Fragment key={idx}>
                <span style={segment.style || doc.defaultStyle}>{beforeCursor}</span>
                <span className="cursor-position"></span>
                <span style={segment.style || doc.defaultStyle}>{afterCursor}</span>
              </React.Fragment>
            );
          }
          
          // Otherwise, show segment normally
          return (
            <span key={idx} style={segment.style || doc.defaultStyle}>
              {segment.text}
            </span>
          );
        })}
      </div>
    );
  };

  // Handler for mouse clicks to update cursor position
  const handleDocumentClick = (event, index) => {
    if (index === activeDocumentIndex && onCursorChange) {
      const element = event.currentTarget.querySelector('.document-content');
      if (!element) return;
      
      const doc = documents[index];
      if (!doc.textSegments || doc.textSegments.length === 0) {
        onCursorChange(0);
        return;
      }
      
      // Simple calculation - get relative percentage of click position
      // and convert to relative position in text
      const rect = element.getBoundingClientRect();
      const relativeX = event.clientX - rect.left;
      const percentage = relativeX / rect.width;
      
      const totalLength = doc.fullContent.length;
      let estimatedPosition = Math.floor(percentage * totalLength);
      
      // Ensure position is within bounds
      estimatedPosition = Math.min(Math.max(0, estimatedPosition), totalLength);
      
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
            key={`${index}-${doc.fullContent.length}`}
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
                    // Prevent double clicks
                    e.target.disabled = true;
                    onDocumentClose(index);
                    // Re-enable button after a short delay
                    setTimeout(() => {
                      if (e.target && !e.target.disabled) {
                        e.target.disabled = false;
                      }
                    }, 500);
                  }}
                  title="סגור פתק"
                >
                  ✕
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