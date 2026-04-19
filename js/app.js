const API = '/api/requests';

// API සමඟ සම්බන්ධ වන පොදු Function එක
async function fetchAPI(url, method = 'GET', body = null) {
    const options = { 
        method, 
        headers: { 'Content-Type': 'application/json' } 
    };
    if (body) options.body = JSON.stringify(body);
    
    try {
        const res = await fetch(url, options);
        return await res.json();
    } catch (e) {
        console.error("API Error:", e);
        return null;
    }
}

// --- USER DASHBOARD පාලනය ---
async function initDashboard() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // User ගේ නම පෙන්වීම
    const nameDisplay = document.getElementById('userNameDisplay');
    if (nameDisplay) nameDisplay.textContent = user.name;

    // Logout කිරීම
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });

    // Modal පාලනය (New Request Button)
    const modal = document.getElementById('requestModal');
    const newRequestBtn = document.getElementById('newRequestBtn');
    const closeModalBtns = document.querySelectorAll('.close-modal, .cancel-btn');

    if (newRequestBtn) {
        newRequestBtn.onclick = () => modal.classList.remove('hidden');
    }

    closeModalBtns.forEach(btn => {
        btn.onclick = () => modal.classList.add('hidden');
    });

    // Form එක Submit කිරීම
    const form = document.getElementById('movieRequestForm');
    if (form) {
        form.onsubmit = async (e) => {
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

            const res = await fetchAPI(API, 'POST', data);
            if (res) {
                alert('ඉල්ලීම සාර්ථකව යොමු කළා!');
                modal.classList.add('hidden');
                form.reset();
                loadUserRequests(user.id);
            }
        };
    }

    loadUserRequests(user.id);
}

// දත්ත පෙන්වීම (Status එක අනුව වෙනස් වේ)
async function loadUserRequests(userId) {
    const container = document.getElementById('requestsContainer');
    if (!container) return;

    const all = await fetchAPI(API) || [];
    const mine = all.filter(r => r.userId === userId);
    
    if (mine.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#888;">තවමත් ඉල්ලීම් නොමැත.</p>';
        return;
    }

    container.innerHTML = mine.map(req => {
        let statusText = "බලාපොරොත්තුවෙන්";
        let statusColor = "#f39c12"; // Orange

        if (req.status === 'completed') {
            statusText = "සම්පූර්ණයි (WhatsApp බලන්න)";
            statusColor = "#2ecc71"; // Green
        } else if (req.status === 'unfound') {
            statusText = "සොයාගත නොහැක (Unfounded)";
            statusColor = "#e74c3c"; // Red
        }

        return `
            <div class="request-card" style="border-left: 5px solid ${statusColor}; background: rgba(255,255,255,0.05); padding: 15px; margin-bottom: 15px; border-radius: 10px;">
                <h4 style="margin:0; font-size: 18px;">${req.movieName}</h4>
                <p style="margin: 5px 0; font-size: 13px; color: #ccc;">Quality: ${req.quality} | Site: ${req.site}</p>
                <span style="color:${statusColor}; font-weight:bold; font-size:13px;">● ${statusText}</span>
            </div>
        `;
    }).join('');
}

// --- ADMIN PANEL පාලනය ---
async function initAdmin() {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;

    const all = await fetchAPI(API) || [];
    
    tbody.innerHTML = all.map(req => `
        <tr>
            <td>${req.userName}</td>
            <td>${req.movieName}</td>
            <td><span class="status-badge">${req.status}</span></td>
            <td>
                <button onclick="updateRequestStatus('${req.id}', 'completed')" style="background:#2ecc71; color:white; border:none; padding:6px; border-radius:4px; cursor:pointer;">Done</button>
                <button onclick="updateRequestStatus('${req.id}', 'unfound')" style="background:#e74c3c; color:white; border:none; padding:6px; border-radius:4px; cursor:pointer; margin-left:5px;">Not Found</button>
            </td>
        </tr>
    `).join('');
}

window.updateRequestStatus = async (id, status) => {
    const msg = status === 'completed' ? "සම්පූර්ණ කළ බවට සලකුණු කරන්නද?" : "සොයාගත නොහැකි බවට සලකුණු කරන්නද?";
    if (confirm(msg)) {
        await fetchAPI(`${API}?id=${id}`, 'PATCH', { status });
        location.reload();
    }
};

// පිටුව Load වූ පසු අදාළ කොටස ක්‍රියාත්මක කිරීම
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('requestsContainer')) {
        initDashboard();
    }
    if (document.getElementById('tableBody')) {
        initAdmin();
    }
});
