// auth.js

function login(role) {
    localStorage.setItem('userRole', role);
    // Setting name to Mantosh when logging in as student
    localStorage.setItem('userName', role === 'admin' ? 'System Admin' : 'Mantosh');
    window.location.href = 'dashboard.html';
}

function logout() {
    localStorage.clear();
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('dashboard.html')) {
        const role = localStorage.getItem('userRole');
        if (!role) {
            window.location.href = 'index.html';
            return;
        }

        const userName = localStorage.getItem('userName');
        document.getElementById('user-name').textContent = userName;
        document.getElementById('user-role-badge').textContent = role;
        
        // Grab first letter of name for the Avatar circle
        document.getElementById('avatar-circle').textContent = userName.charAt(0).toUpperCase();

        if (role === 'admin') {
            document.getElementById('admin-tools').classList.remove('hidden');
        }
    }
});