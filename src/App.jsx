import React, { useState } from 'react';
import './App.css';
import emojiRegex from 'emoji-regex';
import MultiTextDisplay from './components/MultiTextDisplay';
import TextEditor from './components/TextEditor';
import FileOperations from './components/FileOperations';
import UserAuth from './components/UserAuth';

function App() {

  // State for current user
  const [currentUser, setCurrentUser] = useState(null);

  // State for open documents
  const [documents, setDocuments] = useState([]);

  // Index of currently active document
  const [activeDocumentIndex, setActiveDocumentIndex] = useState(-1);

  // Cursor position in active document
  const [cursorPosition, setCursorPosition] = useState(0);

  // State for current style of active document
  const [currentStyle, setCurrentStyle] = useState({
    fontFamily: 'Arial',
    fontSize: '16px',
    color: '#000000',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    direction: 'rtl', // Default for Hebrew
  });

  // New state - whether style changes apply only from this point forward
  const [applyStyleFromNow, setApplyStyleFromNow] = useState(false);

  // State for current keyboard language
  const [currentLanguage, setCurrentLanguage] = useState('hebrew');

  // Action history for undo functionality
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [appMessage, setAppMessage] = useState('');
  const [appMessageType, setAppMessageType] = useState('');


  // Helper function to find text segment and relative position
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

    // If we got here, the cursor is probably at the end of the document
    return {
      segmentIndex: doc.textSegments.length - 1,
      localPosition: doc.textSegments.length > 0 ? doc.textSegments[doc.textSegments.length - 1].text.length : 0
    };
  };

  // Shared function for displaying messages throughout the application
  const showMessage = (text, type) => {
    setAppMessage(text);
    setAppMessageType(type);
    setTimeout(() => {
      setAppMessage('');
    }, 3000);
  };

  // Function to create a new document
  const createNewDocument = () => {
    const defaultStyle = {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#000000',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      direction: 'rtl', // Default for Hebrew
    };

    const newDocument = {
      name: `פתק ${documents.length + 1}`,
      // Instead of storing just regular content, we store an array of text segments with style for each
      textSegments: [],
      // We also store the full text for convenience
      fullContent: '',
      // We store the general style as default
      defaultStyle: { ...defaultStyle }
    };

    // Update the documents and set the new document as active
    const newDocuments = [...documents, newDocument];
    setDocuments(newDocuments);
    setActiveDocumentIndex(newDocuments.length - 1);
    setCurrentStyle(defaultStyle);
    setCursorPosition(0);
  };

  // Function to open a new document
  const openNewDocument = (textSegments, defaultStyle, name) => {
    const doc = {
      name: name || `מסמך ${documents.length + 1}`,
      textSegments: textSegments || [],
      fullContent: textSegments ? textSegments.reduce((acc, segment) => acc + segment.text, '') : '',
      defaultStyle: { ...defaultStyle }
    };

    const newDocuments = [...documents, doc];
    setDocuments(newDocuments);
    setActiveDocumentIndex(newDocuments.length - 1);
    setCurrentStyle(defaultStyle);
    setCursorPosition(doc.fullContent.length);

    // Save in history
    const newHistory = [];
    newHistory.push(JSON.parse(JSON.stringify(doc))); // Deep copy
    setHistory(newHistory);
    setHistoryIndex(0);
  };

  // Function to select active document
  const selectDocument = (index) => {
    if (index >= 0 && index < documents.length) {
      setActiveDocumentIndex(index);
      const doc = documents[index];
      // Update current style to the document's default style
      if (doc.defaultStyle) {
        setCurrentStyle(doc.defaultStyle);
      }
      setCursorPosition(doc.fullContent ? doc.fullContent.length : 0);
    }
  };

  // Function to update cursor position
  const handleCursorChange = (position) => {
    setCursorPosition(position);
    console.log('Cursor position changed to:', position);
  };
// Function to close a document
const closeDocument = (index) => {
  // בדיקה שהמסמך קיים
  const documentToClose = documents[index];
  if (!documentToClose) return;

  // יצירת עותק של רשימת המסמכים הנוכחית
  const newDocuments = [...documents];
  // הסרת המסמך מהרשימה
  newDocuments.splice(index, 1);
  
  // עדכון רשימת המסמכים
  setDocuments(newDocuments);

  // עדכון המסמך הפעיל
  if (index === activeDocumentIndex) {
    if (newDocuments.length > 0) {
      // אם סגרנו את המסמך האחרון, נבחר את המסמך האחרון החדש
      if (index >= newDocuments.length) {
        setActiveDocumentIndex(newDocuments.length - 1);
      } else {
        setActiveDocumentIndex(index < newDocuments.length ? index : newDocuments.length - 1);
      }
    } else {
      // אם לא נשארו מסמכים פתוחים, נאפס את האינדקס הפעיל
      setActiveDocumentIndex(-1);
      // אין צורך ליצור מסמך חדש אוטומטית בעת סגירת המסמך האחרון
    }
  } else if (index < activeDocumentIndex) {
    // אם המסמך שנסגר היה לפני המסמך הפעיל, יש לעדכן את האינדקס
    setActiveDocumentIndex(activeDocumentIndex - 1);
  }
};
  
  


// Function to add a character
const addCharacter = (char) => {
  if (activeDocumentIndex >= 0) {
    // Validate that the character is valid
    if (char === undefined || char === null) {
      console.error("Character is undefined or null");
      return;
    }

    // Ensure the character is a string
    const charToAdd = char;
    const isEmoji = emojiRegex().test(charToAdd);
    const newDocuments = [...documents];
    const currentDoc = JSON.parse(JSON.stringify(newDocuments[activeDocumentIndex])); // Deep copy

    // Make sure text segments exist
    if (!currentDoc.textSegments) {
      currentDoc.textSegments = [];
    }

    if (isEmoji) {
      currentDoc.textSegments.push({
        text: charToAdd,
        style: { ...currentStyle }
      });
      currentDoc.fullContent = charToAdd;

      newDocuments[activeDocumentIndex] = currentDoc;
      setDocuments(newDocuments);
      setCursorPosition(cursorPosition + charToAdd.length);
      return;

    }

    if (currentDoc.textSegments.length === 0) {
      // If no text segments exist, create a new one
      currentDoc.textSegments.push({
        text: charToAdd,
        style: { ...currentStyle }
      });
      currentDoc.fullContent = charToAdd;

      newDocuments[activeDocumentIndex] = currentDoc;
      setDocuments(newDocuments);
      setCursorPosition(1);
      return;
    }


    // Find the segment and relative position
    const { segmentIndex, localPosition } = findSegmentAndPosition(currentDoc, cursorPosition);

    if (applyStyleFromNow) {
      // "Apply from now on" mode - check whether to create a new segment or split the existing one

      if (segmentIndex >= 0 && localPosition === currentDoc.textSegments[segmentIndex].text.length) {
        // Cursor is at the end of an existing segment, check if styles match
        const currentSegment = currentDoc.textSegments[segmentIndex];
        const isSameStyle = JSON.stringify(currentSegment.style) === JSON.stringify(currentStyle);

        if (isSameStyle) {
          // If style matches, add character to the current segment
          currentSegment.text += charToAdd;
        } else {
          // If style is different, create a new segment
          currentDoc.textSegments.splice(segmentIndex + 1, 0, {
            text: charToAdd,
            style: { ...currentStyle }
          });
        }
      } else if (segmentIndex >= 0) {
        // Cursor is inside an existing segment, need to split it
        const currentSegment = currentDoc.textSegments[segmentIndex];
        const beforeText = currentSegment.text.substring(0, localPosition);
        const afterText = currentSegment.text.substring(localPosition);

        // Update the current segment with the text before the cursor
        currentSegment.text = beforeText;

        // Insert a new segment with the new character
        currentDoc.textSegments.splice(segmentIndex + 1, 0, {
          text: charToAdd,
          style: { ...currentStyle }
        });

        // Insert another segment with the remaining text (if any)
        if (afterText) {
          currentDoc.textSegments.splice(segmentIndex + 2, 0, {
            text: afterText,
            style: { ...currentSegment.style }
          });
        }
      } else {
        // No appropriate segment found, create a new one
        currentDoc.textSegments.push({
          text: charToAdd,
          style: { ...currentStyle }
        });
      }
    } else {
      // "All text" mode - apply a unified style to the whole document

      if (currentDoc.textSegments.length === 1) {
        // Only one segment exists, update it
        const segment = currentDoc.textSegments[0];

        const beforeText = segment.text.substring(0, localPosition);
        const afterText = segment.text.substring(localPosition);

        // Update the segment with the added character
        segment.text = beforeText + charToAdd + afterText;
        segment.style = { ...currentStyle };
      } else {
        // Multiple segments exist, merge them into one
        const fullText = currentDoc.fullContent;
        const beforeText = fullText.substring(0, cursorPosition);
        const afterText = fullText.substring(cursorPosition);

        // Replace all segments with a single one
        currentDoc.textSegments = [{
          text: beforeText + charToAdd + afterText,
          style: { ...currentStyle }
        }];
      }
    }

    // Update the full content
    currentDoc.fullContent = currentDoc.textSegments.reduce((acc, segment) => acc + segment.text, '');

    newDocuments[activeDocumentIndex] = currentDoc;
    setDocuments(newDocuments);
    setCursorPosition(cursorPosition + 1);

    // Save in history (optional to improve performance)
    if (historyIndex >= 0 && history.length > 0) {
      const lastHistory = history[historyIndex];
      // Save to history only if there is a significant change
      if (lastHistory.fullContent.length + 5 < currentDoc.fullContent.length) {
        const newHistory = [...history.slice(0, historyIndex + 1)];
        newHistory.push(JSON.parse(JSON.stringify(currentDoc))); // Deep copy
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    }
  } else if (documents.length === 0) {
    // If there are no documents and the user is connected, create a new document
    if (currentUser && currentUser !== 'default') {
      createNewDocument();
      // Retry after creating a new document
      setTimeout(() => addCharacter(char), 10);
    } else {
      showMessage('You must be logged in to create a new note.', 'error');
    }
  }
};

// const addCharacter = (char) => {
//   if (activeDocumentIndex >= 0) {
//     // אם התו הוא אימוגי, פשוט מוסיפים אותו
//     const charToAdd = String(char);
//     const isEmoji = emojiRegex().test(charToAdd); 
//     const newDocuments = [...documents];
//     const currentDoc = JSON.parse(JSON.stringify(newDocuments[activeDocumentIndex])); // Copy document

//     // אם אין מקטעים, יוצרים מקטע חדש עם התו
//     if (!currentDoc.textSegments) {
//       currentDoc.textSegments = [];
//     }

//     if (currentDoc.textSegments.length === 0 || isEmoji) {
//       // אם אין מקטעים או אם מדובר באימוגי
//       currentDoc.textSegments.push({
//         text: charToAdd,
//         style: { ...currentStyle }
//       });
//       currentDoc.fullContent = charToAdd;

//       newDocuments[activeDocumentIndex] = currentDoc;
//       setDocuments(newDocuments);

//       // אם מדובר באימוגי, הסמן יתעדכן לאחר האימוגי
//       setCursorPosition(cursorPosition + charToAdd.length);
//       return;
//     }

//     // אם יש מקטעים, בודקים איפה להוסיף את התו
//     const { segmentIndex, localPosition } = findSegmentAndPosition(currentDoc, cursorPosition);

//     // אם יש סגנון מיוחד שמופעל על המקטעים
//     if (applyStyleFromNow) {
//       if (segmentIndex >= 0) {
//         const currentSegment = currentDoc.textSegments[segmentIndex];
//         currentSegment.text = currentSegment.text.substring(0, localPosition) + charToAdd + currentSegment.text.substring(localPosition);
//       }
//     } else {
//       // אם אין סגנון, פשוט משנים את התוכן של המקטע
//       currentDoc.textSegments[0].text = currentDoc.textSegments[0].text.substring(0, localPosition) + charToAdd + currentDoc.textSegments[0].text.substring(localPosition);
//     }

//     // מעדכנים את התוכן הכולל של המסמך
//     currentDoc.fullContent = currentDoc.textSegments.reduce((acc, segment) => acc + segment.text, '');

//     newDocuments[activeDocumentIndex] = currentDoc;
//     setDocuments(newDocuments);

//     // אם מדובר באימוגי, הסמן יתעדכן בהתאם לאורך האימוגי
//     if (isEmoji) {
//       setCursorPosition(cursorPosition + charToAdd.length);
//     } else {
//       setCursorPosition(cursorPosition + 1);  // אם זה תו רגיל, העבר רק בחצי
//     }
//   } else if (documents.length === 0) {
//     if (currentUser && currentUser !== 'default') {
//       createNewDocument();
//       setTimeout(() => addCharacter(char), 10);
//     } else {
//       showMessage('You must be logged in to create a new note.', 'error');
//     }
//   }
// };



// Function to delete a character
// const deleteCharacter = () => {
//   if (activeDocumentIndex >= 0) {
//     const newDocuments = [...documents];
//     const currentDoc = JSON.parse(JSON.stringify(newDocuments[activeDocumentIndex])); // Deep copy

//     if (!currentDoc.textSegments || currentDoc.textSegments.length === 0 || !currentDoc.fullContent || cursorPosition === 0) {
//       return; // Nothing to delete
//     }

//     // Find the segment and relative position
//     const { segmentIndex, localPosition } = findSegmentAndPosition(currentDoc, cursorPosition);

//     if (localPosition > 0) {
//       // Delete a character within an existing segment
//       const segment = currentDoc.textSegments[segmentIndex];
//       const beforeDelete = segment.text.substring(0, localPosition - 1);
//       const afterDelete = segment.text.substring(localPosition);

//       if (beforeDelete.length === 0 && afterDelete.length === 0) {
//         // The segment became empty - delete it
//         currentDoc.textSegments.splice(segmentIndex, 1);
//       } else {
//         // Update the existing segment
//         segment.text = beforeDelete + afterDelete;
//       }
//     } else if (segmentIndex > 0) {
//       // Delete a character at the boundary between segments - delete the last character in the previous segment
//       const prevSegment = currentDoc.textSegments[segmentIndex - 1];

//       if (prevSegment.text.length === 1) {
//         // If only one character remains in the previous segment, delete the entire segment
//         currentDoc.textSegments.splice(segmentIndex - 1, 1);
//       } else {
//         // Otherwise, delete just the last character
//         prevSegment.text = prevSegment.text.substring(0, prevSegment.text.length - 1);
//       }
//     }

//     // Remove empty segments
//     currentDoc.textSegments = currentDoc.textSegments.filter(segment => segment.text.length > 0);

//     // Merge adjacent segments with the same style in "All text" mode
//     if (!applyStyleFromNow) {
//       // In "All text" mode, merge all segments into one
//       if (currentDoc.textSegments.length > 0) {
//         const fullText = currentDoc.textSegments.reduce((acc, segment) => acc + segment.text, '');
//         currentDoc.textSegments = [{
//           text: fullText,
//           style: { ...currentStyle }
//         }];
//       }
//     } else {
//       // In "From now on" mode, check if there are adjacent segments with the same style to merge
//       for (let i = 0; i < currentDoc.textSegments.length - 1; i++) {
//         const current = currentDoc.textSegments[i];
//         const next = currentDoc.textSegments[i + 1];

//         if (JSON.stringify(current.style) === JSON.stringify(next.style)) {
//           // If two adjacent segments have the same style, merge them
//           current.text += next.text;
//           currentDoc.textSegments.splice(i + 1, 1);
//           i--; // Check the same segment again
//         }
//       }
//     }

//     // Update the full content
//     currentDoc.fullContent = currentDoc.textSegments.reduce((acc, segment) => acc + segment.text, '');

//     newDocuments[activeDocumentIndex] = currentDoc;
//     setDocuments(newDocuments);
//     setCursorPosition(cursorPosition - 1);

//     // Save in history
//     const newHistory = historyIndex >= 0 ? history.slice(0, historyIndex + 1) : [];
//     newHistory.push(JSON.parse(JSON.stringify(currentDoc))); // Deep copy
//     setHistory(newHistory);
//     setHistoryIndex(newHistory.length - 1);
//   }
// };

const deleteCharacter = () => {
  if (activeDocumentIndex >= 0) {
    const newDocuments = [...documents];
    const currentDoc = JSON.parse(JSON.stringify(newDocuments[activeDocumentIndex])); // Deep copy

    if (!currentDoc.textSegments || currentDoc.textSegments.length === 0 || !currentDoc.fullContent || cursorPosition === 0) {
      return; // Nothing to delete
    }

    // Find the segment and relative position
    const { segmentIndex, localPosition } = findSegmentAndPosition(currentDoc, cursorPosition);

    if (localPosition > 0) {
      // Delete a character within an existing segment
      const segment = currentDoc.textSegments[segmentIndex];
      let beforeDelete = segment.text.substring(0, localPosition - 1);
      let afterDelete = segment.text.substring(localPosition);

      // Check if the previous character is an emoji using emojiRegex
      const prevChar = beforeDelete[beforeDelete.length - 1];
      const isEmoji = emojiRegex().test(prevChar);

      if (isEmoji) {
        // If it's an emoji, delete 2 characters
        beforeDelete = beforeDelete.substring(0, beforeDelete.length - 2);
      } else {
        // Otherwise, delete just 1 character (regular char)
        beforeDelete = beforeDelete.substring(0, beforeDelete.length - 1);
      }

      if (beforeDelete.length === 0 && afterDelete.length === 0) {
        // The segment became empty - delete it
        currentDoc.textSegments.splice(segmentIndex, 1);
      } else {
        // Update the existing segment
        segment.text = beforeDelete + afterDelete;
      }
    } else if (segmentIndex > 0) {
      // Delete a character at the boundary between segments - delete the last character in the previous segment
      const prevSegment = currentDoc.textSegments[segmentIndex - 1];

      if (prevSegment.text.length === 1) {
        // If only one character remains in the previous segment, delete the entire segment
        currentDoc.textSegments.splice(segmentIndex - 1, 1);
      } else {
        // Otherwise, delete just the last character
        prevSegment.text = prevSegment.text.substring(0, prevSegment.text.length - 1);
      }
    }

    // Remove empty segments
    currentDoc.textSegments = currentDoc.textSegments.filter(segment => segment.text.length > 0);

    // Merge adjacent segments with the same style in "All text" mode
    if (!applyStyleFromNow) {
      // In "All text" mode, merge all segments into one
      if (currentDoc.textSegments.length > 0) {
        const fullText = currentDoc.textSegments.reduce((acc, segment) => acc + segment.text, '');
        currentDoc.textSegments = [{
          text: fullText,
          style: { ...currentStyle }
        }];
      }
    } else {
      // In "From now on" mode, check if there are adjacent segments with the same style to merge
      for (let i = 0; i < currentDoc.textSegments.length - 1; i++) {
        const current = currentDoc.textSegments[i];
        const next = currentDoc.textSegments[i + 1];

        if (JSON.stringify(current.style) === JSON.stringify(next.style)) {
          // If two adjacent segments have the same style, merge them
          current.text += next.text;
          currentDoc.textSegments.splice(i + 1, 1);
          i--; // Check the same segment again
        }
      }
    }

    // Update the full content
    currentDoc.fullContent = currentDoc.textSegments.reduce((acc, segment) => acc + segment.text, '');

    newDocuments[activeDocumentIndex] = currentDoc;
    setDocuments(newDocuments);
    setCursorPosition(cursorPosition - 1);

    // Save in history
    const newHistory = historyIndex >= 0 ? history.slice(0, historyIndex + 1) : [];
    newHistory.push(JSON.parse(JSON.stringify(currentDoc))); // Deep copy
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }
};



// Function to delete a word
const deleteWord = () => {
  if (activeDocumentIndex >= 0) {
    const newDocuments = [...documents];
    const currentDoc = JSON.parse(JSON.stringify(newDocuments[activeDocumentIndex])); // Deep copy

    if (!currentDoc.textSegments || currentDoc.textSegments.length === 0 || !currentDoc.fullContent || cursorPosition === 0) {
      return; // Nothing to delete
    }

    // Find the segment and relative position
    const { segmentIndex, localPosition } = findSegmentAndPosition(currentDoc, cursorPosition);

    // If we are at the beginning of a segment, delete the last word in the previous segment
    if (localPosition === 0 && segmentIndex > 0) {
      const prevSegment = currentDoc.textSegments[segmentIndex - 1];
      const words = prevSegment.text.trimEnd().split(/\s+/);

      if (words.length > 1) {
        // Keep all words except the last one
        words.pop();
        prevSegment.text = words.join(' ') + ' ';
      } else {
        // Only one word in the segment, delete the entire segment
        currentDoc.textSegments.splice(segmentIndex - 1, 1);
      }
    } else if (segmentIndex >= 0) {
      // Delete a word within the current segment
      const segment = currentDoc.textSegments[segmentIndex];
      const textBeforeCursor = segment.text.substring(0, localPosition);
      const textAfterCursor = segment.text.substring(localPosition);

      // Find the last space in the text before the cursor
      const lastSpaceIndex = textBeforeCursor.lastIndexOf(' ');

      if (lastSpaceIndex !== -1) {
        // There's a space - delete the last word
        segment.text = textBeforeCursor.substring(0, lastSpaceIndex + 1) + textAfterCursor;
      } else {
        // No space - delete all text before the cursor
        segment.text = textAfterCursor;
      }

      // If the segment became empty, delete it
      if (segment.text.length === 0) {
        currentDoc.textSegments.splice(segmentIndex, 1);
      }
    }

    // Remove empty segments
    currentDoc.textSegments = currentDoc.textSegments.filter(segment => segment.text.length > 0);

    // Merge segments in "All text" mode
    if (!applyStyleFromNow && currentDoc.textSegments.length > 0) {
      const fullText = currentDoc.textSegments.reduce((acc, segment) => acc + segment.text, '');
      currentDoc.textSegments = [{
        text: fullText,
        style: { ...currentStyle }
      }];
    }

    // Update the full content
    currentDoc.fullContent = currentDoc.textSegments.reduce((acc, segment) => acc + segment.text, '');

    // Calculate the new cursor position
    let newCursorPosition = 0;
    if (segmentIndex > 0) {
      for (let i = 0; i < segmentIndex; i++) {
        if (i < currentDoc.textSegments.length) {
          newCursorPosition += currentDoc.textSegments[i].text.length;
        }
      }
    }

    if (segmentIndex < currentDoc.textSegments.length) {
      // If the segment still exists, add the local position
      const segment = currentDoc.textSegments[segmentIndex];
      const textBeforeCursor = segment.text.substring(0, localPosition);
      const lastSpaceIndex = textBeforeCursor.lastIndexOf(' ');

      if (lastSpaceIndex !== -1) {
        newCursorPosition += lastSpaceIndex + 1;
      }
    }

    newDocuments[activeDocumentIndex] = currentDoc;
    setDocuments(newDocuments);
    setCursorPosition(Math.max(0, newCursorPosition));

    // Save in history
    const newHistory = historyIndex >= 0 ? history.slice(0, historyIndex + 1) : [];
    newHistory.push(JSON.parse(JSON.stringify(currentDoc))); // Deep copy
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }
};

// Function to clear text
const clearText = () => {
  if (activeDocumentIndex >= 0) {
    if (window.confirm('Are you sure you want to delete all text?')) {
      const newDocuments = [...documents];
      const currentDoc = { ...newDocuments[activeDocumentIndex] };

      // Clear all segments
      currentDoc.textSegments = [];
      currentDoc.fullContent = '';

      newDocuments[activeDocumentIndex] = currentDoc;
      setDocuments(newDocuments);
      setCursorPosition(0);

      // Save in history
      const newHistory = historyIndex >= 0 ? history.slice(0, historyIndex + 1) : [];
      newHistory.push(JSON.parse(JSON.stringify(currentDoc))); // Deep copy
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }
};

// Function to set "From now on" mode
const setApplyStyleFromNowMode = (value) => {
  console.log("Setting applyStyleFromNow to:", value);
  setApplyStyleFromNow(value);

  // If we changed to "All text" mode, update all segments to the current style
  if (!value && activeDocumentIndex >= 0) {
    const newDocuments = [...documents];
    const currentDoc = { ...newDocuments[activeDocumentIndex] };

    if (currentDoc.textSegments && currentDoc.textSegments.length > 0) {
      // Merge all segments into one
      const fullText = currentDoc.textSegments.reduce((acc, segment) => acc + segment.text, '');
      currentDoc.textSegments = [{
        text: fullText,
        style: { ...currentStyle }
      }];
      currentDoc.fullContent = fullText;

      newDocuments[activeDocumentIndex] = currentDoc;
      setDocuments(newDocuments);

      // Save in history
      const newHistory = historyIndex >= 0 ? history.slice(0, historyIndex + 1) : [];
      newHistory.push(JSON.parse(JSON.stringify(currentDoc))); // Deep copy
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }
};

// Function to change style
const changeStyle = (style) => {
  if (activeDocumentIndex >= 0) {
    // Special handling for toggle properties like bold, italic, and underline
    const newStyle = { ...currentStyle, ...style };

    // Toggle handling for bold
    if (style.hasOwnProperty('fontWeight')) {
      if (style.fontWeight === currentStyle.fontWeight) {
        newStyle.fontWeight = 'normal';
      }
    }

    // Toggle handling for italic
    if (style.hasOwnProperty('fontStyle')) {
      if (style.fontStyle === currentStyle.fontStyle) {
        newStyle.fontStyle = 'normal';
      }
    }

    // Toggle handling for underline
    if (style.hasOwnProperty('textDecoration')) {
      if (style.textDecoration === currentStyle.textDecoration) {
        newStyle.textDecoration = 'none';
      }
    }

    setCurrentStyle(newStyle);

    // If "From now on" mode is not enabled, apply changes to the entire document
    if (!applyStyleFromNow) {
      const newDocuments = [...documents];
      const currentDoc = { ...newDocuments[activeDocumentIndex] };

      // Update all segments to the new style
      if (currentDoc.textSegments && currentDoc.textSegments.length > 0) {
        // Merge all segments into one with the new style
        const fullText = currentDoc.textSegments.reduce((acc, segment) => acc + segment.text, '');
        currentDoc.textSegments = [{
          text: fullText,
          style: { ...newStyle }
        }];
      }

      currentDoc.defaultStyle = { ...newStyle };

      newDocuments[activeDocumentIndex] = currentDoc;
      setDocuments(newDocuments);

      // Save in history
      const newHistory = historyIndex >= 0 ? history.slice(0, historyIndex + 1) : [];
      newHistory.push(JSON.parse(JSON.stringify(currentDoc))); // Deep copy
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
    // If "From now on" mode is enabled, only the current style (currentStyle) changes
    // and it will apply to new text that is added
  }
};

// Function to change keyboard language
const changeLanguage = (language) => {
  setCurrentLanguage(language);

  // Change text direction according to language
  let direction = currentStyle.direction;
  if (language === 'hebrew') {
    direction = 'rtl';
  } else if (language === 'english') {
    direction = 'ltr';
  }

  changeStyle({ direction });
};

// Function to search text
const searchText = (searchTerm) => {
  if (activeDocumentIndex >= 0 && searchTerm) {
    const currentDoc = documents[activeDocumentIndex];
    const position = currentDoc.fullContent.indexOf(searchTerm);

    if (position !== -1) {
      alert(`The text "${searchTerm}" was found at position ${position}`);
      setCursorPosition(position + searchTerm.length);
      return position;
    } else {
      alert(`The text "${searchTerm}" was not found in the document`);
      return -1;
    }
  }
  return -1;
};

// Function to replace text
const replaceText = (searchTerm, replaceTerm) => {
  if (activeDocumentIndex >= 0 && searchTerm && replaceTerm) {
    const newDocuments = [...documents];
    const currentDoc = JSON.parse(JSON.stringify(newDocuments[activeDocumentIndex])); // Deep copy

    let replacementCount = 0;

    // Check if replacement is needed
    if (currentDoc.fullContent.includes(searchTerm)) {
      if (!applyStyleFromNow) {
        // In "All text" mode - simple replacement
        currentDoc.fullContent = currentDoc.fullContent.replace(new RegExp(searchTerm, 'g'), replaceTerm);

        // Update the content in the single segment
        if (currentDoc.textSegments.length === 1) {
          currentDoc.textSegments[0].text = currentDoc.fullContent;
        } else if (currentDoc.textSegments.length > 1) {
          // Merge all segments into one
          currentDoc.textSegments = [{
            text: currentDoc.fullContent,
            style: { ...currentStyle }
          }];
        }

        replacementCount = (currentDoc.fullContent.match(new RegExp(replaceTerm, 'g')) || []).length;
      } else {
        // In "From now on" mode - replacement while preserving segment structure
        // Go through all segments and perform replacement
        for (let i = 0; i < currentDoc.textSegments.length; i++) {
          const segment = currentDoc.textSegments[i];

          if (segment.text.includes(searchTerm)) {
            // Count how many times the search term appears in the segment
            const count = (segment.text.match(new RegExp(searchTerm, 'g')) || []).length;
            replacementCount += count;

            // Replace all occurrences in the segment
            segment.text = segment.text.replace(new RegExp(searchTerm, 'g'), replaceTerm);
          }
        }

        // Update the full content
        currentDoc.fullContent = currentDoc.textSegments.reduce((acc, segment) => acc + segment.text, '');
      }

      newDocuments[activeDocumentIndex] = currentDoc;
      setDocuments(newDocuments);

      // Save in history
      const newHistory = historyIndex >= 0 ? history.slice(0, historyIndex + 1) : [];
      newHistory.push(JSON.parse(JSON.stringify(currentDoc))); // Deep copy
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);

      alert(`Replaced ${replacementCount} occurrences of "${searchTerm}" with "${replaceTerm}"`);
    } else {
      alert(`The text "${searchTerm}" was not found in the document`);
    }
  }
};

// Function to perform undo
const undo = () => {
  if (historyIndex > 0 && activeDocumentIndex >= 0) {
    const newIndex = historyIndex - 1;
    const previousState = history[newIndex];

    const newDocuments = [...documents];
    newDocuments[activeDocumentIndex] = JSON.parse(JSON.stringify(previousState)); // Deep copy

    setDocuments(newDocuments);
    if (previousState.defaultStyle) {
      setCurrentStyle(previousState.defaultStyle);
    }
    setHistoryIndex(newIndex);
    setCursorPosition(previousState.fullContent ? previousState.fullContent.length : 0);
  }
};

// Function to load a document
const loadDocument = (textSegments, defaultStyle, name = null) => {
  if (activeDocumentIndex >= 0) {
    const newDocuments = [...documents];
    const doc = {
      ...newDocuments[activeDocumentIndex],
      textSegments: textSegments || [],
      fullContent: textSegments ? textSegments.reduce((acc, segment) => acc + segment.text, '') : '',
      defaultStyle: { ...defaultStyle },
      name: name || newDocuments[activeDocumentIndex].name
    };

    newDocuments[activeDocumentIndex] = doc;
    setDocuments(newDocuments);
    setCurrentStyle(defaultStyle);
    setCursorPosition(doc.fullContent.length);

    // Save in history
    const newHistory = historyIndex >= 0 ? history.slice(0, historyIndex + 1) : [];
    newHistory.push(JSON.parse(JSON.stringify(doc))); // Deep copy
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  } else {
    // If there's no active document, create a new one
    const doc = {
      name: name || `מסמך ${documents.length + 1}`,
      textSegments: textSegments || [],
      fullContent: textSegments ? textSegments.reduce((acc, segment) => acc + segment.text, '') : '',
      defaultStyle: { ...defaultStyle }
    };

    const newDocuments = [...documents, doc];
    setDocuments(newDocuments);
    setActiveDocumentIndex(newDocuments.length - 1);
    setCurrentStyle(defaultStyle);
    setCursorPosition(doc.fullContent.length);

    // Save in history
    const newHistory = [];
    newHistory.push(JSON.parse(JSON.stringify(doc))); // Deep copy
    setHistory(newHistory);
    setHistoryIndex(0);
  }
};

// Function to handle user login
const handleUserLogin = (username) => {
  setCurrentUser(username);
};

// Function to handle user logout
const handleUserLogout = () => {
  // On logout - close all documents and create a new empty document
  setCurrentUser(null);

  // Close all documents
  setDocuments([]);
  setActiveDocumentIndex(-1);

  // Create a new empty document
  createNewDocument();
};

// Check if we need to create a new document if there are no open documents
//if (documents.length === 0) {
  //createNewDocument();
//}
// יצירת מסמך חדש רק בעת טעינת הדף בפעם הראשונה
React.useEffect(() => {
  if (documents.length === 0 && currentUser) {
    createNewDocument();
  }
}, []); // הפונקציה תרוץ רק פעם אחת בטעינה ראשונית

return (
  <div className="app-container">
    <UserAuth
      onUserLogin={handleUserLogin}
      onUserLogout={handleUserLogout}
      currentUser={currentUser}
      showMessage={showMessage}
    />
    <FileOperations
      documents={documents}
      activeDocumentIndex={activeDocumentIndex}
      onLoadDocument={(textSegments, defaultStyle, name) => loadDocument(textSegments, defaultStyle, name)}
      onCreateNewDocument={createNewDocument}
      onOpenDocument={(textSegments, defaultStyle, name) => openNewDocument(textSegments, defaultStyle, name)}
      currentUser={currentUser}
      showMessage={showMessage}
    />
    <div className="text-display-container">
      <MultiTextDisplay
        documents={documents}
        activeDocumentIndex={activeDocumentIndex}
        onDocumentSelect={selectDocument}
        onDocumentClose={closeDocument}
        cursorPosition={cursorPosition}
        applyStyleFromNow={applyStyleFromNow}
        currentStyle={currentStyle}
        onCursorChange={handleCursorChange}
      />
    </div>
    <div className="editor-container">
      <TextEditor
        onAddCharacter={addCharacter}
        onDeleteCharacter={deleteCharacter}
        onDeleteWord={deleteWord}
        onClearText={clearText}
        onStyleChange={changeStyle}
        onLanguageChange={changeLanguage}
        currentLanguage={currentLanguage}
        onUndo={undo}
        onSearch={searchText}
        onReplace={replaceText}
        applyStyleFromNow={applyStyleFromNow}
        onSetApplyStyleFromNow={setApplyStyleFromNowMode}
      />
    </div>
  </div>
);
}

export default App;