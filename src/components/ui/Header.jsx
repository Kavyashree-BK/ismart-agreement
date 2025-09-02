import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setUser, logout } from "../../slice/userSlice";
import { closeAllModals, resetEditingState } from "../../slice/uiSlice";

export default function Header() {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user);

  const handleRoleChange = useCallback((newRole) => {
    dispatch(setUser({ name: user.name, role: newRole }));
  }, [dispatch, user.name]);

  const handleLogout = useCallback(() => {
    dispatch(logout());
    dispatch(closeAllModals());
    dispatch(resetEditingState());
  }, [dispatch]);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h1 className="text-xl font-semibold text-gray-900">Legal Agreement ERP</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {user.name && (
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Approver">Approver</option>
                    <option value="Checker">Checker</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                  {user.role}
                </button>
              </div>
            )}
            
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
} 