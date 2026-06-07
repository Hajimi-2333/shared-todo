const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// ── Middleware ────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Data helpers ─────────────────────────────────
function readTodos() {
    try {
        if (!fs.existsSync(DATA_FILE)) return [];
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

function writeTodos(todos) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2), 'utf-8');
}

// ── API Routes ───────────────────────────────────

// 获取所有待办
app.get('/api/todos', (_req, res) => {
    const todos = readTodos();
    res.json(todos);
});

// 添加待办
app.post('/api/todos', (req, res) => {
    const { text } = req.body;
    if (!text || !text.trim()) {
        return res.status(400).json({ error: '内容不能为空' });
    }
    const todos = readTodos();
    const todo = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        text: text.trim(),
        completed: false,
        createdAt: Date.now(),
    };
    todos.unshift(todo);
    writeTodos(todos);
    res.status(201).json(todo);
});

// 更新待办（切换完成状态 / 修改文字）
app.patch('/api/todos/:id', (req, res) => {
    const { id } = req.params;
    const todos = readTodos();
    const todo = todos.find(t => t.id === id);
    if (!todo) {
        return res.status(404).json({ error: '待办不存在' });
    }
    if (typeof req.body.completed === 'boolean') {
        todo.completed = req.body.completed;
    }
    if (typeof req.body.text === 'string' && req.body.text.trim()) {
        todo.text = req.body.text.trim();
    }
    writeTodos(todos);
    res.json(todo);
});

// 清空已完成（必须在 /api/todos/:id 之前，否则 "completed" 会被当作 :id）
app.delete('/api/todos/completed', (_req, res) => {
    const todos = readTodos();
    const remaining = todos.filter(t => !t.completed);
    const cleared = todos.length - remaining.length;
    writeTodos(remaining);
    res.json({ cleared });
});

// 删除单条待办
app.delete('/api/todos/:id', (req, res) => {
    const { id } = req.params;
    const todos = readTodos();
    const index = todos.findIndex(t => t.id === id);
    if (index === -1) {
        return res.status(404).json({ error: '待办不存在' });
    }
    const [removed] = todos.splice(index, 1);
    writeTodos(todos);
    res.json(removed);
});

// 回退到首页（SPA 兜底）
app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start ────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ 共享待办服务已启动，端口: ${PORT}`);
});
