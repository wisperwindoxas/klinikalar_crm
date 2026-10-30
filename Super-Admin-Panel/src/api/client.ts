const API_BASE_URL = 'http://localhost:5001/api/v1';

interface CacheEntry {
  data: any;
  timestamp: number;
}

export class ApiClient {
  private static token: string = '';
  private static cache = new Map<string, CacheEntry>();
  public static CACHE_TTL = 30_000; // 30 soniya in-memory kesh

  public static clearCache(endpointPrefix?: string) {
    if (endpointPrefix) {
      for (const key of this.cache.keys()) {
        if (key.startsWith(endpointPrefix)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  public static setToken(t: string) {
    this.token = t;
    localStorage.setItem('sadaf_super_admin_token', t);
  }

  public static getToken(): string {
    if (!this.token) {
      this.token = localStorage.getItem('sadaf_super_admin_token') || '';
    }
    return this.token;
  }

  public static async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = this.getToken();
    const method = (options.method || 'GET').toUpperCase();
    const isGet = method === 'GET';
    const skipCache = Boolean((options.headers as Record<string, string>)?.['x-skip-cache']);

    // Agar GET so'rov bo'lsa va keshda bo'lsa, bir zumda (0ms) keshdan qaytarish
    if (isGet && !skipCache) {
      const cached = this.cache.get(endpoint);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.message || 'Xatolik yuz berdi');
      }

      if (isGet) {
        this.cache.set(endpoint, {
          data: json,
          timestamp: Date.now()
        });
      } else {
        // Ma'lumot o'zgarganda (POST, PUT, PATCH, DELETE) keshni tozalash
        this.clearCache();
      }

      return json;
    } catch (err: any) {
      console.warn(`API Error on ${endpoint}:`, err.message);
      throw err;
    }
  }

  public static async login(identifier: string, password: string) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    });
    if (res.data?.token) {
      this.setToken(res.data.token);
    }
    return res;
  }

  public static async getDashboard() {
    return this.request('/super-admin/dashboard');
  }

  public static async getClinics() {
    return this.request('/super-admin/clinics');
  }

  public static async updateClinicStatus(id: string, status: string) {
    return this.request(`/super-admin/clinics/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  public static async updateClinicPlan(id: string, planCode: string) {
    return this.request(`/super-admin/clinics/${id}/plan`, {
      method: 'PATCH',
      body: JSON.stringify({ planCode })
    });
  }

  public static async getClinicDetails(id: string, params?: { startDate?: string; endDate?: string }) {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/super-admin/clinics/${id}/details${qs}`, {
      headers: { 'x-skip-cache': '1' }
    });
  }

  public static async updateClinic(id: string, payload: any) {
    return this.request(`/super-admin/clinics/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  }

  public static async deleteClinic(id: string) {
    return this.request(`/super-admin/clinics/${id}`, {
      method: 'DELETE'
    });
  }

  public static async createClinicUser(clinicId: string, userData: any) {
    return this.request(`/super-admin/clinics/${clinicId}/users`, {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  public static async updateClinicUser(clinicId: string, userId: string, userData: any) {
    return this.request(`/super-admin/clinics/${clinicId}/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  public static async deleteClinicUser(clinicId: string, userId: string) {
    return this.request(`/super-admin/clinics/${clinicId}/users/${userId}`, {
      method: 'DELETE'
    });
  }

  public static async toggleClinicUserStatus(clinicId: string, userId: string, status: string) {
    return this.request(`/super-admin/clinics/${clinicId}/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  public static async createClinic(payload: any) {
    return this.request('/auth/register-clinic', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public static async getAuditLogs() {
    return this.request('/super-admin/audit-logs');
  }

  // Real Subscriptions & Plans
  public static async getSubscriptions() {
    return this.request('/super-admin/subscriptions');
  }

  public static async extendSubscription(id: string, months: number) {
    return this.request(`/super-admin/subscriptions/${id}/extend`, {
      method: 'POST',
      body: JSON.stringify({ months })
    });
  }

  public static async updateSubscriptionStatus(id: string, status: string) {
    return this.request(`/super-admin/subscriptions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  public static async updateSubscriptionSms(id: string, smsBalance: number, smsEnabled: boolean = true) {
    return this.request(`/super-admin/subscriptions/${id}/sms`, {
      method: 'PATCH',
      body: JSON.stringify({ smsBalance, smsEnabled })
    });
  }

  public static async changeSubscriptionPlan(id: string, planCode: string) {
    return this.request(`/super-admin/subscriptions/${id}/change-plan`, {
      method: 'POST',
      body: JSON.stringify({ planCode })
    });
  }

  public static async getPlans() {
    return this.request('/super-admin/plans');
  }

  // Real SMS Management
  public static async getSmsSettings() {
    return this.request('/super-admin/sms/settings');
  }

  public static async updateSmsSettings(payload: any) {
    return this.request('/super-admin/sms/settings', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  public static async getSmsTemplates() {
    return this.request('/super-admin/sms/templates');
  }

  public static async updateSmsTemplate(eventType: string, payload: any) {
    return this.request(`/super-admin/sms/templates/${eventType}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  public static async getSmsLogs() {
    return this.request('/super-admin/sms/logs');
  }

  public static async sendTestSms(phone: string, message: string) {
    return this.request('/super-admin/sms/send-test', {
      method: 'POST',
      body: JSON.stringify({ phone, message })
    });
  }

  // Real Global Users
  public static async getUsers() {
    return this.request('/super-admin/users');
  }

  public static async createUser(payload: { name: string; email?: string; phone?: string; role: string }) {
    return this.request('/super-admin/users', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public static async updateUserStatus(id: string, isActive: boolean) {
    return this.request(`/super-admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive })
    });
  }

  public static async updateUser(id: string, payload: { name?: string; email?: string; phone?: string; role?: string; password?: string; clinicId?: string }) {
    return this.request(`/super-admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  public static async deleteUser(id: string) {
    return this.request(`/super-admin/users/${id}`, {
      method: 'DELETE'
    });
  }

  // Real Branches
  public static async getBranches() {
    return this.request('/super-admin/branches');
  }

  public static async createBranch(payload: { name: string; code: string; clinicName: string; address?: string; phone?: string; doctorCount?: number }) {
    return this.request('/super-admin/branches', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Real Services Catalog
  public static async getServices() {
    return this.request('/super-admin/services');
  }

  public static async createService(payload: { name: string; price: number; paymentPolicy: string; specialtyId?: string }) {
    return this.request('/super-admin/services', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public static async updateService(id: string, payload: any) {
    return this.request(`/super-admin/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  public static async deleteService(id: string) {
    return this.request(`/super-admin/services/${id}`, {
      method: 'DELETE'
    });
  }

  // Real Support Desk
  public static async getSupportTickets() {
    return this.request('/super-admin/support');
  }

  public static async createSupportTicket(payload: { clinicName: string; contactName: string; contactPhone?: string; subject: string; message: string; priority?: string }) {
    return this.request('/super-admin/support', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public static async replySupportTicket(id: string, reply: string, status = 'RESOLVED') {
    return this.request(`/super-admin/support/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ reply, status })
    });
  }

  // Real Promo Codes
  public static async getPromoCodes() {
    return this.request('/super-admin/promo');
  }

  public static async createPromoCode(payload: { code: string; discountPercent: number; validUntil: string; maxUsage?: number }) {
    return this.request('/super-admin/promo', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public static async togglePromoCode(id: string, isActive: boolean) {
    return this.request(`/super-admin/promo/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive })
    });
  }

  // Real API Keys
  public static async getApiKeys() {
    return this.request('/super-admin/api-keys');
  }

  public static async createApiKey(payload: { clinicName: string; permissions?: string }) {
    return this.request('/super-admin/api-keys', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public static async deleteApiKey(id: string) {
    return this.request(`/super-admin/api-keys/${id}`, {
      method: 'DELETE'
    });
  }

  // Real System Settings
  public static async getSystemSettings() {
    return this.request('/super-admin/settings');
  }

  public static async updateSystemSetting(key: string, value: string) {
    return this.request(`/super-admin/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value })
    });
  }

  // Plans Management
  public static async updatePlan(code: string, payload: any) {
    return this.request(`/super-admin/plans/${code}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  // Real Payments
  public static async getPayments(limit = 100) {
    return this.request(`/super-admin/payments?limit=${limit}`);
  }

  // Real Reports
  public static async getReports() {
    return this.request('/super-admin/reports');
  }

  // Real System Status
  public static async getSystemStatus() {
    return this.request('/super-admin/system-status');
  }
}

