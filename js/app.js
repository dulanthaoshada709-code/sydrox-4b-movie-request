const API_BASE = '/api';
const API_REQUESTS = `${API_BASE}/requests`;
const WHATSAPP_GROUP_LINK = 'YOUR_GROUP_INVITE_LINK'; // 👈 ඔබේ Link එක දාන්න

async function fetchAPI(url, method = 'GET', body = null) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(url, options);
    return res.json();
}

// --- Dashboard ---
async function initDashboard() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) { window.location.href = 'index.html'; return; }
    
    document.getElementById('userNameDisplay').textContent = user.name;
    
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
    
    // Modal
    const modal = document.getElementById('requestModal');
    const form = document.getElementById('movieRequestForm');
    
    document.getElementById('newRequestBtn')?.addEventListener('click', () => modal.classList.remove('hidden'));
    document.querySelectorAll('.close-modal, .cancel-btn').forEach(b => {
        b.addEventListener('click', () => {
            modal.classList.add('hidden');
            form.reset();
        });
    });
    
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            id: 'req_' + Date.now(),
            userId: user.id,
            userName: user.name,
            userWhatsapp: user.whatsapp,
            movieName: document.getElementById('movieName').value.trim(),
            site: document.getElementById('movieSite').value.trim() || '-',
            quality: document.getElementById('quality').value,
            status: 'pending',
            requestedAt: new Date().toISOString()
        };
        await fetchAPI(API_REQUESTS, 'POST', data);
        alert('ඉල්ලීම සාර්ථකයි!');
        modal.classList.add('hidden');
        form.reset();
        await loadUserRequests(user.id);
    });
    
    await loadUserRequests(user.id);
}

async function loadUserRequests(userId) {
    const container = document.getElementById('requestsContainer');
    const all = await fetchAPI(API_REQUESTS) || [];
    const mine = all.filter(r => r.userId === userId);
    
    if (mine.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:gray;">තවමත් ඉල්ලීම් නොමැත.</p>`;
        return;
    }
    
    container.innerHTML = mine.reverse().map(req => {
        const statusColors = { pending: '#f39c12', completed: '#2ecc71', unfound: '#e74c3c' };
        const statusText = { pending: 'බලාපොරොත්තුවෙන්', completed: 'සම්පූර්ණයි', unfound: 'සොයාගත නොහැක' };
        
        let actionBtn = '';
        if (req.status === 'completed') {
            actionBtn = `<a href="${WHATSAPP_GROUP_LINK}" target="_blank" style="background:#25D366; color:white; padding:5px 10px; border-radius:5px; text-decoration:none; margin-top:10px; display:inline-block;">📱 සමූහයට යන්න</a>`;
        }
        
        return `
            <div class="request-card" style="border-left:5px solid ${statusColors[req.status]}; background:rgba(255,255,255,0.05); padding:15px; margin-bottom:15px; border-radius:8px;">
                <h3 style="margin:0 0 10px 0;">🎬 ${req.movieName}</h3>
                <p style="margin:5px 0;">🌐 Site: ${req.site}</p>
                <p style="margin:5px 0;">📺 Quality: ${req.quality}</p>
                <p style="margin:5px 0;">📅 Date: ${new Date(req.requestedAt).toLocaleDateString('si-LK')}</p>
                <p style="margin:10px 0; color:${statusColors[req.status]}; font-weight:bold;">Status: ${statusText[req.status]}</p>
                ${actionBtn}
            </div>
        `;
    }).join('');
}

// --- Admin ---
async function initAdmin() {
    const tbody = document.getElementById('tableBody');
    const all = await fetchAPI(API_REQUESTS) || [];
    
    if (all.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">කිසිදු ඉල්ලීමක් නොමැත</td></tr>`;
        return;
    }
    
    tbody.innerHTML = all.reverse().map(req => {
        const statusColors = { pending: '#f39c12', completed: '#2ecc71', unfound: '#e74c3c' };
        return `
            <tr style="border-bottom:1px solid #ddd;">
                <td>${req.userName}</td>
                <td>${req.userWhatsapp}</td>
                <td>${req.movieName}</td>
                <td>${req.site}</td>
                <td>${req.quality}</td>
                <td style="color:${statusColors[req.status]}; font-weight:bold;">${req.status}</td>
                <td>${new Date(req.requestedAt).toLocaleDateString('si-LK')}</td>
                <td>
                    <button onclick="updateStatus('${req.id}', 'completed')" style="background:#2ecc71; color:white; border:none; padding:5px 8px; border-radius:4px; cursor:pointer;">✅ Done</button>
                    <button onclick="updateStatus('${req.id}', 'unfound')" style="background:#e74c3c; color:white; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; margin-left:5px;">❌ Unfound</button>
                </td>
            </tr>
        `;
    }).join('');
}

// ✅ Fixed: Correct PATCH URL
window.updateStatus = async (id, status) => {
    if (!confirm(`"${status}" ලෙස වෙනස් කරන්නද?`)) return;
    await fetchAPI(`${API_REQUESTS}/${id}`, 'PATCH', { status });
    location.reload();
};

// Init
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('requestsContainer')) initDashboard();
    if (document.getElementById('tableBody')) initAdmin();
});
