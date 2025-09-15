import React, { useState } from "react";
import { useAppState } from "../hooks/useRedux";

export default function ReportFilterForm() {
  const { agreements, addendums, ui } = useAppState();
  const { agreements: agreementsList } = agreements;
  const { addendums: addendumsList } = addendums;
  const { actions: uiActions } = ui;

  const [filters, setFilters] = useState({
    client: "",
    city: "",
    state: "",
    fromDate: "",
    toDate: "",
    addendumsFilter: "all"
  });

  // Get unique values for dropdowns
  const uniqueClients = [...new Set(agreementsList.map(agreement => agreement.selectedClient))];
  const uniqueCities = [...new Set(agreementsList.map(agreement => 
    agreement.selectedBranches?.map(branch => branch.name)
  ).flat().filter(Boolean))];
  const uniqueStates = [...new Set(agreementsList.map(agreement => agreement.state))];

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      client: "",
      city: "",
      state: "",
      fromDate: "",
      toDate: "",
      addendumsFilter: "all"
    });
  };

  const applyFilters = () => {
    // In a real app, you would dispatch these filters to Redux
    // For now, we'll just log them
    console.log("Applied filters:", filters);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Report Filters</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Client Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client
            </label>
            <select
              value={filters.client}
              onChange={(e) => handleFilterChange("client", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Clients</option>
              {uniqueClients.map(client => (
                <option key={client} value={client}>{client}</option>
              ))}
            </select>
          </div>

          {/* City Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <select
              value={filters.city}
              onChange={(e) => handleFilterChange("city", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Cities</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* State Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State
            </label>
            <select
              value={filters.state}
              onChange={(e) => handleFilterChange("state", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All States</option>
              {uniqueStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          {/* From Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={filters.fromDate || new Date().toISOString().split('T')[0]}
              onChange={(e) => handleFilterChange("fromDate", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* To Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={filters.toDate || new Date().toISOString().split('T')[0]}
              onChange={(e) => handleFilterChange("toDate", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Addendums Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Addendums
            </label>
            <select
              value={filters.addendumsFilter}
              onChange={(e) => handleFilterChange("addendumsFilter", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Contracts</option>
              <option value="with">With Addendums</option>
              <option value="without">Without Addendums</option>
            </select>
          </div>
        </div>

        {/* Filter Summary */}
        {(filters.client || filters.city || filters.state || filters.fromDate || filters.toDate || filters.addendumsFilter !== "all") && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <span className="font-medium">Active Filters:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {filters.client && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    Client: {filters.client}
                  </span>
                )}
                {filters.city && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    City: {filters.city}
                  </span>
                )}
                {filters.state && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    State: {filters.state}
                  </span>
                )}
                {filters.addendumsFilter !== "all" && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {filters.addendumsFilter === "with" ? "With Addendums" : "Without Addendums"}
                  </span>
                )}
                {filters.fromDate && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    From: {new Date(filters.fromDate).toLocaleDateString()}
                  </span>
                )}
                {filters.toDate && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    To: {new Date(filters.toDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={applyFilters}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Apply Filters
          </button>
          <button
            onClick={clearFilters}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
}
