document.addEventListener('DOMContentLoaded', function() {
  // Initialize Supabase
  const supabaseUrl = 'https://txfboulsslyxdwhvxpde.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4ZmJvdWxzc2x5eGR3aHZ4cGRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1Njg2NDIsImV4cCI6MjA2OTE0NDY0Mn0.x1y1dSqEzeu6iWgVAmC1c0DyTjltyMC8cTK0YjHPTpQ';
  const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

  // Fixed client_id
  const CLIENT_ID = 'e8646c32-0e05-4e97-953b-5d0a4eb9e86e';

  // Expose functions for frontend
  window.adminDeliveryPricesBackend = {
    login: async (email, password) => {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) {
          alert('فشل تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور.');
          console.error('Login Error:', error);
          return;
        }
        window.adminDeliveryPricesFrontend.saveCredentials(email, password);
        await window.adminDeliveryPricesBackend.fetchDeliveryPrices();
        window.adminDeliveryPricesFrontend.showPrices();
      } catch (error) {
        alert('حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى.');
        console.error('Login Error:', error);
      }
    },
    logout: async () => {
      try {
        await supabase.auth.signOut();
        window.adminDeliveryPricesFrontend.clearCredentials();
        window.adminDeliveryPricesFrontend.showLogin();
      } catch (error) {
        alert('حدث خطأ أثناء تسجيل الخروج.');
        console.error('Logout Error:', error);
      }
    },
    setDeliveryPrices: async ({ product_id, state_ids, price_to_office, price_to_home }) => {
      try {
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', (await supabase.auth.getUser()).data.user.id)
          .single();
        if (clientError || !client) {
          alert('فشل في جلب بيانات البائع.');
          console.error('Client Error:', clientError);
          return;
        }

        // Prepare data for bulk insert
        const priceData = state_ids.map(state_id => ({
          client_id: client.id,
          product_id,
          state_id,
          price_to_office,
          price_to_home
        }));

        const { error } = await supabase
          .from('delivery_prices')
          .insert(priceData);

        if (error) {
          alert('فشل في تعيين أسعار التوصيل.');
          console.error('Set Delivery Prices Error:', error);
          return;
        }

        alert('تم تعيين أسعار التوصيل بنجاح!');
        deliveryPriceForm.reset();
        statesCheckboxes.querySelectorAll('input').forEach(input => input.checked = false);
        await window.adminDeliveryPricesBackend.fetchDeliveryPrices();
      } catch (error) {
        alert('حدث خطأ أثناء تعيين أسعار التوصيل.');
        console.error('Set Delivery Prices Error:', error);
      }
    },
    fetchDeliveryPrices: async () => {
      try {
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', (await supabase.auth.getUser()).data.user.id)
          .single();
        if (clientError || !client) {
          alert('فشل في جلب بيانات البائع.');
          console.error('Client Error:', clientError);
          return;
        }
        const { data: prices, error: pricesError } = await supabase
          .from('delivery_prices')
          .select('*')
          .eq('client_id', client.id);
        if (pricesError) {
          alert('فشل في جلب أسعار التوصيل.');
          console.error('Delivery Prices Error:', pricesError);
          return;
        }
        window.adminDeliveryPricesFrontend.displayDeliveryPrices(prices, window.adminDeliveryPricesFrontend.getProducts(), window.adminDeliveryPricesFrontend.getStates());
      } catch (error) {
        alert('حدث خطأ أثناء جلب أسعار التوصيل.');
        console.error('Fetch Delivery Prices Error:', error);
      }
    },
    deleteDeliveryPrice: async (priceId) => {
      try {
        const { error } = await supabase
          .from('delivery_prices')
          .delete()
          .eq('id', priceId);
        if (error) {
          alert('فشل في حذف سعر التوصيل.');
          console.error('Delete Delivery Price Error:', error);
          return;
        }
        await window.adminDeliveryPricesBackend.fetchDeliveryPrices();
      } catch (error) {
        alert('حدث خطأ أثناء حذف سعر التوصيل.');
        console.error('Delete Delivery Price Error:', error);
      }
    }
  };
});