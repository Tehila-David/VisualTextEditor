import React from 'react';
import './TextEditor.css';
import Keyboard from './Keyboard';

const TextEditor = ({ 
  onAddCharacter,
  onDeleteCharacter,
  onDeleteWord,
  onClearText,
  onStyleChange,
  onLanguageChange,
  currentLanguage,
  onUndo,
  onSearch,
  onReplace,
  applyStyleFromNow,
  onToggleApplyStyleFromNow
}) => {
  return (
    <div className="text-editor-container">
      <Keyboard 
        language={currentLanguage}
        onAddCharacter={onAddCharacter}
        onDeleteCharacter={onDeleteCharacter}
        onDeleteWord={onDeleteWord}
        onClearText={onClearText}
        onStyleChange={onStyleChange}
        onLanguageChange={onLanguageChange}
        currentLanguage={currentLanguage}
        onUndo={onUndo}
        onSearch={onSearch}
        onReplace={onReplace}
        applyStyleFromNow={applyStyleFromNow}
        onToggleApplyStyleFromNow={onToggleApplyStyleFromNow}
      />
    </div>
  );
};

export default TextEditor;