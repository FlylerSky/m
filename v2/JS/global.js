// Check if user is logged in
function checkAuth() {
  return localStorage.getItem('isLoggedIn') === 'true';
}

// Protect pages: redirect to welcome.html if not logged in
if (window.location.pathname !== '/welcome.html' && !checkAuth()) {
  window.location.href = 'welcome.html';
}

// Login Modal Handling
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const loginModal = document.getElementById('loginModal');
const closeModal = document.getElementById('closeModal');
const confirmLogin = document.getElementById('confirmLogin');
const errorMsg = document.getElementById('errorMsg');

if (loginBtn) {
  loginBtn.addEventListener('click', () => {
    loginModal.classList.remove('hidden');
  });
}

if (signupBtn) {
  signupBtn.addEventListener('click', () => {
    window.location.href = 'https://your-google-form-signup'; // Replace with your Google Form URL
  });
}

if (closeModal) {
  closeModal.addEventListener('click', () => {
    loginModal.classList.add('hidden');
    errorMsg.classList.add('hidden');
  });
}

// Login Logic
if (confirmLogin) {
  confirmLogin.addEventListener('click', async () => {
    const accountId = document.getElementById('accountId').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    try {
      // Fetch account.json
      const response = await fetch('./JSON/account.json');
      if (!response.ok) throw new Error('Không thể tải dữ liệu tài khoản');
      const accounts = await response.json();

      // Check credentials
      const user = accounts.find(
        acc => acc.id === accountId && acc.email === email && acc.password === password
      );

      if (user) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userId', user.id);
        window.location.href = 'index.html';
      } else {
        errorMsg.textContent = 'Thông tin đăng nhập không đúng';
        errorMsg.classList.remove('hidden');
      }
    } catch (error) {
      errorMsg.textContent = 'Đã có lỗi xảy ra. Vui lòng thử lại.';
      errorMsg.classList.remove('hidden');
    }
  });
}