"""연출 클립(showcase) 서브시스템.

원본 영상에서 구간을 잘라(trim) 기존 안정화(stabilizer person 모드)와
화질 개선(enhancer)을 서브 잡으로 순차 실행해, 피사체 중심·흔들림 보정·
슬로모션·업스케일이 적용된 최고 화질 클립을 만든다.
잡 모델은 stabilizer 와 동일(잡 디렉토리 + status.json + 서브프로세스 워커).
"""
