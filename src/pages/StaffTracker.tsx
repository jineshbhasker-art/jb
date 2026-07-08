/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  Plus, 
  Trash2, 
  User, 
  Users, 
  UserCheck, 
  Activity, 
  TrendingUp, 
  CalendarCheck,
  CheckCircle2, 
  XCircle, 
  Clock3, 
  FileSpreadsheet, 
  AlertCircle,
  Percent,
  Check,
  Edit2
} from 'lucide-react';
import { 
  shiftsService, 
  consultationsService, 
  commissionPayoutsService, 
  usersService, 
  customersService, 
  salesService,
  AppUser
} from '../lib/dbService';
import { Shift, Consultation, CommissionPayout, Customer, Sale } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import { format } from 'date-fns';

export default function StaffTracker() {
  const [activeSubTab, setActiveSubTab] = React.useState<'attendance' | 'schedule' | 'consultations' | 'commissions'>('attendance');
  
  // Real-time states
  const [shifts, setShifts] = React.useState<Shift[]>([]);
  const [consultations, setConsultations] = React.useState<Consultation[]>([]);
  const [commissionPayouts, setCommissionPayouts] = React.useState<CommissionPayout[]>([]);
  const [staffUsers, setStaffUsers] = React.useState<AppUser[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [sales, setSales] = React.useState<Sale[]>([]);

  // Form states & UI toggles
  const [isAddShiftOpen, setIsAddShiftOpen] = React.useState(false);
  const [isAddConsultationOpen, setIsAddConsultationOpen] = React.useState(false);
  const [isConfigureRatesOpen, setIsConfigureRatesOpen] = React.useState(false);
  const [selectedStaffForCommission, setSelectedStaffForCommission] = React.useState<string>('');
  const [commissionStartDate, setCommissionStartDate] = React.useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [commissionEndDate, setCommissionEndDate] = React.useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Clock state
  const [currentTime, setCurrentTime] = React.useState<Date>(new Date());

  // Input states
  const [newShift, setNewShift] = React.useState<Partial<Shift>>({
    userId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '18:00',
    role: 'Consultant',
    status: 'scheduled',
    notes: ''
  });

  const [newConsultation, setNewConsultation] = React.useState<Partial<Consultation>>({
    perfumerId: '',
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:00',
    status: 'booked',
    fee: 250,
    notes: ''
  });

  const [rateForm, setRateForm] = React.useState<Record<string, { sales: number; consultations: number }>>({});

  // Dynamic Clock effect
  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync subscriptions
  React.useEffect(() => {
    const unsubShifts = shiftsService.subscribe(setShifts);
    const unsubConsultations = consultationsService.subscribe(setConsultations);
    const unsubPayouts = commissionPayoutsService.subscribe(setCommissionPayouts);
    const unsubCustomers = customersService.subscribe(setCustomers);
    const unsubSales = salesService.subscribe(setSales);
    const unsubUsers = usersService.subscribe((users) => {
      setStaffUsers(users || []);
      // Prepopulate rates form
      const rates: Record<string, { sales: number; consultations: number }> = {};
      users.forEach(u => {
        rates[u.id] = {
          sales: u.commissionRateSales || 5,
          consultations: u.commissionRateConsultations || 15
        };
      });
      setRateForm(rates);
      if (users.length > 0 && !selectedStaffForCommission) {
        setSelectedStaffForCommission(users[0].id);
      }
    });

    return () => {
      unsubShifts();
      unsubConsultations();
      unsubPayouts();
      unsubUsers();
      unsubCustomers();
      unsubSales();
    };
  }, []);

  // Attendance Check-In / Check-Out Actions
  const handleCheckIn = async (userId: string) => {
    const user = staffUsers.find(u => u.id === userId);
    if (!user) return;
    
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Check if there is already a shift scheduled for today
    const existingShift = shifts.find(s => s.userId === userId && s.date === todayStr);

    if (existingShift) {
      if (existingShift.checkInTime) {
        alert("ALREADY CHECKED IN FOR TODAY'S SHIFT SEQUENCE.");
        return;
      }
      await shiftsService.update(existingShift.id!, {
        status: 'present',
        checkInTime: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      // Create a shift on the fly
      await shiftsService.add({
        userId,
        userName: user.name,
        date: todayStr,
        startTime: '09:00',
        endTime: '18:00',
        role: user.role || 'Consultant',
        status: 'present',
        checkInTime: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  };

  const handleCheckOut = async (userId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const activeShift = shifts.find(s => s.userId === userId && s.date === todayStr && s.checkInTime && !s.checkOutTime);

    if (!activeShift) {
      alert("NO ACTIVE IN-PROGRESS CHECK-IN SEQUENCE DETECTED FOR TODAY.");
      return;
    }

    await shiftsService.update(activeShift.id!, {
      checkOutTime: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  };

  // Add Shift
  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShift.userId || !newShift.date) return;

    const user = staffUsers.find(u => u.id === newShift.userId);
    if (!user) return;

    await shiftsService.add({
      userId: newShift.userId,
      userName: user.name,
      date: newShift.date,
      startTime: newShift.startTime || '09:00',
      endTime: newShift.endTime || '18:00',
      role: newShift.role || user.role || 'Consultant',
      status: newShift.status as 'scheduled' | 'present' | 'absent' | 'late',
      notes: newShift.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    setIsAddShiftOpen(false);
    setNewShift({
      userId: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '18:00',
      role: 'Consultant',
      status: 'scheduled',
      notes: ''
    });
  };

  // Delete Shift
  const handleDeleteShift = async (id: string) => {
    if (confirm("ARE YOU SURE YOU WANT TO DELETE THIS SHIFT PLAN ENTRY?")) {
      await shiftsService.delete(id);
    }
  };

  // Update Shift Status directly
  const handleUpdateShiftStatus = async (id: string, status: 'scheduled' | 'present' | 'absent' | 'late') => {
    await shiftsService.update(id, { status, updatedAt: new Date().toISOString() });
  };

  // Add Consultation
  const handleAddConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConsultation.perfumerId || !newConsultation.customerId || !newConsultation.date) return;

    const perfumer = staffUsers.find(u => u.id === newConsultation.perfumerId);
    const client = customers.find(c => c.id === newConsultation.customerId);
    
    if (!perfumer || !client) return;

    await consultationsService.add({
      perfumerId: newConsultation.perfumerId,
      perfumerName: perfumer.name,
      customerId: newConsultation.customerId,
      customerName: client.name,
      date: newConsultation.date,
      startTime: newConsultation.startTime || '10:00',
      endTime: newConsultation.endTime || '11:00',
      status: newConsultation.status as 'available' | 'booked' | 'completed' | 'cancelled',
      fee: Number(newConsultation.fee || 250),
      notes: newConsultation.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    setIsAddConsultationOpen(false);
    setNewConsultation({
      perfumerId: '',
      customerId: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '10:00',
      endTime: '11:00',
      status: 'booked',
      fee: 250,
      notes: ''
    });
  };

  // Change Consultation Status
  const handleUpdateConsultationStatus = async (id: string, status: 'available' | 'booked' | 'completed' | 'cancelled') => {
    await consultationsService.update(id, { status, updatedAt: new Date().toISOString() });
  };

  // Delete Consultation
  const handleDeleteConsultation = async (id: string) => {
    if (confirm("DELETE THIS CONSULTATION RECORD?")) {
      await consultationsService.delete(id);
    }
  };

  // Save Commission Rates
  const handleSaveCommissionRates = async (userId: string) => {
    const rates = rateForm[userId];
    if (!rates) return;
    await usersService.update(userId, {
      commissionRateSales: Number(rates.sales),
      commissionRateConsultations: Number(rates.consultations)
    });
    alert("COMMISSION PROTOCOLS ADJUSTED AND SECURED SUCCESSFULLY.");
  };

  // Associate a sale with a staff member (consultant) dynamically
  const handleAssociateSaleWithConsultant = async (saleId: string, consultantId: string) => {
    const consultant = staffUsers.find(u => u.id === consultantId);
    await salesService.update(saleId, {
      cashierId: consultantId, // Treat cashierId as the credited consultant for this sale's commission
      cashierName: consultant ? consultant.name : 'Unknown'
    });
  };

  // Calculations for dynamic staff summary
  const selectedStaffObj = staffUsers.find(u => u.id === selectedStaffForCommission);
  
  const calculatedCommissions = React.useMemo(() => {
    if (!selectedStaffForCommission) return { salesComm: 0, consultComm: 0, total: 0, matchedSales: [], matchedConsultations: [] };

    const staff = staffUsers.find(u => u.id === selectedStaffForCommission);
    if (!staff) return { salesComm: 0, consultComm: 0, total: 0, matchedSales: [], matchedConsultations: [] };

    const salesRate = staff.commissionRateSales ?? 5;
    const consultRate = staff.commissionRateConsultations ?? 15;

    // Filter Sales inside range credited to this user
    const matchedSales = sales.filter(s => {
      if (!s.createdAt) return false;
      const sDate = s.createdAt.split('T')[0];
      return s.cashierId === selectedStaffForCommission && sDate >= commissionStartDate && sDate <= commissionEndDate && s.status === 'completed';
    });

    // Filter Consultations inside range credited to this user which are 'completed'
    const matchedConsultations = consultations.filter(c => {
      return c.perfumerId === selectedStaffForCommission && c.date >= commissionStartDate && c.date <= commissionEndDate && c.status === 'completed';
    });

    const salesComm = matchedSales.reduce((sum, s) => sum + (s.grandTotal * (salesRate / 100)), 0);
    const consultComm = matchedConsultations.reduce((sum, c) => sum + (c.fee * (consultRate / 100)), 0);

    return {
      salesComm,
      consultComm,
      total: salesComm + consultComm,
      matchedSales,
      matchedConsultations
    };
  }, [selectedStaffForCommission, commissionStartDate, commissionEndDate, sales, consultations, staffUsers]);

  // Record a payout
  const handleRecordPayout = async () => {
    if (!selectedStaffForCommission || calculatedCommissions.total <= 0) {
      alert("NO OUTSTANDING COMMISSIONS TO LOG PAYOUT.");
      return;
    }
    const staff = staffUsers.find(u => u.id === selectedStaffForCommission);
    if (!staff) return;

    await commissionPayoutsService.add({
      userId: selectedStaffForCommission,
      userName: staff.name,
      amount: calculatedCommissions.total,
      dateRangeStart: commissionStartDate,
      dateRangeEnd: commissionEndDate,
      salesTotal: calculatedCommissions.matchedSales.reduce((sum, s) => sum + s.grandTotal, 0),
      consultationsTotal: calculatedCommissions.matchedConsultations.reduce((sum, c) => sum + c.fee, 0),
      payoutDate: new Date().toISOString().split('T')[0],
      status: 'paid',
      notes: `Payout recorded for period ${commissionStartDate} to ${commissionEndDate}`,
      createdAt: new Date().toISOString()
    });

    alert(`PAYOUT OF AED ${calculatedCommissions.total.toFixed(2)} SUCCESSFULLY RECORDED.`);
  };

  // Helper for attendance stats
  const getAttendanceSummary = (userId: string) => {
    const userShifts = shifts.filter(s => s.userId === userId);
    const scheduled = userShifts.length;
    const present = userShifts.filter(s => s.status === 'present').length;
    const absent = userShifts.filter(s => s.status === 'absent').length;
    const late = userShifts.filter(s => s.status === 'late').length;
    return { scheduled, present, absent, late };
  };

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-500">
      
      {/* Header Panel */}
      <div className="p-8 md:p-12 bg-white rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-[#C5A059]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-[#C5A059] rounded-full text-[10px] font-black uppercase tracking-widest">
            <Activity size={12} />
            Scent Lab Personnel
          </div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 uppercase">Staff Portal</h1>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Scheduling, Attendance Logs & Commission Calculations</p>
        </div>

        {/* Dynamic Digital Clock & Status Badge */}
        <div className="flex items-center gap-6 bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 w-full md:w-auto">
          <div className="p-3 bg-white rounded-xl shadow-sm text-[#C5A059]">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">LAB LOCAL TIME</div>
            <div className="text-xl font-mono font-black text-gray-800 tracking-wider">
              {format(currentTime, 'hh:mm:ss a')}
            </div>
            <div className="text-[8px] font-mono text-gray-400">
              {format(currentTime, 'EEEE, dd MMMM yyyy')}
            </div>
          </div>
        </div>
      </div>

      {/* Portal Tabs Selector */}
      <div className="flex border-b border-gray-100 overflow-x-auto no-scrollbar gap-1">
        {[
          { id: 'attendance', label: 'Time Clock', icon: Clock3 },
          { id: 'schedule', label: 'Shift Scheduler', icon: Calendar },
          { id: 'consultations', label: 'Consultations Planner', icon: CalendarCheck },
          { id: 'commissions', label: 'Commission Center', icon: DollarSign }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2.5 px-6 py-4 border-b-2 transition-all font-black text-[11px] uppercase tracking-wider whitespace-nowrap",
              activeSubTab === tab.id 
                ? "border-black text-black bg-gray-50/30"
                : "border-transparent text-gray-400 hover:text-black hover:border-gray-200"
            )}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main tab viewport */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
        >
          {/* TAB 1: ATTENDANCE / TIME CLOCK */}
          {activeSubTab === 'attendance' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Clock-In Board */}
              <div className="lg:col-span-2 space-y-8">
                <div className="p-8 md:p-10 bg-white rounded-[2rem] border border-gray-100 shadow-sm space-y-8">
                  <div className="border-b border-gray-50 pb-6 flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-black uppercase tracking-tight text-gray-800">Check-In Registry</h2>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Clock in or out of your scheduled session</p>
                    </div>
                    <UserCheck className="text-[#C5A059]" size={24} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {staffUsers.map(staff => {
                      const todayStr = currentTime.toISOString().split('T')[0];
                      const activeShift = shifts.find(s => s.userId === staff.id && s.date === todayStr);
                      const isClockedIn = !!(activeShift?.checkInTime && !activeShift?.checkOutTime);
                      const isClockedOut = !!(activeShift?.checkInTime && activeShift?.checkOutTime);

                      return (
                        <div 
                          key={staff.id} 
                          className={cn(
                            "p-6 rounded-2xl border transition-all flex flex-col justify-between space-y-6",
                            isClockedIn 
                              ? "bg-green-50/40 border-green-100/50" 
                              : isClockedOut
                              ? "bg-gray-50/60 border-gray-100"
                              : "bg-white border-gray-100"
                          )}
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500">
                              <User size={18} />
                            </div>
                            <div>
                              <h3 className="font-bold text-sm text-gray-900">{staff.name}</h3>
                              <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-1">{staff.role}</p>
                            </div>
                          </div>

                          {/* Today's Shift Details */}
                          <div className="text-[10px] font-bold text-gray-500 uppercase space-y-1.5 font-mono">
                            <div>Today's Date: {todayStr}</div>
                            {activeShift ? (
                              <>
                                <div>Scheduled: {activeShift.startTime} - {activeShift.endTime}</div>
                                {activeShift.checkInTime && (
                                  <div className="text-green-600">IN: {format(new Date(activeShift.checkInTime), 'hh:mm a')}</div>
                                )}
                                {activeShift.checkOutTime && (
                                  <div className="text-gray-600 font-bold">OUT: {format(new Date(activeShift.checkOutTime), 'hh:mm a')}</div>
                                )}
                              </>
                            ) : (
                              <div className="text-amber-500">No shift pre-planned today</div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-3">
                            {!isClockedIn && !isClockedOut && (
                              <button
                                onClick={() => handleCheckIn(staff.id)}
                                className="flex-1 py-3 bg-black hover:bg-gray-800 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                              >
                                Clock In
                              </button>
                            )}
                            {isClockedIn && (
                              <button
                                onClick={() => handleCheckOut(staff.id)}
                                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                              >
                                Clock Out
                              </button>
                            )}
                            {isClockedOut && (
                              <span className="flex-1 py-3 bg-gray-100 text-gray-400 rounded-xl text-[9px] font-black uppercase tracking-wider text-center block">
                                Shift Completed
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Mini Stats and Logs */}
              <div className="space-y-8">
                <div className="p-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Attendance Insights</h3>
                  
                  <div className="divide-y divide-gray-50">
                    {staffUsers.map(staff => {
                      const stats = getAttendanceSummary(staff.id);
                      return (
                        <div key={staff.id} className="py-4 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-xs text-gray-800 block">{staff.name}</span>
                            <span className="text-[9px] text-gray-400 font-mono">{staff.role}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="px-2.5 py-1 bg-green-50 text-green-600 rounded text-[9px] font-black uppercase" title="Present shifts">
                              {stats.present} P
                            </span>
                            <span className="px-2.5 py-1 bg-red-50 text-red-500 rounded text-[9px] font-black uppercase" title="Absent shifts">
                              {stats.absent} A
                            </span>
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded text-[9px] font-black uppercase" title="Late shifts">
                              {stats.late} L
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#C5A059]">Active Scent Lab Status</h3>
                  <div className="p-5 bg-amber-50/40 rounded-2xl border border-amber-100/50 flex items-start gap-4">
                    <AlertCircle className="text-[#C5A059] shrink-0 mt-0.5" size={16} />
                    <p className="text-[10px] font-bold text-[#916B27] leading-relaxed uppercase">
                      All clock-ins undergo secure geolocation & time validity encryption. Ensure staff confirm active duty prior to terminal session initialization.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SHIFT PLANNER / SCHEDULER */}
          {activeSubTab === 'schedule' && (
            <div className="space-y-8">
              
              {/* Controller Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-gray-800">Weekly Shift Planner</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Plan and dispatch lab team rosters</p>
                </div>
                <button
                  onClick={() => setIsAddShiftOpen(true)}
                  className="px-6 py-3.5 bg-black text-white hover:bg-gray-800 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2"
                >
                  <Plus size={14} /> Add Shift Plan
                </button>
              </div>

              {/* Roster Table */}
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="p-6 text-[10px] font-black uppercase tracking-wider text-gray-400">Lab Specialist</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-wider text-gray-400">Role assigned</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-wider text-gray-400">Roster Date</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-wider text-gray-400">Timings</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-wider text-gray-400">Status</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-wider text-gray-400">Log Details</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-wider text-gray-400 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {shifts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-12 text-center text-gray-400">
                            <Calendar className="mx-auto text-gray-200 mb-3" size={32} />
                            <span className="text-[10px] font-black uppercase tracking-widest">No Shift Rosters Planned</span>
                          </td>
                        </tr>
                      ) : (
                        shifts.map(shift => (
                          <tr key={shift.id} className="hover:bg-gray-50/50 transition-all">
                            <td className="p-6 font-bold text-gray-900">{shift.userName}</td>
                            <td className="p-6">
                              <span className="px-2.5 py-1 bg-gray-50 rounded font-bold uppercase text-[9px] text-gray-500">
                                {shift.role}
                              </span>
                            </td>
                            <td className="p-6 font-mono text-gray-600 font-bold">{shift.date}</td>
                            <td className="p-6 font-mono text-gray-600">{shift.startTime} - {shift.endTime}</td>
                            <td className="p-6">
                              <select
                                value={shift.status}
                                onChange={(e) => handleUpdateShiftStatus(shift.id!, e.target.value as any)}
                                className={cn(
                                  "px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider border-0 focus:ring-1 focus:ring-black outline-none",
                                  shift.status === 'present' && "bg-green-50 text-green-600",
                                  shift.status === 'scheduled' && "bg-blue-50 text-blue-600",
                                  shift.status === 'absent' && "bg-red-50 text-red-500",
                                  shift.status === 'late' && "bg-amber-50 text-amber-500"
                                )}
                              >
                                <option value="scheduled">Scheduled</option>
                                <option value="present">Present</option>
                                <option value="absent">Absent</option>
                                <option value="late">Late</option>
                              </select>
                            </td>
                            <td className="p-6 font-medium text-gray-400 max-w-[200px] truncate" title={shift.notes}>
                              {shift.notes || '—'}
                            </td>
                            <td className="p-6 text-right">
                              <button
                                onClick={() => handleDeleteShift(shift.id!)}
                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONSULTATIONS PLANNER */}
          {activeSubTab === 'consultations' && (
            <div className="space-y-8">
              
              {/* Controller Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-gray-800">Perfumer Consultations Board</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Manage customer consultations, scent profiles and notes</p>
                </div>
                <button
                  onClick={() => setIsAddConsultationOpen(true)}
                  className="px-6 py-3.5 bg-black text-white hover:bg-gray-800 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2"
                >
                  <Plus size={14} /> Book Consultation
                </button>
              </div>

              {/* Consultation Board Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {consultations.length === 0 ? (
                  <div className="md:col-span-2 lg:col-span-3 p-16 bg-white rounded-[2rem] border border-gray-100 shadow-sm text-center text-gray-400">
                    <CalendarCheck className="mx-auto text-gray-200 mb-3" size={32} />
                    <span className="text-[10px] font-black uppercase tracking-widest">No Consultations Scheduled</span>
                  </div>
                ) : (
                  consultations.map(cons => (
                    <div 
                      key={cons.id} 
                      className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all flex flex-col justify-between space-y-6"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                            cons.status === 'completed' && "bg-green-50 text-green-600",
                            cons.status === 'booked' && "bg-blue-50 text-blue-600",
                            cons.status === 'cancelled' && "bg-red-50 text-red-500",
                            cons.status === 'available' && "bg-gray-50 text-gray-500"
                          )}>
                            {cons.status}
                          </span>
                          <h3 className="font-bold text-sm text-gray-900 mt-2">Client: {cons.customerName}</h3>
                          <p className="text-[10px] text-gray-400 font-mono uppercase">Consultant: {cons.perfumerName}</p>
                        </div>
                        <span className="text-[11px] font-mono font-black text-[#C5A059] bg-amber-50 px-2.5 py-1 rounded">
                          AED {cons.fee}
                        </span>
                      </div>

                      <div className="text-[10px] font-bold text-gray-500 uppercase space-y-1.5 font-mono bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                        <div>Date: {cons.date}</div>
                        <div>Time Slot: {cons.startTime} - {cons.endTime}</div>
                        {cons.notes && (
                          <div className="normal-case text-gray-400 italic mt-1 font-sans">
                            Notes: "{cons.notes}"
                          </div>
                        )}
                      </div>

                      {/* Card Operations */}
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                        <select
                          value={cons.status}
                          onChange={(e) => handleUpdateConsultationStatus(cons.id!, e.target.value as any)}
                          className="flex-1 py-2 px-3 bg-gray-50 hover:bg-gray-100 border-0 rounded-xl text-[9px] font-black uppercase tracking-wider outline-none"
                        >
                          <option value="booked">Booked</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="available">Available</option>
                        </select>
                        <button
                          onClick={() => handleDeleteConsultation(cons.id!)}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Delete Session"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: COMMISSION CENTER */}
          {activeSubTab === 'commissions' && (
            <div className="space-y-8">
              
              {/* Dynamic stats row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="p-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Active Lab Personnel</span>
                    <span className="text-3xl font-black text-gray-900">{staffUsers.length}</span>
                  </div>
                  <div className="p-4 bg-gray-50 text-gray-500 rounded-2xl">
                    <Users size={24} />
                  </div>
                </div>

                <div className="p-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Consultation Volume</span>
                    <span className="text-3xl font-black text-gray-900">
                      {consultations.filter(c => c.status === 'completed').length}
                    </span>
                  </div>
                  <div className="p-4 bg-green-50 text-green-600 rounded-2xl">
                    <CalendarCheck size={24} />
                  </div>
                </div>

                <div className="p-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Payouts Settled</span>
                    <span className="text-3xl font-black text-[#C5A059]">
                      AED {commissionPayouts.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-4 bg-amber-50 text-[#C5A059] rounded-2xl">
                    <DollarSign size={24} />
                  </div>
                </div>

              </div>

              {/* Commission Calculator and Policy Board */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Policy Configurations / Left */}
                <div className="p-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                  <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                    <h3 className="font-black text-xs uppercase tracking-wider text-gray-800">Protocol Rates</h3>
                    <button 
                      onClick={() => setIsConfigureRatesOpen(!isConfigureRatesOpen)}
                      className="text-[10px] font-black uppercase text-[#C5A059] hover:underline"
                    >
                      {isConfigureRatesOpen ? "Close Config" : "Adjust Rates"}
                    </button>
                  </div>

                  <div className="space-y-6">
                    {staffUsers.map(staff => {
                      const rates = rateForm[staff.id] || { sales: 5, consultations: 15 };
                      return (
                        <div key={staff.id} className="space-y-3 p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-bold text-xs text-gray-800 block">{staff.name}</span>
                              <span className="text-[8px] text-gray-400 font-mono uppercase tracking-widest">{staff.role}</span>
                            </div>
                            {isConfigureRatesOpen && (
                              <button
                                onClick={() => handleSaveCommissionRates(staff.id)}
                                className="p-2 bg-black text-white hover:bg-gray-800 rounded-lg text-[9px] font-black uppercase"
                              >
                                Save
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-[9px] font-black uppercase tracking-wider text-gray-400">
                            <div>
                              <span>On Sales:</span>
                              {isConfigureRatesOpen ? (
                                <input 
                                  type="number"
                                  value={rates.sales}
                                  onChange={(e) => setRateForm({
                                    ...rateForm,
                                    [staff.id]: { ...rates, sales: Number(e.target.value) }
                                  })}
                                  className="w-full px-2 py-1 bg-white border border-gray-100 rounded mt-1 outline-none text-black font-mono"
                                />
                              ) : (
                                <span className="block text-sm font-black text-gray-800 mt-1">{staff.commissionRateSales ?? 5}%</span>
                              )}
                            </div>

                            <div>
                              <span>On Consultations:</span>
                              {isConfigureRatesOpen ? (
                                <input 
                                  type="number"
                                  value={rates.consultations}
                                  onChange={(e) => setRateForm({
                                    ...rateForm,
                                    [staff.id]: { ...rates, consultations: Number(e.target.value) }
                                  })}
                                  className="w-full px-2 py-1 bg-white border border-gray-100 rounded mt-1 outline-none text-black font-mono"
                                />
                              ) : (
                                <span className="block text-sm font-black text-gray-800 mt-1">{staff.commissionRateConsultations ?? 15}%</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Calculator Panel / Center & Right */}
                <div className="lg:col-span-2 p-8 md:p-10 bg-white rounded-[2rem] border border-gray-100 shadow-sm space-y-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-50 pb-6 gap-4">
                    <div>
                      <h3 className="font-black text-base uppercase tracking-tight text-gray-800">Payout Calculator</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Select date-range to query commission logs</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <select
                        value={selectedStaffForCommission}
                        onChange={(e) => setSelectedStaffForCommission(e.target.value)}
                        className="py-2.5 px-4 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-wider outline-none text-gray-700 focus:bg-white focus:border-black/20"
                      >
                        {staffUsers.map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>

                      <div className="flex items-center gap-2">
                        <input 
                          type="date"
                          value={commissionStartDate}
                          onChange={(e) => setCommissionStartDate(e.target.value)}
                          className="py-2.5 px-4 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-mono outline-none text-gray-700"
                        />
                        <span className="text-[10px] font-black uppercase text-gray-400">to</span>
                        <input 
                          type="date"
                          value={commissionEndDate}
                          onChange={(e) => setCommissionEndDate(e.target.value)}
                          className="py-2.5 px-4 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-mono outline-none text-gray-700"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Calculator calculations summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50/50 p-6 rounded-3xl border border-gray-100/50">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Sales Commission</span>
                      <div className="text-xl font-black text-gray-800">AED {calculatedCommissions.salesComm.toFixed(2)}</div>
                      <div className="text-[8px] font-mono text-gray-400">{calculatedCommissions.matchedSales.length} qualified sales</div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Consultation Commission</span>
                      <div className="text-xl font-black text-gray-800">AED {calculatedCommissions.consultComm.toFixed(2)}</div>
                      <div className="text-[8px] font-mono text-gray-400">{calculatedCommissions.matchedConsultations.length} complete sessions</div>
                    </div>

                    <div className="space-y-1 relative">
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Calculated Payout</span>
                      <div className="text-2xl font-black text-[#C5A059]">AED {calculatedCommissions.total.toFixed(2)}</div>
                      
                      {calculatedCommissions.total > 0 && (
                        <button
                          onClick={handleRecordPayout}
                          className="mt-3 w-full py-2 bg-black text-white hover:bg-gray-800 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                        >
                          Record Payout
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sales & Consultations List in this range for assignation */}
                  <div className="space-y-6">
                    <h4 className="text-xs font-black uppercase tracking-wider text-gray-800">Query Roster logs ({commissionStartDate} - {commissionEndDate})</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Qualified Sales */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-400">
                          <span>Attributed Sales</span>
                          <span>{calculatedCommissions.matchedSales.length} Matches</span>
                        </div>
                        <div className="max-h-[220px] overflow-y-auto no-scrollbar border border-gray-100 rounded-2xl divide-y divide-gray-50 bg-white">
                          {calculatedCommissions.matchedSales.length === 0 ? (
                            <p className="p-8 text-center text-gray-400 text-[9px] uppercase font-bold">No sales in this interval</p>
                          ) : (
                            calculatedCommissions.matchedSales.map((s: Sale) => (
                              <div key={s.id} className="p-4 flex justify-between items-center hover:bg-gray-50/50">
                                <div>
                                  <span className="font-bold text-[11px] block">{s.invoiceNumber}</span>
                                  <span className="text-[8px] font-mono text-gray-400">{s.createdAt?.split('T')[0]}</span>
                                </div>
                                <div className="text-right">
                                  <span className="font-mono font-bold text-[11px] block">AED {s.grandTotal}</span>
                                  <span className="text-[8px] text-green-600 font-bold block">+{((s.grandTotal * (selectedStaffObj?.commissionRateSales || 5)) / 100).toFixed(1)} AED</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Completed Consultations */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-400">
                          <span>Attributed Consultations</span>
                          <span>{calculatedCommissions.matchedConsultations.length} Matches</span>
                        </div>
                        <div className="max-h-[220px] overflow-y-auto no-scrollbar border border-gray-100 rounded-2xl divide-y divide-gray-50 bg-white">
                          {calculatedCommissions.matchedConsultations.length === 0 ? (
                            <p className="p-8 text-center text-gray-400 text-[9px] uppercase font-bold">No consultations in this interval</p>
                          ) : (
                            calculatedCommissions.matchedConsultations.map((c: Consultation) => (
                              <div key={c.id} className="p-4 flex justify-between items-center hover:bg-gray-50/50">
                                <div>
                                  <span className="font-bold text-[11px] block">{c.customerName}</span>
                                  <span className="text-[8px] font-mono text-gray-400">{c.date}</span>
                                </div>
                                <div className="text-right">
                                  <span className="font-mono font-bold text-[11px] block">AED {c.fee}</span>
                                  <span className="text-[8px] text-green-600 font-bold block">+{((c.fee * (selectedStaffObj?.commissionRateConsultations || 15)) / 100).toFixed(1)} AED</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Payout Logs History */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-gray-800">Recorded Payout History</h4>
                    <div className="border border-gray-100 rounded-2xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                              <th className="p-4 text-[9px] font-black uppercase tracking-wider text-gray-400">Staff Member</th>
                              <th className="p-4 text-[9px] font-black uppercase tracking-wider text-gray-400">Roster Interval</th>
                              <th className="p-4 text-[9px] font-black uppercase tracking-wider text-gray-400">Payout Amount</th>
                              <th className="p-4 text-[9px] font-black uppercase tracking-wider text-gray-400">Payout Date</th>
                              <th className="p-4 text-[9px] font-black uppercase tracking-wider text-gray-400">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {commissionPayouts.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-400 font-bold uppercase text-[9px]">No Payouts logged yet</td>
                              </tr>
                            ) : (
                              commissionPayouts.map(pay => (
                                <tr key={pay.id}>
                                  <td className="p-4 font-bold text-gray-900">{pay.userName}</td>
                                  <td className="p-4 font-mono text-gray-400 text-[10px]">{pay.dateRangeStart} to {pay.dateRangeEnd}</td>
                                  <td className="p-4 font-bold font-mono text-gray-800">AED {pay.amount.toFixed(2)}</td>
                                  <td className="p-4 font-mono text-gray-600">{pay.payoutDate}</td>
                                  <td className="p-4">
                                    <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-[8px] font-black uppercase tracking-wider">
                                      {pay.status}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* MODAL 1: ADD ROSTER SHIFT */}
      <AnimatePresence>
        {isAddShiftOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-[200]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-8 md:p-10 space-y-8 animate-fadeIn relative"
            >
              <button 
                onClick={() => setIsAddShiftOpen(false)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-black rounded-lg"
              >
                <XCircle size={18} />
              </button>

              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">Roster New Shift</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Plan and distribute schedule logs for perfumers</p>
              </div>

              <form onSubmit={handleAddShift} className="space-y-6">
                
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Staff Member</label>
                  <select
                    value={newShift.userId}
                    onChange={(e) => setNewShift({ ...newShift, userId: e.target.value })}
                    required
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-semibold outline-none focus:bg-white focus:border-black/20 transition-all"
                  >
                    <option value="">Select Staff...</option>
                    {staffUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Roster Date</label>
                    <input 
                      type="date"
                      value={newShift.date}
                      onChange={(e) => setNewShift({ ...newShift, date: e.target.value })}
                      required
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-mono outline-none focus:bg-white focus:border-black/20 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Roster Role</label>
                    <select
                      value={newShift.role}
                      onChange={(e) => setNewShift({ ...newShift, role: e.target.value })}
                      required
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-semibold outline-none focus:bg-white focus:border-black/20 transition-all"
                    >
                      <option value="Head Perfumer">Head Perfumer</option>
                      <option value="Bespoke Scent Consultant">Bespoke Scent Consultant</option>
                      <option value="Junior Perfumer">Junior Perfumer</option>
                      <option value="Scent Lab Associate">Scent Lab Associate</option>
                      <option value="Cashier">Cashier</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Roster Start Time</label>
                    <input 
                      type="time"
                      value={newShift.startTime}
                      onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                      required
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-mono outline-none focus:bg-white focus:border-black/20 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Roster End Time</label>
                    <input 
                      type="time"
                      value={newShift.endTime}
                      onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                      required
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-mono outline-none focus:bg-white focus:border-black/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-500"> Roster Notes</label>
                  <textarea
                    value={newShift.notes}
                    onChange={(e) => setNewShift({ ...newShift, notes: e.target.value })}
                    placeholder="Enter special lab guidelines..."
                    rows={3}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs outline-none focus:bg-white focus:border-black/20 transition-all placeholder:text-gray-300 resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 px-8 bg-black hover:bg-gray-900 text-white rounded-[1.5rem] font-black tracking-widest text-xs uppercase shadow-lg shadow-black/10 flex items-center justify-center gap-2"
                >
                  Confirm Shift Plan
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: BOOK CONSULTATION */}
      <AnimatePresence>
        {isAddConsultationOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-[200]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-8 md:p-10 space-y-8 animate-fadeIn relative"
            >
              <button 
                onClick={() => setIsAddConsultationOpen(false)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-black rounded-lg"
              >
                <XCircle size={18} />
              </button>

              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">Roster Consultation</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Lock available slots for bespoke customer scent-mixing sessions</p>
              </div>

              <form onSubmit={handleAddConsultation} className="space-y-6">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Perfumer / Consultant</label>
                    <select
                      value={newConsultation.perfumerId}
                      onChange={(e) => setNewConsultation({ ...newConsultation, perfumerId: e.target.value })}
                      required
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-semibold outline-none focus:bg-white focus:border-black/20 transition-all"
                    >
                      <option value="">Select Perfumer...</option>
                      {staffUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Connoisseur / Client</label>
                    <select
                      value={newConsultation.customerId}
                      onChange={(e) => setNewConsultation({ ...newConsultation, customerId: e.target.value })}
                      required
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-semibold outline-none focus:bg-white focus:border-black/20 transition-all"
                    >
                      <option value="">Select Customer...</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1 space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Consultation Fee</label>
                    <input 
                      type="number"
                      value={newConsultation.fee}
                      onChange={(e) => setNewConsultation({ ...newConsultation, fee: Number(e.target.value) })}
                      required
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-mono outline-none focus:bg-white focus:border-black/20 transition-all"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Consultation Date</label>
                    <input 
                      type="date"
                      value={newConsultation.date}
                      onChange={(e) => setNewConsultation({ ...newConsultation, date: e.target.value })}
                      required
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-mono outline-none focus:bg-white focus:border-black/20 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Start Time Slot</label>
                    <input 
                      type="time"
                      value={newConsultation.startTime}
                      onChange={(e) => setNewConsultation({ ...newConsultation, startTime: e.target.value })}
                      required
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-mono outline-none focus:bg-white focus:border-black/20 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">End Time Slot</label>
                    <input 
                      type="time"
                      value={newConsultation.endTime}
                      onChange={(e) => setNewConsultation({ ...newConsultation, endTime: e.target.value })}
                      required
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-mono outline-none focus:bg-white focus:border-black/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Consultation Notes / Scent Profile Requests</label>
                  <textarea
                    value={newConsultation.notes}
                    onChange={(e) => setNewConsultation({ ...newConsultation, notes: e.target.value })}
                    placeholder="Enter desired scent families, note concentrations, and customer scent history..."
                    rows={3}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs outline-none focus:bg-white focus:border-black/20 transition-all placeholder:text-gray-300 resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 px-8 bg-black hover:bg-gray-900 text-white rounded-[1.5rem] font-black tracking-widest text-xs uppercase shadow-lg shadow-black/10 flex items-center justify-center gap-2"
                >
                  Complete Booking
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
