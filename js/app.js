// Common app functions

// Helper: Get current user
function getCurrentUser() {
  const userJson = localStorage.getItem('currentUser');
  return userJson ? JSON.parse(userJson) : null;
}

// Helper: Get all requests
function getAllRequests() {
  return JSON.parse(localStorage.getItem('movieRequests') || '[]');
}

// Helper: Save requests
function saveRequests(requests) {
  localStorage.setItem('movieRequests', JSON.stringify(requests));
}

// Initialize Dashboard
function initDashboard() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
  
  // Display user name
  const userNameDisplay = document.getElementById('userNameDisplay');
  if (userNameDisplay) {
    userNameDisplay.textContent = user.name;
  }
  
  // Setup logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      localStorage.removeItem('currentUser');
      window.location.href = 'index.html';
    });
  }
  
  // User menu dropdown
  const userMenuBtn = document.getElementById('userMenuBtn');
  const userDropdown = document.getElementById('userDropdown');
  if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener('click', function() {
      userDropdown.classList.toggle('hidden');
    });
    
    // Close when clicking outside
    document.addEventListener('click', function(e) {
      if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.add('hidden');
      }
    });
  }
  
  // Load user requests
  loadUserRequests(user.id);
  
  // New request modal
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
  
  // Close modal when clicking outside
  modal.addEventListener('click', function(e) {
    if (e.target === modal) closeModal();
  });
  
  // Submit new request
  if (requestForm) {
    requestForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const movieName = document.getElementById('movieName').value.trim();
      const movieSite = document.getElementById('movieSite').value.trim() || '-';
      const quality = document.getElementById('quality').value;
      
      if (!movieName || !quality) {
        alert('චිත්‍රපට නම සහ ගුණාත්මකභාවය අනිවාර්ය වේ.');
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

// Load user requests into dashboard
function loadUserRequests(userId) {
  const container = document.getElementById('requestsContainer');
  if (!container) return;
  
  const requests = getAllRequests().filter(req => req.userId === userId);
  
  if (requests.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-inbox"></i>
        <p>තවමත් චිත්‍රපට ඉල්ලීම් නොමැත.</p>
      </div>
    `;
    return;
  }
  
  // Sort by date descending
  requests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
  
  let html = '';
  requests.forEach(req => {
    const date = new Date(req.requestedAt).toLocaleDateString('si-LK');
    const statusClass = req.status === 'pending' ? 'status-pending' : 'status-completed';
    const statusText = req.status === 'pending' ? 'බලාපොරොත්තුවෙන්' : 'සම්පූර්ණයි';
    
    html += `
      <div class="request-card">
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
        <span class="request-status ${statusClass}">${statusText}</span>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// Admin panel: Load all requests
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
  
  // Sort by date descending
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

// Update request status (admin action)
function updateRequestStatus(requestId, newStatus) {
  const requests = getAllRequests();
  const requestIndex = requests.findIndex(r => r.id === requestId);
  
  if (requestIndex !== -1) {
    requests[requestIndex].status = newStatus;
    saveRequests(requests);
    loadAdminRequests(); // Refresh table
  }
}

// Simple escape to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Expose function for onclick in admin table
window.updateRequestStatus = updateRequestStatus;
