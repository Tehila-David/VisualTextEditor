// Local Storage management service - updated to support emojis

const STORAGE_PREFIX = 'visual-text-editor-';

const storageService = {
  // Save document - updated to support emojis
  saveDocument: (fileName, documentData, userId = 'default') => {
    const documentKey = `${STORAGE_PREFIX}${userId}-${fileName}`;
    
    // Ensure we have a valid data structure
    const dataToSave = {
      textSegments: documentData.textSegments || [],
      fullContent: documentData.fullContent || '',
      defaultStyle: documentData.defaultStyle || {},
      lastModified: new Date().toISOString(),
      userId
    };
    
    try {
      // Use special encoding to handle emojis
      localStorage.setItem(documentKey, JSON.stringify(dataToSave));
      
      // Update the user's document list
      const userDocuments = storageService.getUserDocumentsList(userId);
      if (!userDocuments.includes(fileName)) {
        userDocuments.push(fileName);
        storageService.saveUserDocumentsList(userId, userDocuments);
      }
      
      return true;
    } catch (error) {
      console.error('Error saving document with emojis:', error);
      
      // If there's an error, try to save without special characters (as fallback)
      try {
        // Attempt to save without emojis
        const safeData = JSON.parse(JSON.stringify(dataToSave));
        localStorage.setItem(documentKey, JSON.stringify(safeData));
        return true;
      } catch (e) {
        console.error('Failed fallback save:', e);
        return false;
      }
    }
  },
  
  // Load document - updated to support emojis
  loadDocument: (fileName, userId = 'default') => {
    const documentKey = `${STORAGE_PREFIX}${userId}-${fileName}`;
    try {
      const documentData = localStorage.getItem(documentKey);
      
      if (!documentData) {
        return null;
      }
      
      const parsedData = JSON.parse(documentData);
      
      // Check if this is an old document (before update to multiple styles)
      if (!parsedData.textSegments && parsedData.content) {
        // Convert to new structure
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
  
  // Delete document
  deleteDocument: (fileName, userId = 'default') => {
    const documentKey = `${STORAGE_PREFIX}${userId}-${fileName}`;
    localStorage.removeItem(documentKey);
    
    // Update the user's document list
    const userDocuments = storageService.getUserDocumentsList(userId);
    const updatedList = userDocuments.filter(name => name !== fileName);
    storageService.saveUserDocumentsList(userId, updatedList);
    
    return true;
  },
  
  // Get user's document list
  getUserDocumentsList: (userId = 'default') => {
    const listKey = `${STORAGE_PREFIX}${userId}-documents`;
    const documentsList = localStorage.getItem(listKey);
    
    if (!documentsList) {
      return [];
    }
    
    return JSON.parse(documentsList);
  },
  
  // Save user's document list
  saveUserDocumentsList: (userId, documentsList) => {
    const listKey = `${STORAGE_PREFIX}${userId}-documents`;
    localStorage.setItem(listKey, JSON.stringify(documentsList));
    return true;
  },
  
  // Register new user
  registerUser: (username, password) => {
    const usersKey = `${STORAGE_PREFIX}users`;
    let users = storageService.getUsers();
    
    // Check if user already exists
    if (users.find(user => user.username === username)) {
      return false;
    }
    
    users.push({
      username,
      password, // In a real scenario, the password should be encrypted!
      createdAt: new Date().toISOString()
    });
    
    localStorage.setItem(usersKey, JSON.stringify(users));
    return true;
  },
  
  // User login
  loginUser: (username, password) => {
    const users = storageService.getUsers();
    const user = users.find(user => user.username === username && user.password === password);
    
    return user ? username : null;
  },
  
  // Get users list
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