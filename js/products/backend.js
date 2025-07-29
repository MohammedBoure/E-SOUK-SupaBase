document.addEventListener('DOMContentLoaded', function() {
  const supabaseUrl = 'https://txfboulsslyxdwhvxpde.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4ZmJvdWxzc2x5eGR3aHZ4cGRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1Njg2NDIsImV4cCI6MjA2OTE0NDY0Mn0.x1y1dSqEzeu6iWgVAmC1c0DyTjltyMC8cTK0YjHPTpQ';
  const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

  const CLIENT_ID = 'e8646c32-0e05-4e97-953b-5d0a4eb9e86e';

  window.backend = {
    fetchDeliveryPrice: async (productId, stateId) => {
      try {
        const { data, error } = await supabase
          .from('delivery_prices')
          .select('price_to_office, price_to_home')
          .eq('client_id', CLIENT_ID)
          .eq('product_id', productId)
          .eq('state_id', stateId)
          .single();
        if (error || !data) {
          console.error('Fetch Delivery Price Error:', error);
          return null;
        }
        return data;
      } catch (error) {
        console.error('Fetch Delivery Price Error:', error);
        return null;
      }
    },
    submitOrder: async () => {
      const selectedProduct = window.frontend?.getSelectedProduct();
      if (!selectedProduct) {
        alert('يرجى الانتظار حتى يتم تحميل المنتج بالكامل.');
        return false;
      }

      window.frontend.disableSubmitButton(true);

      const { customerName, phone, deliveryType, wilaya, commune, address, units } = window.frontend.getFormData();

      const phoneRegex = /^(05|06|07)\d{8}$/;
      if (!phoneRegex.test(phone)) {
        alert('رقم الهاتف غير صالح. يجب أن يبدأ بـ 05, 06, أو 07 ويتكون من 10 أرقام.');
        window.frontend.disableSubmitButton(false);
        return false;
      }

      try {
        const stateId = parseInt(wilaya.split(' - ')[0]);
        const { error } = await supabase
          .from('orders')
          .insert({
            client_id: CLIENT_ID,
            product_id: new URLSearchParams(window.location.search).get('id'),
            quantity: units,
            state_id: stateId,
            city: commune,
            address: address,
            phone: phone,
            delivery_method: deliveryType === 'توصيل لباب المنزل' ? 'home' : 'office',
            status: 'قيد المعالجة',
            created_at: new Date().toISOString()
          });

        if (error) {
          alert('فشل في إرسال الطلب. يرجى المحاولة مرة أخرى أو التواصل معنا مباشرة.');
          console.error('Supabase Error:', error);
          window.frontend.disableSubmitButton(false);
          return false;
        }

        alert('تم إرسال الطلب بنجاح! سيتم التواصل معك قريباً لتأكيد الطلب.');
        window.frontend.resetForm();
        return true;
      } catch (error) {
        alert('فشل في إرسال الطلب. يرجى المحاولة مرة أخرى أو التواصل معنا مباشرة.');
        console.error('Submission Error:', error);
        window.frontend.disableSubmitButton(false);
        return false;
      }
    }
  };

  if (window.location.pathname.includes('products.html') || window.location.pathname.endsWith('/')) {
    const form = document.getElementById('orderForm');
    
    form?.addEventListener('submit', async function(e) {
      e.preventDefault();
      await window.backend.submitOrder();
    });
  }
});