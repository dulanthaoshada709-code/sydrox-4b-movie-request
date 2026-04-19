// Theme management
(function() {
  const themeToggle = document.getElementById('themeToggle');
  const htmlElement = document.documentElement;
  
  // Check for saved theme preference
  const savedTheme = localStorage.getItem('theme') || 'light';
  htmlElement.setAttribute('data-theme', savedTheme);
  updateToggleButton(savedTheme);
  
  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      const currentTheme = htmlElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      
      htmlElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateToggleButton(newTheme);
    });
  }
  
  function updateToggleButton(theme) {
    if (!themeToggle) return;
    
    const icon = themeToggle.querySelector('i');
    const span = themeToggle.querySelector('span');
    
    if (theme === 'dark') {
      icon.className = 'fas fa-sun';
      if (span) span.textContent = 'light';
    } else {
      icon.className = 'fas fa-moon';
      if (span) span.textContent = 'dark';
    }
  }
})();
