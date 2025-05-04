# Flay-Ground

영화 콘텐츠 관리 및 스트리밍 애플리케이션

## 소개

Flay-Ground는 영화 콘텐츠를 관리하기 위한 웹 기반 애플리케이션입니다. 비디오 파일을 구성하고, 분류하고, 태그를 지정하며, 스트리밍할 수 있습니다.

## 주요 기능

- 영화 콘텐츠 관리 및 분류
- 태그 및 스튜디오별 콘텐츠 구성
- 비디오 스트리밍
- 이미지 갤러리
- 메모 기능
- 다이어리 기능
- 배우 및 스튜디오 정보 관리

## 시스템 요구사항

- Java 17 이상
- 최신 웹 브라우저 (Chrome, Firefox, Edge 등)
- Maven 3.6 이상 (빌드용)
- Node.js 및 yarn (프론트엔드 개발용)

## 설치 방법

### 사전 준비

1. Java 17 설치
2. Maven 설치
3. Node.js 및 yarn 설치 (`npm install -g yarn`)

### 빌드 및 실행

```bash
# 백엔드 빌드
mvn clean package

# 프론트엔드 빌드
cd www
yarn install

# 스크립트 명령어 (package.json)
yarn start # 개발 서버 실행
yarn build # 프로덕션 빌드
yarn build:dev # 개발용 빌드
yarn build:analyze # 번들 분석 보고서와 함께 빌드
yarn watch # 파일 변경 감시 모드
yarn lint # ESLint를 통한 코드 검사 및 수정

# 애플리케이션 실행
# Windows
bin/FlayGroundStartup.bat

# Linux/Mac
bin/FlayGroundStartup.sh
```

## 환경 설정

`src/main/resources` 디렉토리의 다양한 프로퍼티 파일을 통해 환경별 설정이 가능합니다:

- `application-env-dev.properties`: 개발 환경 설정
- `application-env-prod.properties`: 운영 환경 설정
- `application-env-ssl.properties`: SSL 설정
- `application-ground-*.properties`: 플랫폼별 설정 (Mac, WSL 등)

## SSL 설정

SSL 설정은 `cert` 디렉토리의 문서를 참고하세요. 자체 서명된 인증서 생성 방법 및 CA 서명 인증서 설정 방법을 제공합니다.

## 프로젝트 구조

- `src/main/java`: Java 백엔드 코드
- `src/main/resources`: 애플리케이션 설정 및 정적 파일
- `www/src`: 프론트엔드 JavaScript 코드
- `bin`: 실행 스크립트
- `doc`: 문서 파일
- `logs`: 로그 파일

## 개발 가이드

### 백엔드

Spring Boot 기반의 RESTful API를 제공합니다. 주요 패키지는 다음과 같습니다:

- `jk.kamoru.ground.info`: 비디오, 태그, 스튜디오 등의 정보 관리
- `jk.kamoru.ground.stream`: 미디어 스트리밍 처리
- `jk.kamoru.ground.todayis`: 오늘의 정보 관리
- `jk.kamoru.ground.memo`: 메모 관리

### 프론트엔드

프론트엔드는 모듈식 구조로 구성되어 있습니다:

- `flay`: 핵심 기능 (도메인, 패널, 네비게이션)
- `attach`: 파일 첨부 기능
- `diary`: 다이어리 기능
- `image`: 이미지 관리
- `ui`: 재사용 가능한 UI 컴포넌트

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 버전 정보

현재 버전: 6.9.7.4-24

## 연락처

- 개발자: kamoru
- 이메일: [Crazy.4.JK@gmail.com](Crazy.4.JK@gmail.com)
- GitHub: [https://github.com/kamoru/flayground](https://github.com/kamoru/flayground)

## 기여 방법

1. 이 저장소를 포크합니다.
2. 새 기능 브랜치를 만듭니다 (`git checkout -b feature/amazing-feature`)
3. 변경 사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다.

## 향후 계획

향후 개발 계획은 [TODO.md](doc/TODO.md) 파일을 참조하세요.
