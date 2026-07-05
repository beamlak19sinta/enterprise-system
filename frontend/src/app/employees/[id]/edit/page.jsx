'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { employeeApi, departmentApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import Link from 'next/link';

export default function EditEmployeePage() {
  const { id } = useParams();
  const router = useRouter();
  const [departments, setDepartments] = useState([]);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    Promise.all([employeeApi.getOne(id), departmentApi.getAll({ limit: 100 })]).then(([e, d]) => {
      const emp = e.data.data.employee;
      setDepartments(d.data.data.departments);
      reset({
        firstName: emp.user?.firstName, lastName: emp.user?.lastName,
        email: emp.user?.email, phone: emp.user?.phone,
        position: emp.position, department: emp.department?._id,
        employmentType: emp.employmentType, employmentStatus: emp.employmentStatus,
        'salary.base': emp.salary?.base, notes: emp.notes,
      });
    }).catch(() => toast.error('Failed to load'));
  }, [id]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await employeeApi.update(id, data);
      toast.success('Employee updated!');
      router.push(`/employees/${id}`);
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const deptOptions = [{ value: '', label: 'Select Department' }, ...departments.map(d => ({ value: d._id, label: d.name }))];

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-5 animate-fade-in">
        <div className="flex items-center gap-3">
          <Link href={`/employees/${id}`}><button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowLeft className="w-5 h-5 text-gray-500" /></button></Link>
          <h1 className="section-title">Edit Employee</h1>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="card p-5 grid grid-cols-2 gap-4">
            <h3 className="col-span-2 font-semibold text-gray-900 dark:text-white">Personal Info</h3>
            <Input label="First Name" {...register('firstName', { required: 'Required' })} error={errors.firstName?.message} />
            <Input label="Last Name" {...register('lastName', { required: 'Required' })} error={errors.lastName?.message} />
            <Input label="Email" type="email" {...register('email')} className="col-span-2" />
            <Input label="Phone" {...register('phone')} />
            <Input label="Position" {...register('position', { required: 'Required' })} error={errors.position?.message} />
          </div>
          <div className="card p-5 grid grid-cols-2 gap-4">
            <h3 className="col-span-2 font-semibold text-gray-900 dark:text-white">Employment</h3>
            <Select label="Department" options={deptOptions} {...register('department')} />
            <Select label="Employment Type" options={[{ value: 'full_time', label: 'Full Time' }, { value: 'part_time', label: 'Part Time' }, { value: 'contract', label: 'Contract' }, { value: 'intern', label: 'Intern' }]} {...register('employmentType')} />
            <Select label="Status" options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'on_leave', label: 'On Leave' }, { value: 'probation', label: 'Probation' }]} {...register('employmentStatus')} />
            <Input label="Base Salary (USD)" type="number" {...register('salary.base')} />
          </div>
          <div className="card p-5">
            <TextArea label="Notes" {...register('notes')} rows={3} placeholder="Additional notes..." />
          </div>
          <div className="flex justify-end gap-3">
            <Link href={`/employees/${id}`}><Button type="button" variant="secondary">Cancel</Button></Link>
            <Button type="submit" loading={saving} icon={<Save className="w-4 h-4" />}>Save Changes</Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
