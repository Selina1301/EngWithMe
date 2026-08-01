function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

// Sample Official Articles Dataset
const OFFICIAL_ARTICLES = [
  {
    id: "off-1",
    category: "tips",
    categoryLabel: "💡 Study tips",
    title: "Học 20 từ mới mỗi ngày có thực sự hiệu quả không?",
    author: "EngWithMe Team",
    date: "2026-07-24",
    views: 342,
    likes: 48,
    excerpt: "Nên học ít hơn nhưng tập trung vào ví dụ thực tế, phát âm chuẩn, ôn tập định kỳ bằng thuật toán SRS và ứng dụng trực tiếp vào câu nói hàng ngày.",
    content: "Rất nhiều người học Tiếng Anh rơi vào bẫy 'học dồn' — nạp 20 đến 30 từ vựng mỗi ngày nhưng sau 1 tuần thì quên sạch 90%.\n\nBí quyết cốt lõi của việc ghi nhớ dài hạn không phải là số lượng từ nạp vào mỗi ngày, mà là TẦN SUẤT ÔN LẠI (Spaced Repetition System - SRS). Khi học 1 từ mới, hãy luôn kèm theo: 1. Phát âm chuẩn IPA, 2. Nghe mẫu câu thực tế, 3. Tự đặt 1 câu liên quan đến bản thân.\n\nEngWithMe khuyên bạn chỉ nên học 5-10 từ mỗi ngày nhưng hoàn thành đủ 4 bước (Flashcard -> Trắc nghiệm -> Gõ từ -> Phát âm)."
  },
  {
    id: "off-2",
    category: "listening",
    categoryLabel: "🎧 Listening",
    title: "Phương pháp luyện nghe hiểu 90% cho người mất gốc",
    author: "EngWithMe Academic",
    date: "2026-07-22",
    views: 512,
    likes: 89,
    excerpt: "Bắt đầu bằng hội thoại ngắn 30-60 giây, nghe nhiều lần không nhìn vietsub, ghi lại từ khóa nghe được rồi mới đối chiếu transcript.",
    content: "Sai lầm lớn nhất khi luyện nghe là vừa nghe vừa nhìn phụ đề Tiếng Việt. Điều này làm não bộ lười biếng và chỉ đọc chữ chứ không hề xử lý âm thanh.\n\nQuy trình luyện nghe 3 bước chuẩn khoa học:\n- Lần 1: Nghe không xem transcript để nắm ý chính.\n- Lần 2: Nghe lại và chép chính tả (Dictation) những từ nghe được.\n- Lần 3: Mở transcript đối chiếu, đánh dấu những từ nối âm (linking sounds) hoặc biến âm mà bạn đã bỏ lỡ."
  },
  {
    id: "off-3",
    category: "grammar",
    categoryLabel: "✍️ Grammar",
    title: "Cách làm chủ 12 thì Tiếng Anh trong 3 ngày",
    author: "EngWithMe Teacher",
    date: "2026-07-20",
    views: 420,
    likes: 67,
    excerpt: "Hiểu bản chất mốc thời gian (Quá khứ, Hiện tại, Tương lai) kết hợp với thể (Đơn, Tiếp diễn, Hoàn thành) thay vì học vẹt công thức.",
    content: "Đừng cố học thuộc lòng 12 công thức thì một cách khô khan. Hãy hình dung thời gian là một trục tọa độ 3x4:\n- 3 Mốc thời gian: Past (Quá khứ), Present (Hiện tại), Future (Tương lai).\n- 4 Thể hành động: Simple (Đơn - sự thật/thói quen), Continuous (Tiếp diễn - đang xảy ra), Perfect (Hoàn thành - kết quả), Perfect Continuous (Hoàn thành tiếp diễn).\n\nKết hợp 3 mốc thời gian x 4 thể hành động = đúng 12 thì Tiếng Anh!"
  }
];

// Sample Leaderboard Dataset
const LEADERBOARD_USERS = [
  { rank: 1, name: "Nguyễn Tùng Dương", badge: "🥇 Bậc Thầy Chia Sẻ", count: "12 bài viết", xp: "+600 XP" },
  { rank: 2, name: "Trần Mai Anh", badge: "🥈 Blogger Tích Cực", count: "8 bài viết", xp: "+400 XP" },
  { rank: 3, name: "Lê Hoàng Nam", badge: "🥉 Học Viên Chăm Chỉ", count: "5 bài viết", xp: "+250 XP" }
];

let currentActiveCategory = "all";
let currentSearchQuery = "";
let fetchedCommunityBlogs = [];

async function initBlogPage() {
  const reviewWrapper = document.getElementById("review-form-wrapper");
  const approvedFeed = document.getElementById("approved-blogs-feed");
  const officialGrid = document.getElementById("official-articles-grid");

  initBlogFiltersAndSearch();
  renderLeaderboard();
  initReaderModal();
  renderOfficialArticles(officialGrid);

  if (approvedFeed) {
    await loadApprovedBlogs(approvedFeed);
  }

  if (!reviewWrapper) return;

  const cachedUser = typeof getCachedAuthUser === "function" ? getCachedAuthUser() : null;
  if (cachedUser && (cachedUser.id || cachedUser.email)) {
    renderReviewForm(reviewWrapper, cachedUser);
  } else {
    const fetcher = typeof fetchAuth === "function" ? fetchAuth : fetch;
    fetcher("api/me.php")
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((result) => {
        if (result && result.ok && result.user) {
          if (typeof persistAuthUser === "function") {
            persistAuthUser(result.user);
          }
          renderReviewForm(reviewWrapper, result.user);
        } else {
          const fallbackUser = typeof getCachedAuthUser === "function" ? getCachedAuthUser() : null;
          if (fallbackUser && (fallbackUser.id || fallbackUser.email)) {
            renderReviewForm(reviewWrapper, fallbackUser);
          } else {
            renderGuestReviewBanner(reviewWrapper);
          }
        }
      })
      .catch(() => {
        const fallbackUser = typeof getCachedAuthUser === "function" ? getCachedAuthUser() : null;
        if (fallbackUser && (fallbackUser.id || fallbackUser.email)) {
          renderReviewForm(reviewWrapper, fallbackUser);
        } else {
          renderGuestReviewBanner(reviewWrapper);
        }
      });
  }
}

// 1. Filter Chips & Instant Search Setup
function initBlogFiltersAndSearch() {
  const chips = document.querySelectorAll("[data-blog-category]");
  const searchInput = document.querySelector("[data-blog-search]");

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      currentActiveCategory = chip.dataset.blogCategory || "all";
      applyBlogFilters();
    });
  });

  searchInput?.addEventListener("input", (e) => {
    currentSearchQuery = e.target.value.toLowerCase().trim();
    applyBlogFilters();
  });
}

function applyBlogFilters() {
  // Filter official articles
  const officialGrid = document.getElementById("official-articles-grid");
  if (officialGrid) renderOfficialArticles(officialGrid);

  // Filter community articles
  const approvedFeed = document.getElementById("approved-blogs-feed");
  if (approvedFeed) renderCommunityBlogsList(approvedFeed, fetchedCommunityBlogs);
}

// 2. Render Official Articles
function renderOfficialArticles(container) {
  if (!container) return;

  const filtered = OFFICIAL_ARTICLES.filter((art) => {
    const matchCat = currentActiveCategory === "all" || art.category === currentActiveCategory || currentActiveCategory === "tips";
    const matchQuery = !currentSearchQuery || art.title.toLowerCase().includes(currentSearchQuery) || art.content.toLowerCase().includes(currentSearchQuery);
    return matchCat && matchQuery;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 24px; color: #94a3b8;">Không tìm thấy bài viết chính thức nào phù hợp.</div>`;
    return;
  }

  const likedState = JSON.parse(localStorage.getItem("engWithMeBlogLikes") || "{}");

  container.innerHTML = filtered.map((art) => {
    const isLiked = likedState[art.id] || false;
    const currentLikes = art.likes + (isLiked ? 1 : 0);

    return `
      <article class="article-card">
        <div>
          <span class="category-badge">${escapeHtml(art.categoryLabel)}</span>
          <h2 style="margin-top: 10px;">${escapeHtml(art.title)}</h2>
          <p style="margin-top: 10px;">${escapeHtml(art.excerpt)}</p>
        </div>
        <div class="article-card-footer">
          <button type="button" class="blog-action-btn ${isLiked ? 'is-liked' : ''}" data-like-btn="${art.id}">
            <span class="ti-heart"></span> <span>${currentLikes}</span>
          </button>
          <span class="blog-read-link" data-open-article-id="${art.id}">
            Đọc bài viết <span class="ti-arrow-right"></span>
          </span>
        </div>
      </article>
    `;
  }).join('');

  // Bind Likes & Open Modal
  container.querySelectorAll("[data-like-btn]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.likeBtn;
      toggleLikeArticle(id);
      renderOfficialArticles(container);
    });
  });

  container.querySelectorAll("[data-open-article-id]").forEach((link) => {
    link.addEventListener("click", () => {
      const id = link.dataset.openArticleId;
      const article = OFFICIAL_ARTICLES.find((a) => a.id === id);
      if (article) openArticleReaderModal(article);
    });
  });
}

function toggleLikeArticle(id) {
  const likedState = JSON.parse(localStorage.getItem("engWithMeBlogLikes") || "{}");
  likedState[id] = !likedState[id];
  localStorage.setItem("engWithMeBlogLikes", JSON.stringify(likedState));
}

function getTitleBadgeByLevel(level) {
  if (typeof LevelSystem !== "undefined" && typeof LevelSystem.getUserTitleInfo === "function") {
    return LevelSystem.getUserTitleInfo(level).title;
  }
  if (level >= 500) return "🌌 Bậc Thầy Tối Cao Vô Song";
  if (level >= 400) return "👑 Chí Tôn Ngôn Ngữ Vĩnh Cửu";
  if (level >= 270) return "⚡ Thánh Tri Thức Thần Thoại";
  if (level >= 200) return "💎 Thần Thoại Bất Tử EngWithMe";
  if (level >= 150) return "🔥 Bá Chủ Ngôn Ngữ Bất Bại";
  if (level >= 100) return "🌟 Đại Sứ Tiếng Anh Toàn Cầu";
  if (level >= 70) return "🔮 Cao Thủ Thông Thái";
  if (level >= 50) return "⚡ Tướng Quân Từ Vựng";
  if (level >= 30) return "👑 Huyền Thoại EngWithMe";
  if (level >= 10) return "🛡️ Học Sinh Chăm Chỉ";
  return "🥉 Học Viên Tập Sự";
}

// 3. Render Leaderboard Widget (Real DB Query - Top 5)
async function renderLeaderboard() {
  const container = document.getElementById("blog-leaderboard-list");
  if (!container) return;

  // Sync current user's local XP to DB if logged in so they appear on leaderboard
  if (typeof LevelSystem !== "undefined" && typeof LevelSystem.getUserTotalXP === "function") {
    LevelSystem.getUserTotalXP();
  }

  let dbUsers = [];

  try {
    const fetcher = typeof fetchAuth === "function" ? fetchAuth : fetch;
    const res = await fetcher("api/get_leaderboard.php");
    const result = await res.json();
    if (res.ok && result.ok) {
      if (Array.isArray(result.leaderboard)) {
        dbUsers = result.leaderboard;
      } else if (Array.isArray(result.users)) {
        dbUsers = result.users;
      }
    }
  } catch (e) {}

  // Pad up to Top 5 if fewer users exist
  const fullList = [];
  for (let i = 0; i < 5; i++) {
    if (dbUsers[i]) {
      const u = dbUsers[i];
      fullList.push({
        rank: i + 1,
        name: u.name || u.full_name || `Học viên #${u.id}`,
        badge: u.badge || getTitleBadgeByLevel(u.level || 1),
        xp: u.xp || `${u.total_xp || 0} XP`,
        isPlaceholder: false
      });
    } else {
      fullList.push({
        rank: i + 1,
        name: "...",
        badge: "Chưa có học viên",
        xp: "... XP",
        isPlaceholder: true
      });
    }
  }

  container.innerHTML = fullList.map((user, idx) => `
    <div class="leaderboard-item" style="${user.isPlaceholder ? 'opacity: 0.55;' : ''}">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span class="leaderboard-rank" style="font-size: 0.95rem;">${medalIcons[idx] || (idx + 1)}</span>
        <div>
          <strong style="color: #f8fafc; font-size: 0.88rem; display: block;">${escapeHtml(user.name)}</strong>
          <small style="color: ${user.isPlaceholder ? '#94a3b8' : '#00ff87'}; font-size: 0.76rem;">${escapeHtml(user.badge)}</small>
        </div>
      </div>
      <span style="font-size: 0.78rem; font-weight: 800; color: ${user.isPlaceholder ? '#94a3b8' : '#ffd700'}; background: rgba(255,215,0,0.1); padding: 3px 8px; border-radius: 99px;">${escapeHtml(user.xp)}</span>
    </div>
  `).join('');
}

// 4. Render & Filter Community Reviews
async function loadApprovedBlogs(container) {
  try {
    const fetcher = typeof fetchAuth === "function" ? fetchAuth : fetch;
    const res = await fetcher("api/get_blogs.php");
    const result = await res.json();

    if (!res.ok || !result.ok || !result.blogs || result.blogs.length === 0) {
      fetchedCommunityBlogs = [];
    } else {
      fetchedCommunityBlogs = result.blogs;
    }
    renderCommunityBlogsList(container, fetchedCommunityBlogs);

  } catch (err) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 20px; color: var(--danger);">Không thể tải cảm nhận từ cộng đồng.</div>`;
  }
}

function renderCommunityBlogsList(container, blogs) {
  if (!blogs || blogs.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 30px; color: #94a3b8; border: 1px dashed rgba(255,255,255,0.1); border-radius: 16px;">
        Chưa có bài viết cảm nhận nào được duyệt. Hãy là người đầu tiên chia sẻ!
      </div>
    `;
    return;
  }

  const filtered = blogs.filter((blog) => {
    const matchCat = currentActiveCategory === "all" || currentActiveCategory === "reviews";
    const matchQuery = !currentSearchQuery || blog.title.toLowerCase().includes(currentSearchQuery) || blog.content.toLowerCase().includes(currentSearchQuery);
    return matchCat && matchQuery;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 24px; color: #94a3b8;">Không có bài viết cộng đồng nào phù hợp.</div>`;
    return;
  }

  container.innerHTML = filtered.map((blog) => {
    const isLiked = !!blog.is_liked;
    const likesCount = blog.likes !== undefined ? blog.likes : (blog.likes_count || 0);
    const viewsCount = blog.views !== undefined ? blog.views : (blog.views_count || 1);

    const starsHtml = Array(5).fill(0).map((_, i) => 
      i < blog.rating
        ? `<span class="star-btn active" style="font-size: 1.05rem; cursor: default; padding: 0 1px;">★</span>`
        : `<span class="star-btn" style="font-size: 1.05rem; cursor: default; padding: 0 1px; opacity: 0.3;">★</span>`
    ).join('');

    const displayTitle = blog.title;
    const displayContent = blog.content;

    return `
      <article class="article-card">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <span class="category-badge"><span class="ti-user"></span> ${escapeHtml(blog.author_name)}</span>
            <div style="display: flex;">${starsHtml}</div>
          </div>
          <h3 style="margin: 0 0 10px; font-size: 1.25rem; color: #ffffff; font-weight: 800;">${escapeHtml(displayTitle)}</h3>
          <p style="margin: 0; font-size: 0.92rem; color: #cbd5e1; line-height: 1.6;">${escapeHtml(displayContent)}</p>
        </div>
        <div class="article-card-footer" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 16px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <button type="button" class="blog-action-btn ${isLiked ? 'is-liked' : ''}" data-comm-like="${blog.id}" title="Thả tim bài viết">
              <span class="ti-heart"></span> <span data-comm-like-count="${blog.id}">${likesCount}</span> Yêu thích
            </button>
            <span style="font-size: 0.82rem; color: #94a3b8; display: inline-flex; align-items: center; gap: 4px;" title="Lượt xem bài viết">
              <span class="ti-eye"></span> <span data-comm-view-count="${blog.id}">${viewsCount}</span> lượt xem
            </span>
          </div>
          <span class="blog-read-link" data-open-comm-id="${blog.id}" style="cursor: pointer;">
            Đọc bài viết <span class="ti-arrow-right"></span>
          </span>
        </div>
      </article>
    `;
  }).join('');

  // Bind Real DB Likes & Modal View Increment
  container.querySelectorAll("[data-comm-like]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const blogId = btn.dataset.commLike;
      const fetcher = typeof fetchAuth === "function" ? fetchAuth : fetch;
      try {
        const formData = new FormData();
        formData.append("id", blogId);
        formData.append("blog_id", blogId);
        const res = await fetcher("api/toggle_blog_like.php", { method: "POST", body: formData });
        const data = await res.json();
        if (res.ok && data.ok) {
          const b = blogs.find(item => String(item.id) === String(blogId));
          if (b) {
            b.is_liked = data.liked;
            b.likes = data.likes !== undefined ? data.likes : data.likes_count;
          }
          btn.classList.toggle("is-liked", data.liked);
          const countSpan = btn.querySelector("[data-comm-like-count]");
          if (countSpan) countSpan.textContent = data.likes !== undefined ? data.likes : data.likes_count;
        } else if (data && data.message) {
          alert(data.message);
        }
      } catch (err) {}
    });
  });

  container.querySelectorAll("[data-open-comm-id]").forEach((link) => {
    link.addEventListener("click", () => {
      const id = Number(link.dataset.openCommId);
      const blog = blogs.find((b) => Number(b.id) === id);
      if (blog) {
        openArticleReaderModal({
          id: `comm-${blog.id}`,
          rawId: blog.id,
          categoryLabel: "⭐ Cảm nhận học viên",
          title: blog.title,
          author: blog.author_name,
          date: new Date(blog.created_at || Date.now()).toLocaleDateString("vi-VN"),
          views: blog.views || blog.views_count || 1,
          likes: blog.likes || blog.likes_count || 0,
          is_liked: blog.is_liked || false,
          content: blog.content
        });
      }
    });
  });
}

// 5. Article Reader Modal
function initReaderModal() {
  const modal = document.getElementById("article-reader-modal");
  const closeBtn = modal?.querySelector("[data-close-modal]");

  closeBtn?.addEventListener("click", () => {
    closeArticleReaderModal();
  });

  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeArticleReaderModal();
  });
}

async function openArticleReaderModal(article) {
  const modal = document.getElementById("article-reader-modal");
  if (!modal) return;

  const viewCountEl = document.getElementById("modal-view-count");
  let currentViews = Number(article.views || article.views_count || 1);

  // Sync / Increment view count in D1 BEFORE modal opens to eliminate visual jump from old -> new count
  if (article.rawId) {
    try {
      const formData = new FormData();
      formData.append("id", article.rawId);
      formData.append("blog_id", article.rawId);
      const fetcher = typeof fetchAuth === "function" ? fetchAuth : fetch;
      const res = await fetcher("api/increment_blog_view.php", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.ok) {
        const serverViews = data.views !== undefined ? data.views : data.views_count;
        if (serverViews !== undefined) {
          currentViews = serverViews;
          article.views = serverViews;
          const cardSpan = document.querySelector(`[data-comm-view-count="${article.rawId}"]`);
          if (cardSpan) cardSpan.textContent = serverViews;
        }
      }
    } catch (e) {}
  }

  document.getElementById("modal-category").textContent = article.categoryLabel || "BLOG";
  document.getElementById("modal-title").textContent = article.title;
  document.getElementById("modal-author").textContent = article.author;
  document.getElementById("modal-date").textContent = article.date;
  if (viewCountEl) viewCountEl.textContent = currentViews;

  const contentEl = document.getElementById("modal-content");
  contentEl.innerHTML = article.content.split("\n\n").map((p) => `<p style="margin-bottom: 14px;">${escapeHtml(p)}</p>`).join('');

  const likeCountEl = document.getElementById("modal-like-count");
  const modalLikeBtn = document.getElementById("modal-like-btn");

  if (likeCountEl) likeCountEl.textContent = article.likes || 0;
  if (modalLikeBtn) {
    modalLikeBtn.classList.toggle("is-liked", !!article.is_liked);
    modalLikeBtn.onclick = async () => {
      if (article.rawId) {
        try {
          const formData = new FormData();
          formData.append("id", article.rawId);
          formData.append("blog_id", article.rawId);
          const fetcher = typeof fetchAuth === "function" ? fetchAuth : fetch;
          const res = await fetcher("api/toggle_blog_like.php", { method: "POST", body: formData });
          const data = await res.json();
          if (res.ok && data.ok) {
            article.is_liked = data.liked;
            article.likes = data.likes !== undefined ? data.likes : data.likes_count;
            modalLikeBtn.classList.toggle("is-liked", data.liked);
            if (likeCountEl) likeCountEl.textContent = article.likes;
            const feed = document.getElementById("approved-blogs-feed");
            if (feed) loadApprovedBlogs(feed);
          }
        } catch (e) {}
      }
    };
  }

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}

function closeArticleReaderModal() {
  const modal = document.getElementById("article-reader-modal");
  if (modal) {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }
}

function renderGuestReviewBanner(container) {
  const bloggerUsername = document.getElementById("blogger-username");
  if (bloggerUsername) bloggerUsername.textContent = "Blogger: Khách";

  container.innerHTML = `
    <div style="text-align: center; padding: 30px 15px; background: rgba(56, 189, 248, 0.05); border-radius: var(--radius); border: 1px dashed rgba(56, 189, 248, 0.25);">
      <p style="color: var(--muted); margin-bottom: 18px; font-size: 15px;">Bạn cần đăng nhập tài khoản để có thể đăng cảm nhận và đánh giá website.</p>
      <a class="btn btn-primary" href="login.html" style="display: inline-flex; align-items: center; gap: 8px;">
        <span class="ti-shift-right"></span> Đăng nhập để viết blog
      </a>
    </div>
  `;
}

function renderReviewForm(container, user) {
  const bloggerUsername = document.getElementById("blogger-username");
  if (bloggerUsername) bloggerUsername.textContent = `Blogger: ${user.name || 'Học viên'}`;

  container.innerHTML = `
    <form id="submit-review-form" style="display: grid; gap: 14px;">
      <div style="display: grid; gap: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.9rem; font-weight: 600; color: #cbd5e1;">Tiêu đề bài viết</span>
          <small id="title-char-warn" style="font-size: 0.78rem; color: #94a3b8; transition: all 0.25s ease;">Max 36 ký tự (0/36)</small>
        </div>
        <input type="text" name="title" maxlength="36" placeholder="Nhập tiêu đề ngắn gọn (ví dụ: Trải nghiệm học tuyệt vời)" required style="background: rgba(2, 6, 23, 0.4); border: 1px solid rgba(125, 211, 252, 0.24); border-radius: 10px; color: #f8fbff; padding: 10px 14px; font-size: 0.92rem; width: 100%; transition: all 0.25s ease; outline: none;">
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(2, 6, 23, 0.35); border: 1px solid rgba(125, 211, 252, 0.16); padding: 10px 14px; border-radius: 10px;">
        <span style="font-size: 0.9rem; font-weight: 600; color: #cbd5e1;">Đánh giá trải nghiệm</span>
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="star-rating">
            <span class="star-btn active" data-value="1">★</span>
            <span class="star-btn active" data-value="2">★</span>
            <span class="star-btn active" data-value="3">★</span>
            <span class="star-btn active" data-value="4">★</span>
            <span class="star-btn active" data-value="5">★</span>
          </div>
          <span id="rating-text-badge" style="font-size: 0.8rem; font-weight: 700; color: #00ff87; background: rgba(0, 255, 135, 0.1); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(0, 255, 135, 0.2);">5/5 Rất tốt</span>
        </div>
        <input type="hidden" name="rating" id="review-rating-value" value="5">
      </div>

      <div style="display: grid; gap: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.9rem; font-weight: 600; color: #cbd5e1;">Nội dung cảm nhận</span>
          <small id="content-char-warn" style="font-size: 0.78rem; color: #94a3b8; transition: all 0.25s ease;">Max 350 ký tự (0/350)</small>
        </div>
        <textarea name="content" rows="4" maxlength="350" placeholder="Nhập những suy nghĩ, cảm nhận hay bài viết chia sẻ kinh nghiệm học tập của bạn..." required style="background: rgba(2, 6, 23, 0.4); width: 100%; border: 1px solid rgba(125, 211, 252, 0.24); border-radius: 10px; color: #f8fbff; padding: 10px 14px; resize: vertical; font-family: inherit; font-size: 0.92rem; min-height: 90px; transition: all 0.25s ease; outline: none;"></textarea>
      </div>

      <button class="btn btn-primary" type="submit" style="margin-top: 4px; padding: 11px; font-weight: 700; font-size: 0.95rem; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
        <span class="ti-check"></span> Gửi bài viết (+50 XP)
      </button>
      <p class="feedback" id="review-feedback" style="display: none; font-weight: 800; font-size: 14px; margin: 8px 0 0 0; text-align: center;"></p>
    </form>
  `;

  // Init stars & character limit feedback
  const form = container.querySelector("#submit-review-form");
  const titleInput = form.querySelector('input[name="title"]');
  const titleWarn = form.querySelector("#title-char-warn");
  const contentInput = form.querySelector('textarea[name="content"]');
  const contentWarn = form.querySelector("#content-char-warn");
  const ratingTextBadge = form.querySelector("#rating-text-badge");

  const ratingLabels = {
    5: "5/5 Rất tốt",
    4: "4/5 Tốt",
    3: "3/5 Bình thường",
    2: "2/5 Tạm được",
    1: "1/5 Cần cải thiện"
  };

  const checkTitleLimit = () => {
    const len = titleInput.value.length;
    if (len >= 36) {
      titleInput.style.background = "linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(185, 28, 28, 0.15))";
      titleInput.style.border = "1.5px solid #ef4444";
      titleInput.style.boxShadow = "0 0 12px rgba(239, 68, 68, 0.35)";
      titleWarn.innerHTML = "⚠️ Max 36 ký tự!";
      titleWarn.style.color = "#f87171";
      titleWarn.style.fontWeight = "bold";
    } else {
      titleInput.style.background = "rgba(2, 6, 23, 0.4)";
      titleInput.style.border = "1px solid rgba(125, 211, 252, 0.24)";
      titleInput.style.boxShadow = "none";
      titleWarn.innerHTML = `Max 36 ký tự (${len}/36)`;
      titleWarn.style.color = "#94a3b8";
      titleWarn.style.fontWeight = "normal";
    }
  };

  const checkContentLimit = () => {
    const len = contentInput.value.length;
    if (len >= 350) {
      contentInput.style.background = "linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(185, 28, 28, 0.15))";
      contentInput.style.border = "1.5px solid #ef4444";
      contentInput.style.boxShadow = "0 0 12px rgba(239, 68, 68, 0.35)";
      contentWarn.innerHTML = "⚠️ Max 350 ký tự!";
      contentWarn.style.color = "#f87171";
      contentWarn.style.fontWeight = "bold";
    } else {
      contentInput.style.background = "rgba(2, 6, 23, 0.4)";
      contentInput.style.border = "1px solid rgba(125, 211, 252, 0.24)";
      contentInput.style.boxShadow = "none";
      contentWarn.innerHTML = `Max 350 ký tự (${len}/350)`;
      contentWarn.style.color = "#94a3b8";
      contentWarn.style.fontWeight = "normal";
    }
  };

  titleInput.addEventListener("input", checkTitleLimit);
  contentInput.addEventListener("input", checkContentLimit);
  const starContainer = form.querySelector(".star-rating");
  const stars = form.querySelectorAll(".star-btn");
  let currentRating = 5;

  const updateStars = (rating) => {
    if (ratingTextBadge) ratingTextBadge.textContent = ratingLabels[rating] || `${rating}/5`;
    stars.forEach((s) => {
      const val = parseInt(s.getAttribute("data-value"), 10);
      if (val <= rating) {
        s.classList.add("active");
      } else {
        s.classList.remove("active");
      }
    });
  };

  stars.forEach((star) => {
    star.addEventListener("click", () => {
      currentRating = parseInt(star.getAttribute("data-value"), 10);
      form.querySelector("#review-rating-value").value = currentRating;
      updateStars(currentRating);
    });
    star.addEventListener("mouseenter", () => {
      updateStars(parseInt(star.getAttribute("data-value"), 10));
    });
  });

  if (starContainer) {
    starContainer.addEventListener("mouseleave", () => {
      updateStars(currentRating);
    });
  }

  // Handle submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const feedback = form.querySelector("#review-feedback");
    const submitBtn = form.querySelector('button[type="submit"]');

    try {
      submitBtn.disabled = true;
      feedback.style.display = "block";
      feedback.textContent = "Đang gửi bài viết...";
      feedback.style.color = "var(--primary)";

      const formData = new FormData(form);
      const fetcher = typeof fetchAuth === "function" ? fetchAuth : fetch;
      const res = await fetcher("api/submit_blog.php", {
        method: "POST",
        body: formData
      });
      const result = await res.json();

      if (!res.ok || !result.ok) {
        feedback.textContent = result.message || "Không thể gửi cảm nhận.";
        feedback.style.color = "var(--danger)";
        return;
      }

      feedback.textContent = result.message || "Đã gửi bài viết thành công! Bài viết đã được chuyển tới Admin để kiểm duyệt.";
      feedback.style.color = result.status === "approved" ? "#00ff87" : "#38bdf8";

      if (typeof LevelSystem !== "undefined" && typeof LevelSystem.addXP === "function") {
        LevelSystem.addXP(50, "Đóng góp bài viết Blog");
      }
      renderLeaderboard();

      form.reset();
      currentRating = 5;
      updateStars(5);

      // Reload list
      const approvedFeed = document.getElementById("approved-blogs-feed");
      if (approvedFeed) loadApprovedBlogs(approvedFeed);

    } catch (err) {
      feedback.textContent = "Lỗi kết nối máy chủ.";
      feedback.style.color = "var(--danger)";
    } finally {
      submitBtn.disabled = false;
    }
  });
}
