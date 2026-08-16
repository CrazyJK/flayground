# SQLite 온라인 백업 헬퍼: 서비스가 떠 있어도(WAL) 일관된 사본을 뜬다.
# 사용: python bin/sqlite_backup.py <원본.db> <사본.db>
# VACUUM INTO 라서 백업과 동시에 컴팩션도 된다(사본에는 WAL/공백 페이지 없음).
import sys
import sqlite3

def main() -> None:
    if len(sys.argv) != 3:
        print("usage: sqlite_backup.py <src.db> <dst.db>", file=sys.stderr)
        sys.exit(2)
    src, dst = sys.argv[1], sys.argv[2]
    con = sqlite3.connect(src)
    try:
        con.execute("VACUUM INTO ?", (dst,))
    finally:
        con.close()

if __name__ == "__main__":
    main()
