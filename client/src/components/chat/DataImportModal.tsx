import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useProjectStore } from '../../store/projectStore';
import { dataService } from '../../services/dataService';
import toast from 'react-hot-toast';
import { PlusCircle, FileJson, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

type EntityType = 'products' | 'customers' | 'orders' | 'invoices';

export default function DataImportModal({ open, onClose }: Props) {
  const { selectedProject } = useProjectStore();
  const [tab, setTab] = useState<'form' | 'json'>('form');
  const [entity, setEntity] = useState<EntityType>('products');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  // Product
  const [productForm, setProductForm] = useState({ name: '', price: '', category: 'Electronics', stock: '50' });
  // Customer
  const [customerForm, setCustomerForm] = useState({ name: '', email: '', city: 'Mumbai', segment: 'retail' });
  // Order
  const [orderForm, setOrderForm] = useState({ customerName: '', totalAmount: '', status: 'confirmed', city: 'Mumbai' });
  // Invoice
  const [invoiceForm, setInvoiceForm] = useState({ customerName: '', totalAmount: '', status: 'paid' });

  // JSON input state
  const [jsonText, setJsonText] = useState('');

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) {
      toast.error('No active workspace selected');
      return;
    }
    setError('');
    setLoading(true);

    try {
      let record: Record<string, unknown> = {};
      if (entity === 'products') {
        record = {
          name: productForm.name,
          price: parseFloat(productForm.price) || 0,
          category: productForm.category,
          stock: parseInt(productForm.stock, 10) || 10,
        };
      } else if (entity === 'customers') {
        record = {
          name: customerForm.name,
          email: customerForm.email,
          city: customerForm.city,
          segment: customerForm.segment,
        };
      } else if (entity === 'orders') {
        const amount = parseFloat(orderForm.totalAmount) || 1000;
        record = {
          customerName: orderForm.customerName,
          totalAmount: amount,
          amount,
          status: orderForm.status,
          city: orderForm.city,
        };
      } else if (entity === 'invoices') {
        const amount = parseFloat(invoiceForm.totalAmount) || 1000;
        record = {
          customerName: invoiceForm.customerName,
          totalAmount: amount,
          amount,
          status: invoiceForm.status,
        };
      }

      await dataService.importData(selectedProject._id, entity, [record]);
      toast.success(`New ${entity.slice(0, -1)} added to your workspace!`);
      // Reset forms
      setProductForm({ name: '', price: '', category: 'Electronics', stock: '50' });
      setCustomerForm({ name: '', email: '', city: 'Mumbai', segment: 'retail' });
      setOrderForm({ customerName: '', totalAmount: '', status: 'confirmed', city: 'Mumbai' });
      setInvoiceForm({ customerName: '', totalAmount: '', status: 'paid' });
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err.message || 'Failed to add data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleJsonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) {
      toast.error('No active workspace selected');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const parsed = JSON.parse(jsonText);
      const records = Array.isArray(parsed) ? parsed : [parsed];
      if (records.length === 0) {
        setError('JSON array is empty');
        setLoading(false);
        return;
      }

      const res = await dataService.importData(selectedProject._id, entity, records);
      toast.success(res.message || `Imported ${res.count} records successfully!`);
      setJsonText('');
      onClose();
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format. Please check your syntax.');
      } else {
        setError(err?.response?.data?.error || err.message || 'Failed to import JSON');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Feed Data to Your Workspace" className="max-w-lg">
      <div className="space-y-4">
        {/* Workspace context */}
        <p className="text-xs text-gray-400">
          Adding data to:{' '}
          <span className="text-brand-400 font-semibold">{selectedProject?.name || 'Workspace'}</span>
          <span className="text-gray-500 block text-[11px] mt-0.5">
            This data is strictly private and accessible only to your account.
          </span>
        </p>

        {/* Tab switcher */}
        <div className="flex bg-gray-800/80 p-1 rounded-xl border border-gray-700">
          <button
            type="button"
            onClick={() => { setTab('form'); setError(''); }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              tab === 'form' ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" /> Quick Add Form
          </button>
          <button
            type="button"
            onClick={() => { setTab('json'); setError(''); }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              tab === 'json' ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" /> Bulk JSON Import
          </button>
        </div>

        {/* Entity Selector */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Select Collection</label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['products', 'customers', 'orders', 'invoices'] as EntityType[]).map((ent) => (
              <button
                key={ent}
                type="button"
                onClick={() => { setEntity(ent); setError(''); }}
                className={`py-1.5 px-2 text-xs font-medium rounded-lg border capitalize text-center transition-colors ${
                  entity === ent
                    ? 'bg-brand-500/15 border-brand-500/40 text-brand-300'
                    : 'bg-gray-800/40 border-gray-700/60 text-gray-400 hover:border-gray-600'
                }`}
              >
                {ent}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: Form */}
        {tab === 'form' ? (
          <form onSubmit={handleFormSubmit} className="space-y-3 pt-1">
            {entity === 'products' && (
              <>
                <Input
                  label="Product Name"
                  placeholder="e.g. MacBook Pro 16 M3"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Price (₹)"
                    type="number"
                    placeholder="120000"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    required
                  />
                  <Input
                    label="Stock"
                    type="number"
                    placeholder="50"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="input-field"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Apparel">Apparel</option>
                    <option value="Hardware">Hardware</option>
                  </select>
                </div>
              </>
            )}

            {entity === 'customers' && (
              <>
                <Input
                  label="Customer Name"
                  placeholder="e.g. Rahul Sharma"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="rahul@example.com"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="City"
                    placeholder="Mumbai"
                    value={customerForm.city}
                    onChange={(e) => setCustomerForm({ ...customerForm, city: e.target.value })}
                  />
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1.5">Segment</label>
                    <select
                      value={customerForm.segment}
                      onChange={(e) => setCustomerForm({ ...customerForm, segment: e.target.value })}
                      className="input-field"
                    >
                      <option value="retail">Retail</option>
                      <option value="wholesale">Wholesale</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {entity === 'orders' && (
              <>
                <Input
                  label="Customer Name"
                  placeholder="e.g. Priya Patel"
                  value={orderForm.customerName}
                  onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })}
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Total Amount (₹)"
                    type="number"
                    placeholder="15000"
                    value={orderForm.totalAmount}
                    onChange={(e) => setOrderForm({ ...orderForm, totalAmount: e.target.value })}
                    required
                  />
                  <Input
                    label="City"
                    placeholder="Mumbai"
                    value={orderForm.city}
                    onChange={(e) => setOrderForm({ ...orderForm, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">Order Status</label>
                  <select
                    value={orderForm.status}
                    onChange={(e) => setOrderForm({ ...orderForm, status: e.target.value })}
                    className="input-field"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
              </>
            )}

            {entity === 'invoices' && (
              <>
                <Input
                  label="Customer Name"
                  placeholder="e.g. Vikram Mehta"
                  value={invoiceForm.customerName}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, customerName: e.target.value })}
                  required
                />
                <Input
                  label="Total Amount (₹)"
                  type="number"
                  placeholder="25000"
                  value={invoiceForm.totalAmount}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, totalAmount: e.target.value })}
                  required
                />
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">Status</label>
                  <select
                    value={invoiceForm.status}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, status: e.target.value })}
                    className="input-field"
                  >
                    <option value="paid">Paid</option>
                    <option value="sent">Sent</option>
                    <option value="draft">Draft</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </>
            )}

            <Button type="submit" loading={loading} fullWidth className="mt-4">
              Add Record to {entity}
            </Button>
          </form>
        ) : (
          /* Tab 2: JSON Import */
          <form onSubmit={handleJsonSubmit} className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Paste JSON Array or Object ({entity})
              </label>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder={`[\n  {\n    "name": "Custom Product",\n    "price": 2500,\n    "category": "Electronics"\n  }\n]`}
                rows={7}
                className="input-field font-mono text-xs leading-relaxed"
                required
              />
            </div>
            <Button type="submit" loading={loading} fullWidth className="mt-2">
              Import Records to {entity}
            </Button>
          </form>
        )}
      </div>
    </Modal>
  );
}
