import type { AppointmentStatus } from "@prisma/client";

export type ReportsPageSearchParams = {
  from?: string;
  to?: string;
  doctorId?: string;
  serviceId?: string;
};

export type ReportDoctorOption = {
  id: string;
  name: string;
  specialty: string | null;
  isActive: boolean;
};

export type ReportServiceOption = {
  id: string;
  name: string;
  durationMinutes: number;
  isActive: boolean;
};

export type ReportFilterValues = {
  from: string;
  to: string;
  doctorId: string;
  serviceId: string;
};

export type ReportsSummaryMetrics = {
  totalReservations: number;
  confirmedCount: number;
  pendingCount: number;
  cancelledCount: number;
  completedCount: number;
  noShowCount: number;
  newClientsCount: number;
  cancellationRate: number;
  noShowRate: number;
};

export type ReportDailyRow = {
  dateValue: string;
  label: string;
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  completed: number;
  noShow: number;
};

export type ReportRankingRow = {
  id: string;
  label: string;
  secondaryLabel: string | null;
  total: number;
  lastReservationAt: Date | null;
  statusBreakdown: Partial<Record<AppointmentStatus, number>>;
  href?: string;
};

export type ReportsOverview = {
  dateRange: {
    from: string;
    to: string;
    fromLabel: string;
    toLabel: string;
  };
  metrics: ReportsSummaryMetrics;
  reservationsByDay: ReportDailyRow[];
  topServices: ReportRankingRow[];
  topProfessionals: ReportRankingRow[];
  topClients: ReportRankingRow[];
};
