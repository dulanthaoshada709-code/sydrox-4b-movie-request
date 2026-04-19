const API_BASE_URL = '/api';

async function apiFetch(endpoint, method = 'GET', body = null) {
  const options = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) options.body = JSON.stringify(body);
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    alert('දත්ත ගබඩාව සමඟ සම්බන්ධ වීමේ දෝෂයකි.');
    return null;
  }
}

async function getAllRequests() {
  const data = await apiFetch('/requests');
  return data || [];
}

async function saveRequest(newRequest) {
  return await apiFetch('/requests', 'POST', newRequest);
}

async function updateRequestStatusMongo(requestId, newStatus) {
  return await apiFetch(`/requests/${requestId}`, 'PATCH', { status: newStatus });
}

function getCurrentUser() {
  const userJson = localStorage.getItem('currentUser');
  return userJson ? JSON.parse(userJson) : null;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function initDashboard() {
  const user = getCurrentUser();
  if (!user) { window.location.href = 'index.html'; return; }
  
  document.getElementById('userNameDisplay').textContent = user.name;
  
  document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
  });
  
  const userMenuBtn = document.getElementById('userMenuBtn');
  const userDropdown = document.getElementById('userDropdown');
  userMenuBtn.addEventListener('click', () => userDropdown.classList.toggle('hidden'));
  document.addEventListener('click', (e) => {
    if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
      userDropdown.classList.add('hidden');
    }
  });
  
  await loadUserRequests(user.id);
  
  const modal = document.getElementById('requestModal');
  const newRequestBtn = document.getElementById('newRequestBtn');
  const closeModalBtn = document.querySelector('.close-modal');
  const cancelBtn = document.querySelector('.cancel-btn');
  const requestForm = document.getElementById('movieRequestForm');
  
  newRequestBtn.addEventListener('click', () => modal.classList.remove('hidden'));
  
  const closeModal = () => { modal.classList.add('hidden'); requestForm.reset(); };
  closeModalBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  
  requestForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const movieName = document.getElementById('movieName').value.trim();
    const movieSite = document.getElementById('movieSite').value.trim() || '-';
    const quality = document.getElementById('quality').value;
    
    if (!movieName || !quality) { alert('චිත්‍රපට නම සහ ගුණාත්මකභාවය අනිවාර්ය වේ.'); return; }
    
    const newRequest = {
      id: 'req_' + Date.now() + Math.random().toString(36).substr(2, 5),
      userId: user.id,
      userName: user.name,
      userWhatsapp: user.whatsapp,
      movieName, site: movieSite, quality,
      status: 'pending',
      requestedAt: new Date().toISOString()
    };
    
    const result = await saveRequest(newRequest);
    if (result) { closeModal(); await loadUserRequests(user.id); }
  });
}

async function loadUserRequests(userId) {
  const container = document.getElementById('requestsContainer');
  const allRequests = await getAllRequests();
  const requests = allRequests.filter(req => req.userId === userId);
  
  if (requests.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-inbox"></i><p>තවමත් ඉල්ලීම් නොමැත.</p></div>`;
    return;
  }
  
  requests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
  
  const groupLink = 'YOUR_GROUP_INVITE_LINK'; // 👈 මෙතනට WhatsApp Link එක දාන්න
  
  let html = '';
  requests.forEach(req => {
    const date = new Date(req.requestedAt).toLocaleDateString('si-LK');
    let statusClass, statusText;
    
    if (req.status === 'pending') { statusClass = 'status-pending'; statusText = 'බලාපොරොත්තුවෙන්'; }
    else if (req.status === 'completed') { statusClass = 'status-completed'; statusText = 'සම්පූර්ණයි'; }
    else { statusClass = 'status-unfound'; statusText = 'සොයාගත නොහැක'; }
    
    let actionBadge = '';
    if (req.status === 'completed') {
      actionBadge = `<a href="${groupLink}" target="_blank" class="whatsapp-group-link"><i class="fab fa-whatsapp"></i> සමූහයට යන්න</a>`;
    } else if (req.status === 'unfound') {
      actionBadge = `<span class="unfound-message"><i class="fas fa-exclamation-circle"></i> චිත්‍රපටය හමු නොවීය</span>`;
    }
    
    html += `
      <div class="request-card ${req.status === 'completed' ? 'completed-request' : (req.status === 'unfound' ? 'unfound-request' : '')}">
        <h4><i class="fas fa-film"></i> ${escapeHtml(req.movieName)}</h4>
        <div class="request-detail"><i class="fas fa-globe"></i><span>${escapeHtml(req.site)}</span></div>
        <div class="request-detail"><i class="fas fa-video"></i><span>${escapeHtml(req.quality)}</span></div>
        <div class="request-detail"><i class="far fa-calendar-alt"></i><span>${date}</span></div>
        <div class="request-footer">
          <span class="request-status ${statusClass}">${statusText}</span>
          ${actionBadge}
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

async function loadAdminRequests() {
  const tbody = document.getElementById('tableBody');
  const noDataMsg = document.getElementById('noDataMessage');
  const table = document.getElementById('requestsTable');
  
  const requests = await getAllRequests();
  
  if (requests.length === 0) {
    table.classList.add('hidden');
    noDataMsg.classList.remove('hidden');
    return;
  }
  
  table.classList.remove('hidden');
  noDataMsg.classList.add('hidden');
  
  requests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
  
  let html = '';
  requests.forEach(req => {
    const date = new Date(req.requestedAt).toLocaleDateString('si-LK');
    let statusText, statusClass;
    
    if (req.status === 'pending') { statusText = 'බලාපොරොත්තුවෙන්'; statusClass = 'status-pending'; }
    else if (req.status === 'completed') { statusText = 'සම්පූර්ණයි'; statusClass = 'status-completed'; }
    else { statusText = 'සොයාගත නොහැක'; statusClass = 'status-unfound'; }
    
    html += `
      <tr>
        <td>${escapeHtml(req.userName)}</td>
        <td>${escapeHtml(req.userWhatsapp)}</td>
        <td>${escapeHtml(req.movieName)}</td>
        <td>${escapeHtml(req.site)}</td>
        <td>${escapeHtml(req.quality)}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>${date}</td>
        <td>
          <button class="action-btn complete" onclick="updateRequestStatus('${req.id}', 'completed')" ${req.status === 'completed' ? 'disabled' : ''}>සම්පූර්ණ</button>
          <button class="action-btn unfound" onclick="updateRequestStatus('${req.id}', 'unfound')" ${req.status === 'unfound' ? 'disabled' : ''}>හමු නොවීය</button>
        </td>
      </tr>
    `;
  });
  
  tbody.innerHTML = html;
}

async function updateRequestStatus(requestId, newStatus) {
  const msg = newStatus === 'completed' ? 'සම්පූර්ණ කළ බවට සලකුණු කරන්නද?' : 'සොයාගත නොහැකි බවට සලකුණු කරන්නද?';
  if (!confirm(msg)) return;
  
  const result = await updateRequestStatusMongo(requestId, newStatus);
  if (result) { await loadAdminRequests(); alert('තත්වය යාවත්කාලීන කරන ලදී.'); }
}

window.updateRequestStatus = updateRequestStatus;
