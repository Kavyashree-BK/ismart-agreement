import React, { useState, useEffect, useCallback } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";

// Hardcoded clients and their branches
const clientsData = [
  {
    name: "ABC Corp",
    branches: [
      {
        id: "BR001",
        name: "Mumbai Branch",
        code: "MUM",
        type: "Regional",
        status: "Active",
        address: "Mumbai, Maharashtra",
        manager: "John Doe"
      },
      {
        id: "BR002",
        name: "Pune Branch", 
        code: "PUN",
        type: "Regional",
        status: "Active",
        address: "Pune, Maharashtra",
        manager: "Jane Smith"
      },
      {
        id: "BR003",
        name: "Delhi Branch",
        code: "DEL",
        type: "Regional", 
        status: "Active",
        address: "Delhi, NCR",
        manager: "Mike Johnson"
      }
    ]
  },
  {
    name: "XYZ Ltd",
    branches: [
      {
        id: "BR004",
        name: "Chennai Branch",
        code: "CHE",
        type: "Regional",
        status: "Active", 
        address: "Chennai, Tamil Nadu",
        manager: "Sarah Wilson"
      },
      {
        id: "BR005",
        name: "Hyderabad Branch",
        code: "HYD",
        type: "Regional",
        status: "Active",
        address: "Hyderabad, Telangana", 
        manager: "David Brown"
      }
    ]
  },
  {
    name: "Tech Solutions",
    branches: [
      {
        id: "BR006",
        name: "Bangalore HQ",
        code: "BLR",
        type: "Headquarters",
        status: "Active",
        address: "Bangalore, Karnataka",
        manager: "Lisa Anderson"
      },
      {
        id: "BR007",
        name: "Kolkata Branch",
        code: "KOL",
        type: "Regional",
        status: "Active",
        address: "Kolkata, West Bengal",
        manager: "Robert Taylor"
      }
    ]
  },
  {
    name: "CC Ltd",
    branches: [
      {
        id: "BR008",
        name: "Lucknow Branch",
        code: "LKO",
        type: "Regional",
        status: "Active",
        address: "Lucknow, Uttar Pradesh",
        manager: "Priya Sharma"
      },
      {
        id: "BR009",
        name: "Kanpur Branch",
        code: "KNP",
        type: "Regional",
        status: "Active",
        address: "Kanpur, Uttar Pradesh",
        manager: "Amit Kumar"
      }
    ]
  },
  {
    name: "Delta Inc",
    branches: [
      {
        id: "BR010",
        name: "Ahmedabad Branch",
        code: "AMD",
        type: "Regional",
        status: "Active",
        address: "Ahmedabad, Gujarat",
        manager: "Rajesh Patel"
      },
      {
        id: "BR011",
        name: "Surat Branch",
        code: "SUR",
        type: "Regional",
        status: "Active",
        address: "Surat, Gujarat",
        manager: "Meera Shah"
      },
      {
        id: "BR012",
        name: "Vadodara Branch",
        code: "VAD",
        type: "Regional",
        status: "Active",
        address: "Vadodara, Gujarat",
        manager: "Vikram Singh"
      }
    ]
  }
];

const AgreementForm = (props) => {
  const { onSubmit, editingAgreement, onEditComplete } = props;
  const [entityType, setEntityType] = useState("single");
  const [agreementDraftType, setAgreementDraftType] = useState("client");
  const [clauses, setClauses] = useState(initialClauses());
  const [underList, setUnderList] = useState(initialUnderList());
  const [form, setForm] = useState(initialFormData());
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [uploadedStatus, setUploadedStatus] = useState({});
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [escalationError, setEscalationError] = useState("");
  const [userRole, setUserRole] = useState("checker");
  const [selectedClient, setSelectedClient] = useState("");
  const [availableBranches, setAvailableBranches] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [userInfoErrors, setUserInfoErrors] = useState({});
  const [uploadStatuses, setUploadStatuses] = useState({
    LOI: { uploaded: false, status: "", remarks: "" },
    WO: { uploaded: false, status: "", remarks: "" },
    PO: { uploaded: false, status: "", remarks: "" },
    EmailApproval: { uploaded: false, status: "", remarks: "" },
    Agreement: { uploaded: false, status: "", remarks: "" },
    // Clause uploads will be added dynamically as clause-0, clause-1, ...
  });
  const [stage, setStage] = useState("checker"); // checker or approver
  const [isContinueClicked, setIsContinueClicked] = useState(false);
  const [uploadError, setUploadError] = useState({}); // { [type]: errorMsg }
  const [draftSaved, setDraftSaved] = useState(false);
  const [draft, setDraft] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [isOpenAgreement, setIsOpenAgreement] = useState(false);

  // Debounce mechanism to prevent excessive re-renders
  const [debounceTimer, setDebounceTimer] = useState(null);

  const debouncedSetForm = useCallback((updates) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    const timer = setTimeout(() => {
      setForm(prev => ({ ...prev, ...updates }));
    }, 100); // 100ms debounce
    setDebounceTimer(timer);
  }, [debounceTimer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  // Check if agreement is expiring within 30 days
  const today = new Date();
  const timeDiff = endDate.getTime() - today.getTime();
  const daysToExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));
  const isExpiringSoon = daysToExpiry > 0 && daysToExpiry <= 30;

  // Handle editing mode - pre-fill form when editingAgreement is provided
  useEffect(() => {
    console.log("AgreementForm useEffect - editingAgreement:", editingAgreement);
    if (editingAgreement) {
      console.log("Setting edit mode with agreement data:", editingAgreement);
      setIsEditMode(true);
      
      // Pre-fill all form data
      setForm(editingAgreement.form || initialFormData());
      setClauses(editingAgreement.clauses || initialClauses());
      setUnderList(editingAgreement.underList || initialUnderList());
      setEntityType(editingAgreement.entityType || "single");
      setAgreementDraftType(editingAgreement.agreementDraftType || "client");
      setUserRole(editingAgreement.userRole || "checker");
      setSelectedClient(editingAgreement.selectedClient || "");
      
      // Update available sites based on selected client
      const clientObj = clientsData.find(c => c.name === editingAgreement.selectedClient);
      setAvailableBranches(clientObj ? clientObj.branches : []);
      setSelectedBranches(editingAgreement.selectedBranches || []);
      
      setUploadStatuses(editingAgreement.uploadStatuses || {});
      setStartDate(editingAgreement.startDate ? new Date(editingAgreement.startDate) : new Date());
      setEndDate(editingAgreement.endDate ? new Date(editingAgreement.endDate) : new Date());
      setIsOpenAgreement(editingAgreement.isOpenAgreement || false); // Set the new state
    } else {
      console.log("Setting normal mode (no editing)");
      setIsEditMode(false);
    }
  }, [editingAgreement]);

  // Handle click outside to close branch dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (branchDropdownOpen && !event.target.closest('.branch-dropdown')) {
        setBranchDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [branchDropdownOpen]);

  function initialClauses() {
    return [
      { title: "Term and termination (Duration)", placeholder: "30 days", isInitial: true },
      { title: "Payment Terms", placeholder: "15", isInitial: true },
      { title: "Penalty", placeholder: "500/-", isInitial: true },
      { title: "Minimum Wages", placeholder: "Yearly / Not Allowed / At Actual", isInitial: true },
      { title: "Costing - Salary Breakup", placeholder: "Yes / No", isInitial: true },
      { title: "SLA", placeholder: "Specific Page/Clause", isInitial: true },
      { title: "Indemnity", placeholder: "Specific Page/Clause", isInitial: true },
      { title: "Insurance", placeholder: "Specific Page/Clause", isInitial: true },
    ];
  }

  function initialUnderList() {
    return [
      {
        type: "text",
        placeholder: "Under list / annexure",
        className: "border border-gray-300 p-2 rounded text-sm",
      },
    ];
  }

  function initialFormData() {
    return {
      iSmartName: "",
      iSmartContact: "",
      iSmartEmail: "",
      clientName: "",
      clientContact: "",
      clientEmail: "",
    };
  }

     const handleAddClause = () => {
     setClauses(prevClauses => {
       const newClauses = [...prevClauses, { title: "", placeholder: "Enter clause details", isInitial: false }];
       // Initialize uploadStatuses for the new clause
       setUploadStatuses(prevStatuses => ({
         ...prevStatuses,
         [`clause-${newClauses.length - 1}`]: { uploaded: false, file: undefined }
       }));
       return newClauses;
     });
   };

  const handleRemoveClause = (index) => {
    const updatedClauses = clauses.filter((_, i) => i !== index);
    setClauses(updatedClauses);
  };

  const duplicateElement = () => {
    setUnderList([...underList, ...initialUnderList()]);
  };

  const handleRemoveUnderList = (index) => {
    setUnderList(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const errs = {};
    // Email: lowercase, numbers, . _ % + - before @, . - in domain, no uppercase, no special chars at start/end
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    // Phone: exactly 10 digits, no spaces or special chars
    const phoneRegex = /^\d{10}$/;

    if (!phoneRegex.test(form.iSmartContact)) {
      errs.iSmartContact = "Phone number must be exactly 10 digits, no spaces or special characters.";
    }

    if (!phoneRegex.test(form.clientContact)) {
      errs.clientContact = "Phone number must be exactly 10 digits, no spaces or special characters.";
    }

    if (!emailRegex.test(form.iSmartEmail)) {
      errs.iSmartEmail = "Invalid email address. Only lowercase letters, numbers, and . _ % + - allowed before @. No uppercase or other special characters.";
    }

    if (!emailRegex.test(form.clientEmail)) {
      errs.clientEmail = "Invalid email address. Only lowercase letters, numbers, and . _ % + - allowed before @. No uppercase or other special characters.";
    }

    return errs;
  };

  const handleSubmit = () => {
    console.log("Submit clicked");
    const errs = validateForm();
    // Require at least one document from: LOI, WO, PO, or Email Approval
    const requiredDocumentTypes = ["WO", "PO", "LOI", "EmailApproval"];
    const hasAtLeastOneDocument = requiredDocumentTypes.some(type => uploadStatuses[type]?.uploaded);
    
    if (!hasAtLeastOneDocument) {
      const msg = "Escalation: At least one document is required (LOI, WO, PO, or Email Approval)";
      setEscalationError(msg);
      setErrorModalMessage(msg);
      setShowErrorModal(true);
      console.log("Submission blocked:", msg);
      return;
    }

    // Check missing user info fields
    const missingUserFields = [];
    if (!selectedClient) missingUserFields.push("Client Name");
    if (!selectedBranches.length) missingUserFields.push("Client Branch(s)");
    if (!userRole) missingUserFields.push("User Role");

    // Show error messages for missing client name/site
    if (!selectedClient || !selectedBranches.length) {
      setUserInfoErrors(prev => ({
        ...prev,
        clientName: !selectedClient ? "Client name is required" : undefined,
        clientSite: !selectedBranches.length ? "At least one branch is required" : undefined,
      }));
    }

    const allMissing = [...missingUserFields];
    if (allMissing.length > 0) {
      const msg = `Escalation: Missing required fields: ${allMissing.join(", ")}`;
      setEscalationError(msg);
      setErrorModalMessage(msg);
      setShowErrorModal(true);
      console.log("Submission blocked:", msg);
      return;
    }

    setEscalationError(null);

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setErrorModalMessage("Please fix the highlighted errors in the form.");
      setShowErrorModal(true);
      console.log("Submission blocked: field errors", errs);
      return;
    }

    const agreementData = {
      form,
      clauses,
      underList,
      entityType,
      agreementDraftType,
      userRole,
      selectedClient,
      selectedBranches,
      uploadStatuses,
      startDate,
      endDate,
      isOpenAgreement // Add the new state to the data
    };

    // If in edit mode, preserve the original ID and add it to the data
    if (isEditMode && editingAgreement) {
      agreementData.id = editingAgreement.id;
      agreementData.submittedDate = editingAgreement.submittedDate; // Keep original submission date
      agreementData.submittedBy = editingAgreement.submittedBy; // Keep original submitter
    }

    console.log("Form data submitted:", agreementData);

    // Call the onSubmit prop to add to dashboard
    if (onSubmit) {
      onSubmit(agreementData);
    }

    setIsSubmitted(true);
    setShowSuccessModal(true);
    
    // Only reset form if not in edit mode, otherwise call onEditComplete
    if (isEditMode) {
      if (onEditComplete) onEditComplete();
    } else {
      setForm(initialFormData());
      setClauses(initialClauses());
      setUnderList(initialUnderList());
      setEntityType("single");
      setAgreementDraftType("client");
      setErrors({});
      setUploadedStatus({});
      setUserRole("checker");
      setSelectedClient("");
      setAvailableBranches([]);
      setSelectedBranches([]);
      setStartDate(new Date());
      setEndDate(new Date());
      setIsOpenAgreement(false); // Reset the new state
    }
    setTimeout(() => setIsSubmitted(false), 3000);
  };

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    console.log(`handleChange called - field: ${name}, value: ${value}, current userRole: ${userRole}`);
    
    // Special debugging for contact fields
    if (name.includes('Contact') || name.includes('Email') || name.includes('Name')) {
      console.log(`Contact field change - ${name}: "${value}" (length: ${value.length})`);
    }
    
    // Use direct form updates for contact fields to avoid debouncing issues with fake fillers
    if (name.includes('Contact') || name.includes('Email') || name.includes('Name')) {
      setForm(prev => ({ ...prev, [name]: value }));
    } else {
      // Use debounced form updates for better performance on other fields
      debouncedSetForm(prev => ({ ...prev, [name]: value }));
    }

    // Real-time validation for phone and email fields - made less strict for fake filler compatibility
    let errorMsg = undefined;
    
    // Only validate if the field has content (allow empty fields for fake filler)
    if (value && value.trim() !== '') {
      // Phone validation - allow any format for fake filler, but suggest proper format
      if (name === "iSmartContact" || name === "clientContact") {
        const cleanPhone = value.replace(/\D/g, ''); // Remove non-digits
        if (cleanPhone.length !== 10) {
          errorMsg = "Phone number should be 10 digits. Current: " + cleanPhone.length + " digits.";
        }
      }
      
      // Email validation - allow any format for fake filler, but suggest proper format
      if (name === "iSmartEmail" || name === "clientEmail") {
        const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
        if (!emailRegex.test(value.toLowerCase())) {
          errorMsg = "Email should be in lowercase format: example@domain.com";
        }
      }
    }
    
    setErrors(prev => ({ ...prev, [name]: errorMsg }));
  }, [debouncedSetForm, userRole]);

  const handleClientChange = useCallback((e) => {
    const selectedClientName = e.target.value;
    setSelectedClient(selectedClientName);
    setAvailableBranches(clientsData.find(c => c.name === selectedClientName)?.branches || []);
    setSelectedBranches([]);
  }, []);

  const closePopup = () => {
    setIsSubmitted(false);
  };

  const handleUploadChange = (type, file) => {
    // Allowed types and max size
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'image/jpeg',
      'image/png',
      'image/jpg',
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB
    let error = '';
    if (file) {
      if (!allowedTypes.includes(file.type)) {
        error = 'Invalid file type. Only PDF, DOCX, JPG, JPEG, PNG allowed.';
      } else if (file.size > maxSize) {
        error = 'File size exceeds 10MB.';
      }
    }
    if (error) {
      setUploadError(prev => ({ ...prev, [type]: error }));
      // Do not update uploadStatuses
      return;
    } else {
      setUploadError(prev => ({ ...prev, [type]: undefined }));
    }
    setUploadStatuses(prev => ({
      ...prev,
      [type]: { ...prev[type], uploaded: true, file }
    }));
  };

  const handleRemoveUpload = (type) => {
    setUploadStatuses(prev => ({
      ...prev,
      [type]: { ...prev[type], uploaded: false, file: undefined }
    }));
  };

  const handleStatusChange = (type, value) => {
    setUploadStatuses(prev => ({
      ...prev,
      [type]: { ...prev[type], status: value }
    }));
  };

  const handleRemarksChange = (type, value) => {
    setUploadStatuses(prev => ({
      ...prev,
      [type]: { ...prev[type], remarks: value }
    }));
  };

     const canUploadAgreement = () => {
     const initialUploads = ['LOI', 'WO', 'PO', 'EmailApproval'];
     return initialUploads.some(type => uploadStatuses[type].uploaded);
   };

  const handleDateChange1 = (date) => {
    setStartDate(date)
  }
  const handleDateChange2 = (date) => {
    setEndDate(date)
  }

  const validateUserInfo = () => {
    const newErrors = {};
    if (!userRole) newErrors.userRole = "User role is required";
    if (!selectedClient) newErrors.clientName = "Client name is required";
    if (!selectedBranches.length) newErrors.clientBranch = "At least one branch is required";
    setUserInfoErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUserInfoChange = (field, value) => {
    console.log(`handleUserInfoChange called - field: ${field}, value: ${value}, current userRole: ${userRole}`);
    if (field === "userRole") {
      console.log(`Role change detected - from ${userRole} to ${value}`);
      setUserRole(value);
    } else {
      switch (field) {
        case 'clientName':
          setSelectedClient(value);
          setForm(prev => ({ ...prev, clientName: value }));
          // Update available sites and reset selected sites
          const clientObj = clientsData.find(c => c.name === value);
          setAvailableBranches(clientObj ? clientObj.branches : []);
          setSelectedBranches([]);
          break;
        case 'clientBranch':
          setSelectedBranches(value); // value is array
          break;
        default:
          break;
      }
      if (userInfoErrors[field]) {
        setUserInfoErrors(prev => ({ ...prev, [field]: null }));
      }
    }
  };

     // Helper to check if all required uploads are done (for checker)
   const isCheckerUploadsComplete = () => {
     return ["LOI", "WO", "PO", "EmailApproval"].some(type => uploadStatuses[type].uploaded);
   };

  // Helper to check if all required user info fields are filled (for checker)
  const isCheckerUserInfoComplete = () => {
    return userRole && selectedClient && selectedBranches.length > 0;
  };

  // Handler for Continue (checkpoint, not stage change)
  const handleContinue = () => {
    // Prevent continue if client name or site is missing
    if (!selectedClient || !selectedBranches.length) {
      setUserInfoErrors(prev => ({
        ...prev,
        clientName: !selectedClient ? "Client name is required" : undefined,
        clientBranch: !selectedBranches.length ? "At least one branch is required" : undefined,
      }));
      return;
    }
    setIsContinueClicked(true);
    // Only switch role if explicitly requested, not automatically
    // setUserRole("Approver"); // Commented out to prevent automatic role switching
    setStage("approver");
  };

  return (
    <div className="relative max-w-6xl mx-auto p-0 bg-transparent mt-4 mb-8">
      {/* Edit Mode Indicator */}
      {isEditMode && editingAgreement && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✏️</span>
            <div>
              <h3 className="font-bold text-blue-800">Editing Agreement</h3>
              <p className="text-blue-600 text-sm">
                Agreement ID: {editingAgreement.id} • Client: {editingAgreement.selectedClient}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
          {isEditMode && (
            <div className="mt-2">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                Editing Agreement ID: {editingAgreement?.id}
              </span>
            </div>
          )}
        </div>
        <form className="px-4 py-8">
        {/* User Information */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b border-gray-200 pb-2">User Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User Role</label>
              <input className="w-full border rounded-md p-2.5 text-sm bg-gray-100 text-gray-700" value={userRole || 'checker'} disabled readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
              <select
                className="w-full border rounded-md p-2.5 text-sm bg-white text-gray-700"
                value={selectedClient}
                onChange={handleClientChange}
              >
                <option value="" disabled>Select Client</option>
                {clientsData.map(client => (
                  <option key={client.name} value={client.name}>{client.name}</option>
                ))}
              </select>
              {userInfoErrors.clientName && (
                <div className="text-red-600 text-xs mt-1">{userInfoErrors.clientName}</div>
              )}
            </div>
          </div>
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Branch(s) *</label>
            <div className="relative branch-dropdown">
              <button
                type="button"
                onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                className={`w-full border rounded-md p-2.5 text-sm text-left flex items-center justify-between ${
                  userInfoErrors.clientBranch ? 'border-red-500' : 'border-gray-300'
                } ${!selectedClient ? 'bg-gray-100 text-gray-500' : 'bg-white text-gray-700'}`}
                disabled={!selectedClient}
              >
                <span className={selectedBranches.length > 0 ? 'text-gray-700' : 'text-gray-500'}>
                  {selectedBranches.length > 0 
                    ? selectedBranches.length === availableBranches.length && availableBranches.length > 0
                      ? "🌏 Pan India (All Branches)"
                      : `${selectedBranches.length} branch${selectedBranches.length !== 1 ? 'es' : ''} selected`
                    : selectedClient ? "Select client branches..." : "Please select a client first"
                  }
                </span>
                <svg className={`w-4 h-4 transition-transform ${branchDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {branchDropdownOpen && selectedClient && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  <div className="p-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Select Branches</span>
                      <button
                        type="button"
                        onClick={() => setBranchDropdownOpen(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="space-y-1">
                      {/* Pan India Option */}
                      <label className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer border-b border-gray-200">
                        <input
                          type="checkbox"
                          checked={selectedBranches.length === availableBranches.length && availableBranches.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBranches([...availableBranches]);
                              if (userInfoErrors.clientBranch) {
                                setUserInfoErrors(prev => ({ ...prev, clientBranch: null }));
                              }
                            } else {
                              setSelectedBranches([]);
                            }
                          }}
                          className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-blue-700">🌏 Pan India</div>
                          <div className="text-xs text-gray-500">Apply to all branches nationwide</div>
                        </div>
                      </label>
                      
                      {/* Individual Branches */}
                      {availableBranches.map((branch) => {
                        const isSelected = selectedBranches.some(selected => selected.id === branch.id);
                        return (
                          <label key={branch.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  const newSelectedBranches = [...selectedBranches, branch];
                                  setSelectedBranches(newSelectedBranches);
                                  if (userInfoErrors.clientBranch) {
                                    setUserInfoErrors(prev => ({ ...prev, clientBranch: null }));
                                  }
                                } else {
                                  const newSelectedBranches = selectedBranches.filter(b => b.id !== branch.id);
                                  setSelectedBranches(newSelectedBranches);
                                }
                              }}
                              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-700">{branch.name}</div>
                              <div className="text-xs text-gray-500">{branch.code} • {branch.type}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          {selectedBranches.length} of {availableBranches.length} selected
                        </span>
                        <div className="space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedBranches.length === availableBranches.length) {
                                setSelectedBranches([]);
                              } else {
                                setSelectedBranches([...availableBranches]);
                              }
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            {selectedBranches.length === availableBranches.length ? 'Deselect All' : 'Select All'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setBranchDropdownOpen(false)}
                            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Selected Branches Display */}
            {selectedBranches.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedBranches.length === availableBranches.length && availableBranches.length > 0 ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    🌏 Pan India (All Branches)
                    <button
                      type="button"
                      onClick={() => setSelectedBranches([])}
                      className="ml-1 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                ) : (
                  selectedBranches.map((branch) => (
                    <span
                      key={branch.id}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {branch.name} ({branch.code})
                      <button
                        type="button"
                        onClick={() => {
                          const newSelectedBranches = selectedBranches.filter(b => b.id !== branch.id);
                          setSelectedBranches(newSelectedBranches);
                        }}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            )}
            
            {userInfoErrors.clientBranch && (
              <div className="text-red-600 text-xs mt-1">{userInfoErrors.clientBranch}</div>
            )}
          </div>
        </section>

        {/* Document Uploads */}
        {isExpiringSoon && (
          <div className="mb-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded">
            <strong>Alert:</strong> This agreement is expiring in {daysToExpiry} day{daysToExpiry !== 1 ? 's' : ''}. Please ensure at least one required document (LOI, WO, PO, or Email Approval) is uploaded for renewal/escalation.
            {!["WO", "LOI", "PO", "EmailApproval"].some(type => uploadStatuses[type]?.uploaded) && (
              <div className="mt-2 text-red-700">
                <strong>Escalation:</strong> At least one document is required (LOI, WO, PO, or Email Approval)
              </div>
            )}
          </div>
        )}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-1 text-gray-900">Document Uploads</h2>
                     <p className="text-gray-500 mb-6">Upload at least one of the following documents: LOI, WO, PO, or Email Approval</p>
          {/* Agreement Date Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Agreement Duration</label>
            <div className="flex items-center gap-4 mb-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isOpenAgreement}
                  onChange={e => setIsOpenAgreement(e.target.checked)}
                  className="mr-2"
                />
                Open Agreement (No End Date)
              </label>
              <span className="text-xs text-gray-500">
                {isOpenAgreement
                  ? "Only 'From Date' is required"
                  : "Both 'From Date' and 'To Date' are required"}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date *</label>
                <DatePicker
                  className="w-full border rounded-md p-2.5 text-sm"
                  selected={startDate}
                  onChange={date => setStartDate(date)}
                  dateFormat="dd-MM-yyyy"
                  placeholderText="dd-mm-yyyy"
                />
              </div>
              {!isOpenAgreement && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Date *</label>
                  <DatePicker
                    className="w-full border rounded-md p-2.5 text-sm"
                    selected={endDate}
                    onChange={date => setEndDate(date)}
                    dateFormat="dd-MM-yyyy"
                    placeholderText="dd-mm-yyyy"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                         {[
                           "LOI (Letter of Intent)", 
                           "WO (Work Order)", 
                           "PO (Purchase Order)",
                           "EmailApproval (Email Approval)"
                         ].map((label, idx) => {
              const type = label.split(" ")[0];
              const upload = uploadStatuses[type] || {};
              return (
                <div key={label} className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50">
                    <span className="text-4xl mb-2" role="img" aria-label="upload">⬆️</span>
                    <label className="bg-white border px-4 py-2 rounded mb-2 font-medium cursor-pointer">
                      Choose File
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.docx,.jpg,.jpeg,.png"
                        onChange={e => handleUploadChange(type, e.target.files[0])}
                      />
                    </label>
                    {upload.uploaded && upload.file && (
                      <div className="flex flex-col items-center gap-2 mt-2">
                        <span className="text-xs text-gray-700">{upload.file.name}</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="text-blue-600 underline text-xs"
                            onClick={() => {
                              const url = URL.createObjectURL(upload.file);
                              window.open(url, '_blank');
                            }}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="text-red-600 text-xs"
                            onClick={() => handleRemoveUpload(type)}
                            title="Remove uploaded file"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                    <span className="text-gray-400 text-sm mb-2">or drag and drop your file here</span>
                    <span className="text-xs text-gray-400">Max size: 10MB • Allowed: .pdf, .docx, .jpg, .jpeg, .png</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Remarks */}
        <section className="mb-10">
          <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
          <textarea className="w-full border rounded-md p-2.5 text-sm min-h-[80px]" placeholder="Add any additional remarks..." />
        </section>

        {/* Entity Type */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-1 text-gray-900">Entity Type</h2>
          <p className="text-gray-500 mb-6">Specify if this is a single entity or group agreement</p>
          <div className="flex gap-8 mb-4 items-start">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={entityType === "single"}
                onChange={() => setEntityType("single")}
              />
              Single Entity
            </label>
            <div className="flex flex-col">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={entityType === "group"}
                  onChange={() => setEntityType("group")}
                />
                Single Entity with Group Companies
              </label>
              {entityType === "group" && (
                <div className="flex flex-col gap-2 max-w-md mt-2 ml-6">
                  {underList.map((input, key) => (
                    <div key={key} className="flex items-center gap-2">
                      <input
                        type={input.type}
                        placeholder={input.placeholder}
                        className={input.className}
                        value={input.value || ""}
                        onChange={e => {
                          const updated = [...underList];
                          updated[key].value = e.target.value;
                          setUnderList(updated);
                        }}
                      />
                      {underList.length > 1 && (
                        <button
                          type="button"
                          className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100"
                          title="Remove"
                          onClick={() => handleRemoveUnderList(key)}
                        >
                          <span className="text-lg font-bold">&#10060;</span>
                        </button>
                      )}
                    </div>
                  ))}
                  <div className="">
                    <button
                      type="button"
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 mt-2"
                      onClick={duplicateElement}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Agreement Type Selection */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-1 text-gray-900">Agreement Type Selection</h2>
          <p className="text-gray-500 mb-6">Identify the origin of the agreement draft</p>
          <div className="flex gap-8 mb-4 items-start">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={agreementDraftType === "client"}
                onChange={() => setAgreementDraftType("client")}
              />
              Client Draft
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={agreementDraftType === "ismart"}
                onChange={() => setAgreementDraftType("ismart")}
              />
              iSmart Draft
            </label>
          </div>
        </section>

        {/* Important Clauses */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-1 text-gray-900">Important Clauses</h2>
          <p className="text-gray-500 mb-4 text-sm">Add important clauses and supporting documents</p>
          <div className="space-y-3">
            {clauses.map((clause, idx) => (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50" key={idx}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Clause {idx + 1}</span>
                  <button
                    type="button"
                    className="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
                    onClick={() => handleRemoveClause(idx)}
                  >
                    ✕
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  {/* Title Input */}
                  <div className="lg:col-span-2">
                    <input
                      className="w-full border rounded-md p-2 text-sm bg-white"
                      placeholder="Enter clause title"
                      value={clause.title}
                      onChange={e => {
                        const newClauses = [...clauses];
                        newClauses[idx].title = e.target.value;
                        setClauses(newClauses);
                      }}
                    />
                  </div>
                  
                  {/* File Upload */}
                  <div className="flex flex-col">
                    <label className="bg-white border border-gray-300 px-3 py-2 rounded text-sm cursor-pointer hover:bg-gray-50 text-center">
                      📎 {uploadStatuses[`clause-${idx}`]?.uploaded ? 'Change File' : 'Upload File'}
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.docx,.jpg,.jpeg,.png"
                        onChange={e => handleUploadChange(`clause-${idx}`, e.target.files[0])}
                      />
                    </label>
                    {uploadStatuses[`clause-${idx}`]?.uploaded && uploadStatuses[`clause-${idx}`].file && (
                      <div className="mt-1 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <span className="truncate">{uploadStatuses[`clause-${idx}`].file.name}</span>
                        </div>
                        <div className="flex gap-2 mt-1">
                          <button
                            type="button"
                            className="text-blue-600 hover:underline"
                            onClick={() => {
                              const url = URL.createObjectURL(uploadStatuses[`clause-${idx}`].file);
                              window.open(url, '_blank');
                            }}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="text-red-600 hover:underline"
                            onClick={() => handleRemoveUpload(`clause-${idx}`)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Clause Details */}
                <div className="mt-3">
                  <textarea
                    className="w-full border rounded-md p-2 text-sm resize-none"
                    rows="2"
                    placeholder="Enter clause details..."
                    value={clause.details || ''}
                    onChange={e => {
                      const newClauses = [...clauses];
                      newClauses[idx].details = e.target.value;
                      setClauses(newClauses);
                    }}
                  />
                </div>
              </div>
            ))}
            
            <button
              type="button"
              className="w-full border-2 border-dashed border-gray-300 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 hover:border-gray-400 hover:bg-gray-50 text-gray-600"
              onClick={handleAddClause}
            >
              <span className="text-lg">＋</span> Add Clause
            </button>
          </div>
        </section>

        {/* Contact Information */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-1 text-gray-900">Contact Information</h2>
          <p className="text-gray-500 mb-6">Contact details for I Smart and Client</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <button className="border px-4 py-1 rounded-full font-medium mb-2">I Smart</button>
              <input
                className="w-full border rounded-md p-2.5 text-sm mb-2"
                placeholder="Enter name"
                name="iSmartName"
                value={form.iSmartName}
                onChange={handleChange}
                onFocus={() => console.log('iSmartName field focused')}
                onBlur={() => console.log('iSmartName field blurred')}
              />
                             <input
                type="text"
                className="w-full border rounded-md p-2.5 text-sm mb-2"
                placeholder="Enter phone number"
                name="iSmartContact"
                value={form.iSmartContact}
                onChange={handleChange}
                onFocus={() => console.log('iSmartContact field focused')}
                onBlur={() => console.log('iSmartContact field blurred')}
              />
              {errors.iSmartContact && (
                <div className="text-red-600 text-xs mb-2">{errors.iSmartContact}</div>
              )}
              <input
                className="w-full border rounded-md p-2.5 text-sm mb-2"
                placeholder="Enter email"
                name="iSmartEmail"
                value={form.iSmartEmail}
                onChange={handleChange}
                onFocus={() => console.log('iSmartEmail field focused')}
                onBlur={() => console.log('iSmartEmail field blurred')}
              />
              {errors.iSmartEmail && (
                <div className="text-red-600 text-xs mb-2">{errors.iSmartEmail}</div>
              )}
            </div>
            <div>
              <button className="border px-4 py-1 rounded-full font-medium mb-2">Client</button>
              <input
                className="w-full border rounded-md p-2.5 text-sm mb-2"
                placeholder="Enter name"
                name="clientName"
                value={form.clientName}
                onChange={handleChange}
                onFocus={() => console.log('clientName field focused')}
                onBlur={() => console.log('clientName field blurred')}
              />
                             <input
                type="text"
                className="w-full border rounded-md p-2.5 text-sm mb-2"
                placeholder="Enter phone number"
                name="clientContact"
                value={form.clientContact}
                onChange={handleChange}
                onFocus={() => console.log('clientContact field focused')}
                onBlur={() => console.log('clientContact field blurred')}
              />
              {errors.clientContact && (
                <div className="text-red-600 text-xs mb-2">{errors.clientContact}</div>
              )}
              <input
                className="w-full border rounded-md p-2.5 text-sm mb-2"
                placeholder="Enter email"
                name="clientEmail"
                value={form.clientEmail}
                onChange={handleChange}
                onFocus={() => console.log('clientEmail field focused')}
                onBlur={() => console.log('clientEmail field blurred')}
              />
              {errors.clientEmail && (
                <div className="text-red-600 text-xs mb-2">{errors.clientEmail}</div>
              )}
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-8 items-start">
          {/* Draft chip to the left */}
          {draft && (
            <div className="flex items-center mr-4">
              <button
                type="button"
                className="flex items-center bg-gray-100 border border-gray-300 rounded-full px-4 py-1 text-sm font-medium text-gray-800 hover:bg-gray-200 transition mr-2 shadow"
                onClick={() => {
                  // Load draft into form
                  setForm(draft.form);
                  setClauses(draft.clauses);
                  setUnderList(draft.underList);
                  setEntityType(draft.entityType);
                  setAgreementDraftType(draft.agreementDraftType || "client");
                  // Don't automatically change user role from draft to prevent fake filler issues
                  // setUserRole(draft.userRole);
                  setSelectedClient(draft.selectedClient);
                  // Update availableSites based on selectedClient
                  const clientObj = clientsData.find(c => c.name === draft.selectedClient);
                  setAvailableBranches(clientObj ? clientObj.branches : []);
                  setSelectedBranches(draft.selectedBranches);
                  setUploadStatuses(draft.uploadStatuses);
                  setStartDate(new Date(draft.startDate));
                  setEndDate(new Date(draft.endDate));
                  setIsOpenAgreement(draft.isOpenAgreement || false); // Set the new state from draft
                }}
                title="Open draft for editing"
              >
                <span className="truncate max-w-[120px]">Draft</span>
              </button>
              <button
                type="button"
                className="ml-1 text-gray-400 hover:text-red-500 focus:outline-none"
                onClick={() => setDraft(null)}
                title="Remove draft"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="border px-6 py-2 rounded font-medium bg-white hover:bg-gray-100"
              onClick={() => {
                // Save draft to state
                const draftData = {
                  form,
                  clauses,
                  underList,
                  entityType,
                  agreementDraftType,
                  userRole,
                  selectedClient,
                  selectedBranches,
                  uploadStatuses,
                  startDate,
                  endDate,
                  isOpenAgreement // Add the new state to the draft
                };
                setDraft(draftData);
                setDraftSaved(true);
                setTimeout(() => setDraftSaved(false), 2000);
              }}
            >
              Save Draft
            </button>
            {draftSaved && (
              <div className="text-green-700 bg-green-100 border-l-4 border-green-500 p-2 rounded text-xs">Draft saved successfully!</div>
            )}
          </div>
          <button
            type="button"
            className="bg-black text-white px-6 py-2 rounded font-medium hover:bg-gray-900"
            onClick={handleSubmit}
          >
            {isEditMode ? 'Update Agreement' : 'Submit for Review'}
          </button>
          {isEditMode && (
            <button
              type="button"
              className="bg-gray-500 text-white px-6 py-2 rounded font-medium hover:bg-gray-600 ml-2"
              onClick={() => {
                if (onEditComplete) onEditComplete();
              }}
            >
              Cancel Edit
            </button>
          )}
        </div>
        {/* Submission Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
            <div className="bg-white p-8 rounded shadow-xl flex flex-col items-center">
              <div className="text-2xl font-bold mb-2 text-green-700">Submission Successful!</div>
              <div className="mb-4 text-gray-700">Your agreement has been submitted for review.</div>
              <button
                className="mt-2 px-6 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700"
                onClick={() => setShowSuccessModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
        {/* Submission Error Modal */}
        {showErrorModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
            <div className="bg-white p-8 rounded shadow-xl flex flex-col items-center">
              <div className="text-2xl font-bold mb-2 text-red-700">Submission Blocked</div>
              <div className="mb-4 text-gray-700">{errorModalMessage}</div>
              <button
                className="mt-2 px-6 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700"
                onClick={() => setShowErrorModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  </div>
  );
};

export default AgreementForm; 