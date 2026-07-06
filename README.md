# 웹툰 자동번역 모듈

웹툰 이미지를 업로드하면 YOLO 객체 감지 모델로 말풍선·텍스트 영역을 자동으로 찾고, OCR로 원문을 추출한 뒤 Gemini 번역 API를 통해 번역합니다. 번역 결과는 편집 화면에서 바로 검수·수정할 수 있도록 구성했습니다
프론트엔드는 React와 TypeScript로 구현하고, 백엔드는 Express와 MySQL로 사용자 세션, 업로드 배치, 편집 오버레이 데이터를 관리했습니다. 이미지 업로드와 리사이징은 multer·sharp, PSD 변환은 ag-psd, OCR은 Tesseract.js, 말풍선 자동 감지는 YOLO26 추론모델을 사용했습니다.

---

## 시퀀스 다이어그램

```mermaid
sequenceDiagram
    autonumber
    actor User as 사용자
    participant FE as Front-end<br/>(React)
    participant API as Back-end<br/>(Express)
    participant DB as Database<br/>(MySQL)
    participant Robo as Detection<br/>(YOLO26 추론모델)
    participant OCR as OCR<br/>(Tesseract.js)
    participant Translate as Translation<br/>(Google Translation API)
    participant Editor as Webtoon Editor<br/>(React)

    rect rgb(245, 248, 255)
        Note over User,DB: 1. 웹툰 이미지 또는 PSD 업로드
        User->>FE: 이미지/PSD 파일과 작업 제목 입력
        FE->>API: POST /api/uploads
        API->>API: PSD 변환 및 이미지 리사이징
        API->>DB: upload_batches, user_uploads 저장
        API-->>FE: batchId, 이미지 URL 목록 반환
    end

    rect rgb(250, 250, 240)
        Note over FE,Robo: 2. 말풍선/텍스트 영역 자동 감지
        User->>Editor: 자동 감지 실행
        Editor->>Robo: 현재 웹툰 컷 이미지 전달
        Robo-->>Editor: bbox 좌표 목록 반환
        Editor->>Editor: bbox를 Crop overlay로 변환
    end

    rect rgb(245, 255, 248)
        Note over Editor,Translate: 3. OCR 및 번역 처리
        Editor->>API: POST /api/ocr crop 이미지 base64 전송
        API->>OCR: Tesseract OCR 실행
        OCR-->>API: 원문 텍스트와 confidence 반환
        API-->>Editor: OCR 결과 반환
        Editor->>API: POST /api/translate 원문 텍스트 전송
        API->>Translate: 목표 언어로 번역 요청
        Translate-->>API: 번역문 반환
        API-->>Editor: 번역 결과 반환
    end

    rect rgb(255, 248, 245)
        Note over Editor,DB: 4. 번역 오버레이 검수 및 저장
        User->>Editor: 위치, 크기, 텍스트, 색상, 투명도 수정
        Editor->>Editor: Undo/Redo 이력 관리
        Editor->>API: POST /api/editor/crops
        API->>DB: editor_crop_overlays 저장
        API-->>Editor: 저장 결과 반환
    end
```

---

## 시연 자료

<img width="1152" height="648" alt="download (1)" src="https://github.com/user-attachments/assets/5445723f-d6b2-4e44-8b06-44ce24921a6b" />

<img width="1152" height="648" alt="download" src="https://github.com/user-attachments/assets/72a9ce05-b961-45f3-8b37-e1aeac4548f0" />


## 시연 사이트
http://221.154.120.167:3002/


---

## ERD

```mermaid
erDiagram
    users ||--o{ upload_batches : "1:N"
    users ||--o{ user_uploads : "1:N"
    upload_batches ||--o{ user_uploads : "1:N"
    upload_batches ||--o{ editor_crop_overlays : "1:N"

    users {
        bigint id PK "사용자 ID"
        varchar email "이메일"
        char password_hash "비밀번호 해시"
        varchar display_name "표시 이름"
        enum provider "local, google, kakao, naver"
        varchar provider_id "소셜 로그인 ID"
        enum role "user, admin"
        enum status "active, pending, blocked"
        datetime last_login_at "마지막 로그인"
        datetime created_at "생성 일시"
        datetime updated_at "수정 일시"
    }

    upload_batches {
        bigint id PK "업로드 배치 ID"
        bigint user_id FK "사용자 ID"
        char batch_uuid "배치 UUID"
        varchar title "작업 제목"
        enum status "작업 상태"
        int file_count "파일 수"
        bigint total_size "전체 용량"
        datetime created_at "생성 일시"
        datetime updated_at "수정 일시"
    }

    user_uploads {
        bigint id PK "업로드 ID"
        bigint user_id FK "사용자 ID"
        bigint batch_id FK "배치 ID"
        varchar title "이미지 제목"
        varchar original_name "원본 파일명"
        varchar stored_filename "저장 파일명"
        varchar storage_path "서버 저장 경로"
        varchar public_url "브라우저 접근 URL"
        varchar mime_type "MIME 타입"
        bigint file_size "파일 크기"
        tinyint converted_from_psd "PSD 변환 여부"
        char upload_uuid "업로드 UUID"
        datetime created_at "생성 일시"
    }

    editor_crop_overlays {
        bigint id PK "오버레이 ID"
        bigint batch_id FK "배치 ID"
        varchar overlay_uuid "오버레이 UUID"
        varchar item_id "업로드 이미지 ID"
        decimal x "X 좌표"
        decimal y "Y 좌표"
        decimal width "너비"
        decimal height "높이"
        text text "번역문"
        text origin_text "원문"
        varchar background_color "배경색"
        varchar text_color "글자색"
        tinyint opacity "투명도"
        datetime created_at "생성 일시"
        datetime updated_at "수정 일시"
    }

    sessions {
        varchar session_id PK "세션 ID"
        int expires "만료 시각"
        mediumtext data "세션 데이터"
    }
```

---

## 기술 스택

**프론트엔드**

![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=111111)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=ffffff)
![Webpack](https://img.shields.io/badge/Webpack-8DD6F9?style=for-the-badge&logo=webpack&logoColor=111111)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=reactrouter&logoColor=ffffff)
![Bootstrap](https://img.shields.io/badge/Bootstrap-7952B3?style=for-the-badge&logo=bootstrap&logoColor=ffffff)
![React Moveable](https://img.shields.io/badge/React_Moveable-2563EB?style=for-the-badge)
![React Image Crop](https://img.shields.io/badge/React_Image_Crop-16A34A?style=for-the-badge)

**백엔드**

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=ffffff)
![Express](https://img.shields.io/badge/Express-111111?style=for-the-badge&logo=express&logoColor=ffffff)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=ffffff)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=ffffff)

**이미지/OCR/번역**

![Tesseract.js](https://img.shields.io/badge/Tesseract.js-111827?style=for-the-badge)
![YOLO26](https://img.shields.io/badge/YOLO26_추론모델-6706CE?style=for-the-badge)
![Google Translate](https://img.shields.io/badge/Google_Translate-4285F4?style=for-the-badge&logo=googletranslate&logoColor=ffffff)
![Sharp](https://img.shields.io/badge/Sharp-99CC00?style=for-the-badge)
![ag-psd](https://img.shields.io/badge/ag--psd-4B5563?style=for-the-badge)

**데이터 저장**

![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=ffffff)
![File System](https://img.shields.io/badge/File_System-4B5563?style=for-the-badge)
![Express Session](https://img.shields.io/badge/Express_Session-111111?style=for-the-badge)

**기타**

![dotenv](https://img.shields.io/badge/dotenv-ECD53F?style=for-the-badge&logo=dotenv&logoColor=111111)
![Multer](https://img.shields.io/badge/Multer-4B5563?style=for-the-badge)
![UUID](https://img.shields.io/badge/UUID-4B5563?style=for-the-badge)
![PM2](https://img.shields.io/badge/PM2-2B037A?style=for-the-badge&logo=pm2&logoColor=ffffff)

---


## 외부 API/라이브러리 연동 및 주요 인프라 기능

- **YOLO26 추론모델 말풍선 감지**: 웹툰 이미지를 1200px 단위로 나눠 모델에 전달하고, 반환된 bbox 좌표를 편집 오버레이 좌표로 변환
- **Tesseract.js OCR**: Crop 영역의 base64 이미지를 서버로 전달해 원문 텍스트와 confidence 추출
- **Google Translation API**: OCR 원문을 목표 언어로 번역하고, API 호출 간격을 큐로 제어
- **PSD 변환 및 이미지 리사이징**: `ag-psd`로 PSD 이미지 데이터를 읽고 `sharp`로 PNG 변환 및 1000px 기준 리사이징
- **MySQL 작업 저장소**: 사용자, 업로드 배치, 업로드 파일, 편집 오버레이, 세션 데이터 저장
- **Express Static Data Serving**: `/data/uploads/{filename}` 경로로 업로드 이미지를 브라우저에 제공
- **Undo/Redo 편집 이력**: Crop overlay 좌표, 텍스트, 색상, 투명도 변경을 프론트엔드 상태에서 관리
