const API_BASE_URL = '/api';

async function apiFetch(endpoint, method = 'GET', body = null) {
  const options = { 
    method, 
    headers: { 'Content-Type': 'application/json' } 
  };
  if (body) options.body = JSON.stringify(body);
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
}

const getAllRequests = () => apiFetch('/requests');
const saveRequest = (data) => apiFetch('/requests', 'POST', data);
const updateRequestStatusMongo = (id, status) => apiFetch(`/requests?id=${id}`, 'PATCH', { status });

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

// Dashboard එකේ Buttons වැඩ කරන්නේ මෙතැනින්
async function initDashboard() {
  const user = getCurrentUser();
  if (!user) { window.location.href = 'index.html'; return; }
  
  const userNameDisplay = document.getElementById('userNameDisplay');
  if (userNameDisplay) userNameDisplay.textContent = user.name;
  
  // Logout Button
  document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
  });
  
  // පවතින ඉල්ලීම් පෙන්වීම
  await loadUserRequests(user.id);
  
  // Modal පාලනය කරන Buttons (මෙහි ids නිවැරදි කර ඇත)
  const modal = document.getElementById('requestModal');
  const newRequestBtn = document.getElementById('newRequestBtn');
  const closeModalBtn = document.querySelector('.close-modal');
  const cancelBtn = document.querySelector('.cancel-btn');
  const requestForm = document.getElementById('movieRequestForm');
  
  // Button එක එබූ විට Modal එක පෙන්වීම
  newRequestBtn?.addEventListener('click', () => {
    modal.classList.remove('hidden');
  });
  
  const closeModal = () => { 
    modal.classList.add('hidden'); 
    requestForm?.reset(); 
  };
  
  closeModalBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);

  // Form එක Submit කිරීම
  requestForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const movieName = document.getElementById('movieName').value.trim();
    const movieSite = document.getElementById('movieSite').value.trim() || '-';
    const quality = document.getElementById('quality').value;
    
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
    if (result) { 
      closeModal(); 
      await loadUserRequests(user.id); 
    }
  });
}

async function loadUserRequests(userId) {
  const container = document.getElementById('requestsContainer');
  const allRequests = await getAllRequests() || [];
  const requests = allRequests.filter(req => req.userId === userId);
  
  if (requests.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-inbox"></i><p>තවමත් ඉල්ලීම් නොමැත.</p></div>`;
    return;
  }
  
  let html = '';
  requests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt)).forEach(req => {
    html += `
      <div class="request-card">
        <h4><i class="fas fa-film"></i> ${escapeHtml(req.movieName)}</h4>
        <div class="request-detail"><span>${req.quality}</span></div>
        <div class="request-footer"><span>${req.status}</span></div>
      </div>`;
  });
  container.innerHTML = html;
    }
