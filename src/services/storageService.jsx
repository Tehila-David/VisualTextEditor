// שירות לניהול אחסון מקומי (Local Storage)

const STORAGE_PREFIX = 'visual-text-editor-';

const storageService = {
  // שמירת מסמך
  saveDocument: (fileName, content, style, userId = 'default') => {
    const documentKey = `${STORAGE_PREFIX}${userId}-${fileName}`;
    const documentData = {
      content,
      style,
      lastModified: new Date().toISOString(),
      userId
    };
    localStorage.setItem(documentKey, JSON.stringify(documentData));
    
    // עדכון רשימת המסמכים של המשתמש
    const userDocuments = storageService.getUserDocumentsList(userId);
    if (!userDocuments.includes(fileName)) {
      userDocuments.push(fileName);
      storageService.saveUserDocumentsList(userId, userDocuments);
    }
    
    return true;
  },
  
  // טעינת מסמך
  loadDocument: (fileName, userId = 'default') => {
    const documentKey = `${STORAGE_PREFIX}${userId}-${fileName}`;
    const documentData = localStorage.getItem(documentKey);
    
    if (!documentData) {
      return null;
    }
    
    return JSON.parse(documentData);
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