import React, { useState } from 'react';
import './UserAuth.css';
import storageService from '../services/storageService';

const UserAuth = ({ onUserLogin, onUserLogout, currentUser, showMessage }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  
  // Logout confirmation dialog
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  // Function to open login dialog - exported for external components
  const openLoginDialog = () => {
    setShowLogin(true);
    setShowRegister(false);
  };
  
  // Function to open registration dialog - exported for external components
  const openRegisterDialog = () => {
    setShowRegister(true);
    setShowLogin(false);
  };

  // Handle login form submission
  const handleLogin = (e) => {
    e.preventDefault();
    if (!username || !password) {
      displayMessage('יש למלא את כל השדות', 'error');
      setShowLogin(false);
      clearForm();
      return;
    }

    const loggedInUser = storageService.loginUser(username, password);
    if (loggedInUser) {
      localStorage.setItem('current-user', loggedInUser);
      onUserLogin(loggedInUser);
      displayMessage('התחברת בהצלחה', 'success');
      setShowLogin(false);
      clearForm();
    } else {
      displayMessage('שם משתמש או סיסמה שגויים', 'error');
      setShowLogin(false); 
      clearForm();
    }
  };

  // Handle registration form submission
  const handleRegister = (e) => {
    e.preventDefault();
    if (!username || !password) {
      displayMessage('יש למלא את כל השדות', 'error');
      setShowRegister(false); 
      return;
    }

    const success = storageService.registerUser(username, password);
    if (success) {
      displayMessage('הרשמה בוצעה בהצלחה, כעת ניתן להתחבר', 'success');
      setShowRegister(false);
      // Open login dialog after successful registration
      setTimeout(() => {
        setShowLogin(true);
      }, 1000);
      clearForm();
    } else {
      displayMessage('שם המשתמש כבר קיים במערכת', 'error');
      setShowRegister(false); 
      clearForm();
    }
  };

  // Open logout confirmation dialog
  const confirmLogout = () => {
    setShowConfirmLogout(true);
  };

  // Perform logout
  const handleLogout = () => {
    localStorage.removeItem('current-user');
    onUserLogout(); // Call external function to handle documents closing
    displayMessage('התנתקת בהצלחה', 'success');
    setShowConfirmLogout(false);
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

  // Clear form fields
  const clearForm = () => {
    setUsername('');
    setPassword('');
  };

  return (
    <div className="user-auth">
      {currentUser ? (
        <div className="user-info">
          <span className="welcome-message">שלום, {currentUser}</span>
          <button className="auth-button logout-button" onClick={confirmLogout}>
            התנתק
          </button>
        </div>
      ) : (
        <div className="auth-buttons">
          <button 
            className="auth-button" 
            onClick={openLoginDialog}
          >
            התחבר
          </button>
          <button 
            className="auth-button" 
            onClick={openRegisterDialog}
          >
            הרשם
          </button>
        </div>
      )}

      {/* Flash message - appears at top of screen */}
      {message && (
        <div className={`auth-message ${messageType} flash-message`}>
          {message}
        </div>
      )}

      {/* Login form */}
      {showLogin && (
        <div className="auth-dialog-overlay">
          <div className="auth-dialog">
            <h3>התחברות</h3>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>שם משתמש</label>
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label>סיסמה</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                />
              </div>
              <div className="auth-dialog-buttons">
                <button type="submit">התחבר</button>
                <button 
                  type="button" 
                  onClick={() => setShowLogin(false)}
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Registration form */}
      {showRegister && (
        <div className="auth-dialog-overlay">
          <div className="auth-dialog">
            <h3>הרשמה</h3>
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label>שם משתמש</label>
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label>סיסמה</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                />
              </div>
              <div className="auth-dialog-buttons">
                <button type="submit">הרשם</button>
                <button 
                  type="button" 
                  onClick={() => setShowRegister(false)}
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logout confirmation dialog */}
      {showConfirmLogout && (
        <div className="auth-dialog-overlay">
          <div className="auth-dialog">
            <h3>אישור התנתקות</h3>
            <p>האם אתה בטוח שברצונך להתנתק? כל המסמכים הפתוחים ייסגרו.</p>
            <div className="auth-dialog-buttons">
              <button onClick={handleLogout}>אישור</button>
              <button onClick={() => setShowConfirmLogout(false)}>ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAuth;