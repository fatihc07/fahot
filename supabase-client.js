let socket = null;
let isReady = false;
let queue = [];

// Socket.io istemci kütüphanesini dinamik olarak yüklüyoruz
const script = document.createElement('script');
script.src = '/socket.io/socket.io.js';
script.onload = () => {
    socket = io();
    isReady = true;
    queue.forEach(fn => fn());
    queue = [];
};
document.head.appendChild(script);

// Socket.io hazır olmadan işlem yapılmasını önleyen bekletici
function emitWhenReady(event, payload, callback) {
    if (isReady) {
        socket.emit(event, payload, callback);
    } else {
        queue.push(() => socket.emit(event, payload, callback));
    }
}

// Supabase API'sini taklit eden sahte (mock) istemci!
const _supabase = {
    from: (table) => {
        let query = { table, action: 'select', filters: [], ordering: [] };
        const chain = {
            select: (cols, opts) => { query.cols = cols; query.opts = opts || {}; return chain; },
            insert: (data) => { query.action = 'insert'; query.data = Array.isArray(data) ? data : [data]; return chain; },
            update: (data) => { query.action = 'update'; query.data = data; return chain; },
            eq: (col, val) => { query.filters.push({ type: 'eq', col, val }); return chain; },
            neq: (col, val) => { query.filters.push({ type: 'neq', col, val }); return chain; },
            order: (col, opts) => { query.ordering.push({ col, opts }); return chain; },
            single: () => { query.single = true; return chain; },
            // Await kullanıldığında JS motoru "then" fonskiyonunu çalıştırır:
            then: function(resolve, reject) {
                emitWhenReady('db_req', query, (response) => {
                    resolve(response);
                });
            }
        };
        return chain;
    },
    channel: (name) => {
        const chan = {
            on: (provider, opts, callback) => {
                const setupListener = () => {
                    socket.on(`realtime-${opts.table}`, (payload) => {
                        // Fitreleme kontrolü örn: game_id=eq.123
                        if (opts.filter) {
                            const parts = String(opts.filter).split('=eq.');
                            if (parts.length === 2 && String(payload.new[parts[0]]) !== String(parts[1])) return;
                        }
                        if (payload.event === opts.event || opts.event === '*') {
                            callback(payload);
                        }
                    });
                };
                if (isReady) setupListener();
                else queue.push(setupListener);
                return chan;
            },
            subscribe: () => { return chan; } // Zinciri kırmamak için
        };
        return chan;
    }
};

window.supabaseClient = _supabase;
console.log('QuizPulse: Local Node/Socket Client Initialized');
