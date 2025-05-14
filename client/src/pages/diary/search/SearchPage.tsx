import React, {useEffect} from 'react';
import { useState } from "react";
import Header from '../../header/Header.tsx';
import './SearchPage.css';
import { CategoryTags, initialCategoryTags } from "../diaryEditor/TagData.ts";
import {handleRemoveTag, handleTagClick} from "../diaryEditor/TagHandler.ts";
import { useNavigate } from 'react-router-dom';

const SearchPage: React.FC = () => {
    const navigate = useNavigate();
    const categories = ["기분", "생활 & 경험", "취미", "특별한 순간", "날씨", "기타"];
    const [selectedCategory, setSelectedCategory] = useState<string>(''); // 선택된 카테고리
    const [selectedTags, setSelectedTags] = useState<{ id: number; emoji: string; label: string }[]>([]); // 선택된 태그 / 혹시 오류나면 id: number; 지우기
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]); // 태그 id만 저장
    const accessToken = localStorage.getItem("accessToken"); // 저장된 토큰 가져오기
    const [categoryTags, setCategoryTags] = useState<CategoryTags>(initialCategoryTags); // 카테고리 리스트
    const [searchResults, setSearchResults] = useState<{ diaryId: number; title: string; date: string }[]>([]); // 검색 결과

    useEffect(() => {
        // 기타 태그 불러오기
        fetch('http://localhost:8080/category/6' , {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            credentials: "include"
        })
            .then(async response => {
                if (response.status === 204) {
                    return []; // 내용 없을 때 빈 배열
                } else if (!response.ok) {
                    throw new Error('서버 오류');
                }
                return await response.json();
            })
            .then(data => {
                console.log('서버에서 가져온 태그 데이터:', data);

                const newTag = data.map((tag: any) => ({
                    id: tag.tagId,
                    emoji: '🏷️', // 임시
                    label: tag.name
                }));

                setCategoryTags(prev => ({
                    ...prev,
                    '기타': newTag
                }));
            })
            .catch(error => {
                console.error('기타 태그 불러오기 실패:', error);
            });
    }, []);

    const handleSearch = () => {
        if (selectedTagIds.length === 0) {
            alert("태그를 하나 이상 선택해주세요.");
            return;
        }

        const queryParams = selectedTagIds.map(id => `tags=${id}`).join('&');

        fetch(`http://localhost:8080/tag/search?${queryParams}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            credentials: "include"
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("검색 실패");
                }
                return response.json();
            })
            .then(data => {
                console.log("검색 결과:", data);
                setSearchResults(data); // 검색 결과 상태에 저장
            })
            .catch(error => {
                console.error("검색 오류:", error);
            });
    };

    return (
        <div>
            <Header />
            <main className="main-content">
                <div className="search-bar">
                    <div className="selected-tags-container">
                        {selectedTags.length === 0 ? (
                            <span className="placeholder-text">태그를 선택해주세요^^</span>
                        ) : (
                            selectedTags.map((tag) => (
                                <span key={tag.id} className="selected-tag">
                                    {tag.emoji} {tag.label}
                                    <button
                                        className="remove-tag-button"
                                        onClick={() => handleRemoveTag(tag, selectedTags, selectedTagIds, setSelectedTags, setSelectedTagIds)}
                                    >
                                        ❌
                                    </button>
                                </span>
                            ))
                        )}
                    </div>
                    <button className="search-button" onClick={handleSearch}>🔍</button>
                </div>

                <div className="categories">
                    {categories.map((category) => (
                        <button
                            key={category}
                            className={`category ${selectedCategory === category ? "active" : ""}`}
                            onClick={() => setSelectedCategory(category)}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* 선택된 카테고리에 해당하는 태그 표시 */}
                {selectedCategory && (
                    <div className="tag-wrapper">
                        {categoryTags[selectedCategory]?.map((tag) => (
                            <span
                                key={tag.id}
                                className="tag-button"
                                onClick={() => handleTagClick(tag, selectedTags, selectedTagIds, setSelectedTags, setSelectedTagIds)}
                                data-id={tag.id}
                            >
                                {tag.emoji} {tag.label}
                            </span>
                        ))}
                    </div>
                )}

                {searchResults.length > 0 ? (
                    <div>
                        {Object.entries(
                            searchResults.reduce((acc: Record<string, typeof searchResults>, result) => {
                                const date = new Date(result.date);
                                const yearMonth = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}`;

                                if (!acc[yearMonth]) {
                                    acc[yearMonth] = [];
                                }
                                acc[yearMonth].push(result);
                                return acc;
                            }, {})
                        ).map(([yearMonth, diaries]) => (
                            <div key={yearMonth} className="diary-group">
                                <h2 className="diary-group-title">📅 {yearMonth}</h2>
                                <hr />
                                {diaries.map((result) => (
                                    <div
                                        key={result.diaryId}
                                        className="question-card"
                                        onClick={() => navigate(`/diary/${result.diaryId}`)}
                                    >
                                        <div className="date-box">{new Date(result.date).getDate()}일</div>
                                        <div className="question-text">{result.title}</div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-results-message">검색 결과가 없습니다.</div>
                )}

            </main>
        </div>
    );
};

export default SearchPage;