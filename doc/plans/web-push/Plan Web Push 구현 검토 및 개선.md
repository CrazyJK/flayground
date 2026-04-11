# Plan: Web Push 구현 검토 및 개선

현재 Web Push 구현은 85% 완성도로 핵심 기능이 모두 작동하며, requireInteraction: true 설정으로 알림 지속성 문제도 해결되었습니다. SSE와 Push 통합도 완료되어 프로덕션 배포 가능한 수준입니다. 다만 에러 처리 강화, 서비스 워커 빌드 자동화, UX 개선이 추가로 필요합니다.

Steps
프론트엔드 에러 처리 강화 - PushNotification.ts의 sendSubscriptionToServer에 지수 백오프 재시도 로직 추가, 네트워크 실패 시 사용자 알림 표시

서비스 워커 TypeScript 전환 - service-worker.js를 www/src/service-worker.ts로 변환, webpack.common.cjs 엔트리 포인트에 추가하여 빌드 자동화

구독 만료 재등록 로직 - SideNavBar.ts 또는 PushNotification.ts에 24시간 주기 구독 상태 확인 및 자동 재구독 로직 추가

VAPID 공개키 API 제공 - PushSubscriptionController.java에 /api/push/vapid-public-key 엔드포인트 추가, PushNotification.ts에서 하드코딩 대신 API 호출로 변경

실제 환경 테스트 - Notice/CURL 타입 Push 전송, 410 Gone 자동 삭제, 브로드캐스트 성능, 알림 지속성(Windows Action Center 기록) 검증

Further Considerations
알림 타입별 구독 설정 - PushSubscription.java에 enableNotice, enableCurl, enableBatch 필드 추가하여 사용자가 알림 종류별 수신 설정 가능하도록 확장할까요?

사용자 인증 연동 - 현재 IP 기반 세션 인증 대신 실제 로그인 시스템과 연동이 필요한가요? (IP 변경 시 새 사용자로 인식되는 문제 해결)

로깅 유틸리티 클래스 - 프론트엔드에 Logger 클래스를 만들어 프로덕션 환경에서 console.log 자동 제거 및 에러를 서버로 전송하는 구조가 필요한가요?
