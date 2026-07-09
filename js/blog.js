function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

async function initBlogPage() {
  const reviewWrapper = document.getElementById("review-form-wrapper");
  const approvedFeed = document.getElementById("approved-blogs-feed");

  if (approvedFeed) {
    loadApprovedBlogs(approvedFeed);
  }

  if (!reviewWrapper) return;

  const cachedUser = typeof getCachedAuthUser === "function" ? getCachedAuthUser() : null;
  if (cachedUser) {
    renderReviewForm(reviewWrapper, cachedUser);
  } else {
    // Check with server to verify
    fetch("api/me.php", { credentials: "same-origin" })
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((result) => {
        if (result.ok && result.user) {
          if (typeof persistAuthUser === "function") {
            persistAuthUser(result.user);
          }
          renderReviewForm(reviewWrapper, result.user);
        } else {
          renderGuestReviewBanner(reviewWrapper);
        }
      })
      .catch(() => {
        renderGuestReviewBanner(reviewWrapper);
      });
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
      <label style="display: grid; gap: 6px;">Tiêu đề bài viết
        <input type="text" name="title" placeholder="Nhập tiêu đề ngắn gọn (ví dụ: Trải nghiệm học tuyệt vời)" required style="background: rgba(2, 6, 23, 0.4);">
      </label>
      
      <label style="display: grid; gap: 6px;">Đánh giá chất lượng
        <div class="star-rating" style="display: flex; gap: 6px; font-size: 1.2rem; margin-top: 4px;">
          <span class="star-btn" data-value="1" style="cursor: pointer; transition: all 0.2s; display: inline-block; font-size: 1.5rem; line-height: 1;">★</span>
          <span class="star-btn" data-value="2" style="cursor: pointer; transition: all 0.2s; display: inline-block; font-size: 1.5rem; line-height: 1;">★</span>
          <span class="star-btn" data-value="3" style="cursor: pointer; transition: all 0.2s; display: inline-block; font-size: 1.5rem; line-height: 1;">★</span>
          <span class="star-btn" data-value="4" style="cursor: pointer; transition: all 0.2s; display: inline-block; font-size: 1.5rem; line-height: 1;">★</span>
          <span class="star-btn" data-value="5" style="cursor: pointer; transition: all 0.2s; display: inline-block; font-size: 1.5rem; line-height: 1;">★</span>
        </div>
        <input type="hidden" name="rating" id="review-rating-value" value="5">
      </label>

      <label style="display: grid; gap: 6px;">Nội dung cảm nhận
        <textarea name="content" rows="4" placeholder="Nhập những suy nghĩ, cảm nhận hay bài viết chia sẻ kinh nghiệm học tập của bạn..." required style="background: rgba(2, 6, 23, 0.4); width: 100%; border: 1px solid rgba(125, 211, 252, 0.24); border-radius: var(--radius); color: #f8fbff; padding: 11px 12px; resize: vertical; font-family: inherit; font-size: 14px;"></textarea>
      </label>

      <button class="btn btn-primary" type="submit" style="margin-top: 8px;">
        <span class="ti-check"></span> Gửi bài viết
      </button>
      <p class="feedback" id="review-feedback" style="min-height: 20px; font-weight: 800; font-size: 14px; margin: 0;"></p>
    </form>
  `;

  // Init stars
  const form = container.querySelector("#submit-review-form");
  const stars = form.querySelectorAll(".star-btn");
  let currentRating = 5;

  const updateStars = (rating) => {
    stars.forEach((s) => {
      const val = parseInt(s.getAttribute("data-value"));
      if (val <= rating) {
        s.style.background = "linear-gradient(135deg, #2ee878, #38bdf8)";
        s.style.webkitBackgroundClip = "text";
        s.style.webkitTextFillColor = "transparent";
        s.style.filter = "drop-shadow(0 0 4px rgba(46, 232, 120, 0.7))";
        s.style.opacity = "1";
      } else {
        s.style.background = "none";
        s.style.webkitBackgroundClip = "initial";
        s.style.webkitTextFillColor = "rgba(166, 180, 201, 0.15)";
        s.style.filter = "none";
        s.style.opacity = "0.4";
      }
    });
  };

  stars.forEach((star) => {
    star.addEventListener("click", () => {
      currentRating = parseInt(star.getAttribute("data-value"));
      form.querySelector("#review-rating-value").value = currentRating;
      updateStars(currentRating);
    });
    star.addEventListener("mouseover", () => {
      updateStars(parseInt(star.getAttribute("data-value")));
    });
    star.addEventListener("mouseleave", () => {
      updateStars(currentRating);
    });
  });

  // Handle submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const feedback = form.querySelector("#review-feedback");
    const submitBtn = form.querySelector('button[type="submit"]');

    try {
      submitBtn.disabled = true;
      feedback.textContent = "Đang gửi bài viết...";
      feedback.style.color = "var(--primary)";

      const formData = new FormData(form);
      const res = await fetch("api/submit_blog.php", {
        method: "POST",
        body: formData,
        credentials: "same-origin"
      });
      const result = await res.json();

      if (!res.ok || !result.ok) {
        feedback.textContent = result.message || "Không thể gửi cảm nhận.";
        feedback.style.color = "var(--danger)";
        return;
      }

      feedback.textContent = "✓ " + result.message;
      feedback.style.color = "var(--primary)";
      form.reset();
      currentRating = 5;
      updateStars(5);

    } catch (err) {
      feedback.textContent = "Lỗi kết nối máy chủ.";
      feedback.style.color = "var(--danger)";
    } finally {
      submitBtn.disabled = false;
    }
  });
}

async function loadApprovedBlogs(container) {
  try {
    const res = await fetch("api/get_blogs.php");
    const result = await res.json();

    if (!res.ok || !result.ok || !result.blogs || result.blogs.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--muted); border: 1px dashed var(--line); border-radius: var(--radius);">
          Chưa có cảm nhận cộng đồng nào được duyệt. Hãy là người đầu tiên chia sẻ!
        </div>
      `;
      return;
    }

    container.innerHTML = result.blogs.map((blog) => {
      const starsHtml = Array(5).fill(0).map((_, i) => 
        i < blog.rating
          ? `<span style="background: linear-gradient(135deg, #2ee878, #38bdf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; display: inline-block; font-size: 0.95rem; line-height: 1; filter: drop-shadow(0 0 3px rgba(46, 232, 120, 0.45));">★</span>`
          : `<span style="color: rgba(166,180,201,0.15); display: inline-block; font-size: 0.95rem; line-height: 1;">★</span>`
      ).join('');

      const formattedDate = new Date(blog.created_at).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });

      return `
        <article class="article-card" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%; min-height: 220px;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 8px;">
              <span style="font-weight: 800; font-size: 13px; color: var(--secondary); max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                <span class="ti-user" style="margin-right: 4px;"></span>${escapeHtml(blog.author_name)}
              </span>
              <div style="display: flex;">${starsHtml}</div>
            </div>
            <h3 style="margin: 0 0 10px; font-size: 18px; line-height: 1.3; color: #ffffff;">${escapeHtml(blog.title)}</h3>
            <p style="margin: 0; font-size: 14px; line-height: 1.5; color: var(--muted); overflow: hidden; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical;">${escapeHtml(blog.content)}</p>
          </div>
          <span style="display: block; margin-top: 15px; font-size: 12px; color: rgba(166,180,201,0.5);">${formattedDate}</span>
        </article>
      `;
    }).join('');

  } catch (err) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 20px; color: var(--danger);">Không thể tải cảm nhận từ cộng đồng.</div>`;
  }
}
