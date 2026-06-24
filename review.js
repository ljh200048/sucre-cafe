// review.js — Sucré 리뷰 시스템 공통 모듈
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBl9jwmiIQnDjeobk9GBE5I0GO05ONPo6E",
  authDomain: "sucre-cafe.firebaseapp.com",
  projectId: "sucre-cafe",
  storageBucket: "sucre-cafe.firebasestorage.app",
  messagingSenderId: "1014358894897",
  appId: "1:1014358894897:web:ce72ad3e9a8a8e95e96810"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// 리뷰 섹션 HTML 삽입
export function injectReviewSection(menuId, menuName) {
  const existing = document.getElementById('sucre-review-section');
  if (existing) existing.remove();

  const section = document.createElement('div');
  section.id = 'sucre-review-section';
  section.innerHTML = `
    <style>
      .rv-section { padding: 56px 40px; border-top: 0.5px solid #e0ddd8; font-family: 'Cormorant Garamond', serif; }
      .rv-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 32px; }
      .rv-title { font-family: 'Playfair Display', serif; font-size: 23px; font-weight: 400; }
      .rv-summary { font-size: 13px; color: #b8975a; letter-spacing: .06em; }

      /* 작성 폼 */
      .rv-form-wrap { background: #faf9f7; border: 0.5px solid #e8e4e0; padding: 28px 28px 24px; margin-bottom: 36px; }
      .rv-form-title { font-size: 14px; letter-spacing: .06em; color: #1a1a1a; margin-bottom: 18px; }
      .rv-login-msg { font-size: 14px; color: #999; letter-spacing: .02em; }
      .rv-login-msg a { color: #b8975a; text-decoration: underline; }
      .rv-stars-row { display: flex; gap: 6px; margin-bottom: 14px; }
      .rv-star { font-size: 24px; cursor: pointer; color: #e0ddd8; transition: color .15s; }
      .rv-star.on { color: #b8975a; }
      .rv-textarea { width: 100%; padding: 11px 14px; border: 0.5px solid #d8d4cc; font-family: 'Cormorant Garamond', serif; font-size: 14px; resize: vertical; min-height: 80px; outline: none; border-radius: 1px; margin-bottom: 14px; transition: border-color .15s; letter-spacing: .02em; }
      .rv-textarea:focus { border-color: #1a1a1a; }

      /* 사진 업로드 */
      .rv-img-upload { border: 1px dashed #d8d4cc; padding: 16px; text-align: center; cursor: pointer; margin-bottom: 14px; border-radius: 1px; transition: all .15s; }
      .rv-img-upload:hover { border-color: #b8975a; background: #fdf9f2; }
      .rv-img-upload input { display: none; }
      .rv-img-upload-label { font-size: 13px; color: #999; cursor: pointer; letter-spacing: .04em; }
      .rv-img-upload-label span { color: #b8975a; text-decoration: underline; }
      .rv-img-previews { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
      .rv-img-preview { width: 72px; height: 72px; object-fit: cover; border-radius: 2px; border: 0.5px solid #e0ddd8; }
      .rv-progress { height: 3px; background: #f0ede8; border-radius: 2px; overflow: hidden; display: none; margin-bottom: 10px; }
      .rv-progress-fill { height: 100%; background: #b8975a; width: 0%; transition: width .3s; border-radius: 2px; }

      .rv-submit-btn { padding: 11px 28px; background: #1a1a1a; color: #fff; border: none; font-family: 'Cormorant Garamond', serif; font-size: 13px; letter-spacing: .1em; cursor: pointer; transition: background .2s; }
      .rv-submit-btn:hover { background: #333; }
      .rv-submit-btn:disabled { background: #999; cursor: not-allowed; }
      .rv-msg { font-size: 13px; padding: 8px 14px; margin-top: 10px; border-radius: 1px; display: none; }
      .rv-msg.success { background: #f0f8e8; border: 0.5px solid #c8e0a8; color: #5a8a3a; }
      .rv-msg.error { background: #fdf0f0; border: 0.5px solid #f0c0c0; color: #c03030; }

      /* 리뷰 목록 */
      .rv-list { display: flex; flex-direction: column; gap: 0; }
      .rv-card { padding: 24px 0; border-bottom: 0.5px solid #ece9e4; }
      .rv-card-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
      .rv-card-name { font-size: 14px; font-weight: 500; letter-spacing: .04em; color: #1a1a1a; }
      .rv-card-meta { font-size: 12px; color: #aaa; letter-spacing: .02em; }
      .rv-card-stars { color: #b8975a; font-size: 13px; letter-spacing: 2px; margin-bottom: 8px; }
      .rv-card-text { font-size: 14px; color: #555; line-height: 1.85; letter-spacing: .02em; margin-bottom: 10px; }
      .rv-card-imgs { display: flex; gap: 8px; flex-wrap: wrap; }
      .rv-card-img { width: 80px; height: 80px; object-fit: cover; border-radius: 2px; border: 0.5px solid #e0ddd8; cursor: pointer; transition: opacity .15s; }
      .rv-card-img:hover { opacity: .85; }
      .rv-empty { font-size: 14px; color: #bbb; padding: 24px 0; letter-spacing: .02em; }

      /* 이미지 라이트박스 */
      .rv-lightbox { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 9999; align-items: center; justify-content: center; }
      .rv-lightbox.open { display: flex; }
      .rv-lightbox img { max-width: 90vw; max-height: 90vh; object-fit: contain; }
      .rv-lightbox-close { position: absolute; top: 20px; right: 28px; color: #fff; font-size: 28px; cursor: pointer; }

      @media (max-width: 768px) {
        .rv-section { padding: 44px 20px; }
        .rv-form-wrap { padding: 20px; }
      }
    </style>

    <div class="rv-section">
      <div class="rv-header">
        <div class="rv-title">Review</div>
        <div class="rv-summary" id="rv-summary">리뷰 0개</div>
      </div>

      <!-- 작성 폼 -->
      <div class="rv-form-wrap">
        <div class="rv-form-title" id="rv-form-title">리뷰 작성</div>
        <div id="rv-login-area">
          <div class="rv-login-msg">리뷰 작성은 <a href="login.html">로그인</a> 후 이용 가능해요 😊</div>
        </div>
        <div id="rv-write-area" style="display:none">
          <div class="rv-stars-row" id="rv-stars">
            <span class="rv-star" data-v="1">★</span>
            <span class="rv-star" data-v="2">★</span>
            <span class="rv-star" data-v="3">★</span>
            <span class="rv-star" data-v="4">★</span>
            <span class="rv-star" data-v="5">★</span>
          </div>
          <textarea class="rv-textarea" id="rv-text" placeholder="솔직한 후기를 남겨주세요 😊" rows="3"></textarea>
          <div class="rv-img-upload" onclick="document.getElementById('rv-file-input').click()">
            <input type="file" id="rv-file-input" accept="image/*" multiple>
            <label class="rv-img-upload-label">사진을 <span>클릭하여 추가</span> (최대 3장)</label>
          </div>
          <div class="rv-img-previews" id="rv-img-previews"></div>
          <div class="rv-progress" id="rv-progress"><div class="rv-progress-fill" id="rv-progress-fill"></div></div>
          <button class="rv-submit-btn" id="rv-submit-btn" onclick="window._submitReview()">리뷰 등록</button>
          <div class="rv-msg" id="rv-msg"></div>
        </div>
      </div>

      <!-- 리뷰 목록 -->
      <div class="rv-list" id="rv-list">
        <div class="rv-empty">아직 리뷰가 없어요. 첫 번째 리뷰를 작성해보세요!</div>
      </div>
    </div>

    <!-- 라이트박스 -->
    <div class="rv-lightbox" id="rv-lightbox" onclick="this.classList.remove('open')">
      <div class="rv-lightbox-close" onclick="document.getElementById('rv-lightbox').classList.remove('open')">✕</div>
      <img id="rv-lightbox-img" src="">
    </div>
  `;

  // 리뷰 섹션을 footer 바로 앞에 삽입
  const footer = document.querySelector('footer');
  if (footer) footer.before(section);
  else document.body.appendChild(section);

  // 별점 선택
  let selectedRating = 0;
  const stars = section.querySelectorAll('.rv-star');
  stars.forEach(star => {
    star.addEventListener('mouseover', () => {
      stars.forEach(s => s.classList.toggle('on', +s.dataset.v <= +star.dataset.v));
    });
    star.addEventListener('click', () => {
      selectedRating = +star.dataset.v;
      stars.forEach(s => s.classList.toggle('on', +s.dataset.v <= selectedRating));
    });
    star.addEventListener('mouseleave', () => {
      stars.forEach(s => s.classList.toggle('on', +s.dataset.v <= selectedRating));
    });
  });

  // 이미지 미리보기
  let selectedFiles = [];
  document.getElementById('rv-file-input').addEventListener('change', e => {
    const files = [...e.target.files].slice(0, 3);
    selectedFiles = files;
    const previews = document.getElementById('rv-img-previews');
    previews.innerHTML = '';
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => {
        const img = document.createElement('img');
        img.src = ev.target.result;
        img.className = 'rv-img-preview';
        previews.appendChild(img);
      };
      reader.readAsDataURL(f);
    });
  });

  // 리뷰 제출
  window._submitReview = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const text = document.getElementById('rv-text').value.trim();
    if (!text) { showMsg('리뷰 내용을 입력해주세요.', 'error'); return; }
    if (selectedRating === 0) { showMsg('별점을 선택해주세요.', 'error'); return; }

    const btn = document.getElementById('rv-submit-btn');
    btn.disabled = true;
    btn.textContent = '등록 중...';

    try {
      // 이미지 업로드
      const imgUrls = [];
      const prog = document.getElementById('rv-progress');
      const fill = document.getElementById('rv-progress-fill');
      prog.style.display = 'block';

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const storageRef = ref(storage, `reviews/${menuId}/${Date.now()}_${i}`);
        const task = uploadBytesResumable(storageRef, file);
        await new Promise((res, rej) => {
          task.on('state_changed',
            snap => { fill.style.width = ((snap.bytesTransferred / snap.totalBytes) * 100) + '%'; },
            rej,
            async () => { imgUrls.push(await getDownloadURL(task.snapshot.ref)); res(); }
          );
        });
      }
      prog.style.display = 'none';

      // Firestore 저장
      await addDoc(collection(db, 'reviews', menuId, 'items'), {
        uid: user.uid,
        name: user.displayName || user.email.split('@')[0],
        rating: selectedRating,
        text,
        images: imgUrls,
        createdAt: serverTimestamp()
      });

      showMsg('✅ 리뷰가 등록됐어요! 감사합니다 😊', 'success');
      document.getElementById('rv-text').value = '';
      document.getElementById('rv-img-previews').innerHTML = '';
      selectedFiles = [];
      selectedRating = 0;
      stars.forEach(s => s.classList.remove('on'));
      btn.textContent = '리뷰 등록';
      btn.disabled = false;
      loadReviews(menuId);
    } catch (e) {
      showMsg('❌ 등록에 실패했어요. 다시 시도해주세요.', 'error');
      btn.disabled = false;
      btn.textContent = '리뷰 등록';
    }
  };

  function showMsg(msg, type) {
    const el = document.getElementById('rv-msg');
    el.className = 'rv-msg ' + type;
    el.textContent = msg;
    el.style.display = 'block';
  }

  // 라이트박스
  window._openLightbox = (src) => {
    document.getElementById('rv-lightbox-img').src = src;
    document.getElementById('rv-lightbox').classList.add('open');
  };

  // 로그인 상태 확인
  onAuthStateChanged(auth, user => {
    const loginArea = document.getElementById('rv-login-area');
    const writeArea = document.getElementById('rv-write-area');
    if (user) {
      loginArea.style.display = 'none';
      writeArea.style.display = 'block';
    } else {
      loginArea.style.display = 'block';
      writeArea.style.display = 'none';
    }
  });

  loadReviews(menuId);
}

// 리뷰 불러오기
async function loadReviews(menuId) {
  const list = document.getElementById('rv-list');
  const summary = document.getElementById('rv-summary');
  if (!list) return;

  list.innerHTML = '<div class="rv-empty" style="color:#ccc">불러오는 중...</div>';

  try {
    const q = query(collection(db, 'reviews', menuId, 'items'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const reviews = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (reviews.length === 0) {
      list.innerHTML = '<div class="rv-empty">아직 리뷰가 없어요. 첫 번째 리뷰를 작성해보세요!</div>';
      summary.textContent = '리뷰 0개';
      return;
    }

    const avg = (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1);
    summary.textContent = `★ ${avg} · 리뷰 ${reviews.length}개`;

    list.innerHTML = reviews.map(r => `
      <div class="rv-card">
        <div class="rv-card-header">
          <span class="rv-card-name">${maskName(r.name)}</span>
          <span class="rv-card-meta">${formatDate(r.createdAt)}</span>
        </div>
        <div class="rv-card-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
        <div class="rv-card-text">${r.text}</div>
        ${r.images && r.images.length > 0 ? `
          <div class="rv-card-imgs">
            ${r.images.map(url => `<img class="rv-card-img" src="${url}" onclick="window._openLightbox('${url}')">`).join('')}
          </div>
        ` : ''}
      </div>
    `).join('');
  } catch (e) {
    list.innerHTML = '<div class="rv-empty">리뷰를 불러오지 못했어요.</div>';
  }
}

function maskName(name) {
  if (!name) return '익명';
  if (name.length <= 1) return name + '*';
  return name[0] + '*'.repeat(name.length - 1);
}

function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
}
