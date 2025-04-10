import React, { useState, useEffect } from 'react';
import './stylesComp.css';
import storageService from '../services/storageService';

const UserAuth = ({ onUserLogin, onUserLogout, currentUser }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' או 'error'

  // בדיקה אם יש משתמש מחובר בטעינת האתר (לוקאל סטורג')
  useEffect(() => {
    const savedUser = localStorage.getItem('current-user');
    if (savedUser) {
      onUserLogin(savedUser);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!username || !password) {
      showMessage('יש למלא את כל השדות', 'error');
      return;
    }

    const loggedInUser = storageService.loginUser(username, password);
    if (loggedInUser) {
      localStorage.setItem('current-user', loggedInUser);
      onUserLogin(loggedInUser);
      showMessage('התחברת בהצלחה', 'success');
      setShowLogin(false);
      clearForm();
    } else {
      showMessage('שם משתמש או סיסמה שגויים', 'error');
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!username || !password) {
      showMessage('יש למלא את כל השדות', 'error');
      return;
    }

    const success = storageService.registerUser(username, password);
    if (success) {
      showMessage('הרשמה בוצעה בהצלחה, כעת ניתן להתחבר', 'success');
      setShowRegister(false);
      setShowLogin(true);
      clearForm();
    } else {
      showMessage('שם המשתמש כבר קיים במערכת', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('current-user');
    onUserLogout();
    showMessage('התנתקת בהצלחה', 'success');
  };

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
    }, 3000);
  };

  const clearForm = () => {
    setUsername('');
    setPassword('');
  };

  return (
    <div className="user-auth">
      {currentUser ? (
        <div className="user-info">
          <span className="welcome-message">שלום, {currentUser}</span>
          <button className="auth-button logout-button" onClick={handleLogout}>
            התנתק
          </button>
        </div>
      ) : (
        <div className="auth-buttons">
          <button 
            className="auth-button" 
            onClick={() => {
              setShowLogin(true);
              setShowRegister(false);
            }}
          >
            התחבר
          </button>
          <button 
            className="auth-button" 
            onClick={() => {
              setShowRegister(true);
              setShowLogin(false);
            }}
          >
            הרשם
          </button>
        </div>
      )}

      {message && (
        <div className={`auth-message ${messageType}`}>
          {message}
        </div>
      )}

      {/* טופס התחברות */}
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

      {/* טופס הרשמה */}
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
    </div>
  );
};

export default UserAuth;