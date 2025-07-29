document.addEventListener('DOMContentLoaded', function() {
  // عناصر واجهة المستخدم
  const loginSection = document.getElementById('loginSection');
  const pricesSection = document.getElementById('pricesSection');
  const loginForm = document.getElementById('loginForm');
  const deliveryPriceForm = document.getElementById('deliveryPriceForm');
  const productSelect = document.getElementById('productSelect');
  const statesCheckboxes = document.getElementById('statesCheckboxes');
  const deliveryPricesTable = document.getElementById('deliveryPricesTable');
  const logoutBtn = document.getElementById('logoutBtn');

  let products = {};
  let states = [];

  // تعطيل إرسال النماذج عند الضغط على Enter
  loginForm.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') {
      e.preventDefault();
    }
  });

  deliveryPriceForm.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') {
      e.preventDefault();
    }
  });

  // Expose functions for backend.js
  window.adminDeliveryPricesFrontend = {
    showLogin: () => {
      loginSection.classList.remove('d-none');
      pricesSection.classList.add('d-none');
      document.body.style.backgroundColor = '#f8f9fa';
    },
    showPrices: () => {
      loginSection.classList.add('d-none');
      pricesSection.classList.remove('d-none');
      document.body.style.backgroundColor = '#f8f9fa';
    },
    displayDeliveryPrices: (prices, products, states) => {
      deliveryPricesTable.innerHTML = '';
      prices.forEach(price => {
        const productName = products[price.product_id]?.name || price.product_id;
        const stateName = states.find(s => s.id === price.state_id)?.name || price.state_id;
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${productName}</td>
          <td>${stateName}</td>
          <td>${price.price_to_office} دج</td>
          <td>${price.price_to_home} دج</td>
          <td>
            <button onclick="window.adminDeliveryPricesBackend.deleteDeliveryPrice('${price.id}')" 
              class="btn btn-danger btn-sm btn-action">
              <i class="fas fa-trash-alt me-1"></i>حذف
            </button>
          </td>
        `;
        deliveryPricesTable.appendChild(row);
      });
    },
    getLoginCredentials: () => ({
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value.trim()
    }),
    getDeliveryPriceData: () => {
      const selectedStates = Array.from(statesCheckboxes.querySelectorAll('input:checked')).map(input => parseInt(input.value));
      return {
        product_id: productSelect.value,
        state_ids: selectedStates,
        price_to_office: parseFloat(document.getElementById('priceToOffice').value),
        price_to_home: parseFloat(document.getElementById('priceToHome').value)
      };
    },
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
    getProducts: () => products,
    getStates: () => states,
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

  // Load products
  fetch('static/products.json')
    .then(response => {
      if (!response.ok) throw new Error(`Failed to fetch products.json: ${response.status}`);
      return response.json();
    })
    .then(data => {
      products = data;
      productSelect.innerHTML = '<option value="">اختر المنتج...</option>';
      Object.keys(products).forEach(id => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = products[id].name;
        productSelect.appendChild(option);
      });
    })
    .catch(error => {
      console.error('Error loading products:', error);
      productSelect.innerHTML = '<option value="">خطأ في تحميل المنتجات</option>';
      window.adminDeliveryPricesFrontend.showError('حدث خطأ أثناء تحميل قائمة المنتجات');
    });

  // Load states
  fetch('static/algeria_municipalities_first_five_states.json')
    .then(response => {
      if (!response.ok) throw new Error(`Failed to fetch states: ${response.status}`);
      return response.json();
    })
    .then(data => {
      states = data.states;
      statesCheckboxes.innerHTML = '';
      states.forEach(state => {
        const div = document.createElement('div');
        div.className = 'col';
        div.innerHTML = `
          <div class="form-check">
            <input class="form-check-input state-checkbox" type="checkbox" value="${state.id}" id="state-${state.id}">
            <label class="form-check-label" for="state-${state.id}">
              ${state.name}
            </label>
          </div>
        `;
        statesCheckboxes.appendChild(div);
      });
    })
    .catch(error => {
      console.error('Error loading states:', error);
      statesCheckboxes.innerHTML = '<div class="col-12 text-danger">خطأ في تحميل قائمة الولايات</div>';
      window.adminDeliveryPricesFrontend.showError('حدث خطأ أثناء تحميل قائمة الولايات');
    });

  // Try auto-login with saved credentials
  const savedCredentials = window.adminDeliveryPricesFrontend.getSavedCredentials();
  if (savedCredentials.email && savedCredentials.password) {
    window.adminDeliveryPricesBackend.login(savedCredentials.email, savedCredentials.password);
  }

  // Form validation
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!loginForm.checkValidity()) {
      e.stopPropagation();
      loginForm.classList.add('was-validated');
      return;
    }
    const { email, password } = window.adminDeliveryPricesFrontend.getLoginCredentials();
    window.adminDeliveryPricesBackend.login(email, password);
  });

  deliveryPriceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!deliveryPriceForm.checkValidity()) {
      e.stopPropagation();
      deliveryPriceForm.classList.add('was-validated');
      return;
    }
    
    const data = window.adminDeliveryPricesFrontend.getDeliveryPriceData();
    if (data.state_ids.length === 0) {
      const statesCheckboxGroup = statesCheckboxes.closest('.form-control');
      statesCheckboxGroup.style.borderColor = '#dc3545';
      statesCheckboxGroup.insertAdjacentHTML('afterend', '<div class="invalid-feedback">يرجى اختيار ولاية واحدة على الأقل</div>');
      return;
    }
    window.adminDeliveryPricesBackend.setDeliveryPrices(data);
  });

  logoutBtn.addEventListener('click', () => {
    window.adminDeliveryPricesBackend.logout();
  });

  // Reset form validation on input
  ['email', 'password'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      loginForm.classList.remove('was-validated');
    });
  });

  ['productSelect', 'priceToOffice', 'priceToHome'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      deliveryPriceForm.classList.remove('was-validated');
    });
  });

  // Reset states validation when any checkbox is clicked
  statesCheckboxes.addEventListener('change', (e) => {
    if (e.target.classList.contains('state-checkbox')) {
      const statesCheckboxGroup = statesCheckboxes.closest('.form-control');
      statesCheckboxGroup.style.borderColor = '';
      const invalidFeedback = statesCheckboxGroup.nextElementSibling;
      if (invalidFeedback && invalidFeedback.classList.contains('invalid-feedback')) {
        invalidFeedback.remove();
      }
    }
  });
});