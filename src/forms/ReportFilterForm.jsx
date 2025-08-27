import React from 'react';
import { useForm, useFormState } from 'react-hook-form';
import { useState } from 'react';
import Button from '../components/ui/Button';
import DropDown from '../components/ui/DropDown';
import Label from '../components/ui/Label';
import FormError from '../components/ui/FormError';
import Modal from '../components/ui/Modal';

const clientOptions = [
  { value: 'clientA', label: 'Client A' },
  { value: 'clientB', label: 'Client B' },
  { value: 'clientC', label: 'Client C' },
];

const stateOptions = [
  { value: 'Maharashtra', label: 'Maharashtra' },
  { value: 'Karnataka', label: 'Karnataka' },
  { value: 'Tamil Nadu', label: 'Tamil Nadu' },
  { value: 'Delhi', label: 'Delhi' },
  { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
];

const statusOptions = [
  { value: 'execution_pending', label: 'Execution Pending' },
  { value: 'executed', label: 'Executed' },
  { value: 'under_process', label: 'Under Process with Client' },
  { value: 'completed', label: 'Completed' },
];

function ReportFilterForm() {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      client: '',
      state: '',
      status: '',
    },
  });

  const { errors } = useFormState({ control });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [reportParams, setReportParams] = useState(null);

  const onSubmit = (data) => {
    console.log('Report Filters:', data);
    setReportParams(data);
    setIsSubmitted(true);
  };

  return (
    <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-6 md:grid-cols-2"
      >
        <div>
          <Label htmlFor="client" className="text-sm font-medium text-gray-700">
            Client
          </Label>
          <DropDown
            id="client"
            name="client"
            control={control}
            options={clientOptions}
            placeholder="Select client"
          />
          <FormError message={errors.client?.message} />
        </div>

        <div>
          <Label htmlFor="state" className="text-sm font-medium text-gray-700">
            State
          </Label>
          <DropDown
            id="state"
            name="state"
            control={control}
            options={stateOptions}
            placeholder="Select state"
          />
          <FormError message={errors.state?.message} />
        </div>

        <div>
          <Label htmlFor="status" className="text-sm font-medium text-gray-700">
            Status Stage
          </Label>
          <DropDown
            id="status"
            name="status"
            control={control}
            options={statusOptions}
            placeholder="Select status"
          />
          <FormError message={errors.status?.message} />
        </div>

        <div className="flex justify-end md:col-span-2">
          <Button
            type="submit"
            className="bg-blue-600 px-6 py-2 hover:bg-blue-700"
          >
            Generate Report
          </Button>
        </div>
      </form>

      {isSubmitted && reportParams && (
        <Modal isOpen={isSubmitted} onClose={() => setIsSubmitted(false)}>
          <h2 className="mb-2 text-center text-2xl font-semibold">
            Report Filtered
          </h2>
          <p className="mb-4 text-center text-gray-600">
            Report generated with the following filters:
          </p>
          <ul className="mb-4 list-disc pl-6 text-gray-700">
            <li>Client: {reportParams.client}</li>
            <li>State: {reportParams.state}</li>
            <li>Status: {reportParams.status}</li>
          </ul>
          <div className="flex items-center justify-center">
            <Button
              onClick={() => setIsSubmitted(false)}
              className="bg-green-500 px-6 py-2 hover:bg-green-600"
            >
              Close
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default ReportFilterForm;
