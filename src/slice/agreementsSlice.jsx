import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Helper function to format date without timezone
const formatDateWithoutTimezone = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const milliseconds = String(d.getMilliseconds()).padStart(3, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
};

// Demo agreements data - EXACTLY 9 agreements like the old UI
const demoAgreements = [
  {
    id: "STATIC-001",
    selectedClient: "TechCorp Solutions",
    selectedDepartment: "IT Services",
    agreementType: "LOI",
    startDate: "2024-01-15",
    endDate: "2024-12-31",
    totalValue: 50000,
    currency: "USD",
    status: "Execution Pending",
    submittedDate: formatDateWithoutTimezone(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)),
    submittedBy: "checker",
    entityType: "single",
    priority: "Medium",
    clauses: [
      { title: "Term and termination (Duration)", placeholder: "12 months", isInitial: true },
      { title: "Payment Terms", placeholder: "15 days", isInitial: true },
      { title: "Penalty", placeholder: "500/-", isInitial: true }
    ],
    uploadStatuses: {
      LOI: { uploaded: true, file: { name: "TechCorp_LOI.pdf", size: "2.1 MB" } },
      WO: { uploaded: true, file: { name: "TechCorp_WO.pdf", size: "1.8 MB" } },
      PO: { uploaded: true, file: { name: "TechCorp_PO.pdf", size: "3.2 MB" } }
    },
    importantClauses: [
      "Term and termination",
      "Payment Terms",
      "SLA",
      "Insurance",
      "Confidentiality"
    ],
    selectedBranches: [
      { name: "Mumbai Central", id: "branch-001" },
      { name: "Andheri West", id: "branch-002" }
    ],
    createdAt: "2024-01-10T10:00:00",
    lastModified: "2024-01-15T14:30:00",
    version: "1.0.0"
  },
  {
    id: "STATIC-002",
    selectedClient: "Global Industries",
    selectedDepartment: "Manufacturing",
    agreementType: "WO",
    startDate: "2024-02-01",
    endDate: "2025-01-31",
    totalValue: 75000,
    currency: "EUR",
    status: "Executed",
    submittedDate: formatDateWithoutTimezone(new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)),
    submittedBy: "checker",
    entityType: "single",
    priority: "Low",
    clauses: [
      { title: "Quality Standards", placeholder: "ISO 9001", isInitial: true },
      { title: "Delivery Schedule", placeholder: "30 days", isInitial: true },
      { title: "Service Level Agreement", placeholder: "Business hours support", isInitial: true }
    ],
    uploadStatuses: {
      WO: { uploaded: true, file: { name: "GlobalIndustries_WO.pdf", size: "2.8 MB" } },
      PO: { uploaded: true, file: { name: "GlobalIndustries_PO.pdf", size: "3.1 MB" } }
    },
    importantClauses: [
      "Quality Standards",
      "Delivery Schedule",
      "Service Level Agreement"
    ],
    selectedBranches: [
      { name: "Pune Industrial", id: "branch-003" }
    ],
    createdAt: "2024-02-01T09:00:00",
    lastModified: "2024-02-05T16:45:00",
    version: "1.0.0"
  },
  {
    id: "STATIC-003",
    selectedClient: "Healthcare Plus",
    selectedDepartment: "Medical Services",
    agreementType: "PO",
    startDate: "2024-02-15",
    endDate: "2025-02-14",
    totalValue: 120000,
    currency: "USD",
    status: "Under Process with Client",
    submittedDate: formatDateWithoutTimezone(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)),
    submittedBy: "checker",
    entityType: "single",
    priority: "High",
    clauses: [
      { title: "Medical Standards", placeholder: "FDA Approved", isInitial: true },
      { title: "Emergency Response", placeholder: "24/7", isInitial: true },
      { title: "Quality Assurance", placeholder: "Monthly audits", isInitial: true }
    ],
    uploadStatuses: {
      PO: { uploaded: true, file: { name: "HealthcarePlus_PO.pdf", size: "4.2 MB" } }
    },
    importantClauses: [
      "Medical Standards",
      "Emergency Response",
      "Quality Assurance"
    ],
    selectedBranches: [
      { name: "Delhi Medical", id: "branch-004" },
      { name: "Bangalore Health", id: "branch-005" }
    ],
    createdAt: "2024-02-15T11:00:00",
    lastModified: "2024-02-20T15:30:00",
    version: "1.0.0"
  },
  {
    id: "STATIC-004",
    selectedClient: "EduTech Solutions",
    selectedDepartment: "Education Technology",
    agreementType: "LOI",
    startDate: "2024-03-01",
    endDate: "2025-02-28",
    totalValue: 85000,
    currency: "USD",
    status: "Approved",
    submittedDate: formatDateWithoutTimezone(new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)),
    submittedBy: "checker",
    entityType: "single",
    priority: "Medium",
    clauses: [
      { title: "Educational Standards", placeholder: "International", isInitial: true },
      { title: "Technology Support", placeholder: "Business hours", isInitial: true },
      { title: "Training Requirements", placeholder: "Monthly sessions", isInitial: true }
    ],
    uploadStatuses: {
      LOI: { uploaded: true, file: { name: "EduTech_LOI.pdf", size: "3.1 MB" } },
      WO: { uploaded: true, file: { name: "EduTech_WO.pdf", size: "2.9 MB" } }
    },
    importantClauses: [
      "Educational Standards",
      "Technology Support",
      "Training Requirements"
    ],
    selectedBranches: [
      { name: "Hyderabad Tech", id: "branch-006" }
    ],
    createdAt: "2024-03-01T10:00:00",
    lastModified: "2024-03-05T14:20:00",
    version: "1.0.0"
  },
  {
    id: "STATIC-005",
    selectedClient: "Green Energy Corp",
    selectedDepartment: "Renewable Energy",
    agreementType: "WO",
    startDate: "2024-03-15",
    endDate: "2025-03-14",
    totalValue: 150000,
    currency: "USD",
    status: "Execution Pending",
    submittedDate: formatDateWithoutTimezone(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
    submittedBy: "checker",
    entityType: "single",
    priority: "High",
    clauses: [
      { title: "Environmental Standards", placeholder: "ISO 14001", isInitial: true },
      { title: "Energy Efficiency", placeholder: "90%+", isInitial: true },
      { title: "Maintenance Schedule", placeholder: "Quarterly", isInitial: true }
    ],
    uploadStatuses: {
      WO: { uploaded: true, file: { name: "GreenEnergy_WO.pdf", size: "3.8 MB" } },
      PO: { uploaded: true, file: { name: "GreenEnergy_PO.pdf", size: "4.5 MB" } }
    },
    importantClauses: [
      "Environmental Standards",
      "Energy Efficiency",
      "Maintenance Schedule"
    ],
    selectedBranches: [
      { name: "Chennai Energy", id: "branch-007" },
      { name: "Kolkata Power", id: "branch-008" }
    ],
    createdAt: "2024-03-15T09:00:00",
    lastModified: "2024-03-18T16:45:00",
    version: "1.0.0"
  },
  {
    id: "STATIC-006",
    selectedClient: "Innovation Systems",
    selectedDepartment: "Research & Development",
    agreementType: "PO",
    startDate: "2024-04-01",
    endDate: "2025-03-31",
    totalValue: 95000,
    currency: "USD",
    status: "Rejected",
    submittedDate: formatDateWithoutTimezone(new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)),
    submittedBy: "checker",
    entityType: "single",
    priority: "Medium",
    clauses: [
      { title: "Research Standards", placeholder: "International", isInitial: true },
      { title: "Intellectual Property", placeholder: "Shared ownership", isInitial: true },
      { title: "Publication Rights", placeholder: "Joint publications", isInitial: true }
    ],
    uploadStatuses: {
      PO: { uploaded: true, file: { name: "InnovationSystems_PO.pdf", size: "2.7 MB" } }
    },
    importantClauses: [
      "Research Standards",
      "Intellectual Property",
      "Publication Rights"
    ],
    selectedBranches: [
      { name: "Bangalore", id: "branch-009" }
    ],
    createdAt: "2024-04-01T08:00:00",
    lastModified: "2024-04-05T12:15:00",
    version: "1.0.0"
  },
  {
    id: "STATIC-007",
    selectedClient: "Digital Solutions Pvt Ltd",
    selectedDepartment: "Digital Marketing",
    agreementType: "LOI",
    startDate: "2024-04-15",
    endDate: "2025-04-14",
    totalValue: 65000,
    currency: "USD",
    status: "Execution Pending",
    submittedDate: formatDateWithoutTimezone(new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)),
    submittedBy: "checker",
    entityType: "single",
    priority: "Low",
    clauses: [
      { title: "Digital Standards", placeholder: "Industry best practices", isInitial: true },
      { title: "Performance Metrics", placeholder: "Monthly reports", isInitial: true },
      { title: "Content Guidelines", placeholder: "Brand compliance", isInitial: true }
    ],
    uploadStatuses: {
      LOI: { uploaded: true, file: { name: "DigitalSolutions_LOI.pdf", size: "2.3 MB" } }
    },
    importantClauses: [
      "Digital Standards",
      "Performance Metrics",
      "Content Guidelines"
    ],
    selectedBranches: [
      { name: "Chennai", id: "branch-010" },
      { name: "Coimbatore", id: "branch-011" }
    ],
    createdAt: "2024-04-15T10:30:00",
    lastModified: "2024-04-18T15:20:00",
    version: "1.0.0"
  },
  {
    id: "STATIC-008",
    selectedClient: "Future Technologies",
    selectedDepartment: "Artificial Intelligence",
    agreementType: "WO",
    startDate: "2024-05-01",
    endDate: "2025-04-30",
    totalValue: 180000,
    currency: "USD",
    status: "Execution Pending",
    submittedDate: formatDateWithoutTimezone(new Date(Date.now() - 18 * 24 * 60 * 60 * 1000)),
    submittedBy: "checker",
    entityType: "single",
    priority: "High",
    clauses: [
      { title: "AI Ethics", placeholder: "Responsible AI guidelines", isInitial: true },
      { title: "Data Privacy", placeholder: "GDPR compliant", isInitial: true },
      { title: "Algorithm Transparency", placeholder: "Explainable AI", isInitial: true }
    ],
    uploadStatuses: {
      WO: { uploaded: true, file: { name: "FutureTechnologies_WO.pdf", size: "3.9 MB" } },
      PO: { uploaded: true, file: { name: "FutureTechnologies_PO.pdf", size: "4.1 MB" } }
    },
    importantClauses: [
      "AI Ethics",
      "Data Privacy",
      "Algorithm Transparency"
    ],
    selectedBranches: [
      { name: "Hyderabad", id: "branch-012" }
    ],
    createdAt: "2024-05-01T09:15:00",
    lastModified: "2024-05-05T13:40:00",
    version: "1.0.0"
  },
  {
    id: "STATIC-009",
    selectedClient: "Smart Logistics",
    selectedDepartment: "Supply Chain",
    agreementType: "PO",
    startDate: "2024-05-15",
    endDate: "2025-05-14",
    totalValue: 110000,
    currency: "USD",
    status: "Execution Pending",
    submittedDate: formatDateWithoutTimezone(new Date(Date.now() - 22 * 24 * 60 * 60 * 1000)),
    submittedBy: "checker",
    entityType: "single",
    priority: "Medium",
    clauses: [
      { title: "Delivery Standards", placeholder: "Next day delivery", isInitial: true },
      { title: "Inventory Management", placeholder: "Real-time tracking", isInitial: true },
      { title: "Quality Control", placeholder: "Random sampling", isInitial: true }
    ],
    uploadStatuses: {
      PO: { uploaded: true, file: { name: "SmartLogistics_PO.pdf", size: "3.4 MB" } }
    },
    importantClauses: [
      "Delivery Standards",
      "Inventory Management",
      "Quality Control"
    ],
    selectedBranches: [
      { name: "Mumbai Port", id: "branch-013" },
      { name: "Delhi Hub", id: "branch-014" }
    ],
    createdAt: "2024-05-15T11:45:00",
    lastModified: "2024-05-20T14:10:00",
    version: "1.0.0"
  }
];

const initialState = {
  agreements: demoAgreements,
  loading: false,
  error: null,
  filters: {
    client: "",
    city: "",
    state: "",
    fromDate: "",
    toDate: "",
    addendumsFilter: "all"
  }
};

// Async thunks for future API integration
export const fetchAgreements = createAsyncThunk(
  'agreements/fetchAgreements',
  async () => {
    // Simulate API call
    return new Promise(resolve => setTimeout(() => resolve(demoAgreements), 1000));
  }
);

export const createAgreement = createAsyncThunk(
  'agreements/createAgreement',
  async (agreementData) => {
    // Simulate API call
    const newAgreement = {
      ...agreementData,
      id: `AGR${Date.now()}`,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      version: "1.0.0"
    };
    return newAgreement;
  }
);

export const updateAgreement = createAsyncThunk(
  'agreements/updateAgreement',
  async ({ id, updates }) => {
    // Simulate API call
    return { id, updates };
  }
);

const agreementsSlice = createSlice({
  name: 'agreements',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        client: "",
        city: "",
        state: "",
        fromDate: "",
        toDate: "",
        addendumsFilter: "all"
      };
    },
    updateAgreementStatus: (state, action) => {
      const { id, status, approvedDate, finalAgreement, priority } = action.payload;
      const agreement = state.agreements.find(ag => ag.id === id);
      if (agreement) {
        if (status !== undefined) agreement.status = status;
        if (approvedDate !== undefined) agreement.approvedDate = approvedDate;
        if (finalAgreement !== undefined) agreement.finalAgreement = finalAgreement;
        if (priority !== undefined) agreement.priority = priority;
        agreement.lastModified = new Date().toISOString();
      }
    },
    addAgreement: (state, action) => {
      state.agreements.push(action.payload);
    },
    removeAgreement: (state, action) => {
      state.agreements = state.agreements.filter(ag => ag.id !== action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAgreements.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAgreements.fulfilled, (state, action) => {
        state.loading = false;
        state.agreements = action.payload;
      })
      .addCase(fetchAgreements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createAgreement.fulfilled, (state, action) => {
        state.agreements.push(action.payload);
      })
      .addCase(updateAgreement.fulfilled, (state, action) => {
        const { id, updates } = action.payload;
        const agreement = state.agreements.find(ag => ag.id === id);
        if (agreement) {
          Object.assign(agreement, updates);
          agreement.lastModified = new Date().toISOString();
        }
      });
  }
});

export const {
  setFilters,
  clearFilters,
  updateAgreementStatus,
  addAgreement,
  removeAgreement
} = agreementsSlice.actions;

// Selectors
export const selectAllAgreements = (state) => state.agreements.agreements;
export const selectAgreementsLoading = (state) => state.agreements.loading;
export const selectAgreementsError = (state) => state.agreements.error;
export const selectAgreementsFilters = (state) => state.agreements.filters;

export default agreementsSlice.reducer;
