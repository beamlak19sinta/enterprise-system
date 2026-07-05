'use client';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { inventoryApi } from '@/lib/api';
import { Table } from '@/components/ui/Table';
import { Zap } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function LowStockPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    inventoryApi.getLowStock()
      .then(r => setProducts(r.data.data.products))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const urgencyColor = (p) => {
    if (p.stock.available <= 0) return 'text-red-600 font-bold';
    if (p.stock.available <= p.stock.reorderPoint / 2) return 'text-orange-500 font-bold';
    return 'text-amber-500 font-semibold';
  };

  const columns = [
    { key: 'name', header: 'Product', render: (row) => (
      <div>
        <p className="font-medium text-sm text-gray-900 dark:text-white">{row.name}</p>
        <p className="text-xs font-mono text-gray-400">{row.sku}</p>
      </div>
    )},
    { key: 'category', header: 'Category', render: (row) => row.category?.name || '—' },
    { key: 'available', header: 'Available', render: (row) => <span className={urgencyColor(row)}>{row.stock.available}</span> },
    { key: 'reorderPoint', header: 'Reorder Point', render: (row) => row.stock.reorderPoint },
    { key: 'reorderQuantity', header: 'Reorder Qty', render: (row) => row.stock.reorderQuantity },
    { key: 'sellingPrice', header: 'Price', render: (row) => formatCurrency(row.sellingPrice) },
    { key: 'supplier', header: 'Supplier', render: (row) => row.supplier?.companyName || '—' },
    { key: 'urgency', header: 'Urgency', render: (row) => (
      row.stock.available <= 0
        ? <span className="badge bg-red-100 text-red-700">Out of Stock</span>
        : <span className="badge bg-amber-100 text-amber-700">Low Stock</span>
    )},
  ];

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="page-header">
          <div>
            <h1 className="section-title flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />Low Stock Alerts
            </h1>
            <p className="text-sm text-gray-500">{products.length} products need attention</p>
          </div>
        </div>

        {products.length === 0 && !loading && (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-gray-500 font-medium">All products are well stocked!</p>
            <p className="text-sm text-gray-400 mt-1">No reorder alerts at this time.</p>
          </div>
        )}

        {products.length > 0 && (
          <div className="card">
            <Table columns={columns} data={products} loading={loading} emptyMessage="No low stock items" />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
