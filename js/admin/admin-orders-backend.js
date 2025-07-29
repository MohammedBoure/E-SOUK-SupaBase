document.addEventListener('DOMContentLoaded', function() {
  // Initialize Supabase
  const supabaseUrl = 'https://txfboulsslyxdwhvxpde.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4ZmJvdWxzc2x5eGR3aHZ4cGRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1Njg2NDIsImV4cCI6MjA2OTE0NDY0Mn0.x1y1dSqEzeu6iWgVAmC1c0DyTjltyMC8cTK0YjHPTpQ';
  const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

  // Expose functions for frontend
  window.adminOrdersBackend = {
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
        window.adminOrdersFrontend.saveCredentials(email, password);
        await window.adminOrdersBackend.fetchOrders();
        window.adminOrdersFrontend.showOrders();
      } catch (error) {
        alert('حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى.');
        console.error('Login Error:', error);
      }
    },
    logout: async () => {
      try {
        await supabase.auth.signOut();
        window.adminOrdersFrontend.clearCredentials();
        window.adminOrdersFrontend.showLogin();
      } catch (error) {
        alert('حدث خطأ أثناء تسجيل الخروج.');
        console.error('Logout Error:', error);
      }
    },
    fetchOrders: async () => {
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
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('client_id', client.id);
        if (ordersError) {
          alert('فشل في جلب الطلبات.');
          console.error('Orders Error:', ordersError);
          return;
        }
        window.adminOrdersFrontend.displayOrders(orders);
      } catch (error) {
        alert('حدث خطأ أثناء جلب الطلبات.');
        console.error('Fetch Orders Error:', error);
      }
    },
    updateOrderStatus: async (orderId, status) => {
      try {
        const { error } = await supabase
          .from('orders')
          .update({ status })
          .eq('id', orderId);
        if (error) {
          alert('فشل في تحديث حالة الطلب.');
          console.error('Update Order Status Error:', error);
          return;
        }
        await window.adminOrdersBackend.fetchOrders();
      } catch (error) {
        alert('حدث خطأ أثناء تحديث حالة الطلب.');
        console.error('Update Order Status Error:', error);
      }
    },
    deleteOrder: async (orderId) => {
      try {
        const { error } = await supabase
          .from('orders')
          .delete()
          .eq('id', orderId);
        if (error) {
          alert('فشل في حذف الطلب.');
          console.error('Delete Order Error:', error);
          return;
        }
        alert('تم حذف الطلب بنجاح!');
        await window.adminOrdersBackend.fetchOrders();
      } catch (error) {
        alert('حدث خطأ أثناء حذف الطلب.');
        console.error('Delete Order Error:', error);
      }
    }
  };
});