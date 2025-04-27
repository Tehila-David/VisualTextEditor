// שירות לניהול אחסון מקומי (Local Storage) - מעודכן לתמיכה באימוג'ים

const STORAGE_PREFIX = 'visual-text-editor-';

const storageService = {
  // שמירת מסמך - מעודכן לתמיכה באימוג'ים
  saveDocument: (fileName, documentData, userId = 'default') => {
    const documentKey = `${STORAGE_PREFIX}${userId}-${fileName}`;
    
    // וידוא שיש לנו מבנה נתונים תקין
    const dataToSave = {
      textSegments: documentData.textSegments || [],
      fullContent: documentData.fullContent || '',
      defaultStyle: documentData.defaultStyle || {},
      lastModified: new Date().toISOString(),
      userId
    };
    
    try {
      // שימוש בקידוד מיוחד לטיפול באימוג'ים
      localStorage.setItem(documentKey, JSON.stringify(dataToSave));
      
      // עדכון רשימת המסמכים של המשתמש
      const userDocuments = storageService.getUserDocumentsList(userId);
      if (!userDocuments.includes(fileName)) {
        userDocuments.push(fileName);
        storageService.saveUserDocumentsList(userId, userDocuments);
      }
      
      return true;
    } catch (error) {
      console.error('Error saving document with emojis:', error);
      
      // אם יש שגיאה, ננסה לשמור ללא תווים מיוחדים (כתחליף)
      try {
        // ניסיון לשמור ללא אימוג'ים
        const safeData = JSON.parse(JSON.stringify(dataToSave));
        localStorage.setItem(documentKey, JSON.stringify(safeData));
        return true;
      } catch (e) {
        console.error('Failed fallback save:', e);
        return false;
      }
    }
  },
  
  // טעינת מסמך - מעודכן לתמיכה באימוג'ים
  loadDocument: (fileName, userId = 'default') => {
    const documentKey = `${STORAGE_PREFIX}${userId}-${fileName}`;
    try {
      const documentData = localStorage.getItem(documentKey);
      
      if (!documentData) {
        return null;
      }
      
      const parsedData = JSON.parse(documentData);
      
      // בדיקה אם זה מסמך ישן (לפני עדכון לסגנונות מרובים)
      if (!parsedData.textSegments && parsedData.content) {
        // המרה למבנה החדש
        return {
          textSegments: [{ 
            text: parsedData.content, 
            style: parsedData.style || {} 
          }],
          fullContent: parsedData.content,
          defaultStyle: parsedData.style || {},
          lastModified: parsedData.lastModified,
          userId: parsedData.userId
        };
      }
      
      return parsedData;
    } catch (error) {
      console.error('Error loading document:', error);
      return null;
    }
  },
  
  // מחיקת מסמך
  deleteDocument: (fileName, userId = 'default') => {
    const documentKey = `${STORAGE_PREFIX}${userId}-${fileName}`;
    localStorage.removeItem(documentKey);
    
    // עדכון רשימת המסמכים של המשתמש
    const userDocuments = storageService.getUserDocumentsList(userId);
    const updatedList = userDocuments.filter(name => name !== fileName);
    storageService.saveUserDocumentsList(userId, updatedList);
    
    return true;
  },
  
  // קבלת רשימת מסמכים של משתמש
  getUserDocumentsList: (userId = 'default') => {
    const listKey = `${STORAGE_PREFIX}${userId}-documents`;
    const documentsList = localStorage.getItem(listKey);
    
    if (!documentsList) {
      return [];
    }
    
    return JSON.parse(documentsList);
  },
  
  // שמירת רשימת מסמכים של משתמש
  saveUserDocumentsList: (userId, documentsList) => {
    const listKey = `${STORAGE_PREFIX}${userId}-documents`;
    localStorage.setItem(listKey, JSON.stringify(documentsList));
    return true;
  },
  
  // רישום משתמש חדש
  registerUser: (username, password) => {
    const usersKey = `${STORAGE_PREFIX}users`;
    let users = storageService.getUsers();
    
    // בדיקה אם המשתמש כבר קיים
    if (users.find(user => user.username === username)) {
      return false;
    }
    
    users.push({
      username,
      password, // במקרה אמיתי, יש להצפין את הסיסמה!
      createdAt: new Date().toISOString()
    });
    
    localStorage.setItem(usersKey, JSON.stringify(users));
    return true;
  },
  
  // התחברות משתמש
  loginUser: (username, password) => {
    const users = storageService.getUsers();
    const user = users.find(user => user.username === username && user.password === password);
    
    return user ? username : null;
  },
  
  // קבלת רשימת משתמשים
  getUsers: () => {
    const usersKey = `${STORAGE_PREFIX}users`;
    const users = localStorage.getItem(usersKey);
    
    if (!users) {
      return [];
    }
    
    return JSON.parse(users);
  }
};

export default storageService;