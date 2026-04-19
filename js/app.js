const API = '/api/requests';

async function fetchAPI(url, method = 'GET', body = null) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(url, options);
    return res.json();
}

// --- User Dashboard ---
async function initDashboard() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) { window.location.href = 'index.html'; return; }
    document.getElementById('userNameDisplay').textContent = user.name;

    loadUserRequests(user.id);
}

async function loadUserRequests(userId) {
    const all = await fetchAPI(API);
    const mine = all.filter(r => r.userId === userId);
    const container = document.getElementById('requestsContainer');
    
    container.innerHTML = mine.map(req => {
        // Status එක අනුව සිංහල තේරුම සහ පැහැය තීරණය කිරීම
        let statusText = "බලාපොරොත්තුවෙන්";
        let statusColor = "orange";

        if (req.status === 'completed') {
            statusText = "සම්පූර්ණයි (WhatsApp බලන්න)";
            statusColor = "#2ecc71"; // කොළ පැහැය
        } else if (req.status === 'unfound') {
            statusText = "සොයාගත නොහැක (Unfounded)";
            statusColor = "#e74c3c"; // රතු පැහැය
        }

        return `
        <div class="request-card" style="background:rgba(255,255,255,0.05); padding:15px; border-radius:12px; margin-bottom:10px; border-left: 5px solid ${statusColor};">
            <h4 style="margin:0; color:#fff;">${req.movieName}</h4>
            <p style="font-size:12px; margin:5px 0; color:#bbb;">Quality: ${req.quality}</p>
            <span style="font-size:11px; font-weight:bold; color:${statusColor};">${statusText}</span>
        </div>`;
    }).join('');
}

// --- Admin Panel ---
async function initAdmin() {
    const all = await fetchAPI(API);
    const tbody = document.getElementById('tableBody');
    
    tbody.innerHTML = all.map(req => `
        <tr>
            <td>${req.userName}</td>
            <td>${req.movieName}</td>
            <td><b>${req.status}</b></td>
            <td>
                <button onclick="updateStatus('${req.id}', 'completed')" style="background:#2ecc71; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; margin-right:5px;">Done</button>
                <button onclick="updateStatus('${req.id}', 'unfound')" style="background:#e74c3c; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Not Found</button>
            </td>
        </tr>
    `).join('');
}

// Admin විසින් තත්වය වෙනස් කරන විට ක්‍රියාත්මක වේ
window.updateStatus = async (id, newStatus) => {
    let confirmMsg = newStatus === 'completed' ? "මෙය WhatsApp සමූහයට දැමූ බව තහවුරු කරන්නද?" : "මෙම චිත්‍රපටය සොයාගත නොහැකි බව සලකුණු කරන්නද?";
    
    if (confirm(confirmMsg)) {
        await fetchAPI(`${API}?id=${id}`, 'PATCH', { status: newStatus });
        alert('තත්වය යාවත්කාලීන කරන ලදී!');
        location.reload();
    }
};

if (document.getElementById('requestsContainer')) initDashboard();
if (document.getElementById('tableBody')) initAdmin();
