// ==================== MongoDB Configuration ====================
const MONGO_API_KEY = 'YOUR_API_KEY'; // Data API Key එක
const MONGO_APP_ID = 'YOUR_APP_ID';   // App ID එක (URL එකේ තියෙන data-abcde කොටස)
const MONGO_BASE_URL = `https://data.mongodb-api.com/app/${MONGO_APP_ID}/endpoint/data/v1`;
const MONGO_DATA_SOURCE = 'Cluster0';  // ඔබගේ Cluster නම (සාමාන්‍යයෙන් Cluster0)
const MONGO_DATABASE = 'movieRequestDB';
const MONGO_COLLECTION = 'requests';

// ==================== Helper: MongoDB API Calls ====================
async function mongoFetch(action, filter = {}, document = null, update = null) {
  const url = `${MONGO_BASE_URL}/action/${action}`;
  const body = {
    dataSource: MONGO_DATA_SOURCE,
    database: MONGO_DATABASE,
    collection: MONGO_COLLECTION
  };

  if (action === 'find') body.filter = filter;
  if (action === 'insertOne' || action === 'replaceOne') body.document = document;
  if (action === 'updateOne') { body.filter = filter; body.update = update; }
  if (action === 'deleteOne') body.filter = filter;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': MONGO_API_KEY
      },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'API Error');
    return data;
  } catch (error) {
    console.error('MongoDB API Error:', error);
    alert('දත්ත ගබඩාව සමඟ සම්බන්ධ වීමේ දෝෂයකි. පසුව නැවත උත්සාහ කරන්න.');
    return null;
  }
}

// Get all requests from MongoDB
async function getAllRequests() {
  const result = await mongoFetch('find', {});
  return result ? result.documents : [];
}

// Save a new request to MongoDB
async function saveRequest(newRequest) {
  return await mongoFetch('insertOne', {}, newRequest);
}

// Update request status in MongoDB
async function updateRequestStatusMongo(requestId, newStatus) {
  const filter = { id: requestId };
  const update = { $set: { status: newStatus } };
  return await mongoFetch('updateOne', filter, null, update);
}

// ==================== Common Helper Functions ====================
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

// ==================== Dashboard Initialization ====================
async function initDashboard() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
  
  const userNameDisplay = document.getElementById('userNameDisplay');
  if (userNameDisplay) userNameDisplay.textContent = user.name;
  
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('currentUser');
      window.location.href = 'index.html';
    });
  }
  
  const userMenuBtn = document.getElementById('userMenuBtn');
  const userDropdown = document.getElementById('userDropdown');
  if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener('click', () => userDropdown.classList.toggle('hidden'));
    document.addEventListener('click', (e) => {
      if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.add('hidden');
      }
    });
  }
  
  await loadUserRequests(user.id);
  
  // Modal setup
  const modal = document.getElementById('requestModal');
  const newRequestBtn = document.getElementById('newRequestBtn');
  const closeModalBtn = document.querySelector('.close-modal');
  const cancelBtn = document.querySelector('.cancel-btn');
  const requestForm = document.getElementById('movieRequestForm');
  
  if (newRequestBtn) newRequestBtn.addEventListener('click', () => modal.classList.remove('hidden'));
  
  const closeModal = () => {
    modal.classList.add('hidden');
    requestForm.reset();
  };
  
  closeModalBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  
  if (requestForm) {
    requestForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const movieName = document.getElementById('movieName').value.trim();
      const movieSite = document.getElementById('movieSite').value.trim() || '-';
      const quality = document.getElementById('quality').value;
      
      if (!movieName || !quality) {
        alert('චිත්‍රපට නම සහ ගුණාත්මකභාවය අනිවාර්ය වේ.');
        return;
      }
      
      const newRequest = {
        id: 'req_' + Date.now() + Math.random().toString(36).substr(2, 5),
        userId: user.id,
        userName: user.name,
        userWhatsapp: user.whatsapp,
        movieName: movieName,
        site: movieSite,
        quality: quality,
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
}

// ==================== Load User Requests into Dashboard ====================
async function loadUserRequests(userId) {
  const container = document.getElementById('requestsContainer');
  if (!container) return;
  
  const allRequests = await getAllRequests();
  const requests = allRequests.filter(req => req.userId === userId);
  
  if (requests.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-inbox"></i><p>තවමත් චිත්‍රපට ඉල්ලීම් නොමැත.</p></div>`;
    return;
  }
  
  requests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
  
  const groupLink = 'YOUR_GROUP_INVITE_LINK'; // ⚠️ මෙය ඔබගේ WhatsApp සමූහයේ ආරාධනා සබැඳියට වෙනස් කරන්න
  
  let html = '';
  requests.forEach(req => {
    const date = new Date(req.requestedAt).toLocaleDateString('si-LK');
    const statusClass = req.status === 'pending' ? 'status-pending' : 'status-completed';
    const statusText = req.status === 'pending' ? 'බලාපොරොත්තුවෙන්' : 'සම්පූර්ණයි';
    
    let completedBadge = '';
    if (req.status === 'completed') {
      completedBadge = `
        <a href="${groupLink}" target="_blank" class="whatsapp-group-link">
          <i class="fab fa-whatsapp"></i> සමූහයට යන්න
        </a>
      `;
    }
    
    html += `
      <div class="request-card ${req.status === 'completed' ? 'completed-request' : ''}">
        <h4><i class="fas fa-film"></i> ${escapeHtml(req.movieName)}</h4>
        <div class="request-detail"><i class="fas fa-globe"></i><span>${escapeHtml(req.site)}</span></div>
        <div class="request-detail"><i class="fas fa-video"></i><span>${escapeHtml(req.quality)}</span></div>
        <div class="request-detail"><i class="far fa-calendar-alt"></i><span>${date}</span></div>
        <div class="request-footer">
          <span class="request-status ${statusClass}">${statusText}</span>
          ${completedBadge}
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// ==================== Admin Panel Functions ====================
async function loadAdminRequests() {
  const tbody = document.getElementById('tableBody');
  const noDataMsg = document.getElementById('noDataMessage');
  const table = document.getElementById('requestsTable');
  if (!tbody) return;
  
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
    const statusText = req.status === 'pending' ? 'බලාපොරොත්තුවෙන්' : 'සම්පූර්ණයි';
    
    html += `
      <tr>
        <td>${escapeHtml(req.userName)}</td>
        <td>${escapeHtml(req.userWhatsapp)}</td>
        <td>${escapeHtml(req.movieName)}</td>
        <td>${escapeHtml(req.site)}</td>
        <td>${escapeHtml(req.quality)}</td>
        <td><span class="status-badge ${req.status === 'pending' ? 'status-pending' : 'status-completed'}">${statusText}</span></td>
        <td>${date}</td>
        <td>
          <button class="action-btn complete" onclick="updateRequestStatus('${req.id}', 'completed')" ${req.status === 'completed' ? 'disabled' : ''}>
            <i class="fas fa-check"></i> සම්පූර්ණ කළා
          </button>
        </td>
      </tr>
    `;
  });
  
  tbody.innerHTML = html;
}

async function updateRequestStatus(requestId, newStatus) {
  if (!confirm('මෙම ඉල්ලීම සම්පූර්ණ කළ බවට සලකුණු කරන්නද?')) return;
  
  const result = await updateRequestStatusMongo(requestId, newStatus);
  if (result) {
    await loadAdminRequests();
    alert('තත්වය යාවත්කාලීන කරන ලදී. පරිශීලකයාට දැන් WhatsApp සබැඳිය පෙනෙනු ඇත.');
  }
}

// Expose globally
window.updateRequestStatus = updateRequestStatus;  const userNameDisplay = document.getElementById('userNameDisplay');
  if (userNameDisplay) {
    userNameDisplay.textContent = user.name;
  }
  
  // Setup logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      localStorage.removeItem('currentUser');
      window.location.href = 'index.html';
    });
  }
  
  // User menu dropdown toggle
  const userMenuBtn = document.getElementById('userMenuBtn');
  const userDropdown = document.getElementById('userDropdown');
  if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener('click', function() {
      userDropdown.classList.toggle('hidden');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.add('hidden');
      }
    });
  }
  
  // Load user's requests into the grid
  loadUserRequests(user.id);
  
  // Setup modal for new movie request
  const modal = document.getElementById('requestModal');
  const newRequestBtn = document.getElementById('newRequestBtn');
  const closeModalBtn = document.querySelector('.close-modal');
  const cancelBtn = document.querySelector('.cancel-btn');
  const requestForm = document.getElementById('movieRequestForm');
  
  if (newRequestBtn) {
    newRequestBtn.addEventListener('click', function() {
      modal.classList.remove('hidden');
    });
  }
  
  function closeModal() {
    modal.classList.add('hidden');
    requestForm.reset();
  }
  
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  
  // Close modal when clicking outside content
  modal.addEventListener('click', function(e) {
    if (e.target === modal) closeModal();
  });
  
  // Handle form submission for new movie request
  if (requestForm) {
    requestForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const movieName = document.getElementById('movieName').value.trim();
      const movieSite = document.getElementById('movieSite').value.trim() || '-';
      const quality = document.getElementById('quality').value;
      
      if (!movieName || !quality) {
        alert('film name and quality ඕනේ.');
        return;
      }
      
      const requests = getAllRequests();
      const newRequest = {
        id: 'req_' + Date.now() + Math.random().toString(36).substr(2, 5),
        userId: user.id,
        userName: user.name,
        userWhatsapp: user.whatsapp,
        movieName: movieName,
        site: movieSite,
        quality: quality,
        status: 'pending',
        requestedAt: new Date().toISOString()
      };
      
      requests.push(newRequest);
      saveRequests(requests);
      
      closeModal();
      loadUserRequests(user.id);
    });
  }
}

// ==================== Load User Requests into Dashboard ====================

function loadUserRequests(userId) {
  const container = document.getElementById('requestsContainer');
  if (!container) return;
  
  const requests = getAllRequests().filter(req => req.userId === userId);
  
  if (requests.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-inbox"></i>
        <p>no films.</p>
      </div>
    `;
    return;
  }
  
  // Sort by date descending (newest first)
  requests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
  
  // ========== IMPORTANT: Replace with your actual WhatsApp group invite link ==========
  const groupLink = 'YOUR_GROUP_INVITE_LINK'; // e.g., https://chat.whatsapp.com/xyz
  // ===================================================================================
  
  let html = '';
  requests.forEach(req => {
    const date = new Date(req.requestedAt).toLocaleDateString('si-LK');
    const statusClass = req.status === 'pending' ? 'status-pending' : 'status-completed';
    const statusText = req.status === 'pending' ? 'wait' : 'complete';
    
    // Show WhatsApp button only if request is completed
    let completedBadge = '';
    if (req.status === 'completed') {
      completedBadge = `
        <a href="${groupLink}" target="_blank" class="whatsapp-group-link" title="WhatsApp group">
          <i class="fab fa-whatsapp"></i> go to group
        </a>
      `;
    }
    
    html += `
      <div class="request-card ${req.status === 'completed' ? 'completed-request' : ''}">
        <h4><i class="fas fa-film"></i> ${escapeHtml(req.movieName)}</h4>
        <div class="request-detail">
          <i class="fas fa-globe"></i>
          <span>${escapeHtml(req.site)}</span>
        </div>
        <div class="request-detail">
          <i class="fas fa-video"></i>
          <span>${escapeHtml(req.quality)}</span>
        </div>
        <div class="request-detail">
          <i class="far fa-calendar-alt"></i>
          <span>${date}</span>
        </div>
        <div class="request-footer">
          <span class="request-status ${statusClass}">${statusText}</span>
          ${completedBadge}
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// ==================== Admin Panel Functions ====================

function loadAdminRequests() {
  const tbody = document.getElementById('tableBody');
  const noDataMsg = document.getElementById('noDataMessage');
  const table = document.getElementById('requestsTable');
  
  if (!tbody) return;
  
  const requests = getAllRequests();
  
  if (requests.length === 0) {
    table.classList.add('hidden');
    noDataMsg.classList.remove('hidden');
    return;
  }
  
  table.classList.remove('hidden');
  noDataMsg.classList.add('hidden');
  
  // Sort by date descending (newest first)
  requests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
  
  let html = '';
  requests.forEach(req => {
    const date = new Date(req.requestedAt).toLocaleDateString('si-LK');
    const statusText = req.status === 'pending' ? 'wait' : 'complete';
    
    html += `
      <tr>
        <td>${escapeHtml(req.userName)}</td>
        <td>${escapeHtml(req.userWhatsapp)}</td>
        <td>${escapeHtml(req.movieName)}</td>
        <td>${escapeHtml(req.site)}</td>
        <td>${escapeHtml(req.quality)}</td>
        <td><span class="status-badge ${req.status === 'pending' ? 'status-pending' : 'status-completed'}">${statusText}</span></td>
        <td>${date}</td>
        <td>
          <button class="action-btn complete" onclick="updateRequestStatus('${req.id}', 'completed')" ${req.status === 'completed' ? 'disabled' : ''}>
            <i class="fas fa-check"></i>completed
          </button>
        </td>
      </tr>
    `;
  });
  
  tbody.innerHTML = html;
}

// Update request status (called from admin panel)
function updateRequestStatus(requestId, newStatus) {
  if (confirm('මෙම ඉල්ලීම සම්පූර්ණ කළ බවට සලකුණු කරන්නද?')) {
    const requests = getAllRequests();
    const requestIndex = requests.findIndex(r => r.id === requestId);
    
    if (requestIndex !== -1) {
      requests[requestIndex].status = newStatus;
      saveRequests(requests);
      loadAdminRequests(); // Refresh admin table
      
      alert('තත්වය යාවත්කාලීන කරන ලදී. පරිශීලකයාට දැන් WhatsApp සබැඳිය පෙනෙනු ඇත.');
    }
  }
}

// Expose updateRequestStatus globally for onclick handler in admin table
window.updateRequestStatus = updateRequestStatus;
