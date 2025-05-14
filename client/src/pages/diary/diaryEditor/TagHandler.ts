import { Tag } from './TagData.ts';

// 태그 클릭 시 선택 또는 선택 해제 처리
export function handleTagClick (tag: Tag,
                                selectedTags: Tag[],
                                selectedTagIds: number[],
                                setSelectedTags: (tags: Tag[]) => void,
                                setSelectedTagIds: (ids: number[]) => void) {
    // 이미 선택된 태그인지 확인
    const alreadySelected = selectedTags.some((t) => t.id === tag.id);

    if (alreadySelected) { // 이미 선택된 태그인 경우: 선택 해제
        const updatedTags = selectedTags.filter((t) => t.id !== tag.id);
        const updatedIds = selectedTagIds.filter((id) => id !== tag.id);

        setSelectedTags(updatedTags);
        setSelectedTagIds(updatedIds);

        console.log("선택된 태그:", updatedTags); // 디버깅용
    } else { // 선택되지 않은 태그인 경우: 선택 추가
        const updatedTags = [...selectedTags, tag];
        const updatedIds = [...selectedTagIds, tag.id];

        setSelectedTags(updatedTags);
        setSelectedTagIds(updatedIds);

        console.log("선택된 태그:", updatedTags); // 디버깅용
    }
}

// 태그 삭제
export function handleRemoveTag (tag: Tag,
                                   selectedTags: Tag[],
                                   selectedTagIds: number[],
                                   setSelectedTags: (tags: Tag[]) => void,
                                   setSelectedTagIds: (ids: number[]) => void) {
    // 선택된 태그 목록과 ID 목록에서 해당 태그 제거
    const updatedTags = selectedTags.filter((t) => t.id !== tag.id);
    const updatedIds = selectedTagIds.filter((id) => id !== tag.id);

    setSelectedTags(updatedTags);
    setSelectedTagIds(updatedIds);

    console.log("남은 태그:", updatedTags); // 디버깅용
}