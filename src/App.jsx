

import React from "react";
import AgreementForm from "./forms/AgreementForm";
import ReportFilterForm from "./forms/ReportFilterForm";
import AgreementTable from "./AgreementTable";
function App() {
  return (
    <div className="p-6">
      <AgreementForm />  
 {/* <ReportFilterForm/>  */}
 <AgreementTable/> 
    </div>
  );
}

export default App;
