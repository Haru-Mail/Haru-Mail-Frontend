import React, {useEffect, useRef, useState} from 'react';
import { useParams } from 'react-router-dom';
import Header from '../../header/Header.tsx';
import {destroyEditor, getEditorData, getFormattedToday, initializeEditor} from './DiaryEditor.ts';
import './DiaryEditorPage.css';
import {CategoryTags, initialCategoryTags} from "./TagData.ts";
import { handleTagClick, handleRemoveTag,} from './TagHandler.ts';

export const DiaryEditorPage: React.FC = () => {
    const editorContainerRef = useRef<HTMLDivElement | null>(null);
    const [showModal, setShowModal] = useState(false); // 모달 상태

    const [categoryTags, setCategoryTags] = useState<CategoryTags>(initialCategoryTags); // 카테고리 리스트
    const [selectedCategory, setSelectedCategory] = useState<string>(''); // 선택된 카테고리
    const [showAddCategoryButton, setShowAddCategoryButton] = useState<boolean>(false); // 카테고리 생성 버튼 상태
    const [selectedTags, setSelectedTags] = useState<{ id: number; emoji: string; label: string }[]>([]); // 선택된 태그 / 혹시 오류나면 id: number; 지우기
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]); // 태그 id만 저장

    const [isAddingTag, setIsAddingTag] = useState(false); // + 버튼 클릭 여부
    const [newTagName, setNewTagName] = useState(""); // 입력 중인 태그 이름

    const formattedDate = getFormattedToday(); // 오늘 날짜 포맷팅

    const { questionText } = useParams<{ questionText: string }>(); // URL에서 받아온 질문 제목을 useState로 초기화
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [title, setTitle] = useState(questionText || "📬 오늘 가장 인상 깊었던 순간은?");  // 초기값을 URL에서 받은 타이틀로 설정

    const accessToken = localStorage.getItem("accessToken"); // 저장된 토큰 가져오기

    useEffect(() => {
        if (questionText) {
            setTitle(decodeURIComponent(questionText) + '?'); // URL 파라미터로 전달된 타이틀을 상태에 반영
        }

        if (editorContainerRef.current) { // 에디터 초기화
            initializeEditor(editorContainerRef.current);
        }

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

                setNewTagName(''); // 태그 입력 초기화
                setIsAddingTag(false);
            })
            .catch(error => {
                console.error('기타 태그 불러오기 실패:', error);
            });

        return () => {
            destroyEditor();
        };
    }, [questionText]);

    // 일기 저장-> 콘솔 출력
    const handleSave = async () => {
        const content = await getEditorData();

        const diaryData = {
            title: title,
            content: content,
        };

        const tagList = selectedTagIds.map(id => ({ tagId: id }));

        const requestData = {
            diary: diaryData,
            tags: tagList
        };

        console.log("보내는 데이터:", JSON.stringify(requestData)); // 데이터 확인용

        try {
            const response = await fetch('http://localhost:8080/diary/save', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                },
                credentials: "include",
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                throw new Error("서버 응답 실패");
            }

            console.log("서버에 저장 완료:", await response.json());
            setShowModal(true); // 성공 시 모달 열기
        } catch (error) {
            console.error("저장 중 오류 발생:", error);
            alert("저장에 실패했습니다. 다시 시도해주세요.");
        }
    };

    // 모달 닫기
    const closeModal = () => {
        setShowModal(false);
    };

    // 카테고리 전환 처리
    const handleCategoryClick = (category: string) => {
        // '기타' 카테고리 클릭 시 추가 버튼을 보여주고, 그 외 카테고리 클릭 시 숨기기
        if (category === '기타') {
            setShowAddCategoryButton(true);  // '기타' 카테고리 선택 시 추가 버튼 보이기
        } else {
            setShowAddCategoryButton(false);  // '기타' 외 다른 카테고리 선택 시 추가 버튼 숨기기
        }

        // 선택된 카테고리 상태 변경
        if (selectedCategory === category) {
            setSelectedCategory('');  // 이미 선택된 카테고리라면 선택 해제
        } else {
            setSelectedCategory(category);  // 새 카테고리 선택
        }
    };

    // 커스텀 태그 입력 모드로 전환
    const handleAddTagClick = () => {
        setIsAddingTag(true);
    };

    // 태그 생성
    const handleNewTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && newTagName.trim() !== '') {
            const newTag = {
                name: newTagName.trim(),
                categoryId: 6,  // 기타 카테고리 ID
            };
            console.log("태그 생성:", newTag);

            // 태그 생성 후 DB에 추가
            fetch('http://localhost:8080/tag/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                credentials: "include",
                body: JSON.stringify(newTag), // newTag를 JSON 형식으로 변환하여 body에 추가
            })
                .then(response => response.json()) // 응답을 JSON으로 처리
                .then(data => {
                    console.log("태그가 성공적으로 추가되었습니다:", data);

                    const createdTag = {
                        id: data.id,  // 서버에서 반환된 ID
                        emoji: '🏷️',  // 임시
                        label: data.name
                    };

                    // '기타' 카테고리에 새 태그 추가
                    setCategoryTags(prev => ({
                        ...prev,
                        '기타': [
                            ...prev['기타'],  // 기존 '기타' 태그들
                            createdTag       // 새 태그 추가
                        ]
                    }));

                    setNewTagName(''); // 태그 입력 초기화
                    setIsAddingTag(false);
                })
                .catch(error => {
                    console.error("태그 생성 중 오류 발생:", error);
                });
        } else if (e.key === 'Escape') { // ESC 키 누르면 입력 취소
            setNewTagName('');
            setIsAddingTag(false);
        }
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
    };

    const handleTitleBlur = () => {
        setIsEditingTitle(false);
    };

    const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            setIsEditingTitle(false);
        }
    };

    return (
        <div className="diary-page">
            <Header />
            <main className="main-content">
                {isEditingTitle ? (
                    <input
                        className="title-input"
                        type="text"
                        value={title}
                        onChange={handleTitleChange}
                        onBlur={handleTitleBlur}
                        onKeyDown={handleTitleKeyDown}
                        autoFocus
                    />
                ) : (
                    <h1 className="title" onClick={() => setIsEditingTitle(true)}>
                        {title}
                    </h1>
                )}
                {/*<h1 className="title">📬 오늘 가장 인상 깊었던 순간은?</h1> /!* 오늘의 질문 *!/*/}
                <p className="date">{formattedDate}</p> {/* 자동 날짜 표시 */}
                <div
                    className="editor-container"
                    ref={editorContainerRef}
                ></div>

                <div className="tag-section">
                    <div className="selected-tags-list">
                        {selectedTags.map((tag) => (
                            <span key={tag.id} className="tag"
                                  onClick={() => handleRemoveTag(tag, selectedTags, selectedTagIds, setSelectedTags, setSelectedTagIds)}>
                                #{tag.label}
                            </span>
                        ))}
                    </div>
                    <div className="category-buttons">
                        {['기분', '생활 & 경험', '취미', '특별한 순간', '날씨', '기타'].map((category) => (
                            <button
                                key={category}
                                className={`category ${selectedCategory === category ? 'active' : ''}`}
                                onClick={() => handleCategoryClick(category)}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {selectedCategory && (
                        <div className="tag-section">
                            {categoryTags[selectedCategory].map((tag) => (
                                <span
                                    key={tag.id}
                                    className="category-tag"
                                    onClick={() => handleTagClick(tag, selectedTags, selectedTagIds, setSelectedTags, setSelectedTagIds)}
                                    data-id={tag.id} // HTML에 id 포함
                                >
                                    {tag.emoji} {tag.label}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* '기타' 카테고리가 선택되면 카테고리 생성 버튼 표시 */}
                    {showAddCategoryButton && (
                        <div className="tag-add">
                            {isAddingTag ? (
                                <input
                                    type="text"
                                    value={newTagName}
                                    onChange={(e) => setNewTagName(e.target.value)}
                                    onKeyDown={handleNewTagKeyDown}
                                    placeholder="태그 입력 후 Enter"
                                    className="new-tag-input"
                                    autoFocus
                                />
                            ) : (
                                <button className="add-category-button" onClick={handleAddTagClick}>
                                    +
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="button-wrapper">
                    <button className="submit-button" onClick={handleSave}>작성 완료</button>
                </div>
            </main>

            {/* 모달창 */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <p>저장이 완료되었습니다!</p>
                        <button className="modal-close-button" onClick={closeModal}>확인</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DiaryEditorPage;
