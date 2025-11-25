# Webtoon 편집 연습 프로젝트

웹툰 편집 워크플로우를 연습하기 위한 모노레포입니다. React 기반 프런트엔드와 Node.js 백엔드, 그리고 공용 타입을 한곳에 모았습니다.

## 폴더 구조
- `front-end` : 웹 편집기 UI (React, TypeScript)
- `back-end` : API 서버 및 OCR/번역 연동
- `shared` : 프런트엔드/백엔드에서 함께 쓰는 타입 및 유틸

## 빠른 시작
1) 필요한 의존성 설치: 각각 `front-end`, `back-end` 폴더에서 `npm install`  
2) 개발 서버 실행: `front-end`에서 `npm run dev`, `back-end`에서 API 서버 실행  
3) 브라우저에서 편집기 UI 접속 후 이미지 업로드 → 크롭/번역 흐름 테스트

## 주요 기능
- 이미지 위에 크롭 오버레이를 생성·이동·리사이즈
- OCR/번역 파이프라인 연습
- 편집 기록(Undo/Redo) 및 오버레이 저장

