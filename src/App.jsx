import React, { useState } from 'react';
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

  // Action history for undo functionality - undo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  //appMessage contains the content of the message to be displayed to the user and the type
  const [appMessage, setAppMessage] = useState('');
  const [appMessageType, setAppMessageType] = useState('');

  //the panel confirm deletion of text
  const [showConfirmClearText, setShowConfirmClearText] = useState(false);
  const [pendingClearTextAction, setPendingClearTextAction] = useState(null);





  // Helper function to find text segment and relative position - for cursor
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
    setHistory([]);
    setHistoryIndex(-1);
    const defaultStyle = {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#000000',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      direction: 'rtl', // Default for Hebrew
    };

    // Create a blank document with default style
    const newDocument = {
      name: `פתק ${documents.length + 1}`,
      textSegments: [],
      fullContent: '',
      defaultStyle: { ...defaultStyle }
    };

    // Updating the document list and setting the new document as active
    const newDocuments = [...documents, newDocument];
    setDocuments(newDocuments);
    setActiveDocumentIndex(newDocuments.length - 1);
    setCurrentStyle(defaultStyle);
    setCursorPosition(0);

    // Creating a starting history - very important
    // Save a deep copy of the empty document with cursor position 0
    const initialState = JSON.parse(JSON.stringify(newDocument));
    initialState.cursorPosition = 0;

    const newHistory = [initialState];
    setHistory(newHistory);
    setHistoryIndex(0);

    console.log('נוצר מסמך חדש עם היסטוריה התחלתית');
  };

  // Function to open a new document
  const openNewDocument = (textSegments, defaultStyle, name) => {
    setHistory([]);
    setHistoryIndex(-1);
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
    setHistory([]);
    setHistoryIndex(-1);
    if (index >= 0 && index < documents.length) {
      // Reset history to empty array when switching documents
      // Set the new active document index
      setActiveDocumentIndex(index);

      const doc = documents[index];

      // Update current style to the document's default style
      if (doc.defaultStyle) {
        setCurrentStyle(doc.defaultStyle);
      }

      // Move cursor to the end of the document
      setCursorPosition(doc.fullContent ? doc.fullContent.length : 0);

      console.log('Document changed to index:', index, 'History reset to empty array');
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
      setHistory([]);
      setHistoryIndex(-1);
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

      if (historyIndex === -1) {
        const emptyDoc = JSON.parse(JSON.stringify(documents[activeDocumentIndex]));
        emptyDoc.cursorPosition = 0;

        const newHistory = [emptyDoc];
        setHistory(newHistory);
        setHistoryIndex(0);

        console.log('נוצרה היסטוריה התחלתית עם מסמך ריק');
      }

      // Verify that the character is valid
      if (char === undefined || char === null) {
        console.error("התו אינו תקין (undefined או null)");
        return;
      }

      // Verifying that a character is a string
      const charToAdd = char;
      const isEmoji = emojiRegex().test(charToAdd);
      const newDocuments = [...documents];
      const currentDoc = JSON.parse(JSON.stringify(newDocuments[activeDocumentIndex])); // העתקה עמוקה

      // Verify that text segments exist
      if (!currentDoc.textSegments) {
        currentDoc.textSegments = [];
      }

      // Special treatment for emoji
      if (isEmoji) {
        currentDoc.textSegments.push({
          text: charToAdd,
          style: { ...currentStyle }
        });
        currentDoc.fullContent = charToAdd;

        newDocuments[activeDocumentIndex] = currentDoc;
        setDocuments(newDocuments);

        // Calculating the new cursor position
        const newCursorPosition = cursorPosition + charToAdd.length;
        setCursorPosition(newCursorPosition);

        // Save to history with new cursor position
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

      // If there are no text segments, we will create a new one
      if (currentDoc.textSegments.length === 0) {
        currentDoc.textSegments.push({
          text: charToAdd,
          style: { ...currentStyle }
        });
        currentDoc.fullContent = charToAdd;

        newDocuments[activeDocumentIndex] = currentDoc;
        setDocuments(newDocuments);

        // Calculating the new cursor position
        const newCursorPosition = 1;
        setCursorPosition(newCursorPosition);

        // Save to history with the new cursor position
        const newHistory = [...history.slice(0, historyIndex + 1)];
        const stateToSave = JSON.parse(JSON.stringify(currentDoc));
        stateToSave.cursorPosition = newCursorPosition;
        newHistory.push(stateToSave);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);

        console.log('נשמר להיסטוריה:', newHistory.length - 1,
          'תוכן ראשוני, מיקום סמן:', newCursorPosition);

        return;
      }

      // Find the section and relative position
      const { segmentIndex, localPosition } = findSegmentAndPosition(currentDoc, cursorPosition);

      if (applyStyleFromNow) {
        // "From Here On" Mode - Checking whether to create a new section or split the existing one

        if (segmentIndex >= 0 && localPosition === currentDoc.textSegments[segmentIndex].text.length) {
          // The cursor is at the end of an existing section, we will check if the styles match
          const currentSegment = currentDoc.textSegments[segmentIndex];
          const isSameStyle = JSON.stringify(currentSegment.style) === JSON.stringify(currentStyle);

          if (isSameStyle) {
            // If the style matches, we add the character to the current section
            currentSegment.text += charToAdd;
          } else {
            // If the style is different, we will create a new section
            currentDoc.textSegments.splice(segmentIndex + 1, 0, {
              text: charToAdd,
              style: { ...currentStyle }
            });
          }
        } else if (segmentIndex >= 0) {
          // The cursor is inside an existing section, it must be split.
          const currentSegment = currentDoc.textSegments[segmentIndex];
          const beforeText = currentSegment.text.substring(0, localPosition);
          const afterText = currentSegment.text.substring(localPosition);

          // Update the current section with the text before the cursor
          currentSegment.text = beforeText;

          // Add a new section with the new character
          currentDoc.textSegments.splice(segmentIndex + 1, 0, {
            text: charToAdd,
            style: { ...currentStyle }
          });

          // Add another section with the remaining text (if any)
          if (afterText) {
            currentDoc.textSegments.splice(segmentIndex + 2, 0, {
              text: afterText,
              style: { ...currentSegment.style }
            });
          }
        } else {
          // No suitable section found, we will create a new one.
          currentDoc.textSegments.push({
            text: charToAdd,
            style: { ...currentStyle }
          });
        }
      } else {
        //"All Text" mode - applying a uniform style to the entire document
        if (currentDoc.textSegments.length === 1) {
          // There is only one section, we will update it
          const segment = currentDoc.textSegments[0];

          const beforeText = segment.text.substring(0, localPosition);
          const afterText = segment.text.substring(localPosition);

          // Update the section with the added character
          segment.text = beforeText + charToAdd + afterText;
          segment.style = { ...currentStyle };
        } else {
          // There are multiple sections, we will merge them into one
          const fullText = currentDoc.fullContent;
          const beforeText = fullText.substring(0, cursorPosition);
          const afterText = fullText.substring(cursorPosition);

          // Replace all segments with one segment
          currentDoc.textSegments = [{
            text: beforeText + charToAdd + afterText,
            style: { ...currentStyle }
          }];
        }
      }

      // Update the full content by combining all text segments
      currentDoc.fullContent = currentDoc.textSegments.reduce((acc, segment) => acc + segment.text, '');

      // Update the current document in the documents array
      newDocuments[activeDocumentIndex] = currentDoc;
      setDocuments(newDocuments);

      // Calculate the new cursor position (advance by 1 for regular characters)
      const newCursorPosition = cursorPosition + 1;
      setCursorPosition(newCursorPosition);

      // Save the current state to history for undo functionality
      const newHistory = [...history.slice(0, historyIndex + 1)]; // Create a new history array up to the current index
      const stateToSave = JSON.parse(JSON.stringify(currentDoc)); // Deep copy the current document
      stateToSave.cursorPosition = newCursorPosition; // Store cursor position with the document state
      newHistory.push(stateToSave); // Add the new state to history
      setHistory(newHistory); // Update the history state
      setHistoryIndex(newHistory.length - 1); // Point to the latest history entry

      // Log history update details
      console.log('Saved to history:', newHistory.length - 1,
        'after adding character, cursor position:', newCursorPosition);
    } else if (documents.length === 0) {
      // Handle the case when there are no open documents

      // If user is logged in, create a new document and try adding the character again
      if (currentUser && currentUser !== 'default') {
        createNewDocument();
        // Try again after document creation (using setTimeout to ensure state updates)
        setTimeout(() => addCharacter(char), 10);
      } else {
        // If user is not logged in, show error message
        showMessage('You must log in to create a new note.', 'error');
      }
    }
  };


  // Function to delete a character
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
  // Function to delete a word - treats emojis as part of words
  const deleteWord = () => {
    if (activeDocumentIndex >= 0) {
      const newDocuments = [...documents];
      // Deep copy of the current document
      const currentDoc = JSON.parse(JSON.stringify(newDocuments[activeDocumentIndex]));

      // Check if there's anything to delete
      if (!currentDoc.textSegments || currentDoc.textSegments.length === 0 || !currentDoc.fullContent || cursorPosition === 0) {
        return; // Nothing to delete
      }

      // Find the segment and relative position
      const { segmentIndex, localPosition } = findSegmentAndPosition(currentDoc, cursorPosition);

      // If we are at the beginning of a segment, delete the last word in the previous segment
      if (localPosition === 0 && segmentIndex > 0) {
        const prevSegment = currentDoc.textSegments[segmentIndex - 1];

        // Remove trailing spaces first
        let text = prevSegment.text.trimEnd();

        // Find the last word boundary
        const lastSpaceIndex = text.lastIndexOf(' ');

        if (lastSpaceIndex !== -1) {
          // Keep everything up to the last space (including the space)
          prevSegment.text = text.substring(0, lastSpaceIndex + 1);
        } else {
          // No space found, delete the entire segment
          currentDoc.textSegments.splice(segmentIndex - 1, 1);
        }
      } else if (segmentIndex >= 0) {
        // Delete a word within the current segment
        const segment = currentDoc.textSegments[segmentIndex];
        const textBeforeCursor = segment.text.substring(0, localPosition);
        const textAfterCursor = segment.text.substring(localPosition);

        // Remove trailing spaces from text before cursor
        const trimmedText = textBeforeCursor.trimEnd();

        // Find the last word boundary (space)
        const lastSpaceIndex = trimmedText.lastIndexOf(' ');

        if (lastSpaceIndex !== -1) {
          // Keep everything up to the last space (including the space)
          segment.text = trimmedText.substring(0, lastSpaceIndex + 1) + textAfterCursor;
        } else {
          // No space found, delete all text before cursor
          segment.text = textAfterCursor;
        }

        // If the segment became empty, delete it
        if (segment.text.length === 0 || segment.text.trim().length === 0) {
          currentDoc.textSegments.splice(segmentIndex, 1);
        }
      }

      // Remove empty segments
      currentDoc.textSegments = currentDoc.textSegments.filter(segment =>
        segment.text.length > 0 && segment.text.trim().length > 0
      );

      // Ensure we have at least one segment
      if (currentDoc.textSegments.length === 0) {
        currentDoc.textSegments = [{
          text: '',
          style: { ...currentStyle }
        }];
      }

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

      // Add lengths of all segments before the current one
      for (let i = 0; i < segmentIndex && i < currentDoc.textSegments.length; i++) {
        newCursorPosition += currentDoc.textSegments[i].text.length;
      }

      // If we deleted from the middle of a segment, position cursor at the last space
      if (segmentIndex < currentDoc.textSegments.length) {
        const textBeforeCursor = currentDoc.textSegments[segmentIndex].text.substring(0, Math.min(localPosition, currentDoc.textSegments[segmentIndex].text.length));
        const trimmedText = textBeforeCursor.trimEnd();
        const lastSpaceIndex = trimmedText.lastIndexOf(' ');

        if (lastSpaceIndex !== -1) {
          newCursorPosition += lastSpaceIndex + 1;
        }
      }

      // Update the documents state
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
  const undo = () => {
    // Ensure there is an active document and history exists (at least 2 states)
    if (activeDocumentIndex >= 0 && historyIndex > 0) {
      // Move to the previous state in history
      const newHistoryIndex = historyIndex - 1;
      const previousState = history[newHistoryIndex];

      if (!previousState) {
        console.warn('No previous state in history');
        return;
      }

      console.log('Performing undo to state', newHistoryIndex, 'content:',
        previousState.fullContent, 'length:',
        previousState.fullContent ? previousState.fullContent.length : 0);

      // Create a copy of the current documents
      const newDocuments = [...documents];

      // Copy the previous state (deep copy)
      const docCopy = JSON.parse(JSON.stringify(previousState));

      // If there's a cursorPosition field in the previous state, remove it before assigning to the document
      // because it's not part of the regular document structure
      if (docCopy.cursorPosition !== undefined) {
        delete docCopy.cursorPosition;
      }

      // Replace the active document with the previous state
      newDocuments[activeDocumentIndex] = docCopy;

      // Update the state
      setDocuments(newDocuments);
      setHistoryIndex(newHistoryIndex);

      // Update the style and cursor
      if (previousState.defaultStyle) {
        setCurrentStyle(previousState.defaultStyle);
      }

      // Use the saved cursor position (if it exists)
      const newCursorPosition = previousState.cursorPosition !== undefined ?
        previousState.cursorPosition :
        (previousState.fullContent ? previousState.fullContent.length : 0);

      console.log('Updating cursor position to:', newCursorPosition);
      setCursorPosition(newCursorPosition);
    } else {
      console.log('Cannot perform undo - not enough history',
        'historyIndex:', historyIndex,
        'activeDocumentIndex:', activeDocumentIndex);
    }
  };

  // Function to load a document
  const loadDocument = (textSegments, defaultStyle, name = null) => {
    setHistory([]);
    setHistoryIndex(-1);
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
    // Check if there are no documents open, we will create a new one after login
    if (documents.length === 0) {
      createNewDocument();
    }
  };

  // Function to handle user logout
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
  // הוסף פונקציה זו ב-App.jsx
  const resetHistory = () => {
    setHistory([]);
    setHistoryIndex(-1);
  };

  return (
    <div className="app-container">

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
          resetHistory={resetHistory} 
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