

import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const AgreementForm = () => {


  const [entityType, setEntityType] = useState("single");
  const [clauses, setClauses] = useState(initialClauses());
  const [underList, setUnderList] = useState(initialUnderList());
  const [form, setForm] = useState(initialFormData());
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [uploadedStatus, setUploadedStatus] = useState({}); // Track uploads
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [escalationError, setEscalationError] = useState("");


  function initialClauses() {
    return [
      { title: "Term and termination (Duration)", placeholder: "30 days" },
      { title: "Payment Terms", placeholder: "15" },
      { title: "Penalty", placeholder: "500/-" },
      { title: "Minimum Wages", placeholder: "Yearly / Not Allowed / At Actual" },
      { title: "Costing - Salary Breakup", placeholder: "Yes / No" },
      { title: "SLA", placeholder: "Specific Page/Clause" },
      { title: "Indemnity", placeholder: "Specific Page/Clause" },
      { title: "Insurance", placeholder: "Specific Page/Clause" },
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
    setClauses([...clauses, { title: "Enter clause", placeholder: "Enter clause details" }]);
  };

  const duplicateElement = () => {
    setUnderList([...underList, ...initialUnderList()]);
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
    const requiredSections = ["Agreement", "WO", "PO", "LOI"];
    const missingUploads = requiredSections
      .map((type, index) => {
        const key = `agreement-${index}`;
        return !uploadedStatus[key] ? type : null;
      })
      .filter(Boolean); // Remove nulls

    if (missingUploads.length > 0) {
      setEscalationError(`Escalation: Missing uploads for section(s): ${missingUploads.join(", ")}`);
      return;
    }
    setEscalationError(null)
    if (Object.keys(errs).length > 0) {

      setErrors(errs);
      return;
    }


    console.log("Form data submitted:", {
      form,
      clauses,
      underList,
      entityType,
    });

    setIsSubmitted(true);
    setForm(initialFormData());
    setClauses(initialClauses());
    setUnderList(initialUnderList());
    setEntityType("single");
    setErrors({});
    setUploadedStatus({});

    setTimeout(() => setIsSubmitted(false), 3000);

  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const closePopup = () => {
    setIsSubmitted(false);
  };

  const handleUploadChange = (key) => {
    setUploadedStatus((prev) => ({ ...prev, [key]: true }));
  };

  const handleDateChange1 = (date) => {
    setStartDate(date)
  }
  const handleDateChange2 = (date) => {
    setEndDate(date)
  }

  return (
    <div className="relative max-w-7xl mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Agreement Form</h1>
      <div className="space-y-4">

        {/* User information */}
        <h2 className="text-xl font-bold">User Information</h2>
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <div>
    <label className="block font-medium">User Role</label>
    <select className="w-full border rounded p-2" defaultValue="" required>
      <option value="" disabled hidden>Select</option>
      <option value="Maker">Maker</option>
      <option value="Checker">Checker</option>
      <option value="Approver">Approver</option>
    </select>
  </div>
  <div>
    <label className="block font-medium">Client Name</label>
    <input type="text" className="w-full border rounded p-2" />
  </div>
  <div>
    <label className="block font-medium">Client Site</label>
    <select className="w-full border rounded p-2" defaultValue="" required>
      <option value="" disabled hidden>Select</option>
      <option value="Single">Single</option>
      <option value="Multiple">Multiple</option>
      <option value="SelectAll">Select All</option>
    </select>
  </div>
</div>

      </div>

      {["Agreement", "WO", "PO", "LOI"].map((type, index) => (
        <div
          key={type}
          className="grid grid-cols-8 gap-4 items-start mb-6 p-4 border border-gray-300 rounded-lg bg-gray-50"
        >
          <div className="col-span-1 font-semibold text-gray-700 pt-2">{type}</div>
          {/* <input type="dateP" placeholder="From" className="col-span-1 border border-gray-300 p-2 rounded text-sm" />
          <input type="text" placeholder="To" className="col-span-1 border border-gray-300 p-2 rounded text-sm" /> */}
          {/* <input type="text" placeholder="NA" className="col-span-1 border border-gray-300 p-2 rounded text-sm" /> */}
          <div className="">
            <DatePicker
              className="col-span-1 border border-gray-300 p-2 rounded text-sm w-32"
              selected={startDate}

              onChange={handleDateChange1} //only when value has changed
            />
          </div>
          <div>
            <DatePicker
              className="col-span-1 border border-gray-300 p-2 rounded text-sm w-32"
              selected={endDate}

              onChange={handleDateChange2}
            />

          </div>
          <label
            className={`inline-block ${uploadedStatus[`agreement-${index}`] ? "bg-green-600" : "bg-blue-600"
              } text-white px-4 py-2 rounded cursor-pointer hover:opacity-90`}
          >
            {uploadedStatus[`agreement-${index}`] ? "Uploaded" : "Upload"}
            <input
              type="file"
              className="hidden"
              onChange={() => handleUploadChange(`agreement-${index}`)}
            />
          </label>
          <div className="col-span-2 text-sm">
            <label className="block text-sm font-medium text-gray-700">Status:</label>
            <input
              type="text"
              placeholder="Enter status"
              className="border border-gray-300 p-1 rounded w-full text-sm"
            />
          </div>
        </div>
      ))
      }
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
              <input
                key={key}
                type={input.type}
                placeholder={input.placeholder}
                className={input.className}
              />
            ))}

<div className="">
              <button
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 "
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



      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Important Clauses</h2>
        {clauses.map((clause, index) => (
          <div key={index} className="grid grid-cols-3 gap-4 mb-4 items-center">
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
            <input
              type="text"
              placeholder={clause.placeholder}
              className="border border-gray-300 p-2 rounded text-sm w-full"
            />
            {(clause.title === "Term and termination (Duration)" || clause.title === "Payment Terms" || clause.title === "Penalty" || clause.title === "Minimum Wages" || clause.title === "Costing - Salary Breakup" || clause.title === "SLA" || clause.title === "Indemnity" || clause.title === "Insurance" || clause.title === "Enter clause") && (
              <label
                className={`inline-block ${uploadedStatus[`clause-${index}`] ? "bg-green-600" : "bg-blue-600"
                  } text-white px-4 py-2 rounded cursor-pointer hover:opacity-90`}
              >
                {uploadedStatus[`clause-${index}`] ? "Uploaded" : "Upload"}
                <input
                  type="file"
                  className="hidden"
                  onChange={() => handleUploadChange(`clause-${index}`)}
                />
              </label>
            )}
          </div>
        ))}
        <button onClick={handleAddClause} className="text-blue-600 hover:underline text-sm mt-2">
          + Add Clause
        </button>

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
