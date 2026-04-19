// Authentication handling for login page
document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const name = document.getElementById('name').value.trim();
      const whatsapp = document.getElementById('whatsapp').value.trim();
      
      // Simple validation - just check not empty
      if (!name || !whatsapp) {
        alert('කරුණාකර නම සහ WhatsApp අංකය ඇතුළත් කරන්න.');
        return;
      }
      
      // Remove length/pattern validation - accept any input
      
      // Create user object
      const user = {
        id: 'user_' + Date.now() + Math.random().toString(36).substr(2, 5),
        name: name,
        whatsapp: whatsapp,
        loginTime: new Date().toISOString()
      };
      
      // Save to localStorage
      localStorage.setItem('currentUser', JSON.stringify(user));
      
      // Also store user in users list (for admin reference)
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const existingUser = users.find(u => u.whatsapp === whatsapp);
      if (!existingUser) {
        users.push(user);
        localStorage.setItem('users', JSON.stringify(users));
      } else {
        // Update name if changed
        existingUser.name = name;
        localStorage.setItem('users', JSON.stringify(users));
        // Use existing user ID
        user.id = existingUser.id;
        localStorage.setItem('currentUser', JSON.stringify(user));
      }
      
      // Redirect to dashboard
      window.location.href = 'dashboard.html';
    });
  }
});