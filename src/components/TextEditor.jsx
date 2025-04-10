import React from 'react';
import './TextEditor.css';
import ToolBar from './ToolBar';
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
  onReplace
}) => {
  return (
    <div className="text-editor">
      <ToolBar 
        onStyleChange={onStyleChange}
        onLanguageChange={onLanguageChange}
        currentLanguage={currentLanguage}
        onUndo={onUndo}
        onClear={onClearText}
        onDeleteWord={onDeleteWord}
        onSearch={onSearch}
        onReplace={onReplace}
      />
      <Keyboard 
        language={currentLanguage}
        onAddCharacter={onAddCharacter}
        onDeleteCharacter={onDeleteCharacter}
      />
    </div>
  );
};

export default TextEditor;