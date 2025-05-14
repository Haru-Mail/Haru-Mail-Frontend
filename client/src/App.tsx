import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/home/HomePage';
import SuccessPage from './pages/success/SuccessPage';
import ListPage from './pages/diary/list/ListPage';
import SettingPage from './pages/setting/MailSettingPage';
import EditorPage from './pages/diary/diaryEditor/DiaryEditorPage';
import DiaryDetailPage from './pages/diary/diaryDetail/DiaryDetailPage';
import SearchPage from './pages/diary/search/SearchPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/list" element={<ListPage />} />
        <Route path="/setting" element={<SettingPage />} />
        <Route path="/editor/:questionText" element={<EditorPage />} />
        <Route path="/detail" element={<DiaryDetailPage />} />
        <Route path="/diary/:diaryId" element={<DiaryDetailPage />} />
        <Route path="/search" element={<SearchPage />} />
      </Routes>
    </Router>
  );
}

export default App;
