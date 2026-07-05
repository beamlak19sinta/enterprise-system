'use client';
import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';
import { Settings, User, Lock, Palette, Bell, Building2, Sun, Moon, Monitor } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

export default function SettingsPage() {
  const { user, setUser, theme, setTheme } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);

  const profileForm = useForm({ defaultValues: { firstName: user?.firstName, lastName: user?.lastName, phone: user?.phone, position: user?.position } });
  const passwordForm = useForm();

  const onProfileSave = async (data) => {
    setSaving(true);
    try {
      const res = await authApi.updateProfile(data);
      setUser(res.data.data.user);
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const onPasswordChange = async (data) => {
    if (data.newPassword !== data.confirmPassword) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    try {
      await authApi.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed!');
      passwordForm.reset();
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Lock className="w-4 h-4" /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in max-w-4xl">
        <div><h1 className="section-title flex items-center gap-2"><Settings className="w-5 h-5 text-primary-500" />Settings</h1><p className="text-sm text-gray-500">Manage your account and preferences</p></div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Sidebar */}
          <div className="card p-3 h-fit">
            <nav className="space-y-1">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}>
                  {tab.icon}{tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 card p-6">
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">Profile Information</h2>
                <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white text-xl font-bold">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-lg">{user?.firstName} {user?.lastName}</p>
                    <p className="text-sm text-gray-400">{user?.email}</p>
                    <span className="badge bg-primary-100 text-primary-700 mt-1 capitalize">{user?.role?.replace('_', ' ')}</span>
                  </div>
                </div>
                <form className="grid grid-cols-2 gap-4" onSubmit={profileForm.handleSubmit(onProfileSave)}>
                  <Input label="First Name" {...profileForm.register('firstName')} />
                  <Input label="Last Name" {...profileForm.register('lastName')} />
                  <Input label="Phone" {...profileForm.register('phone')} className="col-span-2" />
                  <Input label="Position" {...profileForm.register('position')} className="col-span-2" />
                  <div className="col-span-2 flex justify-end"><Button type="submit" loading={saving}>Save Changes</Button></div>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">Change Password</h2>
                <form className="space-y-4 max-w-md" onSubmit={passwordForm.handleSubmit(onPasswordChange)}>
                  <Input label="Current Password" type="password" {...passwordForm.register('currentPassword', { required: 'Required' })} />
                  <Input label="New Password" type="password" {...passwordForm.register('newPassword', { required: 'Required', minLength: { value: 8, message: 'Min 8 chars' } })} />
                  <Input label="Confirm New Password" type="password" {...passwordForm.register('confirmPassword', { required: 'Required' })} />
                  <Button type="submit" loading={saving}>Update Password</Button>
                </form>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">Appearance</h2>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Theme</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'light', label: 'Light', icon: <Sun className="w-5 h-5" /> },
                      { value: 'dark', label: 'Dark', icon: <Moon className="w-5 h-5" /> },
                      { value: 'system', label: 'System', icon: <Monitor className="w-5 h-5" /> },
                    ].map(t => (
                      <button key={t.value} onClick={() => setTheme(t.value)}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${theme === t.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                        <span className={theme === t.value ? 'text-primary-500' : 'text-gray-500'}>{t.icon}</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">Notification Preferences</h2>
                <div className="space-y-4">
                  {[
                    { label: 'In-app notifications', desc: 'Receive alerts inside the dashboard', defaultChecked: true },
                    { label: 'Email notifications', desc: 'Get important updates via email', defaultChecked: true },
                    { label: 'Leave request updates', desc: 'When your leave is approved or rejected', defaultChecked: true },
                    { label: 'Payroll notifications', desc: 'When salary is processed', defaultChecked: true },
                    { label: 'Low stock alerts', desc: 'When inventory falls below reorder point', defaultChecked: false },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <div><p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p><p className="text-xs text-gray-400 mt-0.5">{item.desc}</p></div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input type="checkbox" defaultChecked={item.defaultChecked} className="sr-only peer" />
                        <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-primary-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                      </label>
                    </div>
                  ))}
                  <Button className="mt-2">Save Preferences</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
