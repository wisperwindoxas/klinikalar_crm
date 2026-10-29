import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { QueueTicket } from '../types';

export class WebSocketGateway {
  private static instance: WebSocketGateway;
  private io: Server | null = null;

  public static getInstance(): WebSocketGateway {
    if (!WebSocketGateway.instance) {
      WebSocketGateway.instance = new WebSocketGateway();
    }
    return WebSocketGateway.instance;
  }

  public init(httpServer: HttpServer, corsOrigin: string): void {
    this.io = new Server(httpServer, {
      cors: {
        origin: corsOrigin,
        methods: ['GET', 'POST']
      }
    });

    this.io.on('connection', (socket: Socket) => {
      // Client joins tenant and branch channel
      socket.on('join_tenant', (payload: { tenantId: string; branchId?: string; role?: string }) => {
        if (!payload || !payload.tenantId) return;

        const tenantRoom = `tenant_${payload.tenantId}`;
        socket.join(tenantRoom);

        if (payload.branchId) {
          const branchQueueRoom = `tenant_${payload.tenantId}_branch_${payload.branchId}_queue`;
          socket.join(branchQueueRoom);
        }

        if (payload.role === 'SUPER_ADMIN') {
          socket.join('super_admin_room');
        }
      });

      socket.on('leave_tenant', (payload: { tenantId: string }) => {
        if (payload && payload.tenantId) {
          socket.leave(`tenant_${payload.tenantId}`);
        }
      });
    });

    console.log('Real-Time WebSocket Gateway initialized.');
  }

  public emitTicketCreated(tenantId: string, branchId: string, ticket: QueueTicket): void {
    if (!this.io) return;
    const room = `tenant_${tenantId}_branch_${branchId}_queue`;
    this.io.to(room).emit('queue.created', ticket);
    this.io.to(`tenant_${tenantId}`).emit('queue.updated', { type: 'CREATED', ticket });
    this.io.emit('queue.created', ticket);
  }

  public emitTicketCalled(tenantId: string, branchId: string, ticket: QueueTicket): void {
    if (!this.io) return;
    const room = `tenant_${tenantId}_branch_${branchId}_queue`;
    this.io.to(room).emit('queue.called', ticket);
    this.io.to(`tenant_${tenantId}`).emit('queue.updated', { type: 'CALLED', ticket });
    this.io.emit('queue.called', ticket);
  }

  public emitTicketStarted(tenantId: string, branchId: string, ticket: QueueTicket): void {
    if (!this.io) return;
    const room = `tenant_${tenantId}_branch_${branchId}_queue`;
    this.io.to(room).emit('queue.started', ticket);
    this.io.to(`tenant_${tenantId}`).emit('queue.updated', { type: 'STARTED', ticket });
    this.io.emit('queue.started', ticket);
  }

  public emitTicketCompleted(tenantId: string, branchId: string, ticket: QueueTicket): void {
    if (!this.io) return;
    const room = `tenant_${tenantId}_branch_${branchId}_queue`;
    this.io.to(room).emit('queue.completed', ticket);
    this.io.to(`tenant_${tenantId}`).emit('queue.updated', { type: 'COMPLETED', ticket });
    this.io.emit('queue.completed', ticket);
  }

  public emitTicketSkipped(tenantId: string, branchId: string, ticket: QueueTicket): void {
    if (!this.io) return;
    const room = `tenant_${tenantId}_branch_${branchId}_queue`;
    this.io.to(room).emit('queue.skipped', ticket);
    this.io.to(`tenant_${tenantId}`).emit('queue.updated', { type: 'SKIPPED', ticket });
    this.io.emit('queue.skipped', ticket);
  }

  public emitDoctorStatusChanged(tenantId: string, doctorId: string, status: string): void {
    if (!this.io) return;
    this.io.to(`tenant_${tenantId}`).emit('doctor.status_changed', { doctorId, status });
  }

  public emitSuperAdminEvent(event: string, data: any): void {
    if (!this.io) return;
    this.io.to('super_admin_room').emit(event, data);
  }

  public emitTvSettingsUpdated(tenantId: string, branchId: string, settings: any): void {
    if (!this.io) return;
    const room = `tenant_${tenantId}_branch_${branchId}_queue`;
    this.io.to(room).emit('tv.settings_updated', settings);
    this.io.emit('tv.settings_updated', settings);
  }

  public emitSubscriptionUpdated(tenantId: string, subscription: any): void {
    if (!this.io) return;
    this.io.to(`tenant_${tenantId}`).emit('clinic.subscription_updated', subscription);
    this.io.emit('clinic.subscription_updated', subscription);
  }
}
