const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static(__dirname));
app.use(express.json());

// In-Memory Database
const db = {
    games: [],
    players: [],
    questions: [],
    reactions: [],
    responses: []
};

io.on('connection', (socket) => {
    socket.on('db_req', (query, callback) => {
        try {
            let result = null;
            let count = null;
            const tableData = db[query.table] = db[query.table] || [];

            if (query.action === 'insert') {
                const inserted = query.data.map(item => {
                    const defaults = {};
                    if (query.table === 'players') { defaults.score = 0; defaults.streak = 0; defaults.avatar = '👤'; defaults.team = 'Bireysel'; }
                    if (query.table === 'games') { defaults.status = 'waiting'; defaults.current_question_index = 0; }
                    return {
                        id: crypto.randomUUID(),
                        created_at: new Date().toISOString(),
                        ...defaults,
                        ...item
                    };
                });
                tableData.push(...inserted);
                result = query.single ? inserted[0] : inserted;
                inserted.forEach(item => {
                    io.emit(`realtime-${query.table}`, { event: 'INSERT', new: item });
                });
            }
            else if (query.action === 'update') {
                const targets = tableData.filter(item => applyFilters(item, query.filters));
                targets.forEach(item => {
                    Object.assign(item, query.data);
                    io.emit(`realtime-${query.table}`, { event: 'UPDATE', new: item });
                });
                result = query.single ? targets[0] : targets;
            }
            else if (query.action === 'select') {
                let targets = tableData.filter(item => applyFilters(item, query.filters));

                if (query.opts && query.opts.count === 'exact') {
                    count = targets.length;
                    if (query.opts.head) targets = [];
                }

                if (query.ordering && query.ordering.length > 0) {
                    query.ordering.forEach(order => {
                        targets.sort((a, b) => {
                            const asc = order.opts ? order.opts.ascending : true;
                            if (a[order.col] < b[order.col]) return asc ? -1 : 1;
                            if (a[order.col] > b[order.col]) return asc ? 1 : -1;
                            return 0;
                        });
                    });
                }

                result = query.single ? (targets[0] || null) : targets;
            }

            callback({ data: result, count, error: null });
        } catch (error) {
            console.error('DB Hatası:', error);
            callback({ data: null, error: { message: error.message } });
        }
    });
});

function applyFilters(item, filters) {
    if (!filters) return true;
    for (const f of filters) {
        if (f.type === 'eq' && String(item[f.col]) !== String(f.val)) return false;
        if (f.type === 'neq' && String(item[f.col]) === String(f.val)) return false;
    }
    return true;
}

// Railway/Render gibi platformlar PORT env variable kullanır
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n==============================================`);
    console.log(`🚀 FAHOT SUNUCUSU AKTİF!`);
    console.log(`==============================================`);
    console.log(`➡  Yerel: http://localhost:${PORT}/host.html`);
    console.log(`==============================================`);
});
