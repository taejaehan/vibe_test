const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// SQLite 데이터베이스 초기화
const db = new sqlite3.Database('./profile.db', (err) => {
    if (err) {
        console.error('DB 연결 실패:', err.message);
    } else {
        console.log('SQLite DB 연결 성공');
    }
});

// 테이블 생성 후 기본 데이터 삽입
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS profile (
            id INTEGER PRIMARY KEY,
            name TEXT,
            intro TEXT,
            hobby TEXT,
            email TEXT,
            phone TEXT,
            link_text TEXT,
            link_url TEXT,
            color1 TEXT,
            color2 TEXT
        )
    `);

    // 5명의 유저 기본 데이터
    const users = [
        { id: 1, name: '김민수', intro: '안녕하세요! 저는 코딩을 좋아하는 개발자입니다.', hobby: '취미는 음악 듣기와 산책입니다.', email: 'minsu@example.com', phone: '010-1111-1111', color1: '#667eea', color2: '#764ba2' },
        { id: 2, name: '이지은', intro: '반갑습니다! UX 디자이너 이지은입니다.', hobby: '취미는 그림 그리기와 요가입니다.', email: 'jieun@example.com', phone: '010-2222-2222', color1: '#f093fb', color2: '#f5576c' },
        { id: 3, name: '박준혁', intro: '안녕하세요! 데이터 분석가 박준혁입니다.', hobby: '취미는 독서와 러닝입니다.', email: 'junhyuk@example.com', phone: '010-3333-3333', color1: '#4facfe', color2: '#00f2fe' },
        { id: 4, name: '최서연', intro: '안녕하세요! 프론트엔드 개발자 최서연입니다.', hobby: '취미는 카페 투어와 사진 촬영입니다.', email: 'seoyeon@example.com', phone: '010-4444-4444', color1: '#43e97b', color2: '#38f9d7' },
        { id: 5, name: '정우성', intro: '안녕하세요! 백엔드 개발자 정우성입니다.', hobby: '취미는 게임과 영화 감상입니다.', email: 'woosung@example.com', phone: '010-5555-5555', color1: '#fa709a', color2: '#fee140' }
    ];

    users.forEach(user => {
        db.run(`
            INSERT OR IGNORE INTO profile (id, name, intro, hobby, email, phone, link_text, link_url, color1, color2)
            VALUES (?, ?, ?, ?, ?, ?, '포트폴리오', 'https://www.google.com', ?, ?)
        `, [user.id, user.name, user.intro, user.hobby, user.email, user.phone, user.color1, user.color2]);
    });
});

// GET: 모든 유저 목록 조회
app.get('/api/users', (req, res) => {
    db.all('SELECT id, name, color1, color2 FROM profile', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows || []);
    });
});

// GET: 특정 유저 프로필 조회
app.get('/api/profile/:id', (req, res) => {
    const userId = req.params.id;
    db.get('SELECT * FROM profile WHERE id = ?', [userId], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(row || {});
    });
});

// POST: 특정 유저 프로필 저장
app.post('/api/profile/:id', (req, res) => {
    const userId = req.params.id;
    const { name, intro, hobby, email, phone, link_text, link_url, color1, color2 } = req.body;

    db.run(`
        UPDATE profile SET
            name = COALESCE(?, name),
            intro = COALESCE(?, intro),
            hobby = COALESCE(?, hobby),
            email = COALESCE(?, email),
            phone = COALESCE(?, phone),
            link_text = COALESCE(?, link_text),
            link_url = COALESCE(?, link_url),
            color1 = COALESCE(?, color1),
            color2 = COALESCE(?, color2)
        WHERE id = ?
    `, [name, intro, hobby, email, phone, link_text, link_url, color1, color2, userId], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, changes: this.changes });
    });
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`서버 실행 중: http://localhost:${PORT}`);
});

// 종료 시 DB 연결 해제
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('DB 연결 종료');
        process.exit(0);
    });
});
