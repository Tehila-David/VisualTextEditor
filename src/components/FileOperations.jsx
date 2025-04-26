import React, { useState } from 'react';
import './FileOperations.css';
import storageService from '../services/storageService';

const FileOperations = ({ 
  currentText, 
  currentStyle, 
  onLoadDocument, 
  onCreateNewDocument, // פרמטר חדש
  onOpenDocument, // פרמטר חדש
  currentUser = 'default'
}) => {
  const [documentName, setDocumentName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [documentsList, setDocumentsList] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // סוג ההודעה: 'success' או 'error'

  // הערה: הסרנו את useEffect - הטעינה תתבצע באופן ישיר בעת פתיחת דיאלוג
  
  // טעינת רשימת המסמכים של המשתמש הנוכחי
  const loadDocumentsList = () => {
    const list = storageService.getUserDocumentsList(currentUser);
    setDocumentsList(list);
  };

  // שמירת מסמך
  const saveDocument = () => {
    if (!documentName.trim()) {
      showMessage('נא להזין שם פתק', 'error');
      return;
    }

    try {
      storageService.saveDocument(documentName, currentText, currentStyle, currentUser);
      showMessage(`הפתק "${documentName}" נשמר בהצלחה`, 'success');
      setShowSaveDialog(false);
      // טעינה מחדש של רשימת המסמכים אחרי שמירה
      loadDocumentsList();
    } catch (error) {
      showMessage('שגיאה בשמירת הפתק', 'error');
      console.error('Error saving document:', error);
    }
  };

  // טעינת מסמך
  const openDocument = (fileName) => {
    try {
      const doc = storageService.loadDocument(fileName, currentUser);
      if (doc) {
        onOpenDocument(doc.content, doc.style, fileName); // שימוש בפונקציה החדשה
        showMessage(`הפתק "${fileName}" נטען בהצלחה`, 'success');
        setShowOpenDialog(false);
      } else {
        showMessage(`לא ניתן לטעון את הפתק "${fileName}"`, 'error');
      }
    } catch (error) {
      showMessage('שגיאה בטעינת הפתק', 'error');
      console.error('Error loading document:', error);
    }
  };

  // מחיקת מסמך
  const deleteDocument = (fileName, event) => {
    event.stopPropagation(); // מניעת הטעינה של המסמך בעת לחיצה על כפתור המחיקה
    
    if (window.confirm(`האם אתה בטוח שברצונך למחוק את הפתק "${fileName}"?`)) {
      try {
        storageService.deleteDocument(fileName, currentUser);
        showMessage(`הפתק"${fileName}" נמחק בהצלחה`, 'success');
        // טעינה מחדש של רשימת המסמכים אחרי מחיקה
        loadDocumentsList();
      } catch (error) {
        showMessage('שגיאה במחיקת הפתק', 'error');
        console.error('Error deleting document:', error);
      }
    }
  };

  // יצירת מסמך חדש - פונקציית מעטפת חדשה
  const handleCreateNew = () => {
    onCreateNewDocument(); // קריאה לפונקציה החיצונית
    showMessage('נוצר פתק חדש', 'success');
  };

  // פונקציה להצגת הודעות
  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
    }, 3000);
  };

  return (
    <div className="file-operations">
      <div className="file-buttons">
        <button 
          className="file-button" 
          onClick={handleCreateNew} // שינוי כאן - קריאה לפונקציה החדשה
          title="פתק חדש"
        >
          חדש
        </button>
        <button 
          className="file-button" 
          onClick={() => {
            setShowSaveDialog(true);
          }}
          title="שמירת פתק"
        >
          שמור
        </button>
        <button 
          className="file-button" 
          onClick={() => {
            // טעינת רשימת המסמכים בעת פתיחת הדיאלוג
            loadDocumentsList();
            setShowOpenDialog(true);
          }}
          title="פתיחת פתק"
        >
          פתח
        </button>
      </div>

      {/* הודעת התראה - תוצג בחלק העליון של המסך */}
      {message && (
        <div className={`file-message ${messageType} flash-message`}>
          {message}
        </div>
      )}

      {/* דיאלוג שמירת מסמך */}
      {showSaveDialog && (
        <div className="dialog-overlay" >
          <div className="dialog" >
            <h3>שמירת פתק</h3>
            <input
              type="text"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="שם פתק"
            />
            <div className="dialog-buttons">
              <button onClick={saveDocument}>שמור</button>
              <button onClick={() => setShowSaveDialog(false)}>ביטול</button>
            </div>
          </div>
        </div>
      )}

      {/* דיאלוג פתיחת מסמך */}
      {showOpenDialog && (
        <div className="dialog-overlay" style={{ zIndex: 9999 }}>
          <div className="dialog documents-dialog" style={{ position: 'relative', maxHeight: '80vh', overflowY: 'auto' }}>
            <h3>פתיחת פתק</h3>
            {documentsList.length > 0 ? (
              <ul className="documents-list">
                {documentsList.map((fileName) => (
                  <li key={fileName} onClick={() => openDocument(fileName)}>
                    <span className="document-name">{fileName}</span>
                    <button
                      className="delete-document-button"
                      onClick={(e) => deleteDocument(fileName, e)}
                      title="מחק פתק"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>אין פתקים שמורים</p>
            )}
            <div className="dialog-buttons">
              <button onClick={() => setShowOpenDialog(false)}>סגור</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileOperations;