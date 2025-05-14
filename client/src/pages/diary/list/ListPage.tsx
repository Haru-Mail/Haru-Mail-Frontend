import React, { useEffect, useState } from 'react';
import Header from '../../header/Header';  // Header 컴포넌트 경로
import './ListPage.css';
import { useNavigate } from 'react-router-dom';

interface DiaryItem {
  id: number;
  title: string;
  date: string;
}

interface UserInfo {
  username: string;
  email: string;
}

const ListPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [diaries, setDiaries] = useState<DiaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState<number>(0);
  const [currentMonth, setCurrentMonth] = useState<number>(0);

  // 쿠키에서 accessToken 꺼내는 함수
  const getAccessTokenFromCookies = (): string => {
    const name = 'accessToken=';
    const decoded = decodeURIComponent(document.cookie);
    return (
      decoded
        .split('; ')
        .find(row => row.startsWith(name))
        ?.substring(name.length) ?? ''
    );
  };

  // 이전 달
  const handlePrevMonth = () => {
    setCurrentMonth(prevMonth => {
      if (prevMonth === 1) {
        setCurrentYear(prevYear => prevYear - 1);
        return 12;
      } else {
        return prevMonth - 1;
      }
    });
  };

  // 다음 달
  const handleNextMonth = () => {
    setCurrentMonth(prevMonth => {
      if (prevMonth === 12) {
        setCurrentYear(prevYear => prevYear + 1);
        return 1;
      } else {
        return prevMonth + 1;
      }
    });
  };

  useEffect(() => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth() + 1); // 월은 0부터 시작하므로 +1 필요
  }, []);

  useEffect(() => {
    async function fetchData() {
      const token = getAccessTokenFromCookies();
      try {
        setLoading(true);
        // 1) 사용자 정보 호출
        const userRes = await fetch('http://localhost:8080/auth/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        });
        if (!userRes.ok) throw new Error('User fetch failed');
        const userData: UserInfo = await userRes.json();
        setUser(userData);

        // 2) 월과 연도를 쿼리 파라미터로 전달하여 일기 목록 호출
        const diaryRes = await fetch(
          `http://localhost:8080/diary/list?year=${currentYear}&month=${currentMonth}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
          }
        );
        if (!diaryRes.ok) throw new Error('Diary list fetch failed');
        const diaryData: DiaryItem[] = await diaryRes.json();

        console.log('Received Diary Data:', diaryData);
        setDiaries(diaryData);
      } catch (error) {
        console.error('API 호출 오류:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [currentYear, currentMonth]);  // currentYear와 currentMonth가 변경될 때마다 fetchData 실행

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="webpage-layout">
      <Header /> {/* 공통 헤더 사용 */}

      <main className="webpage-container">
        <div className="header-container">
          <h2>
            <span className="username">{user?.username ?? '사용자'}</span> 님이 작성하신 일기 목록이에요!
          </h2>

          <div className="calendar-header">
            <button className="arrow" onClick={handlePrevMonth}>&lt;</button>
            <span className="month-label">
              {currentYear}년 {currentMonth}월
            </span>
            <button className="arrow" onClick={handleNextMonth}>&gt;</button>
          </div>
        </div>

        <section id="diary-list" className="diary-list">
          {loading ? (
            <div className="loading">로딩 중...</div>
          ) : diaries.length === 0 ? (
            <p className="empty">작성된 일기가 없습니다.</p>
          ) : (
            diaries.map(diary => {
              const date = new Date(diary.date);
              return (
                <div
                  key={diary.id}
                  className="diary-item"
                  onClick={() => navigate(`/diary/${diary.id}`)}
                >
                  <div className="date-tag">{date.getDate()}일</div>
                  <div className="diary-title">{diary.title}</div>
                  <div className="arrow">→</div>
                </div>
              );
            })
          )}
        </section>

        <button className="write-button" onClick={() => navigate('/editor/제목 없음')}>
          일기 작성하기 ✏️
        </button>
      </main>
    </div>
  );
};

export default ListPage;
