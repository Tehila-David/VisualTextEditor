import React, { useState, useEffect } from 'react';
import './App.css';
import MultiTextDisplay from './components/MultiTextDisplay';
import TextEditor from './components/TextEditor';
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
      if (historyIndex === -1 ||
        history.length === 0 ||
        (history[historyIndex]?.content !== currentDoc.content)) {
        // יצירת היסטוריה חדשה רק אם התוכן השתנה
        const newHistory = historyIndex >= 0 ? history.slice(0, historyIndex + 1) : [];
        newHistory.push({ ...currentDoc });
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    }
  }, [documents]);

  // פונקציה חדשה לפתיחת מסמך כמסמך חדש
  const openNewDocument = (content, style, name) => {
    const newDocument = {
      name: name || `מסמך ${documents.length + 1}`,
      content,
      style
    };

    setDocuments([...documents, newDocument]);
    setActiveDocumentIndex(documents.length);
    setCurrentStyle(style);
  };

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
      // הערה: הסרנו את השורה שיוצרת מסמך חדש
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
      const content = currentDoc.content;

      // מחיקת המילה האחרונה בהתחשב ברווחים
      let newContent;

      // בדיקה אם המסמך מסתיים ברווח
      if (content.endsWith(' ')) {
        // מחיקת הרווחים בסוף
        const trimmedContent = content.trimEnd();
        // מציאת הרווח האחרון
        const lastSpaceIndex = trimmedContent.lastIndexOf(' ');
        if (lastSpaceIndex !== -1) {
          newContent = content.substring(0, lastSpaceIndex + 1);
        } else {
          // אם אין רווח נוסף, נמחק הכל
          newContent = '';
        }
      } else {
        // אם אין רווח בסוף, נמצא את הרווח האחרון
        const lastSpaceIndex = content.lastIndexOf(' ');
        if (lastSpaceIndex !== -1) {
          newContent = content.substring(0, lastSpaceIndex + 1);
        } else {
          // אם אין רווח בכלל, נמחק הכל
          newContent = '';
        }
      }

      const newDocuments = [...documents];
      newDocuments[activeDocumentIndex] = {
        ...newDocuments[activeDocumentIndex],
        content: newContent
      };
      setDocuments(newDocuments);
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
      // טיפול מיוחד בתכונות טוגל כמו עיבוי, הטיה וקו תחתון
      const newStyle = { ...currentStyle, ...style };

      // טיפול בטוגל של עיבוי
      if (style.hasOwnProperty('fontWeight')) {
        if (style.fontWeight === currentStyle.fontWeight) {
          newStyle.fontWeight = 'normal';
        }
      }

      // טיפול בטוגל של הטיה
      if (style.hasOwnProperty('fontStyle')) {
        if (style.fontStyle === currentStyle.fontStyle) {
          newStyle.fontStyle = 'normal';
        }
      }

      // טיפול בטוגל של קו תחתון
      if (style.hasOwnProperty('textDecoration')) {
        if (style.textDecoration === currentStyle.textDecoration) {
          newStyle.textDecoration = 'none';
        }
      }

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

  // פונקציה לחיפוש טקסט במסמך
  const searchText = (searchTerm) => {
    if (activeDocumentIndex >= 0 && searchTerm) {
      const currentDoc = documents[activeDocumentIndex];
      const position = currentDoc.content.indexOf(searchTerm);

      if (position !== -1) {
        alert(`הטקסט "${searchTerm}" נמצא בעמדה ${position}`);
        return position;
      } else {
        alert(`הטקסט "${searchTerm}" לא נמצא במסמך`);
        return -1;
      }
    }
    return -1;
  };

  // פונקציה להחלפת טקסט במסמך
  const replaceText = (searchTerm, replaceTerm) => {
    if (activeDocumentIndex >= 0 && searchTerm && replaceTerm) {
      const currentDoc = documents[activeDocumentIndex];

      // יצירת ביטוי רגולרי עם דגל global למציאת כל המופעים
      const regex = new RegExp(searchTerm, 'g');
      const newContent = currentDoc.content.replace(regex, replaceTerm);

      // בדיקה אם בוצעה החלפה
      if (newContent !== currentDoc.content) {
        const newDocuments = [...documents];
        newDocuments[activeDocumentIndex] = {
          ...newDocuments[activeDocumentIndex],
          content: newContent
        };
        setDocuments(newDocuments);

        // חישוב כמות ההחלפות
        const count = (currentDoc.content.match(regex) || []).length;
        alert(`הוחלפו ${count} מופעים של "${searchTerm}" ב-"${replaceTerm}"`);
      } else {
        alert(`הטקסט "${searchTerm}" לא נמצא במסמך`);
      }
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
        onCreateNewDocument={createNewDocument}
        onOpenDocument={(content, style, name) => openNewDocument(content, style, name)}
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
        />
      </div>
    </div>
  );
}

export default App;