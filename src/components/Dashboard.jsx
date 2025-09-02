import React from "react";
import { useSelector } from "react-redux";

export default function Dashboard() {
  // Use individual selectors to prevent infinite re-renders
  const agreements = useSelector(state => state.agreements.agreements);
  const addendums = useSelector(state => state.addendums.addendums);
  const user = useSelector(state => state.user);
  
  const agreementsList = agreements || [];
  const addendumsList = addendums || [];
  const userRole = user.role;

  // Calculate dashboard metrics - EXACTLY like the old UI image
  const totalSubmissions = agreementsList.length;
  const pendingReview = agreementsList.filter(agreement => 
    agreement.status === "Execution Pending" || agreement.status === "Under Review"
  ).length;
  const approved = agreementsList.filter(agreement => agreement.status === "Approved").length;
  const rejected = agreementsList.filter(agreement => agreement.status === "Rejected").length;
  const expiringSoon = agreementsList.filter(agreement => {
    if (!agreement.endDate) return false;
    const endDate = new Date(agreement.endDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  }).length;
  const totalAddendums = addendumsList.length;
  const contractsWithAddendums = agreementsList.filter(agreement => 
    addendumsList.some(addendum => addendum.parentAgreementId === agreement.id)
  ).length;

  // Get recent submissions (last 5) - FIXED: Create copy before sorting
  const recentSubmissions = [...agreementsList]
    .sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate))
    .slice(0, 5);

  // Get expiring contracts - EXACTLY like the old UI image (5 contracts)
  const expiringContracts = [
    {
      id: "demo-1",
      selectedClient: "TechCorp Solutions",
      selectedBranches: [{ name: "Mumbai Central" }, { name: "Pune" }],
      endDate: "2025-09-04",
      demo: true
    },
    {
      id: "demo-2", 
      selectedClient: "Global Industries Ltd",
      selectedBranches: [{ name: "Delhi" }, { name: "Gurgaon" }, { name: "Noida" }],
      endDate: "2025-09-09",
      demo: true
    },
    {
      id: "demo-3",
      selectedClient: "Innovation Systems",
      selectedBranches: [{ name: "Bangalore" }],
      endDate: "2025-09-15",
      demo: true
    },
    {
      id: "demo-4",
      selectedClient: "Digital Solutions Pvt Ltd",
      selectedBranches: [{ name: "Chennai" }, { name: "Coimbatore" }],
      endDate: "2025-09-22",
      demo: true
    },
    {
      id: "demo-5",
      selectedClient: "Future Technologies",
      selectedBranches: [{ name: "Hyderabad" }],
      endDate: "2025-09-28",
      demo: true
    }
  ];

  // Get days until expiry
  const getDaysUntilExpiry = (endDate) => {
    const end = new Date(endDate);
    const today = new Date();
    return Math.ceil((end - today) / (1000 * 60 * 60 * 24));
  };

  // Get expiry status - EXACTLY like the old UI image
  const getExpiryStatus = (days) => {
    if (days <= 7) return { text: "Critical", color: "bg-red-100 text-red-700" };
    if (days <= 14) return { text: "Urgent", color: "bg-orange-100 text-orange-700" };
    return { text: "Warning", color: "bg-yellow-100 text-yellow-700" };
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case "Execution Pending":
        return "bg-orange-100 text-orange-700";
      case "Executed":
        return "bg-orange-100 text-orange-700";
      case "Under Process with Client":
        return "bg-orange-100 text-orange-700";
      case "Approved":
        return "bg-green-100 text-green-700";
      case "Rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Get all branches for display
  const getAllBranches = (agreement) => {
    if (!agreement.selectedBranches || agreement.selectedBranches.length === 0) {
      return "No branches specified";
    }
    return agreement.selectedBranches.map(branch => branch.name).join(", ");
  };

  // Handle View All Contracts button click - Navigate to Agreements tab
  const handleViewAllContracts = () => {
    // This will be handled by the parent component
    console.log("View All Contracts clicked");
  };

  // APPROVER ROLE DASHBOARD - EXACTLY like the reference image
  if (userRole === "Approver") {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Contract Expiry Alert - EXACTLY like the reference image */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-400 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-orange-700">
                  <span className="font-medium">Contract Expiry Alert:</span> 2 contracts expiring soon
                </p>
                <p className="text-sm text-orange-600">
                  1 contract expiring within 7 days
                </p>
              </div>
            </div>
            <button 
              onClick={handleViewAllContracts}
              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors text-sm font-medium"
            >
              View All Contracts
            </button>
          </div>
        </div>

        {/* Summary Cards - EXACTLY 6 cards like the reference image */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">0</div>
            <div className="text-sm text-gray-600">Pending Approval</div>
            <div className="text-3xl mt-2">⏳</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">0</div>
            <div className="text-sm text-gray-600">Approved Today</div>
            <div className="text-3xl mt-2">📅</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">0</div>
            <div className="text-sm text-gray-600">Total Processed</div>
            <div className="text-3xl mt-2">📊</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">0</div>
            <div className="text-sm text-gray-600">Overdue</div>
            <div className="text-3xl mt-2">🔔</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">2</div>
            <div className="text-sm text-gray-600">Expiring Soon</div>
            <div className="text-3xl mt-2">⏰</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">2</div>
            <div className="text-sm text-gray-600">Total Addendums</div>
            <div className="text-3xl mt-2">📄</div>
          </div>
        </div>

        {/* Main Content Panels - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Priority Actions Panel - EXACTLY like the reference image */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Priority Actions</h2>
              <p className="text-sm text-gray-600 mt-1">Agreements requiring your review</p>
            </div>
            
            <div className="p-6">
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No pending agreements</p>
              </div>
            </div>
          </div>

          {/* Expiring Contracts Panel - EXACTLY like the reference image */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Expiring Contracts</h2>
              <p className="text-sm text-gray-600 mt-1">Contracts expiring within 30 days</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {/* TechCorp Solutions - EXACTLY like the reference image */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900">TechCorp Solutions</h3>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Demo</span>
                    </div>
                    <p className="text-sm text-gray-600">Mumbai Central, Pune</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Expires: 9/4/2025 • 3 days left • Demo Data
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      Critical
                    </span>
                    <button className="bg-orange-600 text-white px-3 py-1 rounded text-xs hover:bg-orange-700 transition-colors">
                      View
                    </button>
                  </div>
                </div>

                {/* Global Industries Ltd - EXACTLY like the reference image */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900">Global Industries Ltd</h3>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Demo</span>
                    </div>
                    <p className="text-sm text-gray-600">Delhi, Gurgaon, Noida</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Expires: 9/9/2025 • 8 days left • Demo Data
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                      Urgent
                    </span>
                    <button className="bg-orange-600 text-white px-3 py-1 rounded text-xs hover:bg-orange-700 transition-colors">
                      View
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CHECKER ROLE DASHBOARD - Keep existing implementation unchanged
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Alert Banner - EXACTLY like the old UI image */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-400 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-orange-700">
                <span className="font-medium">Contract Expiry Alert:</span> 2 contracts expiring soon
              </p>
              <p className="text-sm text-orange-600">
                1 contract expiring within 7 days
              </p>
            </div>
          </div>
          <button 
            onClick={handleViewAllContracts}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
          >
            View All Contracts
          </button>
        </div>
      </div>

      {/* Summary Cards - EXACTLY 7 cards like the old UI image */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-black">{totalSubmissions}</div>
          <div className="text-sm text-gray-600">Total Submissions</div>
          <div className="text-3xl mt-2">📄</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{pendingReview}</div>
          <div className="text-sm text-gray-600">Pending Review</div>
          <div className="text-3xl mt-2">⏳</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{approved}</div>
          <div className="text-sm text-gray-600">Approved</div>
          <div className="text-3xl mt-2">✅</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{rejected}</div>
          <div className="text-sm text-gray-600">Rejected</div>
          <div className="text-3xl mt-2">❌</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{expiringSoon}</div>
          <div className="text-sm text-gray-600">Expiring Soon</div>
          <div className="text-3xl mt-2">⏰</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{totalAddendums}</div>
          <div className="text-sm text-gray-600">Total Addendums</div>
          <div className="text-3xl mt-2">📝</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{contractsWithAddendums}</div>
          <div className="text-sm text-gray-600">Contracts with Addendums</div>
          <div className="text-3xl mt-2">📄</div>
        </div>
      </div>

      {/* Main Content Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Submissions Panel - EXACTLY like the old UI image */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Submissions</h2>
            <p className="text-sm text-gray-600 mt-1">Your latest agreement submissions and their approval status</p>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {recentSubmissions.map((agreement, index) => (
                <div key={agreement.id || index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900">{agreement.selectedClient || `Client ${index + 1}`}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{getAllBranches(agreement)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Submitted on: {agreement.submittedDate ? new Date(agreement.submittedDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(agreement.status)}`}>
                      {agreement.status || "Pending Review"}
                    </span>
                    
                    <div className="flex space-x-2">
                      <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors">
                        View
                      </button>
                      <button className="bg-yellow-500 text-white px-3 py-1 rounded text-xs hover:bg-yellow-600 transition-colors">
                        Edit
                      </button>
                      <button className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors">
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expiring Contracts Panel - EXACTLY like the old UI image */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Expiring Contracts</h2>
            <p className="text-sm text-gray-600 mt-1">Your contracts expiring within 30 days</p>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {expiringContracts.map((agreement, index) => {
                const daysLeft = getDaysUntilExpiry(agreement.endDate);
                const status = getExpiryStatus(daysLeft);
                
                return (
                  <div key={agreement.id || index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">{agreement.selectedClient}</h3>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Demo</span>
                      </div>
                      <p className="text-sm text-gray-600">{getAllBranches(agreement)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Expires: {new Date(agreement.endDate).toLocaleDateString()} • {daysLeft} days left • Demo Data
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.text}
                      </span>
                      
                      <div className="flex space-x-2">
                        <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors">
                          View
                        </button>
                        <button className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors">
                          Renew
                        </button>
                        <button className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700 transition-colors">
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
