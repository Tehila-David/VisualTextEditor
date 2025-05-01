# 📝 Visual Text Editor 

A responsive rich text editor with multi-document support, built using React and modern web technologies. Features extensive styling options, document management, and RTL language support.

## 📋 Overview

**Visual Text Editor** is a comprehensive web application. It demonstrates advanced front-end concepts by creating a feature-rich text editor with robust styling capabilities and document management. The system allows users to create, edit, save, and manage multiple documents with various styling options and full RTL language support.

## 💻 Technologies

- React
- CSS3 (CSS Variables, Flexbox, Grid)
- JavaScript (ES6+)
- Local Storage for data persistence
- Font Awesome for icons

## ✨ Key Features

- **Multi-Document Support** - Create and manage multiple documents simultaneously
- **Rich Text Styling** - Format text with various fonts, sizes, colors, and styles
- **User Authentication** - Complete login and registration system
- **Document Management** - Save, open, and delete documents
- **Multiple Language Support** - Hebrew, English, and Emoji keyboards
- **RTL Support** - Full right-to-left text direction support
- **Responsive Design** - Mobile-friendly interface
- **Style Application Modes** - Apply styles to all text or only from cursor position forward
- **Search and Replace** - Find and replace text within documents
- **Undo Functionality** - Revert to previous document states

## 🔧 Technical Implementation

### Document Structure

- **Text Segments** - Documents are structured as arrays of text segments, each with its own styling
- **Style Management** - Comprehensive styling options with two modes: "All Text" and "From Here On"
- **Cursor Management** - Advanced cursor positioning across text segments

### State Management

- **React Hooks** - Utilizes useState for managing component state
- **Local Storage** - Persistent storage for user data and saved documents
- **History Tracking** - Document state history for undo functionality

## 📁 Project Structure

```
/
├── components/
│   ├── MultiTextDisplay.jsx    # Multi-document display component
│   ├── TextEditor.jsx          # Main text editing interface
│   ├── Keyboard.jsx            # Virtual keyboard component
│   ├── FileOperations.jsx      # Document management component
│   └── UserAuth.jsx            # Authentication component
│
├── services/
│   └── storageService.jsx      # Local storage management
│
├── App.jsx                     # Main application component
└── index.jsx                   # Application entry point
```

## 🖋️ Editor Features

### Text Manipulation

- Character and word deletion
- Text clearing with confirmation
- Text search with position reporting
- Text replacement functionality

### Styling Options

- Font family selection
- Font size adjustment
- Text color customization
- Bold, italic, and underline formatting
- Text direction control (RTL/LTR)

### Keyboard Support

- Virtual keyboard with multiple layouts
- Hebrew, English, and Emoji input support
- Language switching
- Special character support

## 📱 User Interface

The application features a clean, intuitive interface with three main sections:

1. **Document Display Area** - Shows all open documents with active document highlighting
2. **Text Editor** - Virtual keyboard and text styling controls
3. **Document Management** - User authentication and file operations

## 💾 Data Persistence

- **User Accounts** - Securely stored in local storage
- **Document Data** - Saved with styling information and metadata
- **Auto-save** - Automatic saving of documents when closing

## 🔍 Usage Flow

1. **Authentication** - Users start at the login screen and can register or log in
2. **Document Creation** - Create new documents or open existing ones
3. **Text Editing** - Add and style text using various formatting options
4. **Document Management** - Save, close, or delete documents

## 📸 Screenshots




