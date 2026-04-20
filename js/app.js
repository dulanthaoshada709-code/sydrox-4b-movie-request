const API_BASE = '/api';
const API_REQUESTS = `${API_BASE}/requests`;
const WHATSAPP_GROUP_LINK = 'YOUR_GROUP_INVITE_LINK'; // 👈 Add your WhatsApp group link here

let dashboardInitialized = false;

async function fetchAPI(url, method = 'GET', body = null) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
}

// DELETE request function
async function deleteRequest(id) {
    if (!confirm('Are you sure you want to delete this request?')) return;
    try {
        await fetchAPI(`${API_REQUESTS}/${id}`, 'DELETE');
        alert('Request deleted successfully!');
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (user) await loadUserRequests(user.id);
    } catch (error) {
        alert('Failed to delete request!');
    }
}

window.deleteRequest = deleteRequest;

// Update status function
window.updateStatus = async (id, status) => {
    if (!confirm(`Mark this request as "${status}"?`)) return;
    try {
        await fetchAPI(`${API_REQUESTS}/${id}`, 'PATCH', { status });
        alert('Status updated successfully!');
        const tbody = document.getElementById('tableBody');
        if (tbody) {
            const all = await fetchAPI(API_REQUESTS) || [];
            renderAdminTable(all, tbody);
        }
    } catch (error) {
        alert('Failed to update status!');
    }
};

// Dashboard initialization
async function initDashboard() {
    if (dashboardInitialized) return;
    dashboardInitialized = true;
    
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) { window.location.href = 'index.html'; return; }
    
    document.getElementById('userNameDisplay').textContent = user.name;
    
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
    
    // User menu dropdown
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    userMenuBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('hidden');
    });
    document.addEventListener('click', (e) => {
        if (!userMenuBtn?.contains(e.target) && !userDropdown?.contains(e.target)) {
            userDropdown?.classList.add('hidden');
        }
    });
    
    // Modal setup
    const modal = document.getElementById('requestModal');
    const form = document.getElementById('movieRequestForm');
    
    document.getElementById('newRequestBtn')?.addEventListener('click', () => modal.classList.remove('hidden'));
    
    document.querySelectorAll('.close-modal, .cancel-btn').forEach(b => {
        b.addEventListener('click', () => {
            modal.classList.add('hidden');
            form.reset();
        });
    });
    
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
            form.reset();
        }
    });
    
    // Form submit - clone to remove old listeners
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            id: 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            userId: user.id,
            userName: user.name,
            userWhatsapp: user.whatsapp,
            movieName: document.getElementById('movieName').value.trim(),
            site: document.getElementById('movieSite').value.trim() || '-',
            quality: document.getElementById('quality').value,
            status: 'pending',
            requestedAt: new Date().toISOString()
        };
        
        try {
            await fetchAPI(API_REQUESTS, 'POST', data);
            alert('Request submitted successfully!');
            modal.classList.add('hidden');
            newForm.reset();
            await loadUserRequests(user.id);
        } catch (error) {
            alert('Failed to submit request!');
        }
    });
    
    await loadUserRequests(user.id);
}

async function loadUserRequests(userId) {
    const container = document.getElementById('requestsContainer');
    try {
        const all = await fetchAPI(API_REQUESTS) || [];
        const mine = all.filter(r => r.userId === userId);
        
        if (mine.length === 0) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-inbox"></i><p>No requests yet.</p></div>`;
            return;
        }
        
        container.innerHTML = mine.reverse().map(req => {
            const statusColors = { pending: '#f39c12', completed: '#2ecc71', unfound: '#e74c3c' };
            const statusText = { pending: 'Pending', completed: 'Completed', unfound: 'Not Found' };
            
            let actionBtn = '';
            if (req.status === 'completed') {
                actionBtn = `<a href="${WHATSAPP_GROUP_LINK}" target="_blank" class="whatsapp-btn"><i class="fab fa-whatsapp"></i> Join Group</a>`;
            }
            
            let deleteBtn = '';
            if (req.status === 'pending') {
                deleteBtn = `<button onclick="deleteRequest('${req.id}')" class="delete-btn"><i class="fas fa-trash"></i> Delete</button>`;
            }
            
            return `
                <div class="request-card" style="border-left:5px solid ${statusColors[req.status]};">
                    <h3><i class="fas fa-film"></i> ${req.movieName}</h3>
                    <p><i class="fas fa-globe"></i> Site: ${req.site}</p>
                    <p><i class="fas fa-video"></i> Quality: ${req.quality}</p>
                    <p><i class="far fa-calendar-alt"></i> Date: ${new Date(req.requestedAt).toLocaleDateString()}</p>
                    <p class="status-badge" style="color:${statusColors[req.status]};">Status: ${statusText[req.status]}</p>
                    <div class="card-actions">
                        ${actionBtn}
                        ${deleteBtn}
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        container.innerHTML = `<p style="color:red;">Failed to load requests.</p>`;
    }
}

// Admin functions
function renderAdminTable(all, tbody) {
    if (all.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">No requests found.</td></tr>`;
        return;
    }
    
    tbody.innerHTML = all.reverse().map(req => {
        const statusColors = { pending: '#f39c12', completed: '#2ecc71', unfound: '#e74c3c' };
        return `
            <tr>
                <td>${req.userName}</td>
                <td>${req.userWhatsapp}</td>
                <td>${req.movieName}</td>
                <td>${req.site}</td>
                <td>${req.quality}</td>
                <td style="color:${statusColors[req.status]}; font-weight:bold;">${req.status}</td>
                <td>${new Date(req.requestedAt).toLocaleDateString()}</td>
                <td>
                    <button onclick="updateStatus('${req.id}', 'completed')" class="admin-btn done">✅ Done</button>
                    <button onclick="updateStatus('${req.id}', 'unfound')" class="admin-btn unfound">❌ Unfound</button>
                </td>
            </tr>
        `;
    }).join('');
}

async function initAdmin() {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    
    try {
        const all = await fetchAPI(API_REQUESTS) || [];
        renderAdminTable(all, tbody);
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="8" style="color:red;">Failed to load requests.</td></tr>`;
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('requestsContainer')) initDashboard();
    if (document.getElementById('tableBody')) initAdmin();
});
