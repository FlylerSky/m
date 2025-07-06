function showLoginForm() {
  document.getElementById('login-form').classList.remove('hidden');
}

function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    let date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + value + expires + "; path=/";
}

function getCookie(name) {
  let nameEQ = name + "=";
  let ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorMessage = document.getElementById('error-message');

  fetch('account.json')
    .then(response => response.json())
    .then(accounts => {
      const user = accounts.find(acc => acc.Email === email && acc.Password === password);
      if (!user) {
        errorMessage.textContent = 'Email hoặc mật khẩu không đúng!';
        errorMessage.classList.remove('hidden');
      } else if (user.isBanned) {
        errorMessage.textContent = 'Tài khoản của bạn đã bị cấm!';
        errorMessage.classList.remove('hidden');
      } else {
        setCookie('AccountID', user.AccountID, 7);
        setCookie('DisplayName', user.DisplayName, 7);
        setCookie('LogoutToken', user.logoutToken, 7);
        setCookie('Avatar', user.avatar, 7);
        window.location.href = 'index.html';
      }
    })
    .catch(error => {
      console.error('Lỗi khi kiểm tra tài khoản:', error);
      errorMessage.textContent = 'Có lỗi xảy ra, thử lại sau!';
      errorMessage.classList.remove('hidden');
    });
}

function checkLoginStatus() {
  const accountID = getCookie('AccountID');
  const displayName = getCookie('DisplayName');
  const logoutToken = getCookie('LogoutToken');
  const avatar = getCookie('Avatar');
  const userAvatar = document.getElementById('user-avatar');
  const errorMessage = document.getElementById('error-message') || document.createElement('p');

  if (!accountID || !displayName || !logoutToken || !avatar) {
    window.location.href = 'welcome.html';
    return;
  }

  fetch('account.json')
    .then(response => response.json())
    .then(accounts => {
      const user = accounts.find(acc => acc.AccountID === accountID);
      if (!user || user.isBanned || user.logoutToken !== logoutToken) {
        errorMessage.id = 'error-message';
        errorMessage.className = 'text-red-500 mt-4';
        errorMessage.textContent = user?.isBanned ? 'Tài khoản của bạn đã bị cấm!' : 'Phiên đăng nhập đã hết hạn!';
        document.querySelector('.container').prepend(errorMessage);
        setTimeout(() => {
          logout();
        }, 3000);
      } else {
        if (userAvatar) userAvatar.src = user.avatar;
      }
    })
    .catch(error => {
      console.error('Lỗi khi kiểm tra trạng thái:', error);
      errorMessage.id = 'error-message';
      errorMessage.className = 'text-red-500 mt-4';
      errorMessage.textContent = 'Có lỗi xảy ra, thử lại sau!';
      document.querySelector('.container').prepend(errorMessage);
    });
}

function toggleMenu() {
  const menu = document.getElementById('user-menu');
  menu.classList.toggle('show');
  menu.classList.toggle('hidden');
  closeMailbox();
}

function logout() {
  setCookie('AccountID', '', -1);
  setCookie('DisplayName', '', -1);
  setCookie('LogoutToken', '', -1);
  setCookie('Avatar', '', -1);
  window.location.href = 'welcome.html';
}

function openSettings() {
  toggleMenu();
  const settingsModal = document.getElementById('settings-modal');
  settingsModal.classList.remove('hidden');
  settingsModal.classList.add('show');
  closeMailbox();
}

function closeSettings() {
  const settingsModal = document.getElementById('settings-modal');
  settingsModal.classList.remove('show');
  settingsModal.classList.add('hidden');
}

function toggleTheme() {
  const isDark = document.getElementById('theme-toggle').checked;
  document.body.classList.toggle('dark', isDark);
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function applyTheme() {
  const theme = localStorage.getItem('theme') || 'light';
  document.getElementById('theme-toggle').checked = theme === 'dark';
  document.body.classList.toggle('dark', theme === 'dark');
}

function changePassword() {
  const newPassword = document.getElementById('new-password').value;
  const accountID = getCookie('AccountID');
  const errorMessage = document.getElementById('error-message');

  if (!newPassword || newPassword.length < 6) {
    errorMessage.textContent = 'Mật khẩu mới phải dài ít nhất 6 ký tự!';
    errorMessage.classList.remove('hidden');
    return;
  }

  errorMessage.textContent = 'Đổi mật khẩu thành công! Vui lòng cập nhật account.json thủ công và đăng nhập lại.';
  errorMessage.className = 'text-green-500 mt-4';
  errorMessage.classList.remove('hidden');
  setTimeout(() => {
    logout();
  }, 2000);
}

function deleteAccount() {
  if (!confirm('Bạn có chắc muốn xóa tài khoản? Hành động này không thể hoàn tác!')) {
    return;
  }

  const accountID = getCookie('AccountID');
  const errorMessage = document.getElementById('error-message');

  errorMessage.textContent = 'Tài khoản đã được xóa! Vui lòng cập nhật account.json thủ công và đăng xuất.';
  errorMessage.className = 'text-green-500 mt-4';
  errorMessage.classList.remove('hidden');
  setTimeout(() => {
    logout();
  }, 2000);
}

let allPosts = [];
let allUpdates = [];
let currentProfileUser = null;
let mailboxMessages = [];
let mailboxAccounts = [];
let soulmatePosts = [];

function loadPosts() {
  Promise.all([fetch('posts.json'), fetch('account.json')])
    .then(([postsResponse, accountsResponse]) => Promise.all([postsResponse.json(), accountsResponse.json()]))
    .then(([posts, accounts]) => {
      allPosts = posts;
      const postsContainer = document.getElementById('posts');
      postsContainer.innerHTML = '';
      filterPosts();
    })
    .catch(error => {
      console.error('Lỗi khi tải bài viết:', error);
      const postsContainer = document.getElementById('posts');
      postsContainer.innerHTML = '<p class="text-red-500">Không thể tải bài viết!</p>';
    });
}

function renderPosts(posts, accounts, container, isUpdate = false) {
  container.innerHTML = '';
  posts.forEach(item => {
    const postElement = document.createElement('div');
    if (isUpdate) {
      // Render Patch Note
      postElement.className = 'post update-post';
      const contentLengthLimit = 200;
      const isLongContent = item.Content.length > contentLengthLimit;
      const shortContent = isLongContent ? item.Content.substring(0, contentLengthLimit) + '...' : item.Content;
      const fullContent = item.Content;

      postElement.innerHTML = `
        <div class="post-header">
          <h3 class="post-username">${item.Title}</h3>
        </div>
        <div class="post-content" data-full-content="${fullContent.replace(/"/g, '&quot;')}">${isLongContent ? shortContent : fullContent}</div>
        ${isLongContent ? '<span class="read-more" onclick="toggleContent(this)">Xem thêm</span>' : ''}
        <small>${item.ReleaseDate}</small>
      `;
    } else {
      // Render bài viết người dùng
      const user = accounts.find(acc => acc.DisplayName === item.Username);
      if (!user) return;
      postElement.className = `post ${user.SoulmateID ? 'soulmate-post' : ''}`;
      const tickClass = user.isSponsor ? 'sponsor-tick' : user.isVerified ? 'verified-tick' : '';

      const contentLengthLimit = 200;
      const isLongPost = item.PostContent.length > contentLengthLimit;
      const shortContent = isLongPost ? item.PostContent.substring(0, contentLengthLimit) + '...' : item.PostContent;
      const fullContent = item.PostContent;

      postElement.innerHTML = `
        <div class="post-header">
          <img src="${user.avatar}" class="post-avatar" alt="Avatar">
          <h3 class="post-username ${tickClass}" data-account-id="${user.AccountID}">${item.Username}</h3>
        </div>
        <div class="post-content" data-full-content="${fullContent.replace(/"/g, '&quot;')}">${isLongPost ? shortContent : fullContent}</div>
        ${isLongPost ? '<span class="read-more" onclick="toggleContent(this)">Xem thêm</span>' : ''}
        <div class="post-media"></div>
        <small>${item.Timestamp}</small>
      `;

      const mediaContainer = postElement.querySelector('.post-media');
      if (item.images && item.images.length > 0) {
        item.images.forEach(image => {
          const imgElement = document.createElement('img');
          imgElement.src = image;
          imgElement.alt = 'Hình ảnh bài viết';
          mediaContainer.appendChild(imgElement);
        });
      }
      if (item.videos && item.videos.length > 0) {
        item.videos.forEach(video => {
          const videoElement = document.createElement('video');
          videoElement.src = video;
          videoElement.controls = true;
          mediaContainer.appendChild(videoElement);
        });
      }
      if (item.audios && item.audios.length > 0) {
        item.audios.forEach(audio => {
          const audioElement = document.createElement('audio');
          audioElement.src = audio;
          audioElement.controls = true;
          mediaContainer.appendChild(audioElement);
        });
      }
      if (item.iframes && item.iframes.length > 0) {
        item.iframes.forEach(iframe => {
          const iframeContainer = document.createElement('div');
          iframeContainer.className = 'iframe-container';
          iframeContainer.innerHTML = iframe;
          mediaContainer.appendChild(iframeContainer);
        });
      }

      const usernameElement = postElement.querySelector('.post-username');
      usernameElement.addEventListener('click', () => {
        goToProfile(item.Username);
      });
    }

    container.appendChild(postElement);
  });
}

function searchPosts() {
  const searchTerm = document.getElementById('search-input').value.toLowerCase();
  fetch('account.json')
    .then(response => response.json())
    .then(accounts => {
      let postsToSearch = allPosts;
      const postsContainer = document.getElementById('posts') || document.getElementById('user-posts');

      if (currentProfileUser) {
        postsToSearch = allPosts.filter(post => post.Username === currentProfileUser);
      }

      const filteredPosts = postsToSearch.filter(post => {
        const user = accounts.find(acc => acc.DisplayName === post.Username);
        if (!user) return false;
        const searchIn = [
          post.Username.toLowerCase(),
          post.PostContent.toLowerCase(),
          post.Timestamp.toLowerCase()
        ].join(' ');
        return searchIn.includes(searchTerm);
      });

      filterPosts(filteredPosts);
    })
    .catch(error => {
      console.error('Lỗi khi tìm kiếm:', error);
      const postsContainer = document.getElementById('posts') || document.getElementById('user-posts');
      postsContainer.innerHTML = '<p class="text-red-500">Không thể tìm kiếm bài viết!</p>';
    });
}

function filterPosts(filteredPosts = null) {
  const filter = document.getElementById('post-filter').value;
  const postsContainer = document.getElementById('posts') || document.getElementById('user-posts');
  fetch('account.json')
    .then(response => response.json())
    .then(accounts => {
      let postsToFilter = filteredPosts !== null ? filteredPosts : allPosts;
      if (currentProfileUser) {
        postsToFilter = postsToFilter.filter(post => post.Username === currentProfileUser);
      }
      if (filter === 'newest') {
        postsToFilter.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));
      } else if (filter === 'oldest') {
        postsToFilter.sort((a, b) => new Date(a.Timestamp) - new Date(a.Timestamp));
      }
      renderPosts(postsToFilter, accounts, postsContainer);
    });
}

function toggleContent(element) {
  const postContent = element.previousElementSibling;
  const fullContent = postContent.getAttribute('data-full-content');
  const isExpanded = element.textContent === 'Thu gọn';

  if (isExpanded) {
    postContent.innerHTML = fullContent.substring(0, 200) + '...';
    element.textContent = 'Xem thêm';
  } else {
    postContent.innerHTML = fullContent;
    element.textContent = 'Thu gọn';
  }
}

function toggleMoreInfo() {
  const moreInfoModal = document.getElementById('more-info-modal');
  if (moreInfoModal) {
    const isHidden = moreInfoModal.classList.contains('hidden');
    if (isHidden) {
      moreInfoModal.classList.remove('hidden');
      moreInfoModal.classList.add('show');
    } else {
      moreInfoModal.classList.remove('show');
      moreInfoModal.classList.add('hidden');
    }
  }
}

function loadProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const targetAccountId = urlParams.get('accountId') || getCookie('AccountID');
  const currentAccountId = getCookie('AccountID');
  const displayName = getCookie('DisplayName');
  const avatar = getCookie('Avatar');
  const errorMessage = document.getElementById('error-message') || document.createElement('p');
  const profileInfo = document.getElementById('profile-info');

  if (!currentAccountId || !displayName || !avatar) {
    window.location.href = 'welcome.html';
    return;
  }

  Promise.all([fetch('account.json'), fetch('posts.json')])
    .then(([accountsResponse, postsResponse]) => Promise.all([accountsResponse.json(), postsResponse.json()]))
    .then(([accounts, posts]) => {
      const currentUser = accounts.find(acc => acc.AccountID === currentAccountId);
      const targetUser = accounts.find(acc => acc.AccountID === targetAccountId);

      if (!currentUser || currentUser.isBanned || currentUser.logoutToken !== getCookie('LogoutToken')) {
        errorMessage.id = 'error-message';
        errorMessage.className = 'text-red-500 mt-4';
        errorMessage.textContent = currentUser?.isBanned ? 'Tài khoản của bạn đã bị cấm!' : 'Phiên đăng nhập đã hết hạn!';
        document.querySelector('.container').prepend(errorMessage);
        setTimeout(() => {
          logout();
        }, 3000);
        return;
      }

      document.getElementById('user-avatar').src = currentUser.avatar;

      if (!targetUser) {
        errorMessage.id = 'error-message';
        errorMessage.className = 'text-red-500 mt-4';
        errorMessage.textContent = 'Tài khoản không tồn tại!';
        document.querySelector('.container').prepend(errorMessage);
        profileInfo.classList.add('hidden');
        return;
      }

      if (targetUser.isBanned) {
        errorMessage.id = 'error-message';
        errorMessage.className = 'text-red-500 mt-4';
        errorMessage.textContent = 'Tài khoản này đã bị cấm!';
        document.querySelector('.container').prepend(errorMessage);
        profileInfo.classList.add('hidden');
      } else {
        errorMessage.classList.add('hidden');
        profileInfo.classList.remove('hidden');
        document.getElementById('profile-avatar').src = targetUser.avatar;
        document.getElementById('profile-displayname').textContent = targetUser.DisplayName;
        document.getElementById('profile-email').textContent = targetUser.Email;
        document.getElementById('profile-accountid').textContent = targetUser.AccountID;
        const verificationSpan = document.getElementById('profile-verification');
        if (targetUser.isSponsor) {
          verificationSpan.className = 'sponsor-tick';
        } else if (targetUser.isVerified) {
          verificationSpan.className = 'verified-tick';
        }

        const soulmateSpan = document.getElementById('profile-soulmate');
        const soulmateDetailSpan = document.getElementById('profile-soulmate-detail');
        const soulmateDateSpan = document.getElementById('profile-soulmate-date');
        if (targetUser.SoulmateID) {
          const soulmate = accounts.find(acc => acc.AccountID === targetUser.SoulmateID);
          soulmateSpan.textContent = soulmate ? soulmate.DisplayName : 'Không xác định';
          soulmateSpan.setAttribute('data-account-id', targetUser.SoulmateID);
          soulmateDetailSpan.textContent = soulmate ? soulmate.DisplayName : 'Không xác định';
          soulmateDateSpan.textContent = targetUser.SoulmateDate || 'Không có thông tin';
        } else {
          soulmateSpan.textContent = 'Chưa có Tri kỉ';
          soulmateDetailSpan.textContent = 'Chưa có Tri kỉ';
          soulmateDateSpan.textContent = 'Không có thông tin';
        }

        document.getElementById('profile-birthday').textContent = targetUser.Birthday || 'Không có thông tin';
        document.getElementById('profile-gender').textContent = targetUser.Gender || 'Không có thông tin';
        document.getElementById('profile-join-date').textContent = targetUser.JoinDate || 'Không có thông tin';

        const socialLinksContainer = document.getElementById('profile-social-links');
        socialLinksContainer.innerHTML = '';
        const socialLinks = targetUser.SocialLinks || {};
        for (const [platform, link] of Object.entries(socialLinks)) {
          if (link) {
            const li = document.createElement('li');
            li.innerHTML = `<a href="${link}" target="_blank" class="text-blue-500 hover:underline">${platform}</a>`;
            socialLinksContainer.appendChild(li);
          }
        }
        if (!socialLinksContainer.hasChildNodes()) {
          const li = document.createElement('li');
          li.textContent = 'Không có liên kết';
          socialLinksContainer.appendChild(li);
        }

        const banHistoryContainer = document.getElementById('profile-ban-history');
        banHistoryContainer.innerHTML = '';
        const banHistory = targetUser.BanHistory || [];
        if (banHistory.length === 0) {
          const li = document.createElement('li');
          li.textContent = 'Không có tiền sử BAN';
          banHistoryContainer.appendChild(li);
        } else {
          banHistory.forEach(ban => {
            const li = document.createElement('li');
            li.textContent = `Bị ban ngày ${ban.BanDate}, lý do: ${ban.Reason}, gỡ ban ngày ${ban.UnbanDate || 'Chưa gỡ ban'}`;
            banHistoryContainer.appendChild(li);
          });
        }

        const userPostsContainer = document.getElementById('user-posts');
        userPostsContainer.innerHTML = '';
        const userPosts = posts.filter(post => post.Username === targetUser.DisplayName);
        if (userPosts.length === 0) {
          userPostsContainer.innerHTML = '<p class="text-gray-500">Chưa có bài viết nào.</p>';
        } else {
          allPosts = posts;
          currentProfileUser = targetUser.DisplayName;
          filterPosts(userPosts);
        }
      }
    })
    .catch(error => {
      console.error('Lỗi khi tải thông tin cá nhân:', error);
      errorMessage.id = 'error-message';
      errorMessage.className = 'text-red-500 mt-4';
      errorMessage.textContent = 'Có lỗi xảy ra, thử lại sau!';
      document.querySelector('.container').prepend(errorMessage);
    });
}

function toggleMailbox() {
  toggleMenu();
  const mailboxModal = document.getElementById('mailbox-modal');
  const isOpen = mailboxModal.classList.contains('show');
  if (!isOpen) {
    loadMailbox();
  }
  mailboxModal.classList.toggle('show');
  mailboxModal.classList.toggle('hidden');
}

function closeMailbox() {
  const mailboxModal = document.getElementById('mailbox-modal');
  mailboxModal.classList.remove('show');
  mailboxModal.classList.add('hidden');
}

function loadMailbox() {
  const displayName = getCookie('DisplayName');
  Promise.all([fetch('messages.json'), fetch('account.json')])
    .then(([messagesResponse, accountsResponse]) => Promise.all([messagesResponse.json(), accountsResponse.json()]))
    .then(([messages, accounts]) => {
      const mailboxContent = document.getElementById('mailbox-content');
      mailboxContent.innerHTML = '';
      const userMessages = messages.filter(msg => 
        (msg.type === 'personal' || msg.type === 'soulmate_request') && msg.recipient === displayName || 
        msg.type === 'server'
      );
      if (userMessages.length === 0) {
        mailboxContent.innerHTML = '<p class="text-gray-500">Không có thư nào.</p>';
      } else {
        mailboxMessages = userMessages;
        mailboxAccounts = accounts;
        filterMailbox();
      }
    })
    .catch(error => {
      console.error('Lỗi khi tải hòm thư:', error);
      const mailboxContent = document.getElementById('mailbox-content');
      mailboxContent.innerHTML = '<p class="text-red-500">Không thể tải hòm thư!</p>';
    });
}

function filterMailbox() {
  const filter = document.getElementById('mail-filter').value;
  const mailboxContent = document.getElementById('mailbox-content');
  if (!mailboxMessages || !mailboxAccounts) {
    mailboxContent.innerHTML = '<p class="text-red-500">Không thể tải dữ liệu hòm thư!</p>';
    return;
  }
  let sortedMessages = [...mailboxMessages];
  if (filter === 'newest') {
    sortedMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } else if (filter === 'oldest') {
    sortedMessages.sort((a, b) => new Date(a.timestamp) - new Date(a.timestamp));
  }
  mailboxContent.innerHTML = '';
  sortedMessages.forEach(msg => {
    const sender = mailboxAccounts.find(acc => acc.DisplayName === msg.sender);
    const mailItem = document.createElement('div');
    mailItem.className = 'mail-item';
    mailItem.innerHTML = `
      <div class="mail-sender" onclick="goToProfile('${msg.sender}')">
        ${sender ? `<img src="${sender.avatar}" class="mail-avatar" alt="Avatar">` : '<div class="mail-avatar" style="background-color: #ccc;"></div>'}
        <h4 class="mail-username">${msg.type === 'server' ? 'Thư toàn Server' : msg.type === 'soulmate_request' ? 'Yêu cầu Tri kỉ' : msg.sender || 'Người gửi ẩn'}</h4>
      </div>
      <p>${msg.content}</p>
      <small>${msg.timestamp}</small>
    `;
    mailboxContent.appendChild(mailItem);
  });
}

function goToProfile(username) {
  fetch('account.json')
    .then(response => response.json())
    .then(accounts => {
      const user = accounts.find(acc => acc.DisplayName === username);
      if (user) {
        window.location.href = `profile.html?accountId=${user.AccountID}`;
      }
    });
}

function goToSoulmateProfile() {
  const soulmateSpan = document.getElementById('profile-soulmate');
  const soulmateId = soulmateSpan.getAttribute('data-account-id');
  if (soulmateId) {
    window.location.href = `profile.html?accountId=${soulmateId}`;
  }
}

function loadSoulmateCenter() {
  const currentAccountId = getCookie('AccountID');
  const soulmateCenter = document.getElementById('soulmate-center');
  const soulmatePostsSection = document.getElementById('soulmate-posts');
  const errorMessage = document.getElementById('error-message') || document.createElement('p');

  fetch('account.json')
    .then(response => response.json())
    .then(accounts => {
      const currentUser = accounts.find(acc => acc.AccountID === currentAccountId);
      if (!currentUser || currentUser.isBanned) {
        errorMessage.id = 'error-message';
        errorMessage.className = 'text-red-500 mt-4';
        errorMessage.textContent = currentUser?.isBanned ? 'Tài khoản của bạn đã bị cấm!' : 'Phiên đăng nhập đã hết hạn!';
        document.querySelector('.container').prepend(errorMessage);
        setTimeout(() => {
          logout();
        }, 3000);
        return;
      }

      if (currentUser.SoulmateID) {
        const soulmate = accounts.find(acc => acc.AccountID === currentUser.SoulmateID);
        if (soulmate) {
          const soulmateDate = new Date(currentUser.SoulmateDate);
          const currentDate = new Date();
          const yearsTogether = Math.floor((currentDate - soulmateDate) / (1000 * 60 * 60 * 24 * 365));
          soulmateCenter.innerHTML = `
            <h3 class="text-xl font-bold mb-4">Tri Kỉ Của Bạn</h3>
            <div class="flex items-center gap-4 mb-4">
              <img src="${soulmate.avatar}" alt="Avatar" class="w-16 h-16 rounded-full">
              <div>
                <h4 class="text-lg font-semibold cursor-pointer" onclick="goToProfile('${soulmate.DisplayName}')">${soulmate.DisplayName}</h4>
                <p>ID: ${soulmate.AccountID}</p>
              </div>
            </div>
            <p><strong>Ngày lập đôi Tri kỉ:</strong> ${currentUser.SoulmateDate}</p>
            <p><strong>Kỷ niệm:</strong> ${yearsTogether} năm</p>
          `;
          fetch('posts.json')
            .then(response => response.json())
            .then(posts => {
              soulmatePosts = posts.filter(post => post.Username === soulmate.DisplayName);
              filterSoulmatePosts();
            })
            .catch(error => {
              console.error('Lỗi khi tải bài viết Tri kỉ:', error);
              document.getElementById('soulmate-post-list').innerHTML = '<p class="text-red-500">Không thể tải bài viết!</p>';
            });
        } else {
          soulmateCenter.innerHTML = '<p class="text-gray-500">Không tìm thấy thông tin Tri kỉ.</p>';
          soulmatePostsSection.style.display = 'none';
        }
      } else {
        soulmateCenter.innerHTML = `
          <h3 class="text-xl font-bold mb-4">Tìm Kiếm Tri Kỉ</h3>
          <select id="soulmate-filter" onchange="filterSoulmates()" class="input mb-4">
            <option value="youngest">Trẻ nhất</option>
            <option value="oldest">Lớn tuổi nhất</option>
          </select>
          <div id="soulmate-list"></div>
        `;
        soulmatePostsSection.style.display = 'none';
        filterSoulmates(accounts);
      }
    })
    .catch(error => {
      console.error('Lỗi khi tải Trung tâm Tri kỉ:', error);
      errorMessage.id = 'error-message';
      errorMessage.className = 'text-red-500 mt-4';
      errorMessage.textContent = 'Có lỗi xảy ra, thử lại sau!';
      document.querySelector('.container').prepend(errorMessage);
    });
}

function calculateAge(birthday) {
  const birthDate = new Date(birthday);
  const currentDate = new Date();
  return Math.floor((currentDate - birthDate) / (1000 * 60 * 60 * 24 * 365));
}

function filterSoulmates(accounts = null) {
  const filter = document.getElementById('soulmate-filter')?.value;
  const soulmateList = document.getElementById('soulmate-list');
  const currentAccountId = getCookie('AccountID');
  const searchTerm = document.getElementById('search-input').value.toLowerCase();

  if (!soulmateList) return;

  fetch('account.json')
    .then(response => response.json())
    .then(accountsData => {
      const currentUser = accountsData.find(acc => acc.AccountID === currentAccountId);
      if (!currentUser) return;

      let potentialSoulmates = accountsData.filter(acc => 
        acc.AccountID !== currentAccountId &&
        !acc.isBanned &&
        acc.Gender !== currentUser.Gender &&
        !acc.SoulmateID
      );

      if (searchTerm) {
        potentialSoulmates = potentialSoulmates.filter(acc => 
          acc.DisplayName.toLowerCase().includes(searchTerm) ||
          acc.AccountID.toLowerCase().includes(searchTerm)
        );
      }

      if (filter === 'youngest') {
        potentialSoulmates.sort((a, b) => new Date(b.Birthday) - new Date(a.Birthday));
      } else if (filter === 'oldest') {
        potentialSoulmates.sort((a, b) => new Date(a.Birthday) - new Date(b.Birthday));
      }

      soulmateList.innerHTML = '';
      if (potentialSoulmates.length === 0) {
        soulmateList.innerHTML = '<p class="text-gray-500">Không tìm thấy Tri kỉ phù hợp.</p>';
      } else {
        potentialSoulmates.forEach(user => {
          const age = calculateAge(user.Birthday);
          const soulmateItem = document.createElement('div');
          soulmateItem.className = 'post';
          soulmateItem.innerHTML = `
            <div class="flex items-center gap-4">
              <img src="${user.avatar}" alt="Avatar" class="w-12 h-12 rounded-full">
              <div>
                <h4 class="text-lg font-semibold cursor-pointer" onclick="goToProfile('${user.DisplayName}')">${user.DisplayName}</h4>
                <p>ID: ${user.AccountID}</p>
                <p>Tuổi: ${age}</p>
              </div>
              <button class="btn btn-primary ml-auto" onclick="requestSoulmate('${user.AccountID}', '${user.DisplayName}')">Yêu cầu Tri kỉ</button>
            </div>
          `;
          soulmateList.appendChild(soulmateItem);
        });
      }
    })
    .catch(error => {
      console.error('Lỗi khi lọc Tri kỉ:', error);
      soulmateList.innerHTML = '<p class="text-red-500">Không thể tải danh sách Tri kỉ!</p>';
    });
}

function searchSoulmates() {
  filterSoulmates();
}

function requestSoulmate(targetAccountId, targetDisplayName) {
  const currentAccountId = getCookie('AccountID');
  const currentDisplayName = getCookie('DisplayName');
  const errorMessage = document.getElementById('error-message') || document.createElement('p');

  fetch('account.json')
    .then(response => response.json())
    .then(accounts => {
      const targetUser = accounts.find(acc => acc.AccountID === targetAccountId);
      if (!targetUser || targetUser.SoulmateID || targetUser.isBanned) {
        errorMessage.id = 'error-message';
        errorMessage.className = 'text-red-500 mt-4';
        errorMessage.textContent = 'Không thể gửi yêu cầu Tri kỉ!';
        document.querySelector('.container').prepend(errorMessage);
        return;
      }

      window.location.href = `https://forms.gle/soulmate-request?senderId=${currentAccountId}&senderName=${encodeURIComponent(currentDisplayName)}&recipientId=${targetAccountId}&recipientName=${encodeURIComponent(targetDisplayName)}`;
    })
    .catch(error => {
      console.error('Lỗi khi gửi yêu cầu Tri kỉ:', error);
      errorMessage.id = 'error-message';
      errorMessage.className = 'text-red-500 mt-4';
      errorMessage.textContent = 'Có lỗi xảy ra, thử lại sau!';
      document.querySelector('.container').prepend(errorMessage);
    });
}

function filterSoulmatePosts() {
  const filter = document.getElementById('soulmate-post-filter').value;
  const soulmatePostList = document.getElementById('soulmate-post-list');
  if (!soulmatePosts || !soulmatePostList) {
    soulmatePostList.innerHTML = '<p class="text-red-500">Không thể tải bài viết Tri kỉ!</p>';
    return;
  }
  let sortedPosts = [...soulmatePosts];
  if (filter === 'newest') {
    sortedPosts.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));
  } else if (filter === 'oldest') {
    sortedPosts.sort((a, b) => new Date(a.Timestamp) - new Date(b.Timestamp));
  }
  fetch('account.json')
    .then(response => response.json())
    .then(accounts => {
      renderPosts(sortedPosts, accounts, soulmatePostList);
    })
    .catch(error => {
      console.error('Lỗi khi lọc bài viết Tri kỉ:', error);
      soulmatePostList.innerHTML = '<p class="text-red-500">Không thể tải bài viết Tri kỉ!</p>';
    });
}

function loadUpdates() {
  const updatesContainer = document.getElementById('updates-list');
  fetch('updates.json')
    .then(response => response.json())
    .then(updates => {
      allUpdates = updates;
      filterUpdates();
    })
    .catch(error => {
      console.error('Lỗi khi tải Patch Note:', error);
      updatesContainer.innerHTML = '<p class="text-red-500">Không thể tải Patch Note!</p>';
    });
}

function filterUpdates() {
  const filter = document.getElementById('update-filter').value;
  const updatesContainer = document.getElementById('updates-list');
  const searchTerm = document.getElementById('search-input').value.toLowerCase();

  let updatesToFilter = allUpdates;
  if (searchTerm) {
    updatesToFilter = updatesToFilter.filter(update => 
      update.Title.toLowerCase().includes(searchTerm) || 
      update.Content.toLowerCase().includes(searchTerm)
    );
  }

  if (filter === 'newest') {
    updatesToFilter.sort((a, b) => new Date(b.ReleaseDate) - new Date(a.ReleaseDate));
  } else if (filter === 'oldest') {
    updatesToFilter.sort((a, b) => new Date(a.ReleaseDate) - new Date(b.ReleaseDate));
  }

  renderPosts(updatesToFilter, [], updatesContainer, true);
}

function searchUpdates() {
  filterUpdates();
}