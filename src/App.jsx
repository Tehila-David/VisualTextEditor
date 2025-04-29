import React, { useState } from 'react';
import './App.css';
import emojiRegex from 'emoji-regex';
import MultiTextDisplay from './components/MultiTextDisplay';
import TextEditor from './components/TextEditor';
import FileOperations from './components/FileOperations';
import UserAuth from './components/UserAuth';
import storageService from './services/storageService';


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

  const [showConfirmClearText, setShowConfirmClearText] = useState(false);
  const [pendingClearTextAction, setPendingClearTextAction] = useState(null);



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
  // const createNewDocument = () => {
  //   const defaultStyle = {
  //     fontFamily: 'Arial',
  //     fontSize: '16px',
  //     color: '#000000',
  //     fontWeight: 'normal',
  //     fontStyle: 'normal',
  //     textDecoration: 'none',
  //     direction: 'rtl', // Default for Hebrew
  //   };

  //   const newDocument = {
  //     name: `פתק ${documents.length + 1}`,
  //     // Instead of storing just regular content, we store an array of text segments with style for each
  //     textSegments: [],
  //     // We also store the full text for convenience
  //     fullContent: '',
  //     // We store the general style as default
  //     defaultStyle: { ...defaultStyle }
  //   };

  //   // Update the documents and set the new document as active
  //   const newDocuments = [...documents, newDocument];
  //   setDocuments(newDocuments);
  //   setActiveDocumentIndex(newDocuments.length - 1);
  //   setCurrentStyle(defaultStyle);
  //   setCursorPosition(0);
  // };

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

    // יצירת מסמך ריק עם סגנון ברירת מחדל
    const newDocument = {
      name: `פתק ${documents.length + 1}`,
      textSegments: [],
      fullContent: '',
      defaultStyle: { ...defaultStyle }
    };

    // עדכון רשימת המסמכים והגדרת המסמך החדש כפעיל
    const newDocuments = [...documents, newDocument];
    setDocuments(newDocuments);
    setActiveDocumentIndex(newDocuments.length - 1);
    setCurrentStyle(defaultStyle);
    setCursorPosition(0);

    // יצירת היסטוריה התחלתית - חשוב מאוד
    // שימרת העתק עמוק של המסמך הריק עם מיקום סמן 0
    const initialState = JSON.parse(JSON.stringify(newDocument));
    initialState.cursorPosition = 0;

    const newHistory = [initialState];
    setHistory(newHistory);
    setHistoryIndex(0);

    console.log('נוצר מסמך חדש עם היסטוריה התחלתית');
  };


  // Function to open a new document
  const openNewDocument = (textSegments, defaultStyle, name) => {
    const doc = {
      name: name || `פתק${documents.length + 1}`,
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


  // Function to close a document - with autosave
  const closeDocument = (index) => {
    // Check that the document exists
    const documentToClose = documents[index];
    if (!documentToClose) return;

    // Check if it's a default note (not a saved one)
    const isDefaultNoteName = /^פתק \d+$/.test(documentToClose.name);

    // Add print for debugging
    console.log('Closing document:', documentToClose.name);
    console.log('Is default note name:', isDefaultNoteName);
    console.log('Has content:', documentToClose.fullContent && documentToClose.fullContent.trim() !== '');

    // Auto-save only if:
    // 1. The user is connected
    // 2. The note has content
    // 3. The name of the note is not a default name
    if (currentUser && currentUser !== 'default' &&
      documentToClose.name &&
      !isDefaultNoteName &&
      documentToClose.fullContent && documentToClose.fullContent.trim() !== '') {
      try {
        console.log('Attempting to auto-save document:', documentToClose.name);

        // Save directly with storageService instead of loadDocument
        const documentData = {
          textSegments: documentToClose.textSegments || [],
          fullContent: documentToClose.fullContent || '',
          defaultStyle: documentToClose.defaultStyle || {}
        };

        storageService.saveDocument(documentToClose.name, documentData, currentUser);

        showMessage(`הפתק "${documentToClose.name}" נשמר אוטומטית לפני הסגירה`, 'success');
      } catch (error) {
        console.error('שגיאה בשמירה אוטומטית:', error);
        showMessage('שגיאה בשמירה אוטומטית של הפתק', 'error');
      }
    }

    // Continue regular document closing code...
    const newDocuments = [...documents];
    newDocuments.splice(index, 1);

    setDocuments(newDocuments);

    if (index === activeDocumentIndex) {
      if (newDocuments.length > 0) {
        if (index >= newDocuments.length) {
          setActiveDocumentIndex(newDocuments.length - 1);
        } else {
          setActiveDocumentIndex(index < newDocuments.length ? index : newDocuments.length - 1);
        }
      } else {
        setActiveDocumentIndex(-1);
      }
    } else if (index < activeDocumentIndex) {
      setActiveDocumentIndex(activeDocumentIndex - 1);
    }
  };

  // Function to add a character
  const addCharacter = (char) => {
    if (activeDocumentIndex >= 0) {
      // וידוא שהמצב ההתחלתי (ריק) נשמר אם זו הפעולה הראשונה
      if (historyIndex === -1) {
        // אין עדיין היסטוריה - נשמור את המצב ההתחלתי
        const emptyDoc = JSON.parse(JSON.stringify(documents[activeDocumentIndex]));
        emptyDoc.cursorPosition = 0;

        const newHistory = [emptyDoc];
        setHistory(newHistory);
        setHistoryIndex(0);

        console.log('נוצרה היסטוריה התחלתית עם מסמך ריק');
      }

      // וידוא שהתו תקין
      if (char === undefined || char === null) {
        console.error("התו אינו תקין (undefined או null)");
        return;
      }

      // וידוא שהתו הוא מחרוזת
      const charToAdd = char;
      const isEmoji = emojiRegex().test(charToAdd);
      const newDocuments = [...documents];
      const currentDoc = JSON.parse(JSON.stringify(newDocuments[activeDocumentIndex])); // העתקה עמוקה

      // וידוא שקיימים מקטעי טקסט
      if (!currentDoc.textSegments) {
        currentDoc.textSegments = [];
      }

      // טיפול מיוחד באימוג'י
      if (isEmoji) {
        currentDoc.textSegments.push({
          text: charToAdd,
          style: { ...currentStyle }
        });
        currentDoc.fullContent = charToAdd;

        newDocuments[activeDocumentIndex] = currentDoc;
        setDocuments(newDocuments);

        // חישוב המיקום החדש של הסמן
        const newCursorPosition = cursorPosition + charToAdd.length;
        setCursorPosition(newCursorPosition);

        // שמירה בהיסטוריה עם מיקום הסמן החדש
        const newHistory = [...history.slice(0, historyIndex + 1)];
        const stateToSave = JSON.parse(JSON.stringify(currentDoc));
        stateToSave.cursorPosition = newCursorPosition; // שמירת מיקום הסמן
        newHistory.push(stateToSave);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);

        console.log('נשמר להיסטוריה:', newHistory.length - 1,
          'אחרי הוספת אימוג׳י, מיקום סמן:', newCursorPosition);

        return;
      }

      // אם אין מקטעי טקסט, ניצור חדש
      if (currentDoc.textSegments.length === 0) {
        currentDoc.textSegments.push({
          text: charToAdd,
          style: { ...currentStyle }
        });
        currentDoc.fullContent = charToAdd;

        newDocuments[activeDocumentIndex] = currentDoc;
        setDocuments(newDocuments);

        // חישוב המיקום החדש של הסמן
        const newCursorPosition = 1;
        setCursorPosition(newCursorPosition);

        // שמירה בהיסטוריה עם מיקום הסמן החדש
        const newHistory = [...history.slice(0, historyIndex + 1)];
        const stateToSave = JSON.parse(JSON.stringify(currentDoc));
        stateToSave.cursorPosition = newCursorPosition; // שמירת מיקום הסמן
        newHistory.push(stateToSave);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);

        console.log('נשמר להיסטוריה:', newHistory.length - 1,
          'תוכן ראשוני, מיקום סמן:', newCursorPosition);

        return;
      }

      // חיפוש המקטע והמיקום היחסי
      const { segmentIndex, localPosition } = findSegmentAndPosition(currentDoc, cursorPosition);

      if (applyStyleFromNow) {
        // מצב "מכאן והלאה" - בדיקה האם ליצור מקטע חדש או לפצל את הקיים

        if (segmentIndex >= 0 && localPosition === currentDoc.textSegments[segmentIndex].text.length) {
          // הסמן בסוף מקטע קיים, נבדוק אם הסגנונות תואמים
          const currentSegment = currentDoc.textSegments[segmentIndex];
          const isSameStyle = JSON.stringify(currentSegment.style) === JSON.stringify(currentStyle);

          if (isSameStyle) {
            // אם הסגנון תואם, נוסיף את התו למקטע הנוכחי
            currentSegment.text += charToAdd;
          } else {
            // אם הסגנון שונה, ניצור מקטע חדש
            currentDoc.textSegments.splice(segmentIndex + 1, 0, {
              text: charToAdd,
              style: { ...currentStyle }
            });
          }
        } else if (segmentIndex >= 0) {
          // הסמן בתוך מקטע קיים, יש לפצל אותו
          const currentSegment = currentDoc.textSegments[segmentIndex];
          const beforeText = currentSegment.text.substring(0, localPosition);
          const afterText = currentSegment.text.substring(localPosition);

          // עדכון המקטע הנוכחי עם הטקסט לפני הסמן
          currentSegment.text = beforeText;

          // הוספת מקטע חדש עם התו החדש
          currentDoc.textSegments.splice(segmentIndex + 1, 0, {
            text: charToAdd,
            style: { ...currentStyle }
          });

          // הוספת עוד מקטע עם הטקסט הנותר (אם יש)
          if (afterText) {
            currentDoc.textSegments.splice(segmentIndex + 2, 0, {
              text: afterText,
              style: { ...currentSegment.style }
            });
          }
        } else {
          // לא נמצא מקטע מתאים, ניצור חדש
          currentDoc.textSegments.push({
            text: charToAdd,
            style: { ...currentStyle }
          });
        }
      } else {
        // מצב "כל הטקסט" - החלת סגנון אחיד על כל המסמך

        if (currentDoc.textSegments.length === 1) {
          // קיים רק מקטע אחד, נעדכן אותו
          const segment = currentDoc.textSegments[0];

          const beforeText = segment.text.substring(0, localPosition);
          const afterText = segment.text.substring(localPosition);

          // עדכון המקטע עם התו המוסף
          segment.text = beforeText + charToAdd + afterText;
          segment.style = { ...currentStyle };
        } else {
          // קיימים מקטעים מרובים, נמזג אותם לאחד
          const fullText = currentDoc.fullContent;
          const beforeText = fullText.substring(0, cursorPosition);
          const afterText = fullText.substring(cursorPosition);

          // החלפת כל המקטעים במקטע אחד
          currentDoc.textSegments = [{
            text: beforeText + charToAdd + afterText,
            style: { ...currentStyle }
          }];
        }
      }

      // עדכון התוכן המלא
      currentDoc.fullContent = currentDoc.textSegments.reduce((acc, segment) => acc + segment.text, '');

      newDocuments[activeDocumentIndex] = currentDoc;
      setDocuments(newDocuments);

      // חישוב המיקום החדש של הסמן
      const newCursorPosition = cursorPosition + 1;
      setCursorPosition(newCursorPosition);

      // שמירה בהיסטוריה עם מיקום הסמן
      const newHistory = [...history.slice(0, historyIndex + 1)];
      const stateToSave = JSON.parse(JSON.stringify(currentDoc));
      stateToSave.cursorPosition = newCursorPosition; // שמירת מיקום הסמן
      newHistory.push(stateToSave);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);

      console.log('נשמר להיסטוריה:', newHistory.length - 1,
        'אחרי הוספת תו, מיקום סמן:', newCursorPosition);
    } else if (documents.length === 0) {
      // אם אין מסמכים והמשתמש מחובר, ניצור מסמך חדש
      if (currentUser && currentUser !== 'default') {
        createNewDocument();
        // ננסה שוב אחרי יצירת מסמך חדש
        setTimeout(() => addCharacter(char), 10);
      } else {
        showMessage('יש להתחבר כדי ליצור פתק חדש.', 'error');
      }
    }
  };



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
  //       let beforeDelete = segment.text.substring(0, localPosition - 1);
  //       let afterDelete = segment.text.substring(localPosition);

  //       // Check if the previous character is an emoji using emojiRegex
  //       const prevChar = beforeDelete[beforeDelete.length - 1];
  //       const isEmoji = emojiRegex().test(prevChar);

  //       if (isEmoji) {
  //         // If it's an emoji, delete 2 characters
  //         beforeDelete = beforeDelete.substring(0, beforeDelete.length - 2);
  //       } else {
  //         // Otherwise, delete just 1 character (regular char)
  //         beforeDelete = beforeDelete.substring(0, beforeDelete.length - 1);
  //       }

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
  // const deleteCharacter = () => {
  //   if (activeDocumentIndex >= 0) {
  //     // וידוא שהמצב ההתחלתי (ריק) נשמר אם זו הפעולה הראשונה
  //     if (historyIndex === -1) {
  //       // אין עדיין היסטוריה - נשמור את המצב ההתחלתי
  //       const emptyDoc = JSON.parse(JSON.stringify(documents[activeDocumentIndex]));
  //       emptyDoc.cursorPosition = 0;

  //       const newHistory = [emptyDoc];
  //       setHistory(newHistory);
  //       setHistoryIndex(0);

  //       console.log('נוצרה היסטוריה התחלתית עם מסמך ריק (לפני מחיקה)');
  //     }

  //     const newDocuments = [...documents];
  //     const currentDoc = JSON.parse(JSON.stringify(newDocuments[activeDocumentIndex])); // העתקה עמוקה

  //     // אין מה למחוק אם המסמך ריק או שהסמן בהתחלה
  //     if (!currentDoc.textSegments || currentDoc.textSegments.length === 0 || !currentDoc.fullContent || cursorPosition === 0) {
  //       return; // אין מה למחוק
  //     }

  //     // חיפוש המקטע והמיקום היחסי
  //     const { segmentIndex, localPosition } = findSegmentAndPosition(currentDoc, cursorPosition);

  //     if (localPosition > 0) {
  //       // מחיקת תו בתוך מקטע קיים
  //       const segment = currentDoc.textSegments[segmentIndex];
  //       const beforeDelete = segment.text.substring(0, localPosition - 1);
  //       const afterDelete = segment.text.substring(localPosition);

  //       const charToDelete = segment.text.charAt(localPosition - 1);
  //       const isEmoji = emojiRegex().test(charToDelete);
  //       let charsToDelete = 1;
  //       // if(!isEmoji){
  //       //   charsToDelete=0;
  //       // }



  //       // המחיקה עצמה - בצורה בטוחה
  //       const newBeforeText = beforeDelete.substring(0, beforeDelete.length - charsToDelete);

  //       if (newBeforeText.length === 0 && afterDelete.length === 0) {
  //         // המקטע הפך לריק - נמחק אותו
  //         currentDoc.textSegments.splice(segmentIndex, 1);
  //       } else {
  //         // עדכון המקטע הקיים
  //         segment.text = newBeforeText + afterDelete;
  //       }
  //     } else if (segmentIndex > 0) {
  //       // מחיקת תו בגבול בין מקטעים - מחיקת התו האחרון במקטע הקודם
  //       const prevSegment = currentDoc.textSegments[segmentIndex - 1];

  //       if (prevSegment.text.length === 1) {
  //         // אם נשאר רק תו אחד במקטע הקודם, נמחק את כל המקטע
  //         currentDoc.textSegments.splice(segmentIndex - 1, 1);
  //       } else {
  //         // אחרת, נמחק רק את התו האחרון
  //         prevSegment.text = prevSegment.text.substring(0, prevSegment.text.length - 1);
  //       }
  //     }
  //     // מחיקת תו בתוך מקטע קיים
  //     // if (localPosition > 0) {
  //     //   // מחיקת תו בתוך מקטע קיים
  //     //   const segment = currentDoc.textSegments[segmentIndex];

  //     //   // בדיקה אם התו הקודם הוא אימוג'י
  //     //   const charToDelete = segment.text.charAt(localPosition - 1);
  //     //   const isEmoji = emojiRegex().test(charToDelete);

  //     //   console.log('מוחק תו:', { 
  //     //     charToDelete, 
  //     //     isEmoji,
  //     //     textBeforeDeletion: segment.text
  //     //   });

  //     //   if (isEmoji) {
  //     //     // טיפול באימוג'י - מחיקה תמיד תו אחד בלבד
  //     //     const beforeText = segment.text.substring(0, localPosition - 1);
  //     //     beforeText = segment.text.substring(0, localPosition - 1);
  //     //     const afterText = segment.text.substring(localPosition);
  //     //     segment.text = beforeText + afterText;
  //     //     console.log('מחיקת אימוג׳י אחד');
  //     //   } else {
  //     //     // טיפול בתו רגיל - מחיקה תמיד תו אחד בדיוק
  //     //     const beforeText = segment.text.substring(0, localPosition-1);
  //     //     const afterText = segment.text.substring(localPosition);
  //     //     segment.text = beforeText + afterText;
  //     //     console.log('מחיקת תו רגיל אחד');
  //     //   }

  //     //   console.log('אחרי מחיקה:', {
  //     //     textAfter: segment.text
  //     //   });

  //     //   // אם המקטע הפך לריק, מוחקים אותו
  //     //   if (segment.text.length === 0) {
  //     //     currentDoc.textSegments.splice(segmentIndex, 1);
  //     //   }
  //     // } else if (segmentIndex > 0) {
  //     //   // מחיקת תו בגבול בין מקטעים - מחיקת התו האחרון במקטע הקודם
  //     //   const prevSegment = currentDoc.textSegments[segmentIndex - 1];

  //     //   // בדיקה אם התו האחרון במקטע הקודם הוא אימוג'י
  //     //   const lastChar = prevSegment.text.charAt(prevSegment.text.length - 1);
  //     //   const isLastCharEmoji = emojiRegex().test(lastChar);

  //     //   console.log('מוחק תו בגבול:', { 
  //     //     lastChar,
  //     //     isLastCharEmoji,
  //     //     segmentBefore: prevSegment.text 
  //     //   });
  //     //   if (prevSegment.text.length === 1) {
  //     //     // אם נשאר רק תו אחד במקטע הקודם, נמחק את כל המקטע
  //     //     currentDoc.textSegments.splice(segmentIndex - 1, 1);
  //     //   } else {
  //     //     if (isLastCharEmoji) {
  //     //       // אם זה אימוג'י - מחיקה של תו אחד בלבד
  //     //       prevSegment.text = prevSegment.text.substring(0, prevSegment.text.length - 1);
  //     //       console.log('מחיקת אימוג׳י אחד בגבול');
  //     //     } else {
  //     //       // אם זה תו רגיל - מחיקה של תו אחד בדיוק
  //     //       prevSegment.text = prevSegment.text.substring(0, prevSegment.text.length - 1);
  //     //       console.log('מחיקת תו רגיל אחד בגבול');
  //     //     }
  //     //   }

  //     //   console.log('אחרי מחיקה בגבול:', { 
  //     //     segmentAfter: prevSegment.text 
  //     //   });
  //     // }


  //     // הסרת מקטעים ריקים
  //     currentDoc.textSegments = currentDoc.textSegments.filter(segment => segment.text.length > 0);

  //     // מיזוג מקטעים סמוכים עם אותו סגנון במצב "כל הטקסט"
  //     if (!applyStyleFromNow) {
  //       // במצב "כל הטקסט", ממזגים את כל המקטעים לאחד
  //       if (currentDoc.textSegments.length > 0) {
  //         const fullText = currentDoc.textSegments.reduce((acc, segment) => acc + segment.text, '');
  //         currentDoc.textSegments = [{
  //           text: fullText,
  //           style: { ...currentStyle }
  //         }];
  //       }
  //     } else {
  //       // במצב "מכאן והלאה", בודקים אם יש מקטעים סמוכים עם אותו סגנון כדי למזג
  //       for (let i = 0; i < currentDoc.textSegments.length - 1; i++) {
  //         const current = currentDoc.textSegments[i];
  //         const next = currentDoc.textSegments[i + 1];

  //         if (JSON.stringify(current.style) === JSON.stringify(next.style)) {
  //           // אם לשני מקטעים סמוכים יש אותו סגנון, ממזגים אותם
  //           current.text += next.text;
  //           currentDoc.textSegments.splice(i + 1, 1);
  //           i--; // בדיקת אותו מקטע שוב
  //         }
  //       }
  //     }

  //     // עדכון התוכן המלא
  //     currentDoc.fullContent = currentDoc.textSegments.reduce((acc, segment) => acc + segment.text, '');

  //     newDocuments[activeDocumentIndex] = currentDoc;
  //     setDocuments(newDocuments);

  //     // חישוב המיקום החדש של הסמן
  //     const newCursorPosition = Math.max(0, cursorPosition - 1);
  //     setCursorPosition(newCursorPosition);

  //     // שמירה בהיסטוריה - עם מיקום הסמן החדש
  //     const newHistory = [...history.slice(0, historyIndex + 1)];
  //     const stateToSave = JSON.parse(JSON.stringify(currentDoc));
  //     stateToSave.cursorPosition = newCursorPosition; // שמירת מיקום הסמן
  //     newHistory.push(stateToSave);
  //     setHistory(newHistory);
  //     setHistoryIndex(newHistory.length - 1);

  //     console.log('נשמר להיסטוריה:', newHistory.length - 1, 
  //                'אחרי מחיקת תו, מיקום סמן:', newCursorPosition);
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

        const regularChar = [
          ['/', 'י', 'ק', 'ר', 'א', 'ט', 'ו', 'ן', 'ם', 'פ', 'ש', '%'],
          ['ד', 'ג', 'כ', 'ע', 'ח', 'ל', 'ך', 'ף', 'ז', 'ס', '$'],
          [')', '(', 'ב', 'ה', 'נ', 'מ', 'צ', 'ת', 'ץ', '.', '#', '^'],
          ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '!', '@'],
          ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'b', 'n'],
          ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'v', 'm', 'c'],
          ['z', 'x', ';', ',', '&', '*']
        ];
        const notEmoji = regularChar.flat().includes(prevChar);

        if (notEmoji) {
          // If it's an emoji, delete 2 characters
          beforeDelete = beforeDelete.substring(0, beforeDelete.length);
        } else {
          // Otherwise, delete just 1 character (regular char)
          beforeDelete = beforeDelete.substring(0, beforeDelete.length - 1);
          console.log("delete: " + prevChar);
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
  // const clearText = () => {
  //   if (activeDocumentIndex >= 0) {
  //     if (window.confirm('Are you sure you want to delete all text?')) {
  //       const newDocuments = [...documents];
  //       const currentDoc = { ...newDocuments[activeDocumentIndex] };

  //       // Clear all segments
  //       currentDoc.textSegments = [];
  //       currentDoc.fullContent = '';

  //       newDocuments[activeDocumentIndex] = currentDoc;
  //       setDocuments(newDocuments);
  //       setCursorPosition(0);

  //       // Save in history
  //       const newHistory = historyIndex >= 0 ? history.slice(0, historyIndex + 1) : [];
  //       newHistory.push(JSON.parse(JSON.stringify(currentDoc))); // Deep copy
  //       setHistory(newHistory);
  //       setHistoryIndex(newHistory.length - 1);
  //     }
  //   }
  // };
  const clearText = () => {
    if (activeDocumentIndex >= 0) {
      setPendingClearTextAction(() => () => {
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

        setShowConfirmClearText(false); // Close the dialog after clearing
      });
      setShowConfirmClearText(true);
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
  // const searchText = (searchTerm) => {
  //   if (activeDocumentIndex >= 0 && searchTerm) {
  //     const currentDoc = documents[activeDocumentIndex];
  //     const position = currentDoc.fullContent.indexOf(searchTerm);

  //     if (position !== -1) {
  //       alert(`The text "${searchTerm}" was found at position ${position}`);
  //       setCursorPosition(position + searchTerm.length);
  //       return position;
  //     } else {
  //       alert(`The text "${searchTerm}" was not found in the document`);
  //       return -1;
  //     }
  //   }
  //   return -1;
  // };
  const searchText = (searchTerm) => {
    if (activeDocumentIndex >= 0 && searchTerm) {
      const currentDoc = documents[activeDocumentIndex];

      // מציאת כל המופעים של מילת החיפוש
      const positions = [];
      let position = -1;
      let currentPosition = 0;

      // לולאה שמוצאת את כל המופעים
      while (true) {
        position = currentDoc.fullContent.indexOf(searchTerm, currentPosition);

        if (position === -1) {
          // לא נמצאו עוד מופעים
          break;
        }

        // נמצא מופע - הוספתו לרשימה והתקדמות לחיפוש הבא
        positions.push(position);
        currentPosition = position + searchTerm.length;
      }

      if (positions.length > 0) {
        // נמצאו מופעים - יצירת הודעה עם כל המיקומים
        const positionsText = positions.join(', ');
        showMessage(`הטקסט "${searchTerm}" נמצא ב-${positions.length} מקומות. מיקומים: ${positionsText}`, 'success');

        // אופציונלי: קביעת הסמן למיקום הראשון שנמצא
        // setCursorPosition(positions[0] + searchTerm.length);

        return positions;
      } else {
        showMessage(`הטקסט "${searchTerm}" לא נמצא במסמך`, 'error');
        return [];
      }
    }
    return [];
  };
  // const searchText = (searchTerm) => {
  //   if (activeDocumentIndex >= 0 && searchTerm) {
  //     const currentDoc = documents[activeDocumentIndex];
  //     const position = currentDoc.fullContent.indexOf(searchTerm);

  //     if (position !== -1) {
  //       showMessage(`הטקסט "${searchTerm}" נמצא במיקום ${position}`, 'success');
  //       //setCursorPosition(position + searchTerm.length);
  //       return position;
  //     } else {
  //       showMessage(`הטקסט "${searchTerm}" לא נמצא במסמך`, 'error');
  //       return -1;
  //     }
  //   }
  //   return -1;
  // };


  // Function to replace text
  // const replaceText = (searchTerm, replaceTerm) => {
  //   if (activeDocumentIndex >= 0 && searchTerm && replaceTerm) {
  //     const newDocuments = [...documents];
  //     const currentDoc = JSON.parse(JSON.stringify(newDocuments[activeDocumentIndex])); // Deep copy

  //     let replacementCount = 0;

  //     // Check if replacement is needed
  //     if (currentDoc.fullContent.includes(searchTerm)) {
  //       if (!applyStyleFromNow) {
  //         // In "All text" mode - simple replacement
  //         currentDoc.fullContent = currentDoc.fullContent.replace(new RegExp(searchTerm, 'g'), replaceTerm);

  //         // Update the content in the single segment
  //         if (currentDoc.textSegments.length === 1) {
  //           currentDoc.textSegments[0].text = currentDoc.fullContent;
  //         } else if (currentDoc.textSegments.length > 1) {
  //           // Merge all segments into one
  //           currentDoc.textSegments = [{
  //             text: currentDoc.fullContent,
  //             style: { ...currentStyle }
  //           }];
  //         }

  //         replacementCount = (currentDoc.fullContent.match(new RegExp(replaceTerm, 'g')) || []).length;
  //       } else {
  //         // In "From now on" mode - replacement while preserving segment structure
  //         // Go through all segments and perform replacement
  //         for (let i = 0; i < currentDoc.textSegments.length; i++) {
  //           const segment = currentDoc.textSegments[i];

  //           if (segment.text.includes(searchTerm)) {
  //             // Count how many times the search term appears in the segment
  //             const count = (segment.text.match(new RegExp(searchTerm, 'g')) || []).length;
  //             replacementCount += count;

  //             // Replace all occurrences in the segment
  //             segment.text = segment.text.replace(new RegExp(searchTerm, 'g'), replaceTerm);
  //           }
  //         }

  //         // Update the full content
  //         currentDoc.fullContent = currentDoc.textSegments.reduce((acc, segment) => acc + segment.text, '');
  //       }

  //       newDocuments[activeDocumentIndex] = currentDoc;
  //       setDocuments(newDocuments);

  //       // Save in history
  //       const newHistory = historyIndex >= 0 ? history.slice(0, historyIndex + 1) : [];
  //       newHistory.push(JSON.parse(JSON.stringify(currentDoc))); // Deep copy
  //       setHistory(newHistory);
  //       setHistoryIndex(newHistory.length - 1);

  //       alert(`Replaced ${replacementCount} occurrences of "${searchTerm}" with "${replaceTerm}"`);
  //     } else {
  //       alert(`The text "${searchTerm}" was not found in the document`);
  //     }
  //   }
  // };

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

        // Show success message
        showMessage(`הוחלפו ${replacementCount} מופעים של "${searchTerm}" ב"${replaceTerm}"`, "success");
      } else {
        // Show error message
        showMessage(`לא נמצאו המילים "${searchTerm}" במסמך`, "error");
      }
    }
  };


  // Function to perform undo
  // const undo = () => {
  //   if (historyIndex > 0 && activeDocumentIndex >= 0) {
  //     const newIndex = historyIndex - 1;
  //     const previousState = history[newIndex];

  //     const newDocuments = [...documents];
  //     newDocuments[activeDocumentIndex] = JSON.parse(JSON.stringify(previousState)); // Deep copy

  //     setDocuments(newDocuments);
  //     if (previousState.defaultStyle) {
  //       setCurrentStyle(previousState.defaultStyle);
  //     }
  //     setHistoryIndex(newIndex);
  //     setCursorPosition(previousState.fullContent ? previousState.fullContent.length : 0);
  //   }
  // };
  // const undo = () => {
  //   // בדיקה שיש מסמך פעיל והיסטוריה
  //   if (activeDocumentIndex >= 0 && historyIndex > 0) {
  //     // מעבר למצב הקודם בהיסטוריה
  //     const newHistoryIndex = historyIndex - 1;
  //     const previousState = history[newHistoryIndex];

  //     if (!previousState) {
  //       console.warn('אין מצב קודם בהיסטוריה');
  //       return;
  //     }

  //     // יצירת עותק של המסמכים הנוכחיים
  //     const newDocuments = [...documents];
  //     // החלפת המסמך הפעיל במצב הקודם (עותק עמוק)
  //     newDocuments[activeDocumentIndex] = JSON.parse(JSON.stringify(previousState));

  //     // עדכון ה-state
  //     setDocuments(newDocuments);
  //     setHistoryIndex(newHistoryIndex);

  //     // עדכון הסגנון והסמן
  //     if (previousState.defaultStyle) {
  //       setCurrentStyle(previousState.defaultStyle);
  //     }

  //     // שימוש במיקום הסמן השמור (אם קיים)
  //     const newCursorPosition = previousState.cursorPosition !== undefined ?
  //       previousState.cursorPosition :
  //       (previousState.fullContent ? previousState.fullContent.length : 0);

  //     setCursorPosition(newCursorPosition);

  //     console.log('ביצוע Undo למצב:', newHistoryIndex,
  //       'תוכן:', previousState.fullContent,
  //       'מיקום סמן:', newCursorPosition);
  //   }
  // };
  const undo = () => {
    // וידוא שיש מסמך פעיל ושהיסטוריה קיימת (לפחות 2 מצבים)
    if (activeDocumentIndex >= 0 && historyIndex > 0) {
      // מעבר למצב הקודם בהיסטוריה
      const newHistoryIndex = historyIndex - 1;
      const previousState = history[newHistoryIndex];

      if (!previousState) {
        console.warn('אין מצב קודם בהיסטוריה');
        return;
      }

      console.log('ביצוע undo למצב', newHistoryIndex, 'תוכן:',
        previousState.fullContent, 'אורך:',
        previousState.fullContent ? previousState.fullContent.length : 0);

      // יצירת עותק של המסמכים הנוכחיים
      const newDocuments = [...documents];

      // העתקת המצב הקודם (עותק עמוק) - אבל בלי השדה cursorPosition
      const docCopy = JSON.parse(JSON.stringify(previousState));

      // אם יש שדה cursorPosition במצב הקודם, נסיר אותו לפני השמה במסמך
      // כי זה לא חלק ממבנה המסמך הרגיל
      if (docCopy.cursorPosition !== undefined) {
        delete docCopy.cursorPosition;
      }

      // החלפת המסמך הפעיל במצב הקודם
      newDocuments[activeDocumentIndex] = docCopy;

      // עדכון ה-state
      setDocuments(newDocuments);
      setHistoryIndex(newHistoryIndex);

      // עדכון הסגנון והסמן
      if (previousState.defaultStyle) {
        setCurrentStyle(previousState.defaultStyle);
      }

      // שימוש במיקום הסמן השמור (אם קיים)
      const newCursorPosition = previousState.cursorPosition !== undefined ?
        previousState.cursorPosition :
        (previousState.fullContent ? previousState.fullContent.length : 0);

      console.log('מעדכן מיקום סמן ל:', newCursorPosition);
      setCursorPosition(newCursorPosition);
    } else {
      console.log('לא ניתן לבצע undo - אין מספיק היסטוריה',
        'historyIndex:', historyIndex,
        'activeDocumentIndex:', activeDocumentIndex);
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
  // const handleUserLogin = (username) => {
  //   setCurrentUser(username);
  // };
  const handleUserLogin = (username) => {
    setCurrentUser(username);
    // Check if there are no documents open, we will create a new one after login
    if (documents.length === 0) {
      createNewDocument();
    }
  };

  // Function to handle user logout
  // const handleUserLogout = () => {
  //   // On logout - close all documents and create a new empty document
  //   setCurrentUser(null);

  //   // Close all documents
  //   setDocuments([]);
  //   setActiveDocumentIndex(-1);

  //   // Create a new empty document
  //   createNewDocument();
  // };
  const handleUserLogout = () => {
    if (currentUser && currentUser !== 'default') {
      documents.forEach((doc) => {
        if (doc && doc.name && doc.fullContent && doc.fullContent.trim() !== '') {
          const documentData = {
            textSegments: doc.textSegments || [],
            fullContent: doc.fullContent || '',
            defaultStyle: doc.defaultStyle || {}
          };
          try {
            storageService.saveDocument(doc.name, documentData, currentUser);
          } catch (error) {
            console.error(`שגיאה בשמירת הפתק "${doc.name}" לפני התנתקות:`, error);
          }
        }
      });
    }

    setCurrentUser(null);
    setDocuments([]);
    setActiveDocumentIndex(-1);
    // The document list is already empty, no need to create a new document here
  };


  // Check if we need to create a new document if there are no open documents
  //if (documents.length === 0) {
  //createNewDocument();
  //}
  // יצירת מסמך חדש רק בעת טעינת הדף בפעם הראשונה
  // React.useEffect(() => {
  //   if (documents.length === 0 && currentUser) {
  //     createNewDocument();
  //   }
  // }, []); // הפונקציה תרוץ רק פעם אחת בטעינה ראשונית

  return (
    <div className="app-container">
      {/* רכיב להצגת הודעות המערכת */}
      {appMessage && (
        <div className={`app-message ${appMessageType}`}>
          <i
            className={
              appMessageType === 'success'
                ? 'fas fa-check-circle icon-success'
                : 'fas fa-exclamation-triangle icon-error'
            }
          ></i>
          {appMessage}
        </div>
      )}

      {showConfirmClearText && (
        <div className="auth-dialog-overlay">
          <div className="auth-dialog">
            <h3>אישור מחיקת טקסט</h3>
            <p>האם אתה בטוח שברצונך למחוק את כל הטקסט?</p>
            <div className="auth-dialog-buttons">
              <button onClick={() => {
                if (pendingClearTextAction) pendingClearTextAction();
              }}>
                אישור
              </button>
              <button onClick={() => setShowConfirmClearText(false)}>
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

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