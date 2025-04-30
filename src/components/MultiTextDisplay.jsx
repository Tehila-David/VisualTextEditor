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
  onCursorChange,
  resetHistory // Add this prop to receive the resetHistory function
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

  // Helper function to handle document selection with history reset
  const handleDocumentSelect = (index) => {
    // First reset history
    if (resetHistory) {
      resetHistory();
      console.log('History reset when selecting document:', index);
    }
    
    // Then call the original onDocumentSelect
    onDocumentSelect(index);
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

  // Handle document click for cursor placement
  const handleDocumentClick = (e, docIndex) => {
    // This function would handle cursor placement when clicking on a document
    // It's not implemented in the current code, but would be used if you want to add this feature
    if (onCursorChange && docIndex === activeDocumentIndex) {
      // Implementation would depend on how you want to handle cursor placement
    }
  };
  
  return (
    <div className="multi-text-display">
      {documents.length === 0 ? (
        <div className="empty-state">
         <p>אין פתקים פתוחים.</p>
        </div>
      ) : (
        <div className="documents-container">
          {documents.map((doc, index) => (
            <div 
              key={`${index}-${doc.fullContent.length}`}
              className={`document-wrapper ${index === activeDocumentIndex ? 'active' : ''}`}
              onClick={(e) => {
                // Use handleDocumentSelect to reset history before selecting document
                handleDocumentSelect(index);
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