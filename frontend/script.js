// Automatically redirect 127.0.0.1 to localhost for Google OAuth compatibility
if (typeof window !== "undefined" && window.location && window.location.hostname === "127.0.0.1") {
    window.location.replace(window.location.href.replace("//127.0.0.1", "//localhost"));
}

const API_BASE_URLS = (() => {
    const configured = typeof window !== "undefined" && window.__API_BASE_URL__
        ? window.__API_BASE_URL__
        : "";
    if (configured) {
        return [configured.replace(/\/$/, "")];
    }
    const origin = typeof window !== "undefined" && window.location ? window.location.origin : "";
    const hostname = typeof window !== "undefined" && window.location ? window.location.hostname : "";
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

    const candidates = [];
    if (origin && origin.startsWith("http")) {
        candidates.push(`${origin}/api`);
        candidates.push("/api");
    }
    // Only fall back to localhost if running on a local desktop machine!
    // On a mobile phone, probing localhost will fail or hang.
    if (isLocalhost) {
        candidates.push("http://localhost:3000/api");
        candidates.push("http://localhost:8080/api");
    }
    return [...new Set(candidates)];
})();

const GOOGLE_CLIENT_ID = (typeof window !== "undefined" && window.__GOOGLE_CLIENT_ID__)
    || "415741727195-o4f10dgd13hrph7enkmmjge0mtfa2de1.apps.googleusercontent.com";

const GOOGLE_ALLOWED_ORIGINS = (typeof window !== "undefined" && Array.isArray(window.__GOOGLE_ALLOWED_ORIGINS__))
    ? window.__GOOGLE_ALLOWED_ORIGINS__.map(origin => origin.trim().replace(/\/$/, ""))
    : [
        "http://localhost:3000",
        "http://localhost:8080",
        "http://localhost:5500",
        "http://localhost"
    ];

function currentOrigin() {
    return typeof window !== "undefined" && window.location ? window.location.origin : "";
}

function showGoogleOriginHint() {
    const origin = currentOrigin();
    const allowed = GOOGLE_ALLOWED_ORIGINS.map(value => value.replace(/\/$/, ""));
    if (!origin || allowed.includes(origin)) {
        return;
    }

    console.warn(
        "Google OAuth origin note: make sure this origin is listed in Google Cloud Console -> APIs & Services -> Credentials -> OAuth 2.0 Client ID -> Authorized JavaScript origins:\n" +
        origin + "\nAllowed presets: " + allowed.join(", ")
    );
}

function authToken() {
    return localStorage.getItem("authToken");
}

async function apiRequest(path, options = {}) {
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };
    if (authToken() && !headers.Authorization) {
        headers.Authorization = `Bearer ${authToken()}`;
    }

    let lastError = null;
    for (const baseUrl of API_BASE_URLS) {
        try {
            const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
            const body = await response.json().catch(() => ({}));
            if (response.status === 401 && !path.startsWith("/auth/")) {
                clearAuth();
                window.location.href = "index.html";
            }
            if (!response.ok) {
                if (response.status === 404 && baseUrl !== "/api") {
                    continue;
                }
                throw new Error(body.error || "The server could not complete the request.");
            }
            return body;
        } catch (error) {
            lastError = error;
            const message = String(error && error.message ? error.message : error);
            const isConnectionIssue = message.includes("Failed to fetch") || message.includes("fetch") || message.includes("network") || message.includes("not running");
            if (!isConnectionIssue) {
                throw error;
            }
        }
    }

    throw new Error(
        lastError && lastError.message && !lastError.message.includes("fetch")
            ? lastError.message
            : "The library server is not running. Please start the backend and try again."
    );
}

function showApiError(error) {
    console.error(error);
    alert(error.message || "Unable to connect to the library server.");
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function showSignup() {
    document.getElementById("signinForm").classList.add("hidden");
    document.getElementById("signupForm").classList.remove("hidden");
    document.getElementById("authTitle").textContent = "Create Account";
    document.getElementById("authSubtitle").textContent = "Create your library account";
    document.getElementById("authMessage").textContent = "";
    setTimeout(() => renderGoogleButton("googleSignupButton"), 50);
}

function showSignin() {
    document.getElementById("signupForm").classList.add("hidden");
    document.getElementById("signinForm").classList.remove("hidden");
    document.getElementById("authTitle").textContent = "Welcome Back";
    document.getElementById("authSubtitle").textContent = "Sign in to continue to your library";
    document.getElementById("authMessage").textContent = "";
    setTimeout(() => renderGoogleButton("googleLoginButton"), 50);
}

function selectLoginType(button) {
    document.querySelectorAll(".login-type-btn").forEach(option => {
        option.classList.toggle("active", option === button);
    });
    document.getElementById("authTitle").textContent =
        button.dataset.loginRole === "ADMIN" ? "Admin Login" : "User Login";
    document.getElementById("authSubtitle").textContent =
        button.dataset.loginRole === "ADMIN"
            ? "Sign in to manage your library"
            : "Sign in to access your library";
    document.getElementById("authMessage").textContent = "";
}

function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    input.type = input.type === "password" ? "text" : "password";
    button.textContent = input.type === "password" ? "👁" : "🙈";
}

function forgotPassword(event) {
    event.preventDefault();
    const message = document.getElementById("authMessage");
    message.textContent = "Please contact the administrator to reset your password.";
    message.className = "auth-message success";
}

function saveAuth(result) {
    localStorage.setItem("authToken", result.token);
    localStorage.setItem("userRole", result.user.role);
    localStorage.setItem("userEmail", result.user.email);
    localStorage.setItem("userName", result.user.name);
    localStorage.setItem("isLoggedIn", "true");
}

function handleGoogleCredential(response) {
    const message = document.getElementById("authMessage");
    const selectedLogin = document.querySelector(".login-type-btn.active");
    const selectedRole = selectedLogin ? selectedLogin.dataset.loginRole : "USER";

    message.textContent = "Authenticating with Google...";
    message.className = "auth-message";

    apiRequest("/auth/google", {
        method: "POST",
        body: JSON.stringify({ credential: response.credential })
    }).then(result => {
        if (selectedRole === "USER" && result.user.role === "ADMIN") {
            clearAuth();
            throw new Error("This account is registered as an Administrator. Please switch to 'Admin Login' above to sign in.");
        }
        if (selectedRole === "ADMIN" && result.user.role !== "ADMIN") {
            clearAuth();
            throw new Error("This account does not have administrator privileges. Please switch to 'User Login' above to sign in.");
        }
        saveAuth(result);
        redirectByRole();
    }).catch(error => {
        clearAuth();
        message.textContent = error.message;
        message.className = "auth-message error";
    });
}

function renderGoogleButton(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !window.google || !window.google.accounts || !window.google.accounts.id) return;
    try {
        container.innerHTML = "";
        const availableWidth = container.offsetWidth || 280;
        const buttonWidth = Math.min(320, Math.max(220, availableWidth));
        window.google.accounts.id.renderButton(container, {
            theme: "outline",
            size: "large",
            width: buttonWidth,
            text: "continue_with"
        });
    } catch (err) {
        console.warn("Google button render note for " + containerId, err);
    }
}

function initializeGoogleLogin() {
    showGoogleOriginHint();
    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
        setTimeout(initializeGoogleLogin, 400);
        return;
    }
    try {
        window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredential,
            auto_select: false,
            cancel_on_tap_outside: true
        });
        renderGoogleButton("googleLoginButton");
        renderGoogleButton("googleSignupButton");
    } catch (e) {
        console.warn("Google Sign-In initialization note:", e);
    }
}

function clearAuth() {
    ["authToken", "userRole", "userEmail", "userName", "isLoggedIn"].forEach(key => {
        localStorage.removeItem(key);
    });
}

function redirectByRole() {
    window.location.href = localStorage.getItem("userRole") === "ADMIN"
        ? "dashboard.html" : "user-dashboard.html";
}

function initializeAuthentication() {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    document.querySelectorAll(".login-type-btn").forEach(button => {
        button.addEventListener("click", () => selectLoginType(button));
    });

    if (loginForm) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            const message = document.getElementById("authMessage");
            const selectedRole = document.querySelector(".login-type-btn.active").dataset.loginRole;
            try {
                const result = await apiRequest("/auth/login", {
                    method: "POST",
                    body: JSON.stringify({
                        email: document.getElementById("loginEmail").value.trim(),
                        password: document.getElementById("loginPassword").value
                    })
                });
                if (selectedRole === "USER" && result.user.role === "ADMIN") {
                    clearAuth();
                    throw new Error("This account is registered as an Administrator. Please switch to 'Admin Login' above to sign in.");
                }
                if (selectedRole === "ADMIN" && result.user.role !== "ADMIN") {
                    clearAuth();
                    throw new Error("This account does not have administrator privileges. Please switch to 'User Login' above to sign in.");
                }
                saveAuth(result);
                redirectByRole();
            } catch (error) {
                message.textContent = error.message;
                message.className = "auth-message error";
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            const message = document.getElementById("authMessage");
            const password = document.getElementById("signupPassword").value;
            if (password !== document.getElementById("confirmPassword").value) {
                message.textContent = "Passwords do not match.";
                message.className = "auth-message error";
                return;
            }
            try {
                const result = await apiRequest("/auth/register", {
                    method: "POST",
                    body: JSON.stringify({
                        name: document.getElementById("signupName").value.trim(),
                        email: document.getElementById("signupEmail").value.trim(),
                        password
                    })
                });
                saveAuth(result);
                redirectByRole();
            } catch (error) {
                message.textContent = error.message;
                message.className = "auth-message error";
            }
        });
    }
}

function renderBooks(books) {
    const table = document.getElementById("bookTableBody");
    const userTable = document.getElementById("userBookTableBody");
    const overview = document.getElementById("dashboardBookTableBody");
    const admin = localStorage.getItem("userRole") === "ADMIN";
    const rows = books.map(book => {
        const total = (book.totalCopies !== undefined && book.totalCopies !== null) ? book.totalCopies : 10;
        const avail = (book.availableCopies !== undefined && book.availableCopies !== null) ? book.availableCopies : (book.available ? total : 0);
        const hasCopies = avail > 0;
        const canReturn = avail < total;

        return `
        <tr data-book="${book.bookId} ${escapeHtml(book.title)} ${escapeHtml(book.author)}">
            <td>${book.bookId}</td>
            <td>${escapeHtml(book.title)}</td>
            <td>${escapeHtml(book.author)}</td>
            <td><strong style="color: ${hasCopies ? '#16a34a' : '#dc2626'}; font-size: 14px;">${avail}</strong> <span style="color: #64748b; font-size: 12px;">/ ${total}</span></td>
            <td><span class="${hasCopies ? "status-available" : "status-issued"}">${hasCopies ? `${avail} in Stock` : "Out of Stock"}</span></td>
            ${admin
            ? `<td>
                ${hasCopies ? `<button class="success-btn table-btn" onclick="issueBook(${book.bookId})">Issue</button>` : `<button class="secondary-btn table-btn" disabled style="opacity: 0.5; cursor: not-allowed;">No Copies</button>`}
                ${canReturn ? `<button class="primary-btn table-btn" onclick="returnBook(${book.bookId})">Return</button>` : ''}
                <button class="danger-btn table-btn" onclick="deleteBook(${book.bookId})">Delete</button>
               </td>`
            : `<td>
                ${hasCopies ? `<button class="success-btn table-btn" onclick="issueBook(${book.bookId})">Issue Book</button>` : `<button class="secondary-btn table-btn" disabled style="opacity: 0.5; cursor: not-allowed;">Out of Stock</button>`}
                ${canReturn ? `<button class="primary-btn table-btn" onclick="returnBook(${book.bookId})">Return Book</button>` : ''}
               </td>`}
        </tr>`;
    }).join("");

    if (table) table.innerHTML = rows || '<tr><td colspan="6">No books found.</td></tr>';
    if (userTable) userTable.innerHTML = rows || '<tr><td colspan="6">No books found.</td></tr>';
    if (overview) {
        overview.innerHTML = books.length ? books.slice(0, 5).map(book => {
            const total = (book.totalCopies !== undefined && book.totalCopies !== null) ? book.totalCopies : 10;
            const avail = (book.availableCopies !== undefined && book.availableCopies !== null) ? book.availableCopies : (book.available ? total : 0);
            return `
            <tr>
                <td>${book.bookId}</td>
                <td>${escapeHtml(book.title)}</td>
                <td>${escapeHtml(book.author)}</td>
                <td><strong style="color: ${avail > 0 ? '#16a34a' : '#dc2626'}">${avail}</strong> / ${total}</td>
                <td><span class="${avail > 0 ? "status-available" : "status-issued"}">${avail > 0 ? "In Stock" : "Out of Stock"}</span></td>
            </tr>`;
        }).join("")
            : '<tr><td colspan="5">No books found.</td></tr>';
    }
}

function renderMembers(members) {
    const targets = ["memberTableBody", "userMemberTableBody"];
    targets.forEach(id => {
        const table = document.getElementById(id);
        if (table) {
            table.innerHTML = members.length
                ? members.map(member => `<tr><td>${member.memberId}</td><td>${escapeHtml(member.name)}</td></tr>`).join("")
                : '<tr><td colspan="2">No members found.</td></tr>';
        }
    });
}

async function loadLibraryData() {
    try {
        const books = await apiRequest("/books");
        renderBooks(books);
        const totalCopiesSum = books.reduce((sum, b) => sum + ((b.totalCopies !== undefined && b.totalCopies !== null) ? b.totalCopies : 10), 0);
        const availableCopiesSum = books.reduce((sum, b) => sum + ((b.availableCopies !== undefined && b.availableCopies !== null) ? b.availableCopies : (b.available ? 10 : 0)), 0);
        const issuedCopiesSum = Math.max(0, totalCopiesSum - availableCopiesSum);

        const values = {
            totalBooks: books.length,
            availableBooks: availableCopiesSum,
            issuedBooks: issuedCopiesSum
        };
        Object.keys(values).forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = values[id];
        });
    } catch (error) {
        console.error("Unable to load books:", error);
        const table = document.getElementById("userBookTableBody") || document.getElementById("bookTableBody");
        if (table) table.innerHTML = `<tr><td colspan="6">${escapeHtml(error.message)}</td></tr>`;
    }
    if (document.getElementById("memberTableBody")) {
        await loadMembers();
    }
}

async function loadMembers() {
    try {
        const members = await apiRequest("/members");
        renderMembers(members);
        const totalMembers = document.getElementById("totalMembers");
        if (totalMembers) totalMembers.textContent = members.length;
    } catch (error) {
        console.error("Unable to load members:", error);
        const table = document.getElementById("memberTableBody");
        if (table) table.innerHTML = `<tr><td colspan="2">${escapeHtml(error.message)}</td></tr>`;
    }
}

function showSection(sectionId) {
    document.querySelectorAll(".content-section").forEach(section => {
        section.classList.toggle("active", section.id === sectionId);
    });
    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.toggle("active", link.dataset.section === sectionId);
    });
    if (sectionId === "members") {
        loadMembers();
    }
    if (sectionId === "requests") {
        loadIssueRequests();
    }
    if (sectionId === "return-requests") {
        loadReturnRequests();
    }
    if (sectionId === "member-requests") {
        loadMemberRequests();
    }
}

function openUserCatalogue() {
    openUserSection("userDashboard");
}

function openUserSection(sectionId) {
    const dashboard = document.getElementById("userDashboard");
    const membersSection = document.getElementById("userMembersSection");
    const catBtn = document.getElementById("userCatalogueNavBtn");
    const memBtn = document.getElementById("userMembersNavBtn");
    const pageTitle = document.getElementById("userPageTitle");
    const pageSubtitle = document.getElementById("userPageSubtitle");

    if (dashboard) dashboard.style.display = sectionId === "userDashboard" ? "block" : "none";
    if (membersSection) membersSection.style.display = sectionId === "userMembersSection" ? "block" : "none";

    if (catBtn) catBtn.classList.toggle("active", sectionId === "userDashboard");
    if (memBtn) memBtn.classList.toggle("active", sectionId === "userMembersSection");

    if (sectionId === "userMembersSection") {
        if (pageTitle) pageTitle.textContent = "Library Members";
        if (pageSubtitle) pageSubtitle.textContent = "View registered library members";
        loadMembers();
    } else {
        if (pageTitle) pageTitle.textContent = "Library Catalogue";
        if (pageSubtitle) pageSubtitle.textContent = "Browse available books";
    }
}

function openUserMemberModal() {
    const modal = document.getElementById("userMemberModal");
    if (!modal) return;
    const nameInput = document.getElementById("userMemberName");
    if (nameInput && !nameInput.value) {
        const storedName = localStorage.getItem("userName");
        if (storedName) nameInput.value = storedName;
    }
    modal.classList.add("show");
}

function closeUserMemberModal() {
    const modal = document.getElementById("userMemberModal");
    if (modal) modal.classList.remove("show");
}

async function submitMemberRequest() {
    const idInput = document.getElementById("userMemberId");
    const nameInput = document.getElementById("userMemberName");
    const memberId = idInput ? idInput.value.trim() : "";
    const name = nameInput ? nameInput.value.trim() : "";

    if (!memberId || !/^[1-9]\d*$/.test(memberId)) {
        return alert("Please enter a valid Member ID (positive number).");
    }
    if (!name) {
        return alert("Please enter your Member Name.");
    }

    try {
        const response = await apiRequest("/member-requests", {
            method: "POST",
            body: JSON.stringify({ memberId: Number(memberId), name })
        });
        alert(response.message || "Membership request submitted successfully.");
        if (idInput) idInput.value = "";
        closeUserMemberModal();
    } catch (error) {
        showApiError(error);
    }
}

function searchBooks() {
    const input = document.getElementById("bookSearch");
    if (!input) return;
    const query = input.value.toLowerCase().trim();
    document.querySelectorAll("#bookTableBody tr, #userBookTableBody tr").forEach(row => {
        row.hidden = query !== "" && !(row.dataset.book || "").toLowerCase().includes(query);
    });
}

function openBookModal() { document.getElementById("bookModal").classList.add("show"); }
function closeBookModal() { document.getElementById("bookModal").classList.remove("show"); }
function openMemberModal() { document.getElementById("memberModal").classList.add("show"); }
function closeMemberModal() { document.getElementById("memberModal").classList.remove("show"); }

async function addBook() {
    const bookId = document.getElementById("bookId").value.trim();
    const title = document.getElementById("bookTitle").value.trim();
    const author = document.getElementById("bookAuthor").value.trim();
    const copiesInput = document.getElementById("bookCopies");
    const copies = copiesInput ? copiesInput.value.trim() : "";

    if (bookId && !/^[1-9]\d*$/.test(bookId)) return alert("Book ID must be a positive whole number.");
    if (!title || !author) return alert("Book title and author are required.");
    if (copies && !/^[1-9]\d*$/.test(copies)) return alert("Number of copies must be a positive whole number.");

    try {
        const book = { title, author };
        if (bookId) book.bookId = Number(bookId);
        book.copies = copies ? Number(copies) : 10;
        await apiRequest("/books", { method: "POST", body: JSON.stringify(book) });
        document.getElementById("bookId").value = "";
        document.getElementById("bookTitle").value = "";
        document.getElementById("bookAuthor").value = "";
        if (copiesInput) copiesInput.value = "10";
        closeBookModal();
        await loadLibraryData();
    } catch (error) { showApiError(error); }
}

async function addMember() {
    const name = document.getElementById("memberName").value.trim();
    if (!name) return alert("Member name is required.");
    try {
        await apiRequest("/members", { method: "POST", body: JSON.stringify({ name }) });
        document.getElementById("memberName").value = "";
        closeMemberModal();
        await loadLibraryData();
    } catch (error) { showApiError(error); }
}

async function deleteBook(bookId) {
    if (!window.confirm(`Delete book ${bookId}? This cannot be undone.`)) {
        return;
    }

    try {
        await apiRequest(`/books/${bookId}`, { method: "DELETE" });
        await loadLibraryData();
    } catch (error) {
        showApiError(error);
    }
}

async function updateBookStatus(bookId, action) {
    await apiRequest(`/books/${bookId}/${action}`, { method: "PUT" });
    await loadLibraryData();
}

async function loadIssueRequests() {
    const table = document.getElementById("issueRequestsTableBody");
    if (!table) return;
    try {
        const requests = await apiRequest("/issue-requests");
        table.innerHTML = requests.length
            ? requests.map(request => `<tr>
                <td>${request.requestId}</td>
                <td>${request.bookId} - ${escapeHtml(request.title)}</td>
                <td>${escapeHtml(request.userName)}</td>
                <td>${escapeHtml(request.email)}</td>
                <td>
                    <button class="success-btn table-btn" onclick="processIssueRequest(${request.requestId}, 'approve')">Approve</button>
                    <button class="danger-btn table-btn" onclick="processIssueRequest(${request.requestId}, 'reject')">Reject</button>
                </td>
            </tr>`).join("")
            : '<tr><td colspan="5">No pending issue requests.</td></tr>';
    } catch (error) {
        table.innerHTML = `<tr><td colspan="5">${escapeHtml(error.message)}</td></tr>`;
    }
}

async function processIssueRequest(requestId, action) {
    try {
        await apiRequest(`/issue-requests/${requestId}/${action}`, { method: "PUT" });
        await loadIssueRequests();
        await loadLibraryData();
    } catch (error) {
        showApiError(error);
    }
}

async function loadReturnRequests() {
    const table = document.getElementById("returnRequestsTableBody");
    if (!table) return;
    try {
        const requests = await apiRequest("/return-requests");
        table.innerHTML = requests.length
            ? requests.map(request => `<tr>
                <td>${request.requestId}</td>
                <td>${request.bookId} - ${escapeHtml(request.title)}</td>
                <td>${escapeHtml(request.userName)}</td>
                <td>${escapeHtml(request.email)}</td>
                <td>
                    <button class="success-btn table-btn" onclick="processReturnRequest(${request.requestId}, 'approve')">Approve</button>
                    <button class="danger-btn table-btn" onclick="processReturnRequest(${request.requestId}, 'reject')">Reject</button>
                </td>
            </tr>`).join("")
            : '<tr><td colspan="5">No pending return requests.</td></tr>';
    } catch (error) {
        table.innerHTML = `<tr><td colspan="5">${escapeHtml(error.message)}</td></tr>`;
    }
}

async function processReturnRequest(requestId, action) {
    try {
        await apiRequest(`/return-requests/${requestId}/${action}`, { method: "PUT" });
        await loadReturnRequests();
        await loadLibraryData();
    } catch (error) {
        showApiError(error);
    }
}

async function loadMemberRequests() {
    const table = document.getElementById("memberRequestsTableBody");
    if (!table) return;
    try {
        const requests = await apiRequest("/member-requests");
        table.innerHTML = requests.length
            ? requests.map(request => `<tr>
                <td>${request.requestId}</td>
                <td><strong>#${request.memberId}</strong></td>
                <td>${escapeHtml(request.name)}</td>
                <td>${escapeHtml(request.userName)}</td>
                <td>${escapeHtml(request.email)}</td>
                <td>
                    <button class="success-btn table-btn" onclick="processMemberRequest(${request.requestId}, 'approve')">Approve</button>
                    <button class="danger-btn table-btn" onclick="processMemberRequest(${request.requestId}, 'reject')">Reject</button>
                </td>
            </tr>`).join("")
            : '<tr><td colspan="6">No pending member requests.</td></tr>';
    } catch (error) {
        table.innerHTML = `<tr><td colspan="6">${escapeHtml(error.message)}</td></tr>`;
    }
}

async function processMemberRequest(requestId, action) {
    try {
        await apiRequest(`/member-requests/${requestId}/${action}`, { method: "PUT" });
        await loadMemberRequests();
        await loadLibraryData();
    } catch (error) {
        showApiError(error);
    }
}

async function issueBook(bookId) {
    let targetId = bookId;
    if (targetId === undefined) {
        const input = document.getElementById("issueBookId");
        targetId = input ? input.value.trim() : null;
    }
    if (!targetId || !/^[1-9]\d*$/.test(String(targetId))) {
        return alert("Please enter a valid Book ID.");
    }
    const idNum = Number(targetId);
    const isAdmin = localStorage.getItem("userRole") === "ADMIN";
    const confirmMsg = isAdmin
        ? `Issue Book #${idNum} immediately?`
        : `Submit a request to borrow Book #${idNum}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
        const response = await apiRequest(`/books/${idNum}/issue`, { method: "PUT" });
        alert(response.message || "Request processed successfully.");
        const input = document.getElementById("issueBookId");
        if (input) input.value = "";
        await loadLibraryData();
    } catch (error) {
        showApiError(error);
    }
}

async function returnBook(bookId) {
    let targetId = bookId;
    if (targetId === undefined) {
        const input = document.getElementById("returnBookId");
        targetId = input ? input.value.trim() : null;
    }
    if (!targetId || !/^[1-9]\d*$/.test(String(targetId))) {
        return alert("Please enter a valid Book ID.");
    }
    const idNum = Number(targetId);
    const isAdmin = localStorage.getItem("userRole") === "ADMIN";
    const confirmMsg = isAdmin
        ? `Mark Book #${idNum} as returned?`
        : `Submit a request to return Book #${idNum}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
        const response = await apiRequest(`/books/${idNum}/return`, { method: "PUT" });
        alert(response.message || "Request processed successfully.");
        const input = document.getElementById("returnBookId");
        if (input) input.value = "";
        await loadLibraryData();
    } catch (error) {
        showApiError(error);
    }
}

async function logout() {
    try {
        if (authToken()) await apiRequest("/auth/logout", { method: "POST" });
    } catch (error) {
        console.warn("Logout request failed", error);
    } finally {
        clearAuth();
        window.location.href = "index.html";
    }
}

function renderCurrentUser() {
    const badges = document.querySelectorAll(".current-user-badge");
    const name = localStorage.getItem("userName") || "User";
    const role = localStorage.getItem("userRole") || "USER";
    badges.forEach(badge => {
        badge.innerHTML = `
            <div class="user-badge-chip">
                <span class="badge-avatar">👤</span>
                <span class="badge-name">${escapeHtml(name)}</span>
                <span class="badge-role ${role.toLowerCase()}">${role}</span>
            </div>
        `;
    });
}

function enforceDashboardAccess() {
    const isDashboard = document.getElementById("dashboard") !== null;
    const isUserDashboard = document.getElementById("userDashboard") !== null;
    if (!authToken()) {
        window.location.href = "index.html";
    } else if (isDashboard && localStorage.getItem("userRole") !== "ADMIN") {
        window.location.href = "user-dashboard.html";
    } else if (isUserDashboard && localStorage.getItem("userRole") === "ADMIN") {
        window.location.href = "dashboard.html";
    }
    renderCurrentUser();
}

document.addEventListener("DOMContentLoaded", function () {
    initializeAuthentication();
    if (document.getElementById("dashboard") || document.getElementById("userDashboard")) {
        enforceDashboardAccess();
        if (authToken()) loadLibraryData();
    }
});

