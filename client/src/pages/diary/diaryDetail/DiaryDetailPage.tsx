import React, {useEffect, useRef, useState} from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import './DiaryDetailPage.css';
import {destroyEditor, initializeViewer} from "./DiaryDetailView.ts";
import {DiaryInfoDto} from "./DiaryInfoDto.ts";

const DiaryDetailPage: React.FC = () => {
    const { diaryId } = useParams<{ diaryId: string }>(); // URL에서 diaryId 파라미터 추출
    const viewerContainerRef = useRef<HTMLDivElement | null>(null);
    const [diaryData, setDiaryData] = useState<DiaryInfoDto | null>(null);

    const accessToken = localStorage.getItem("accessToken"); // 저장된 토큰 가져오기
    const navigate = useNavigate();

    // 날짜 포맷팅 함수
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);  // ISO 형식의 문자열을 Date 객체로 변환
        const dayOfWeek = date.toLocaleString('ko-KR', { weekday: 'short' });
        const day = date.getDate();
        const month = date.getMonth() + 1; // 월 (0부터 시작하므로 +1)
        const year = date.getFullYear();

        return `${year}.${month}.${day} (${dayOfWeek})`;
    };

    useEffect(() => {
        const fetchAndInit = async () => {
            if (!viewerContainerRef.current) return;

            try {
                const res = await fetch(`http://localhost:8080/diary/${diaryId}`, { // 토큰 기반 인증
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                    credentials: 'include'
                });
                const data: DiaryInfoDto = await res.json();
                const savedJson = JSON.parse(data.content);

                console.log("받아온 일기 데이터:", savedJson); // 콘솔 출력

                initializeViewer(viewerContainerRef.current, savedJson);
                setDiaryData(data);
            } catch (error) {
                console.error('데이터 로딩 및 뷰어 초기화 실패:', error);
            }
        };

        fetchAndInit();

        return () => {
            destroyEditor();
        };
    }, [diaryId]);

    return (
        <div className="fullscreenContainer">
            <button className="backButton"
                    onClick={() => navigate(-1)}>
                {'←'}
            </button>
            <div className="container">
                <h1 className="title">{diaryData?.title || 'Loading...'}</h1>
                <p className="date">{diaryData?.date ? formatDate(diaryData.date) : 'Loading...'}</p>
                <div className="editorWrapper">
                    <div
                        className="viewer-container"
                        ref={viewerContainerRef}
                    ></div>
                </div>
                <div className="selected-tags">
                    {diaryData?.tags.map((tag, index) => (
                        <div key={index} className="tag">#{tag}</div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DiaryDetailPage;