

import React, { useState } from "react";
import AgreementForm from "./forms/AgreementForm";
import ReportFilterForm from "./forms/ReportFilterForm";
import AgreementTable from "./forms/AgreementTable";

function App() {
  const [userRole, setUserRole] = useState("");

  return (
    <div className="p-6">
      <AgreementForm setUserRole={setUserRole} />  
      {/* <ReportFilterForm/>  */}
      {userRole === "Approver" && <AgreementTable />}
    </div>
  );
}

export default App;
