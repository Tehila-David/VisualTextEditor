import React, { useState } from 'react';
import './FileOperations.css';
import storageService from '../services/storageService';

const FileOperations = ({
  documents,
  activeDocumentIndex,
  onLoadDocument,
  onCreateNewDocument,
  onOpenDocument,
  currentUser = 'default',
  showMessage
}) => {
  const [documentName, setDocumentName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [documentsList, setDocumentsList] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  // Confirmation dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');

  // Check if user is logged in
  const isLoggedIn = () => {
    return currentUser && currentUser !== 'default';
  };

  // Load user's document list
  const loadDocumentsList = () => {
    const list = storageService.getUserDocumentsList(currentUser);
    setDocumentsList(list);
  };

  // Save document - updated with custom confirm dialog
  const saveDocument = () => {
    // Check if the note is already saved with that name
    const existingDocuments = storageService.getUserDocumentsList(currentUser);
    const documentExists = existingDocuments.includes(documentName);

    if (documentExists) {
      // New behavior: do not allow overwrite, show error message
      displayMessage(`פתק בשם "${documentName}" כבר שמור במערכת`, 'error');
      setShowSaveDialog(false);
      return;
    }

    // Check if user is logged in
    if (!isLoggedIn()) {
      displayMessage('עליך להתחבר כדי לשמור פתקים', 'error');
      setShowSaveDialog(false);
      return;
    }

    if (!documentName.trim()) {
      displayMessage('נא להזין שם פתק', 'error');
      return;
    }

    if (activeDocumentIndex < 0 || !documents[activeDocumentIndex]) {
      displayMessage('אין פתק פעיל לשמירה', 'error');
      return;
    }

    // If the note does not exist, save it directly
    savingProcess();

    // Inner function to handle saving
    function savingProcess() {
      try {
        const currentDoc = documents[activeDocumentIndex];

        // Prepare data for saving
        const documentData = {
          textSegments: currentDoc.textSegments || [],
          fullContent: currentDoc.fullContent || '',
          defaultStyle: currentDoc.defaultStyle || {}
        };

        storageService.saveDocument(documentName, documentData, currentUser);

        // Update the document's name
        const newDocuments = [...documents];
        newDocuments[activeDocumentIndex] = {
          ...newDocuments[activeDocumentIndex],
          name: documentName
        };

        // Save the changes and reload the document
        onLoadDocument(
          currentDoc.textSegments,
          currentDoc.defaultStyle,
          documentName
        );

        displayMessage(`הפתק "${documentName}" נשמר בהצלחה`, 'success');
        setShowSaveDialog(false);
        // Reload document list after save
        loadDocumentsList();
      } catch (error) {
        displayMessage('שגיאה בשמירת הפתק', 'error');
        console.error('Error saving document:', error);
      }
    }
  };

  // Load document - updated for multi-style support
  const openDocument = (fileName) => {
    // Check if user is logged in
    if (!isLoggedIn()) {
      displayMessage('עליך להתחבר כדי לפתוח פתקים', 'error');
      setShowOpenDialog(false);
      return;
    }

    // Check if the file is already open
    const isAlreadyOpen = documents.some(doc => doc.name === fileName);
    if (isAlreadyOpen) {
      // Close the dialog before performing the other actions
      setShowOpenDialog(false);
      displayMessage(`הפתק "${fileName}" כבר פתוח`, 'success');
      return;
    }

    try {
      const doc = storageService.loadDocument(fileName, currentUser);
      if (doc) {
        // Close the dialog before loading the document
        setShowOpenDialog(false);

        // Check if file is in new or old format
        if (doc.textSegments) {
          // New format with multi-style segments
          onOpenDocument(doc.textSegments, doc.defaultStyle, fileName);
        } else {
          // Old format - convert to new format
          onOpenDocument([{ text: doc.content, style: doc.style }], doc.style, fileName);
        }

        displayMessage(`הפתק "${fileName}" נטען בהצלחה`, 'success');
      } else {
        displayMessage(`לא ניתן לטעון את הפתק "${fileName}"`, 'error');
      }
    } catch (error) {
      displayMessage('שגיאה בטעינת הפתק', 'error');
      console.error('Error loading document:', error);
    }
  };

  // Open delete confirmation dialog
  const confirmDeleteDocument = (fileName, event) => {
    event.stopPropagation(); // Prevent document loading when clicking delete button

    // Check if user is logged in
    if (!isLoggedIn()) {
      displayMessage('עליך להתחבר כדי למחוק פתקים', 'error');
      return;
    }

    setConfirmMessage(`האם אתה בטוח שברצונך למחוק את הפתק "${fileName}"?`);
    setConfirmAction(() => () => {
      try {
        storageService.deleteDocument(fileName, currentUser);
        displayMessage(`הפתק "${fileName}" נמחק בהצלחה`, 'success');
        // Reload document list after deletion
        loadDocumentsList();
      } catch (error) {
        displayMessage('שגיאה במחיקת הפתק', 'error');
        console.error('Error deleting document:', error);
      }
    });
    setShowConfirmDialog(true);
  };

  // Create new document - wrapper function
  const handleCreateNew = () => {
    // Check if user is logged in
    if (!isLoggedIn()) {
      displayMessage('עליך להתחבר כדי ליצור פתק חדש', 'error');
      return;
    }

    onCreateNewDocument(); // Call external function
    displayMessage('נוצר פתק חדש', 'success');
  };

  // Display messages function
  const displayMessage = (text, type) => {
    // If showMessage was passed from parent, use it
    if (typeof showMessage === 'function') {
      showMessage(text, type);
    } else {
      // Otherwise, use internal message system
      setMessage(text);
      setMessageType(type);
      setTimeout(() => {
        setMessage('');
      }, 3000);
    }
  };

  // Confirm dialog action
  const handleConfirm = () => {
    if (confirmAction) {
      confirmAction();
    }
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  // Cancel dialog action
  const handleCancel = () => {
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  // סגנון לאייקונים
  const iconStyle = {
    marginLeft: '5px',
    fontSize: '16px'
  };

  return (
    <div className="file-operations">
      <div className="file-buttons">
        <button
          className="file-button"
          onClick={handleCreateNew}
          title={isLoggedIn() ? "פתק חדש" : "יש להתחבר תחילה"}
        >
          <i className="fas fa-file-alt" style={iconStyle}></i>
          חדש
        </button>
        <button
          className="file-button"
          onClick={() => {
            if (!isLoggedIn()) {
              displayMessage('עליך להתחבר כדי לשמור פתקים', 'error');
              return;
            }
            if (activeDocumentIndex < 0 || !documents[activeDocumentIndex]) {
              displayMessage('אין פתק פעיל לשמירה', 'error');
              return;
            }

            const currentDocName = documents[activeDocumentIndex].name || '';
            const existingDocuments = storageService.getUserDocumentsList(currentUser);

            if (existingDocuments.includes(currentDocName)) {
              displayMessage(`פתק בשם "${currentDocName}" כבר שמור במערכת`, 'error');
              return;
            }

            setDocumentName(currentDocName); // אפשרות להכניס את השם כבר
            setShowSaveDialog(true);
          }}
          title={isLoggedIn() ? "שמירת פתק" : "יש להתחבר תחילה"}
        >
          <i className="fas fa-save" style={iconStyle}></i>
          שמור
        </button>

        <button
          className="file-button"
          onClick={() => {
            // Check if user is logged in
            if (!isLoggedIn()) {
              displayMessage('עליך להתחבר כדי לפתוח פתקים', 'error');
              return;
            }

            // Load document list when opening dialog
            loadDocumentsList();
            setShowOpenDialog(true);
          }}
          title={isLoggedIn() ? "פתיחת פתק" : "יש להתחבר תחילה"}
        >
          <i className="fas fa-folder-open" style={iconStyle}></i>
          פתח
        </button>
      </div>

      {/* Local flash message - if not using system messages */}
      {message && (
        <div className={`file-message ${messageType} flash-message`}>
          {message}
        </div>
      )}

      {/* Save document dialog */}
      {showSaveDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>
              <i className="fas fa-save" style={iconStyle}></i>
              שמירת פתק
            </h3>
            <input
              type="text"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="שם פתק"
            />
            <div className="dialog-buttons">
              <button onClick={saveDocument}>
                <i className="fas fa-check" style={iconStyle}></i>
                שמור
              </button>
              <button onClick={() => setShowSaveDialog(false)}>
                <i className="fas fa-times" style={iconStyle}></i>
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Open document dialog */}
      {showOpenDialog && (
        <div className="dialog-overlay" style={{ zIndex: 9999 }}>
          <div className="dialog documents-dialog" style={{ position: 'relative', maxHeight: '80vh', overflowY: 'auto' }}>
            <h3>
              <i className="fas fa-folder-open" style={iconStyle}></i>
              פתיחת פתק
            </h3>
            {documentsList.length > 0 ? (
              <ul className="documents-list">
                {documentsList.map((fileName) => (
                  <li key={fileName} onClick={() => openDocument(fileName)}>
                    <span className="document-name">
                      <i className="fas fa-file-alt" style={{marginLeft: '8px'}}></i>
                      {fileName}
                    </span>
                    <button
                      className="delete-document-button"
                      onClick={(e) => confirmDeleteDocument(fileName, e)}
                      title="מחק פתק"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                <i className="fas fa-info-circle" style={{marginLeft: '5px'}}></i>
                אין פתקים שמורים
              </p>
            )}
            <div className="dialog-buttons">
              <button onClick={() => setShowOpenDialog(false)}>
                <i className="fas fa-times" style={iconStyle}></i>
                סגור
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation dialog */}
      {showConfirmDialog && (
        <div className="dialog-overlay" style={{ zIndex: 99999 }}>
          <div className="dialog">
            <h3>
              <i className="fas fa-exclamation-triangle" style={{marginLeft: '5px', color: '#e74c3c'}}></i>
              אישור פעולה
            </h3>
            <p>{confirmMessage}</p>
            <div className="dialog-buttons">
              <button onClick={handleConfirm}>
                <i className="fas fa-check" style={iconStyle}></i>
                אישור
              </button>
              <button onClick={handleCancel}>
                <i className="fas fa-times" style={iconStyle}></i>
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileOperations;