import React, { useState, useEffect } from 'react';
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

  // טעינת רשימת מסמכים בעת טעינת הרכיב
  useEffect(() => {
    loadDocumentsList();
  }, [currentUser]);

  // טעינת רשימת המסמכים של המשתמש הנוכחי
  const loadDocumentsList = () => {
    const list = storageService.getUserDocumentsList(currentUser);
    setDocumentsList(list);
  };

  // שמירת מסמך
  const saveDocument = () => {
    if (!documentName.trim()) {
      setMessage('נא להזין שם למסמך');
      return;
    }

    try {
      storageService.saveDocument(documentName, currentText, currentStyle, currentUser);
      setMessage(`המסמך "${documentName}" נשמר בהצלחה`);
      setShowSaveDialog(false);
      loadDocumentsList();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('שגיאה בשמירת המסמך');
      console.error('Error saving document:', error);
    }
  };

  // טעינת מסמך
  const openDocument = (fileName) => {
    try {
      const doc = storageService.loadDocument(fileName, currentUser);
      if (doc) {
        onOpenDocument(doc.content, doc.style, fileName); // שימוש בפונקציה החדשה
        setMessage(`המסמך "${fileName}" נטען בהצלחה`);
        setShowOpenDialog(false);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`לא ניתן לטעון את המסמך "${fileName}"`);
      }
    } catch (error) {
      setMessage('שגיאה בטעינת המסמך');
      console.error('Error loading document:', error);
    }
  };

  // מחיקת מסמך
  const deleteDocument = (fileName, event) => {
    event.stopPropagation(); // מניעת הטעינה של המסמך בעת לחיצה על כפתור המחיקה
    
    if (window.confirm(`האם אתה בטוח שברצונך למחוק את המסמך "${fileName}"?`)) {
      try {
        storageService.deleteDocument(fileName, currentUser);
        setMessage(`המסמך "${fileName}" נמחק בהצלחה`);
        loadDocumentsList();
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        setMessage('שגיאה במחיקת המסמך');
        console.error('Error deleting document:', error);
      }
    }
  };

  // יצירת מסמך חדש - פונקציית מעטפת חדשה
  const handleCreateNew = () => {
    onCreateNewDocument(); // קריאה לפונקציה החיצונית
    setMessage('נוצר מסמך חדש');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="file-operations">
      <div className="file-buttons">
        <button 
          className="file-button" 
          onClick={handleCreateNew} // שינוי כאן - קריאה לפונקציה החדשה
          title="מסמך חדש"
        >
          חדש
        </button>
        <button 
          className="file-button" 
          onClick={() => setShowSaveDialog(true)}
          title="שמירת מסמך"
        >
          שמור
        </button>
        <button 
          className="file-button" 
          onClick={() => {
            setShowOpenDialog(true);
            loadDocumentsList();
          }}
          title="פתיחת מסמך"
        >
          פתח
        </button>
      </div>

      {message && <div className="file-message">{message}</div>}

      {/* דיאלוג שמירת מסמך */}
      {showSaveDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>שמירת מסמך</h3>
            <input
              type="text"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="שם המסמך"
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
        <div className="dialog-overlay">
          <div className="dialog documents-dialog">
            <h3>פתיחת מסמך</h3>
            {documentsList.length > 0 ? (
              <ul className="documents-list">
                {documentsList.map((fileName) => (
                  <li key={fileName} onClick={() => openDocument(fileName)}>
                    <span className="document-name">{fileName}</span>
                    <button
                      className="delete-document-button"
                      onClick={(e) => deleteDocument(fileName, e)}
                      title="מחק מסמך"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>אין מסמכים שמורים</p>
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