import React, { useState, useEffect } from 'react';
import './components/stylesComp.css';
import MultiTextDisplay from './components/MultiTextDisplay';
import TextEditor from './components/TextEditor';
import Keyboard from './components/Keyboard';
import ToolBar from './components/ToolBar';
import FileOperations from './components/FileOperations';
import UserAuth from './components/UserAuth';

function App() {
  // מצב עבור המשתמש הנוכחי
  const [currentUser, setCurrentUser] = useState(null);
  
  // מצב עבור מסמכים פתוחים
  const [documents, setDocuments] = useState([]);
  
  // אינדקס של המסמך הפעיל כרגע
  const [activeDocumentIndex, setActiveDocumentIndex] = useState(-1);
  
  // מצב עבור הסגנון הנוכחי של המסמך הפעיל
  const [currentStyle, setCurrentStyle] = useState({
    fontFamily: 'Arial',
    fontSize: '16px',
    color: '#000000',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    direction: 'rtl', // כברירת מחדל עבור עברית
  });

  // מצב עבור שפת המקלדת הנוכחית
  const [currentLanguage, setCurrentLanguage] = useState('hebrew');
  
  // היסטוריית פעולות לטובת undo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // יצירת מסמך חדש בטעינת האפליקציה אם אין מסמכים
  useEffect(() => {
    if (documents.length === 0) {
      createNewDocument();
    }
  }, []);

  // עדכון המסמך הפעיל בכל פעם שמשתנה האינדקס
  useEffect(() => {
    if (activeDocumentIndex >= 0 && activeDocumentIndex < documents.length) {
      setCurrentStyle(documents[activeDocumentIndex].style);
    }
  }, [activeDocumentIndex, documents]);

  // שמירת המצב בהיסטוריה בכל פעם שמסמך משתנה
  useEffect(() => {
    if (documents.length > 0 && activeDocumentIndex >= 0) {
      const currentDoc = documents[activeDocumentIndex];
      if (currentDoc.content !== '' && (historyIndex === -1 || history[historyIndex]?.content !== currentDoc.content)) {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push({ ...currentDoc });
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    }
  }, [documents]);

  // פונקציה ליצירת מסמך חדש
  const createNewDocument = () => {
    const newDocument = {
      name: `מסמך ${documents.length + 1}`,
      content: '',
      style: { ...currentStyle }
    };
    
    setDocuments([...documents, newDocument]);
    setActiveDocumentIndex(documents.length);
  };

  // פונקציה לבחירת מסמך פעיל
  const selectDocument = (index) => {
    if (index >= 0 && index < documents.length) {
      setActiveDocumentIndex(index);
    }
  };

  // פונקציה לסגירת מסמך
  const closeDocument = (index) => {
    // בדיקה אם יש תוכן במסמך ולהציע לשמור אותו
    const documentToClose = documents[index];
    if (documentToClose.content && !window.confirm(`האם אתה בטוח שברצונך לסגור את "${documentToClose.name}"? שינויים שלא נשמרו יאבדו.`)) {
      return;
    }
    
    const newDocuments = [...documents];
    newDocuments.splice(index, 1);
    
    setDocuments(newDocuments);
    
    // אם סגרנו את המסמך הפעיל, נעבור למסמך הבא או הקודם
    if (index === activeDocumentIndex) {
      if (newDocuments.length > 0) {
        // אם סגרנו את המסמך האחרון, נבחר את המסמך האחרון החדש
        if (index >= newDocuments.length) {
          setActiveDocumentIndex(newDocuments.length - 1);
        } else {
          setActiveDocumentIndex(index);
        }
      } else {
        setActiveDocumentIndex(-1);
        // אם אין יותר מסמכים, ניצור אחד חדש
        createNewDocument();
      }
    } else if (index < activeDocumentIndex) {
      // אם המסמך שנסגר היה לפני המסמך הפעיל, נעדכן את האינדקס
      setActiveDocumentIndex(activeDocumentIndex - 1);
    }
  };

  // פונקציה להוספת תו לטקסט במסמך הפעיל
  const addCharacter = (char) => {
    if (activeDocumentIndex >= 0) {
      const newDocuments = [...documents];
      newDocuments[activeDocumentIndex] = {
        ...newDocuments[activeDocumentIndex],
        content: newDocuments[activeDocumentIndex].content + char
      };
      setDocuments(newDocuments);
    }
  };

  // פונקציה למחיקת תו אחד מהטקסט במסמך הפעיל
  const deleteCharacter = () => {
    if (activeDocumentIndex >= 0) {
      const currentDoc = documents[activeDocumentIndex];
      if (currentDoc.content.length > 0) {
        const newDocuments = [...documents];
        newDocuments[activeDocumentIndex] = {
          ...newDocuments[activeDocumentIndex],
          content: newDocuments[activeDocumentIndex].content.slice(0, -1)
        };
        setDocuments(newDocuments);
      }
    }
  };

  // פונקציה למחיקת מילה אחרונה במסמך הפעיל
  const deleteWord = () => {
    if (activeDocumentIndex >= 0) {
      const currentDoc = documents[activeDocumentIndex];
      const words = currentDoc.content.split(' ');
      if (words.length > 0) {
        words.pop();
        const newDocuments = [...documents];
        newDocuments[activeDocumentIndex] = {
          ...newDocuments[activeDocumentIndex],
          content: words.join(' ')
        };
        setDocuments(newDocuments);
      }
    }
  };

  // פונקציה למחיקת כל הטקסט במסמך הפעיל
  const clearText = () => {
    if (activeDocumentIndex >= 0) {
      if (window.confirm('האם אתה בטוח שברצונך למחוק את כל הטקסט?')) {
        const newDocuments = [...documents];
        newDocuments[activeDocumentIndex] = {
          ...newDocuments[activeDocumentIndex],
          content: ''
        };
        setDocuments(newDocuments);
      }
    }
  };

  // פונקציה לשינוי סגנון הטקסט במסמך הפעיל
  const changeStyle = (style) => {
    if (activeDocumentIndex >= 0) {
      const newStyle = { ...currentStyle, ...style };
      setCurrentStyle(newStyle);
      
      const newDocuments = [...documents];
      newDocuments[activeDocumentIndex] = {
        ...newDocuments[activeDocumentIndex],
        style: newStyle
      };
      setDocuments(newDocuments);
    }
  };

  // פונקציה לשינוי שפת המקלדת
  const changeLanguage = (language) => {
    setCurrentLanguage(language);
    
    // שינוי כיוון הטקסט בהתאם לשפה
    let direction = currentStyle.direction;
    if (language === 'hebrew') {
      direction = 'rtl';
    } else if (language === 'english') {
      direction = 'ltr';
    }
    
    changeStyle({ direction });
  };

  // פונקציה לביצוע undo
  const undo = () => {
    if (historyIndex > 0 && activeDocumentIndex >= 0) {
      const newIndex = historyIndex - 1;
      const previousState = history[newIndex];
      
      const newDocuments = [...documents];
      newDocuments[activeDocumentIndex] = { ...previousState };
      
      setDocuments(newDocuments);
      setCurrentStyle(previousState.style);
      setHistoryIndex(newIndex);
    }
  };

  // פונקציה לטעינת מסמך
  const loadDocument = (content, style, name = null) => {
    if (activeDocumentIndex >= 0) {
      const newDocuments = [...documents];
      newDocuments[activeDocumentIndex] = {
        ...newDocuments[activeDocumentIndex],
        content,
        style,
        name: name || newDocuments[activeDocumentIndex].name
      };
      setDocuments(newDocuments);
      setCurrentStyle(style);
    } else {
      // אם אין מסמך פעיל, ניצור אחד חדש עם התוכן והסגנון שהתקבלו
      const newDocument = {
        name: name || `מסמך ${documents.length + 1}`,
        content,
        style
      };
      
      setDocuments([...documents, newDocument]);
      setActiveDocumentIndex(documents.length);
      setCurrentStyle(style);
    }
  };

  // פונקציה לחיפוש תו בטקסט
  const searchCharacter = (char) => {
    if (activeDocumentIndex >= 0) {
      const currentDoc = documents[activeDocumentIndex];
      return currentDoc.content.includes(char) ? currentDoc.content.indexOf(char) : -1;
    }
    return -1;
  };

  // פונקציה להחלפת תו בטקסט
  const replaceCharacter = (oldChar, newChar) => {
    if (activeDocumentIndex >= 0) {
      const currentDoc = documents[activeDocumentIndex];
      const newContent = currentDoc.content.replace(new RegExp(oldChar, 'g'), newChar);
      
      const newDocuments = [...documents];
      newDocuments[activeDocumentIndex] = {
        ...newDocuments[activeDocumentIndex],
        content: newContent
      };
      setDocuments(newDocuments);
    }
  };

  // פונקציה לטיפול בהתחברות משתמש
  const handleUserLogin = (username) => {
    setCurrentUser(username);
  };

  // פונקציה לטיפול בהתנתקות משתמש
  const handleUserLogout = () => {
    setCurrentUser(null);
    // ניצור מסמך חדש למשתמש החדש אם אין מסמכים פתוחים
    if (documents.length === 0) {
      createNewDocument();
    }
  };

  return (
    <div className="app-container">
      <UserAuth 
        onUserLogin={handleUserLogin}
        onUserLogout={handleUserLogout}
        currentUser={currentUser}
      />
      <FileOperations 
        currentText={activeDocumentIndex >= 0 ? documents[activeDocumentIndex].content : ''}
        currentStyle={currentStyle}
        onLoadDocument={(content, style, name) => loadDocument(content, style, name)}
        currentUser={currentUser}
      />
      <div className="text-display-container">
        <MultiTextDisplay 
          documents={documents}
          activeDocumentIndex={activeDocumentIndex}
          onDocumentSelect={selectDocument}
          onDocumentClose={closeDocument}
        />
      </div>
      <div className="editor-container">
        <ToolBar 
          onStyleChange={changeStyle}
          onLanguageChange={changeLanguage}
          currentLanguage={currentLanguage}
          onUndo={undo}
          onClear={clearText}
          onDeleteWord={deleteWord}
          onCreateNew={createNewDocument}
        />
        <Keyboard 
          language={currentLanguage}
          onAddCharacter={addCharacter}
          onDeleteCharacter={deleteCharacter}
        />
      </div>
    </div>
  );
}

export default App;