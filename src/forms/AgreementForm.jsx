import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Hardcoded clients and their sites
const clientsData = [
  {
    name: "ABC Corp",
    sites: ["Mumbai Office", "Pune Office", "Delhi Branch"]
  },
  {
    name: "XYZ Ltd",
    sites: ["Chennai Branch", "Hyderabad Site"]
  },
  {
    name: "Tech Solutions",
    sites: ["Bangalore HQ", "Kolkata Center"]
  },
  {
    name: "CC Ltd",
    sites: ["Lucknow", "Kanpur"]
  },
  {
    name: "Delta Inc",
    sites: ["Ahmedabad", "Surat", "Vadodara"]
  }
];

const AgreementForm = (props) => {
  const [entityType, setEntityType] = useState("single");
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
  const [availableSites, setAvailableSites] = useState([]);
  const [selectedSites, setSelectedSites] = useState([]);
  const [userInfoErrors, setUserInfoErrors] = useState({});
  const [uploadStatuses, setUploadStatuses] = useState({
    LOI: { uploaded: false, status: "", remarks: "" },
    WO: { uploaded: false, status: "", remarks: "" },
    PO: { uploaded: false, status: "", remarks: "" },
    Email: { uploaded: false, status: "", remarks: "" },
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

  // Check if agreement is expiring within 30 days
  const today = new Date();
  const timeDiff = endDate.getTime() - today.getTime();
  const daysToExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));
  const isExpiringSoon = daysToExpiry > 0 && daysToExpiry <= 30;

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
      const newClauses = [...prevClauses, { title: "Enter clause", placeholder: "Enter clause details", isInitial: false }];
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
    // Only require LOI, WO, PO, Email uploads (not Agreement)
    const requiredSections = ["WO", "PO", "LOI", "Email"];
    const missingUploads = requiredSections
      .map(type => {
        return !uploadStatuses[type]?.uploaded ? type : null;
      })
      .filter(Boolean);

    // Check missing user info fields
    const missingUserFields = [];
    if (!selectedClient) missingUserFields.push("Client Name");
    if (!selectedSites.length) missingUserFields.push("Client Site(s)");
    if (!userRole) missingUserFields.push("User Role");

    // Show error messages for missing client name/site
    if (!selectedClient || !selectedSites.length) {
      setUserInfoErrors(prev => ({
        ...prev,
        clientName: !selectedClient ? "Client name is required" : undefined,
        clientSite: !selectedSites.length ? "At least one site is required" : undefined,
      }));
    }

    const allMissing = [...missingUploads, ...missingUserFields];
    if (allMissing.length > 0) {
      const msg = `Escalation: Missing uploads for section(s): ${allMissing.join(", ")}`;
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

    console.log("Form data submitted:", {
      form,
      clauses,
      underList,
      entityType,
      userRole,
      selectedClient,
      selectedSites,
    });

    setIsSubmitted(true);
    setShowSuccessModal(true);
    setForm(initialFormData());
    setClauses(initialClauses());
    setUnderList(initialUnderList());
    setEntityType("single");
    setErrors({});
    setUploadedStatus({});
    setUserRole("");
    setSelectedClient("");
    setAvailableSites([]);
    setSelectedSites([]);
    setTimeout(() => setIsSubmitted(false), 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // Real-time validation for phone and email fields
    let errorMsg = undefined;
    // Email: lowercase, numbers, . _ % + - before @, . - in domain, no uppercase, no special chars at start/end
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    // Phone: exactly 10 digits, no spaces or special chars
    const phoneRegex = /^\d{10}$/;

    if (name === "iSmartContact" || name === "clientContact") {
      if (!phoneRegex.test(value)) {
        errorMsg = "Phone number must be exactly 10 digits, no spaces or special characters.";
      }
    }
    if (name === "iSmartEmail" || name === "clientEmail") {
      if (!emailRegex.test(value)) {
        errorMsg = "Invalid email address. Only lowercase letters, numbers, and . _ % + - allowed before @. No uppercase or other special characters.";
      }
    }
    setErrors(prev => ({ ...prev, [name]: errorMsg }));
  };

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
    const initialUploads = ['LOI', 'WO', 'PO', 'Email'];
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
    if (!selectedSites.length) newErrors.clientSite = "At least one site is required";
    setUserInfoErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUserInfoChange = (field, value) => {
    switch (field) {
      case 'userRole':
        setUserRole(value);
        break;
      case 'clientName':
        setSelectedClient(value);
        setForm(prev => ({ ...prev, clientName: value }));
        // Update available sites and reset selected sites
        const clientObj = clientsData.find(c => c.name === value);
        setAvailableSites(clientObj ? clientObj.sites : []);
        setSelectedSites([]);
        break;
      case 'clientSite':
        setSelectedSites(value); // value is array
        break;
      default:
        break;
    }
    if (userInfoErrors[field]) {
      setUserInfoErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Helper to check if all required uploads are done (for checker)
  const isCheckerUploadsComplete = () => {
    return ["LOI", "WO", "PO", "Email"].every(type => uploadStatuses[type].uploaded);
  };

  // Helper to check if all required user info fields are filled (for checker)
  const isCheckerUserInfoComplete = () => {
    return userRole && selectedClient && selectedSites.length > 0;
  };

  // Handler for Continue (checkpoint, not stage change)
  const handleContinue = () => {
    // Prevent continue if client name or site is missing
    if (!selectedClient || !selectedSites.length) {
      setUserInfoErrors(prev => ({
        ...prev,
        clientName: !selectedClient ? "Client name is required" : undefined,
        clientSite: !selectedSites.length ? "At least one site is required" : undefined,
      }));
      return;
    }
    setIsContinueClicked(true);
    setUserRole("Approver");
    setStage("approver");
  };

  return (
    <div className="relative max-w-5xl mx-auto p-0 bg-transparent mt-8 mb-12">
      <div className="bg-white border-b px-8 pt-8 pb-4 rounded-t-2xl">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-1">
          <span role="img" aria-label="doc">📄</span> Legal Agreement ERP
        </h1>
        <div className="flex gap-3 mt-2">
          <span className="font-semibold text-blue-600">Dashboard</span>
          <span className="text-gray-400">|</span>
          <span className="font-semibold text-green-600">New Agreement</span>
        </div>
      </div>
      <form className="bg-white px-8 py-10 rounded-b-2xl shadow-xl border-t-0">
        {/* User Information */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-1 text-gray-900">User Information</h2>
          <p className="text-gray-500 mb-6">Basic information about the agreement</p>
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
                onChange={e => {
                  setSelectedClient(e.target.value);
                  setAvailableSites(clientsData.find(c => c.name === e.target.value)?.sites || []);
                  setSelectedSites([]);
                }}
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
          <div className="flex gap-8 mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Site(s) *</label>
            <div className="flex flex-wrap gap-6">
              {(availableSites || []).map(site => (
                <label key={site} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value={site}
                    checked={selectedSites.includes(site)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedSites([...selectedSites, site]);
                      } else {
                        setSelectedSites(selectedSites.filter(s => s !== site));
                      }
                    }}
                    disabled={!selectedClient}
                  />
                  {site}
                </label>
              ))}
            </div>
            {userInfoErrors.clientSite && (
              <div className="text-red-600 text-xs mt-1">{userInfoErrors.clientSite}</div>
            )}
          </div>
        </section>

        {/* Document Uploads */}
        {isExpiringSoon && (
          <div className="mb-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded">
            <strong>Alert:</strong> This agreement is expiring in {daysToExpiry} day{daysToExpiry !== 1 ? 's' : ''}. Please ensure all required documents (WO, LOI, Email, PO) are uploaded for renewal/escalation.
            {(["WO", "LOI", "Email", "PO"].some(type => !uploadStatuses[type]?.uploaded)) && (
              <div className="mt-2 text-red-700">
                <strong>Escalation:</strong> Missing uploads for: {
                  ["WO", "LOI", "Email", "PO"].filter(type => !uploadStatuses[type]?.uploaded).join(", ")
                }
              </div>
            )}
          </div>
        )}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-1 text-gray-900">Document Uploads</h2>
          <p className="text-gray-500 mb-6">Upload required documents (LOI, WO, PO, Email)</p>
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
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            {["LOI (Letter of Intent)", "WO (Work Order)", "PO (Purchase Order)", "Email"].map((label, idx) => {
              const type = label.split(" ")[0];
              const upload = uploadStatuses[type] || {};
              return (
                <div key={label} className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{label} *</label>
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

        {/* Important Clauses */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-1 text-gray-900">Important Clauses</h2>
          <p className="text-gray-500 mb-6">Add important clauses and supporting documents</p>
          <div className="mb-6">
            {clauses.map((clause, idx) => (
              <div className="mb-4" key={idx}>
                <label className="block text-sm font-medium text-gray-700 mb-2">Clause {idx + 1}</label>
                <input
                  className="w-full border rounded-md p-2.5 text-sm mb-2"
                  placeholder="Enter clause title"
                  value={clause.title}
                  onChange={e => {
                    const newClauses = [...clauses];
                    newClauses[idx].title = e.target.value;
                    setClauses(newClauses);
                  }}
                />
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50">
                  <span className="text-4xl mb-2" role="img" aria-label="upload">⬆️</span>
                  <label className="bg-white border px-4 py-2 rounded mb-2 font-medium cursor-pointer">
                    Choose File
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.docx,.jpg,.jpeg,.png"
                      onChange={e => handleUploadChange(`clause-${idx}`, e.target.files[0])}
                    />
                  </label>
                  {uploadStatuses[`clause-${idx}`] && uploadStatuses[`clause-${idx}`].uploaded && uploadStatuses[`clause-${idx}`].file && (
                    <div className="flex flex-col items-center gap-2 mt-2">
                      <span className="text-xs text-gray-700">{uploadStatuses[`clause-${idx}`].file.name}</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="text-blue-600 underline text-xs"
                          onClick={() => {
                            const url = URL.createObjectURL(uploadStatuses[`clause-${idx}`].file);
                            window.open(url, '_blank');
                          }}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="text-red-600 text-xs"
                          onClick={() => handleRemoveUpload(`clause-${idx}`)}
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
                <textarea
                  className="w-full border rounded-md p-2.5 text-sm min-h-[60px] mt-2"
                  placeholder="Enter clause details..."
                  value={clause.details || ''}
                  onChange={e => {
                    const newClauses = [...clauses];
                    newClauses[idx].details = e.target.value;
                    setClauses(newClauses);
                  }}
                />
                {!clause.isInitial && (
                  <button
                    type="button"
                    className="text-red-600 text-xs mt-1"
                    onClick={() => handleRemoveClause(idx)}
                  >
                    Remove Clause
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="border px-4 py-2 rounded font-medium flex items-center gap-2"
              onClick={handleAddClause}
            >
              <span className="text-xl">＋</span> Add Clause
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
              />
              <input
                className="w-full border rounded-md p-2.5 text-sm mb-2"
                placeholder="Enter phone number"
                name="iSmartContact"
                value={form.iSmartContact}
                onChange={handleChange}
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
              />
              <input
                className="w-full border rounded-md p-2.5 text-sm mb-2"
                placeholder="Enter phone number"
                name="clientContact"
                value={form.clientContact}
                onChange={handleChange}
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
                  setUserRole(draft.userRole);
                  setSelectedClient(draft.selectedClient);
                  // Update availableSites based on selectedClient
                  const clientObj = clientsData.find(c => c.name === draft.selectedClient);
                  setAvailableSites(clientObj ? clientObj.sites : []);
                  setSelectedSites(draft.selectedSites);
                  setUploadStatuses(draft.uploadStatuses);
                  setStartDate(new Date(draft.startDate));
                  setEndDate(new Date(draft.endDate));
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
                  userRole,
                  selectedClient,
                  selectedSites,
                  uploadStatuses,
                  startDate,
                  endDate
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
            Submit for Review
          </button>
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
  );
};

export default AgreementForm;
