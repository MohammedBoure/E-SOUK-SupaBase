document.addEventListener('DOMContentLoaded', function() {
  // عناصر واجهة المستخدم
  const loginSection = document.getElementById('loginSection');
  const ordersSection = document.getElementById('ordersSection');
  const loginForm = document.getElementById('loginForm');
  const ordersTable = document.getElementById('ordersTable');
  const logoutBtn = document.getElementById('logoutBtn');

  // تعطيل إرسال النماذج عند الضغط على Enter
  loginForm.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') {
      e.preventDefault();
    }
  });

  // Expose functions for backend.js
  window.adminOrdersFrontend = {
    showLogin: () => {
      loginSection.classList.remove('d-none');
      ordersSection.classList.add('d-none');
      document.body.style.backgroundColor = '#f8f9fa';
    },
    showOrders: () => {
      loginSection.classList.add('d-none');
      ordersSection.classList.remove('d-none');
      document.body.style.backgroundColor = '#f8f9fa';
    },
    displayOrders: (orders, products = {}) => {
      ordersTable.innerHTML = '';
      if (orders.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td colspan="10" class="text-center py-4 text-muted">
            <i class="fas fa-box-open fa-2x mb-2"></i>
            <p>لا توجد طلبات لعرضها</p>
          </td>
        `;
        ordersTable.appendChild(row);
        return;
      }

      orders.forEach(order => {
        const productName = products[order.product_id]?.name || order.product_id;
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${order.id}</td>
          <td>${productName}</td>
          <td>${order.quantity}</td>
          <td>${order.state_id}</td>
          <td>${order.city}</td>
          <td>${order.phone}</td>
          <td>${order.delivery_method === 'home' ? '<i class="fas fa-home me-1"></i>توصيل لباب المنزل' : '<i class="fas fa-building me-1"></i>توصيل إلى مكتب'}</td>
          <td>
            <select class="form-select status-select" onchange="window.adminOrdersBackend.updateOrderStatus('${order.id}', this.value)">
              <option value="قيد المعالجة" ${order.status === 'قيد المعالجة' ? 'selected' : ''}>
                <i class="fas fa-spinner me-1"></i>قيد المعالجة
              </option>
              <option value="تم الشحن" ${order.status === 'تم الشحن' ? 'selected' : ''}>
                <i class="fas fa-truck me-1"></i>تم الشحن
              </option>
              <option value="تم التوصيل" ${order.status === 'تم التوصيل' ? 'selected' : ''}>
                <i class="fas fa-check-circle me-1"></i>تم التوصيل
              </option>
              <option value="ملغى" ${order.status === 'ملغى' ? 'selected' : ''}>
                <i class="fas fa-times-circle me-1"></i>ملغى
              </option>
            </select>
          </td>
          <td>${new Date(order.created_at).toLocaleString('ar-EG')}</td>
          <td>
            <button onclick="window.adminOrdersBackend.deleteOrder('${order.id}')" 
              class="btn btn-danger btn-sm btn-action">
              <i class="fas fa-trash-alt me-1"></i>حذف
            </button>
          </td>
        `;
        ordersTable.appendChild(row);
      });
    },
    getLoginCredentials: () => ({
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value.trim()
    }),
    saveCredentials: (email, password) => {
      localStorage.setItem('adminEmail', email);
      localStorage.setItem('adminPassword', password);
    },
    getSavedCredentials: () => ({
      email: localStorage.getItem('adminEmail'),
      password: localStorage.getItem('adminPassword')
    }),
    clearCredentials: () => {
      localStorage.removeItem('adminEmail');
      localStorage.removeItem('adminPassword');
    },
    showError: (message) => {
      const toast = document.createElement('div');
      toast.className = 'position-fixed bottom-0 end-0 p-3';
      toast.style.zIndex = '11';
      toast.innerHTML = `
        <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
          <div class="toast-header bg-danger text-white">
            <strong class="me-auto">خطأ</strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
          <div class="toast-body">${message}</div>
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 5000);
    }
  };

  // Try auto-login with saved credentials
  const savedCredentials = window.adminOrdersFrontend.getSavedCredentials();
  if (savedCredentials.email && savedCredentials.password) {
    window.adminOrdersBackend.login(savedCredentials.email, savedCredentials.password);
  }

  // Form validation
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!loginForm.checkValidity()) {
      e.stopPropagation();
      loginForm.classList.add('was-validated');
      return;
    }
    const { email, password } = window.adminOrdersFrontend.getLoginCredentials();
    window.adminOrdersBackend.login(email, password);
  });

  logoutBtn.addEventListener('click', () => {
    window.adminOrdersBackend.logout();
  });

  // Reset form validation on input
  ['email', 'password'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      loginForm.classList.remove('was-validated');
    });
  });
});