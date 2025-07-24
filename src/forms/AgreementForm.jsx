import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Hardcoded clients and their sites
const clientsData = [
  {
    name: "Client A",
    sites: ["Site A1", "Site A2", "Site A3"]
  },
  {
    name: "Client B",
    sites: ["Site B1", "Site B2"]
  },
  {
    name: "Client C",
    sites: ["Site C1", "Site C2", "Site C3", "Site C4"]
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
  const [userRole, setUserRole] = useState("");
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
    const emailRegex = /^[a-z][a-z0-9._%+-]*@[a-z0-9.-]+\.[a-z]{2,}$/;

    if (!form.iSmartContact.match(/^\d{10}$/)) {
      errs.iSmartContact = "Invalid contact number";
    }

    if (!form.clientContact.match(/^\d{10}$/)) {
      errs.clientContact = "Invalid contact number";
    }

    if (!emailRegex.test(form.iSmartEmail)) {
      errs.iSmartEmail = "Invalid email address";
    }

    if (!emailRegex.test(form.clientEmail)) {
      errs.clientEmail = "Invalid email address";
    }

    return errs;
  };

  const handleSubmit = () => {
    const errs = validateForm();
    const requiredSections = [ "WO", "PO", "LOI","Email","Agreement"];
    const missingUploads = requiredSections
      .map((type, index) => {
        const key = `agreement-${index}`;
        return !uploadedStatus[key] ? type : null;
      })
      .filter(Boolean); // Remove nulls

      // Check missing user info fields
  const missingUserFields = [];
  if (!userRole) missingUserFields.push("User Role");
  if (!selectedClient) missingUserFields.push("Client Name");
  if (!selectedSites.length) missingUserFields.push("Client Site(s)");

  const allMissing = [...missingUploads, ...missingUserFields]; 
  if (allMissing.length > 0) {
    setEscalationError(
      `Escalation: Missing uploads for section(s): ${allMissing.join(", ")}`
    );
    return;
  }

  setEscalationError(null);

  if (Object.keys(errs).length > 0) {
    setErrors(errs);
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
    setForm({ ...form, [e.target.name]: e.target.value });
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
    setIsContinueClicked(true);
    setUserRole("Approver");
    setStage("approver");
  };

  return (
    <div className="relative max-w-7xl mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Agreement Form</h1>
      <div className="space-y-4">

        {/* User information */}
        <div className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-bold mb-4 text-gray-800">User Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block font-medium text-gray-700">User Role</label>
              <select
                className={`w-full border rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  userInfoErrors.userRole ? 'border-red-500' : 'border-gray-300'
                }`}
                value={userRole}
                onChange={(e) => {
                  if (stage === "approver") return; // prevent changing role in approver stage
                  handleUserInfoChange('userRole', e.target.value);
                  if (typeof props.setUserRole === "function") {
                    props.setUserRole(e.target.value);
                  }
                }}
                disabled={stage === "approver"}
              >
                <option value="" disabled>Select Role</option>
                <option value="Checker">Checker</option>
                <option value="Approver">Approver</option>
              </select>
              {userInfoErrors.userRole && (
                <p className="text-red-500 text-xs mt-1">{userInfoErrors.userRole}</p>
              )}
            </div>

            {/* Client Name Dropdown */}
            <div className="space-y-2">
              <label className="block font-medium text-gray-700">Client Name</label>
              <select
                className={`w-full border rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  userInfoErrors.clientName ? 'border-red-500' : 'border-gray-300'
                }`}
                value={selectedClient}
                onChange={e => handleUserInfoChange('clientName', e.target.value)}
              >
                <option value="" disabled>Select Client</option>
                {clientsData.map(client => (
                  <option key={client.name} value={client.name}>{client.name}</option>
                ))}
              </select>
              {userInfoErrors.clientName && (
                <p className="text-red-500 text-xs mt-1">{userInfoErrors.clientName}</p>
              )}
            </div>

            {/* Multi-select Site Dropdown */}
            <div className="space-y-2">
              <label className="block font-medium text-gray-700">Client Site(s)</label>
              <div className={`w-full border rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${userInfoErrors.clientSite ? 'border-red-500' : 'border-gray-300'}`}>
                <select
                  multiple
                  value={selectedSites}
                  onChange={e => {
                    const options = Array.from(e.target.selectedOptions, option => option.value);
                    handleUserInfoChange('clientSite', options);
                  }}
                  className="w-full h-24 bg-transparent outline-none"
                  disabled={!selectedClient}
                >
                  {availableSites.map(site => (
                    <option key={site} value={site}>{site}</option>
                  ))}
                </select>
              </div>
              {userInfoErrors.clientSite && (
                <p className="text-red-500 text-xs mt-1">{userInfoErrors.clientSite}</p>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Upload Section */}
      {userRole && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            {userRole === "Checker" ? "Initial Approvals" : "Execution Stage"}
          </h2>
          
          {/* Expiry alert for agreement */}
          {isExpiringSoon && (
            <div className="mb-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded text-sm font-semibold">
              Escalation: This agreement will expire in {daysToExpiry} day{daysToExpiry !== 1 ? 's' : ''}!
            </div>
          )}

          {/* Initial Uploads (Checker) */}
          {userRole === "Checker" && stage === "checker" && (
            <div className="space-y-4">
              {["LOI", "WO", "PO", "Email"].map((type) => (
                <div key={type} className="grid grid-cols-8 gap-4 items-center p-4 border border-gray-300 rounded-lg bg-gray-50">
                  <div className="col-span-1 font-semibold text-gray-700">{type}</div>
                  <div className="col-span-2">
                    <DatePicker
                      className="w-full border border-gray-300 p-2 rounded text-sm"
                      selected={startDate}
                      onChange={handleDateChange1}
                      placeholderText="From Date"
                    />
                  </div>
                  <div className="col-span-2">
                    <DatePicker
                      className="w-full border border-gray-300 p-2 rounded text-sm"
                      selected={endDate}
                      onChange={handleDateChange2}
                      placeholderText="To Date"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className={`inline-block ${
                      uploadStatuses[type].uploaded ? "bg-green-600" : "bg-blue-600"
                    } text-white px-4 py-2 rounded cursor-pointer hover:opacity-90`}>
                      {uploadStatuses[type].uploaded ? "Uploaded" : "Upload"}
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => handleUploadChange(type, e.target.files[0])}
                      />
                    </label>
                    {uploadError[type] && <p className="text-red-500 text-xs mt-1">{uploadError[type]}</p>}
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Enter remarks"
                      value={uploadStatuses[type].remarks}
                      onChange={(e) => handleRemarksChange(type, e.target.value)}
                      className="w-full border border-gray-300 p-2 rounded text-sm"
                    />
                  </div>
                </div>
              ))}
              {/* Continue button below uploads, left-aligned */}
              <div className="flex justify-end mt-4">
                <button
                  onClick={handleContinue}
                  className={`px-6 py-2 rounded text-white text-sm font-semibold focus:outline-none transition-colors duration-200 ${
                    isContinueClicked
                      ? 'bg-green-600 cursor-not-allowed'
                      : (isCheckerUploadsComplete() && isCheckerUserInfoComplete())
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-blue-300 cursor-not-allowed'
                  }`}
                  disabled={isContinueClicked || !(isCheckerUploadsComplete() && isCheckerUserInfoComplete())}
                >
                  {isContinueClicked ? 'Continue ✓' : 'Continue'}
                </button>
              </div>
            </div>
          )}

          {/* Agreement Upload (Approver) */}
          {userRole === "Approver" && (
            <div className={`space-y-4`}>
              <div className="grid grid-cols-8 gap-4 items-center p-4 border border-gray-300 rounded-lg bg-gray-50">
                <div className="col-span-1 font-semibold text-gray-700">Agreement</div>
                <div className="col-span-2">
                  <DatePicker
                    className="w-full border border-gray-300 p-2 rounded text-sm"
                    selected={startDate}
                    onChange={handleDateChange1}
                    placeholderText="From Date"
                  />
                </div>
                <div className="col-span-2">
                  <DatePicker
                    className="w-full border border-gray-300 p-2 rounded text-sm"
                    selected={endDate}
                    onChange={handleDateChange2}
                    placeholderText="To Date"
                  />
                </div>
                <div className="col-span-1">
                  <label className={`inline-block ${
                    uploadStatuses.Agreement.uploaded ? "bg-green-600" : "bg-blue-600"
                  } text-white px-4 py-2 rounded cursor-pointer hover:opacity-90`}>
                    {uploadStatuses.Agreement.uploaded ? "Uploaded" : "Upload"}
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => handleUploadChange('Agreement', e.target.files[0])}
                    />
                  </label>
                  {uploadError.Agreement && <p className="text-red-500 text-xs mt-1">{uploadError.Agreement}</p>}
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    placeholder="Enter remarks"
                    value={uploadStatuses.Agreement.remarks}
                    onChange={(e) => handleRemarksChange('Agreement', e.target.value)}
                    className="w-full border border-gray-300 p-2 rounded text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Entity Type Section */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Entity Type</h2>
        <div className="flex gap-6 flex-wrap">
          {["single", "group"].map((type) => (
            <div key={type} className="flex flex-col">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="entityType"
                  value={type}
                  className="accent-blue-600"
                  checked={entityType === type}
                  onChange={(e) => setEntityType(e.target.value)}
                />
                {type === "single"
                  ? "Single Entity"
                  : "Single Entity with Group Companies"}
              </label>

              {/* Show underList inputs below group radio */}
              {type === "group" && entityType === "group" && (
                <div className="mt-3 flex flex-col gap-2 max-w-md">
                  {underList.map((input, key) => (
                    <div key={key} className="flex items-center gap-2">
                      <input
                        type={input.type}
                        placeholder={input.placeholder}
                        className={input.className}
                      />
                      {underList.length > 1 && (
                        <button
                          type="button"
                          className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100"
                          title="Remove"
                          onClick={() => handleRemoveUnderList(key)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 6a1 1 0 011-1h6a1 1 0 011 1v8a1 1 0 01-1 1H7a1 1 0 01-1-1V6zm2 2a1 1 0 012 0v4a1 1 0 11-2 0V8z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  <div className="">
                    <button
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                      onClick={duplicateElement}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Important Clauses Section */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Important Clauses</h2>
        {clauses.map((clause, index) => (
          <div key={index} className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                value={clause.title}
                onChange={(e) => {
                  const updated = [...clauses];
                  updated[index].title = e.target.value;
                  setClauses(updated);
                }}
                className="border border-gray-300 p-2 rounded text-sm w-full"
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder={clause.placeholder}
                className="border border-gray-300 p-2 rounded text-sm w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              {(clause.title === "Term and termination (Duration)" || 
                clause.title === "Payment Terms" || 
                clause.title === "Penalty" || 
                clause.title === "Minimum Wages" || 
                clause.title === "Costing - Salary Breakup" || 
                clause.title === "SLA" || 
                clause.title === "Indemnity" || 
                clause.title === "Insurance" || 
                clause.title === "Enter clause") && (
                <>
                  <label
                    className={`inline-block ${
                      uploadStatuses[`clause-${index}`]?.uploaded ? "bg-green-600" : "bg-blue-600"
                    } text-white px-4 py-2 rounded cursor-pointer hover:opacity-90`}
                  >
                    {uploadStatuses[`clause-${index}`]?.uploaded ? "Uploaded" : "Upload"}
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => handleUploadChange(`clause-${index}`, e.target.files[0])}
                    />
                  </label>
                  {uploadError[`clause-${index}`] && <p className="text-red-500 text-xs mt-1">{uploadError[`clause-${index}`]}</p>}
                  {uploadStatuses[`clause-${index}`]?.uploaded && (
                    <>
                      <button
                        type="button"
                        className="text-blue-600 underline text-xs ml-2"
                        onClick={() => {
                          const file = uploadStatuses[`clause-${index}`]?.file;
                          if (file) {
                            const url = URL.createObjectURL(file);
                            window.open(url, '_blank');
                          }
                        }}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="text-red-600 text-xs ml-2"
                        onClick={() => handleRemoveUpload(`clause-${index}`)}
                        title="Remove uploaded file"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </>
              )}
              {!clause.isInitial && (
                <button
                  onClick={() => handleRemoveClause(index)}
                  className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100"
                  title="Remove clause"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
        <div className="flex gap-4 items-center">
          <button 
            onClick={handleAddClause} 
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Clause
          </button>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Contact Information</h2>
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Person from I Smart</h3>
            <input name="iSmartName" value={form.iSmartName} onChange={handleChange} placeholder="Name" className="w-full border p-2 rounded text-sm mb-2" />
            <input name="iSmartContact" value={form.iSmartContact} onChange={handleChange} placeholder="Contact No" className="w-full border p-2 rounded text-sm mb-1" />
            {errors.iSmartContact && <p className="text-red-600 text-xs mb-1">{errors.iSmartContact}</p>}
            <input name="iSmartEmail" value={form.iSmartEmail} onChange={handleChange} placeholder="Email" className="w-full border p-2 rounded text-sm" />
            {errors.iSmartEmail && <p className="text-red-600 text-xs">{errors.iSmartEmail}</p>}
          </div>
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Person from Client</h3>
            <input name="clientName" value={form.clientName} onChange={handleChange} placeholder="Name" className="w-full border p-2 rounded text-sm mb-2" />
            <input name="clientContact" value={form.clientContact} onChange={handleChange} placeholder="Contact No" className="w-full border p-2 rounded text-sm mb-1" />
            {errors.clientContact && <p className="text-red-600 text-xs mb-1">{errors.clientContact}</p>}
            <input name="clientEmail" value={form.clientEmail} onChange={handleChange} placeholder="Email" className="w-full border p-2 rounded text-sm" />
            {errors.clientEmail && <p className="text-red-600 text-xs">{errors.clientEmail}</p>}
          </div>
        </div>
      </div>
      {escalationError && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
            {escalationError}
          </div>
        )}

      <div className="mt-10 text-right">
        <button onClick={handleSubmit} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 text-sm">
          Submit
        </button>
      </div>

      {
        isSubmitted && (
          <div className="fixed top-5 right-5 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg z-50">
            <div className="flex items-center justify-between">
              <span>Submitted successfully!</span>
              <button onClick={closePopup} className="ml-4 text-green-700 font-bold hover:text-green-900">×</button>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default AgreementForm;
