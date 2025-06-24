document.getElementById('login-btn').addEventListener('click', () => {
  document.getElementById('login-modal').style.display = 'block';
});

document.getElementById('close-modal').addEventListener('click', () => {
  document.getElementById('login-modal').style.display = 'none';
});

document.getElementById('signup-btn').addEventListener('click', () => {
  window.location.href = 'YOUR_GOOGLE_FORM_URL'; // Thay bằng URL Google Form của bạn
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const accountId = document.getElementById('account-id').value;
  const password = document.getElementById('password').value;
  const errorMsg = document.getElementById('login-error');

  try {
    const response = await fetch('/json/account.json');
    const accounts = await response.json();
    const user = accounts.find(
      acc => acc.email === email && acc.id === accountId && acc.password === password
    );

    if (user) {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userId', user.id);
      window.location.href = '/index.html';
    } else {
      errorMsg.textContent = 'Thông tin đăng nhập không đúng!';
    }
  } catch (error) {
    console.error('Error checking account:', error);
    errorMsg.textContent = 'Có lỗi xảy ra, vui lòng thử lại!';
  }
});