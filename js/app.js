const API = '/api/requests';

// පොදු Function එකක් API Call කිරීමට
async function fetchAPI(url, method = 'GET', body = null) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(url, options);
    return res.json();
}

// --- Dashboard ආරම්භය ---
async function initDashboard() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) { window.location.href = 'index.html'; return; }

    document.getElementById('userNameDisplay').textContent = user.name;

    const modal = document.getElementById('requestModal');
    const newRequestBtn = document.getElementById('newRequestBtn');
    
    // Plus Button එක එබූ විට Modal එක පෙන්වීම
    newRequestBtn?.addEventListener('click', () => modal.classList.remove('hidden'));

    // Form එක Submit කිරීම
    document.getElementById('movieRequestForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            id: 'req_' + Date.now(),
            userId: user.id,
            userName: user.name,
            userWhatsapp: user.whatsapp,
            movieName: document.getElementById('movieName').value,
            site: document.getElementById('movieSite').value || '-',
            quality: document.getElementById('quality').value,
            status: 'pending',
            requestedAt: new Date().toISOString()
        };

        await fetchAPI(API, 'POST', data);
        alert('ඉල්ලීම යොමු කළා!');
        modal.classList.add('hidden');
        location.reload(); // දත්ත අලුත් කිරීමට
    });

    loadUserRequests(user.id);
}

// User ගේ දත්ත පෙන්වීම
async function loadUserRequests(userId) {
    const all = await fetchAPI(API);
    const mine = all.filter(r => r.userId === userId);
    const container = document.getElementById('requestsContainer');
    
    container.innerHTML = mine.map(req => `
        <div class="request-card" style="background:rgba(255,255,255,0.1); padding:15px; border-radius:10px; margin-bottom:10px;">
            <h4 style="color:#fff;">${req.movieName}</h4>
            <p style="font-size:12px;">Quality: ${req.quality} | Status: <span style="color:orange;">${req.status}</span></p>
        </div>
    `).join('');
}

// --- Admin Panel ආරම්භය ---
async function initAdmin() {
    const all = await fetchAPI(API);
    const tbody = document.getElementById('tableBody');
    
    tbody.innerHTML = all.map(req => `
        <tr>
            <td>${req.userName}</td>
            <td>${req.movieName}</td>
            <td>${req.quality}</td>
            <td><b>${req.status}</b></td>
            <td><button onclick="updateStatus('${req.id}')" style="background:green; color:#white; padding:5px; border:none; border-radius:4px; cursor:pointer;">Done</button></td>
        </tr>
    `).join('');
}

window.updateStatus = async (id) => {
    await fetchAPI(`${API}?id=${id}`, 'PATCH', { status: 'completed' });
    location.reload();
};

// පිටුව හඳුනාගෙන අදාළ Function එක Run කිරීම
if (document.getElementById('requestsContainer')) initDashboard();
if (document.getElementById('tableBody')) initAdmin();
