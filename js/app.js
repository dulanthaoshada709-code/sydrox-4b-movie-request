const API_BASE_URL = ''; // Vercel වලදී මෙය හිස්ව තැබිය හැක

async function apiFetch(endpoint, method = 'GET', body = null) {
  const options = { 
    method, 
    headers: { 'Content-Type': 'application/json' } 
  };
  if (body) options.body = JSON.stringify(body);
  
  try {
    const response = await fetch(`/api${endpoint}`, options);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
}

// Functions
const getAllRequests = () => apiFetch('/requests');
const saveRequest = (data) => apiFetch('/requests', 'POST', data);
const updateRequestStatusMongo = (id, status) => apiFetch(`/requests/${id}`, 'PATCH', { status });

// ... (මෙහි සිට පහළට ඔබ කලින් එවා තිබූ initDashboard වැනි ශ්‍රිත එලෙසම තබන්න)
