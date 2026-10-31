import { io, Socket } from 'socket.io-client';

const API_BASE_URL = 'http://189.74.99.251:5001/api/v1';
const WS_BASE_URL = 'http://189.74.99.251:5001';

export class UserApiClient {
  private static token: string = '';
  private static socket: Socket | null = null;

  public static setToken(t: string) {
    this.token = t;
    localStorage.setItem('sadaf_user_token', t);
  }

  public static getToken(): string {
    if (!this.token) {
      this.token = localStorage.getItem('sadaf_user_token') || '';
    }
    return this.token;
  }

  public static async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = this.getToken();
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
      return json;
    } catch (err: any) {
      console.warn(`User API Error on ${endpoint}:`, err.message);
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

  public static getSocket(): Socket {
    if (!this.socket) {
      this.socket = io(WS_BASE_URL, {
        transports: ['websocket', 'polling']
      });
    }
    return this.socket;
  }

  // Clinic
  public static async getCurrentClinic() {
    return this.request('/clinics/current');
  }

  public static async updateBranding(payload: any) {
    return this.request('/clinics/branding', {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  }

  public static async getBranches() {
    return this.request('/branches');
  }

  public static async getCabinets(branchId?: string) {
    return this.request(`/cabinets${branchId ? `?branchId=${branchId}` : ''}`);
  }

  // Manager Dashboard
  public static async getManagerDashboard(branchId?: string) {
    return this.request(`/reports/manager-dashboard${branchId ? `?branchId=${branchId}` : ''}`);
  }

  // Doctors
  public static async getDoctors(branchId?: string) {
    return this.request(`/doctors${branchId ? `?branchId=${branchId}` : ''}`);
  }

  public static async createDoctor(payload: any) {
    return this.request('/doctors', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public static async updateDoctorStatus(id: string, status: string) {
    return this.request(`/doctors/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  // Patients
  public static async getPatients(search?: string) {
    return this.request(`/patients${search ? `?search=${encodeURIComponent(search)}` : ''}`);
  }

  public static async getPatientById(id: string) {
    return this.request(`/patients/${id}`);
  }

  public static async createPatient(payload: any) {
    return this.request('/patients', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Queues & Tickets
  public static async getTickets(branchId?: string, doctorId?: string, status?: string) {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);
    if (doctorId) params.append('doctorId', doctorId);
    if (status) params.append('status', status);
    return this.request(`/queues/tickets?${params.toString()}`);
  }

  public static async createTicket(payload: {
    doctorId: string;
    patientId: string;
    branchId?: string;
    complaint?: string;
  }) {
    return this.request('/queues/tickets', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public static async callTicket(ticketId: string) {
    return this.request(`/queues/tickets/${ticketId}/call`, { method: 'POST' });
  }

  public static async startTicket(ticketId: string) {
    return this.request(`/queues/tickets/${ticketId}/start`, { method: 'POST' });
  }

  public static async completeTicket(ticketId: string, payload: any) {
    return this.request(`/queues/tickets/${ticketId}/complete`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public static async skipTicket(ticketId: string) {
    return this.request(`/queues/tickets/${ticketId}/skip`, { method: 'POST' });
  }

  public static async cancelTicket(ticketId: string) {
    return this.request(`/queues/tickets/${ticketId}/cancel`, { method: 'POST' });
  }
}
