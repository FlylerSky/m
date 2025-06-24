document.addEventListener('DOMContentLoaded', () => {
  // Kiểm tra trạng thái đăng nhập
  if (window.location.pathname.includes('index.html')) {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      window.location.href = '/welcome.html';
      return;
    }
  }

  // Xử lý nút Đăng nhập
  const loginBtn = document.getElementById('login-btn');
  const loginContainer = document.getElementById('login-container');
  if (loginBtn && loginContainer) {
    loginBtn.addEventListener('click', () => {
      loginContainer.classList.toggle('hidden');
    });
  }

  // Xử lý nút Đăng ký
  const registerBtn = document.getElementById('register-btn');
  if (registerBtn) {
    registerBtn.addEventListener('click', () => {
      window.location.href = 'YOUR_GOOGLE_FORM_URL'; // Thay bằng URL Google Form
    });
  }

  // Xử lý đăng nhập
  const submitLogin = document.getElementById('submit-login');
  if (submitLogin) {
    submitLogin.addEventListener('click', async () => {
      const email = document.getElementById('email').value;
      const accountId = document.getElementById('account-id').value;
      const password = document.getElementById('password').value;

      try {
        const response = await fetch('/json/account.json');
        const accounts = await response.json();
        const user = accounts.find(
          acc => acc.email === email && acc.id === accountId && acc.password === password
        );

        if (user) {
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('user', JSON.stringify(user));
          window.location.href = '/index.html';
        } else {
          alert('Thông tin đăng nhập không đúng!');
        }
      } catch (error) {
        console.error('Error loading accounts:', error);
        alert('Đã có lỗi xảy ra. Vui lòng thử lại.');
      }
    });
  }

  // Xử lý nút Đăng xuất
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('user');
      window.location.href = '/welcome.html';
    });
  }

  // Đóng modal đăng nhập
  const closeLogin = document.getElementById('close-login');
  if (closeLogin) {
    closeLogin.addEventListener('click', () => {
      loginContainer?.classList.add('hidden');
    });
  }

  // Xử lý menu avatar
  const userAvatar = document.getElementById('user-avatar');
  const userMenu = document.getElementById('user-menu');
  const closeMenu = document.getElementById('close-menu');
  if (userAvatar && userMenu) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    userAvatar.src = user.avatar || 'https://via.placeholder.com/40'; // Fallback avatar
    userAvatar.addEventListener('click', () => {
      userMenu.classList.toggle('hidden');
    });
    closeMenu?.addEventListener('click', () => {
      userMenu.classList.add('hidden');
    });
  }

  // Tải bài viết từ posts.json
  const postList = document.getElementById('post gocpost-list');
  if (postList) {
    fetch('/json/posts.json')
      .then(response => response.json())
      .then(posts => {
        posts.forEach(post => {
          const postDiv = document.createElement('div');
          postDiv.className = 'bg-gray-900 p-4 rounded-lg shadow-md';
          const isLongContent = post.content.length > 200;
          postDiv.innerHTML = `
            <div class="flex items-start space-x-3">
              <img src="${post.avatar || 'https://via.placeholder.com/40'}" alt="Avatar" class="w-10 h-10 rounded-full">
              <div class="flex-1">
                <div class="flex items-center space-x-2">
                  <span class="font-semibold">${post.displayName}</span>
                  <span class="text-gray-400">${post.tag}</span>
                </div>
                <h3 class="text-lg font-semibold mt-1">${post.title}</h3>
                <p class="text-gray-300 ${isLongContent ? 'line-clamp-3' : ''}" id="content-${post.id}">
                  ${post.content}
                </p>
                ${isLongContent ? `<button class="text-blue-500 hover:underline mt-1" onclick="document.getElementById('content-${post.id}').classList.remove('line-clamp-3'); this.remove();">Xem thêm</button>` : ''}
                ${post.image ? `<img src="${post.image}" alt="Post image" class="mt-2 w-full rounded-md object-contain">` : ''}
                ${post.iframe ? `<div class="mt-2 aspect-w-16 aspect-h-9"><iframe src="${post.iframe}" class="w-full h-full rounded-md" frameborder="0" allowfullscreen></iframe></div>` : ''}
              </div>
            </div>
          `;
          postList.appendChild(postDiv);
        });
      })
      .catch(error => {
        console.error('Error loading posts:', error);
        postList.innerHTML = '<p class="text-gray-400">Không thể tải bài viết.</p>';
      });
  }
});