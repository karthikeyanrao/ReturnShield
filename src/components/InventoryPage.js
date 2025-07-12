import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import './CouponPage.css';

const InventoryPage = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', qty: '', price: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState({}); // { [itemId]: true/false }
  const [editInputs, setEditInputs] = useState({}); // { [itemId]: { qty, price } }

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'inventory'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(data);
    } catch (err) {
      setItems([]);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Smart add: merge if name exists (case-insensitive)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.name || !form.qty || !form.price) {
      setError('All fields are required.');
      return;
    }
    if (isNaN(form.qty) || isNaN(form.price) || Number(form.qty) <= 0 || Number(form.price) <= 0) {
      setError('Quantity and price must be positive numbers.');
      return;
    }
    try {
      const existing = items.find(item => item.name.trim().toLowerCase() === form.name.trim().toLowerCase());
      if (existing) {
        // Update existing item: add qty
        const itemRef = doc(db, 'inventory', existing.id);
        await updateDoc(itemRef, {
          qty: existing.qty + Number(form.qty),
          price: Number(form.price),
        });
        setSuccess('Item updated!');
      } else {
        // Add new item
        await addDoc(collection(db, 'inventory'), {
          name: form.name,
          qty: Number(form.qty),
          price: Number(form.price),
          createdAt: serverTimestamp(),
        });
        setSuccess('Item added!');
      }
      setForm({ name: '', qty: '', price: '' });
      fetchItems();
    } catch (err) {
      setError('Failed to add/update item.');
    }
  };

  // Inline update for each item
  const handleEdit = (item) => {
    setEditing({ ...editing, [item.id]: true });
    setEditInputs({ ...editInputs, [item.id]: { qty: item.qty, price: item.price } });
  };
  const handleEditInput = (itemId, field, value) => {
    setEditInputs({
      ...editInputs,
      [itemId]: { ...editInputs[itemId], [field]: value },
    });
  };
  const handleSaveEdit = async (itemId) => {
    const { qty, price } = editInputs[itemId];
    if (isNaN(qty) || isNaN(price) || Number(qty) <= 0 || Number(price) <= 0) return;
    try {
      const itemRef = doc(db, 'inventory', itemId);
      const oldItem = items.find(i => i.id === itemId);
      await updateDoc(itemRef, { qty: oldItem.qty + Number(qty), price: Number(price) });
      setEditing({ ...editing, [itemId]: false });
      setEditInputs({ ...editInputs, [itemId]: {} });
      fetchItems();
    } catch (err) {
      setError('Failed to update item.');
    }
  };
  const handleCancelEdit = (itemId) => {
    setEditing({ ...editing, [itemId]: false });
    setEditInputs({ ...editInputs, [itemId]: {} });
  };

  return (
    <div className="coupons-container">
      <div className="coupons-header">
        <h1 className="coupons-title">Inventory</h1>
      </div>
      <div className="coupons-content">
        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <input
              name="name"
              placeholder="Item Name"
              value={form.name}
              onChange={handleChange}
              className="input-field"
              style={{ flex: 2 }}
            />
            <input
              name="qty"
              type="number"
              placeholder="Quantity"
              value={form.qty}
              onChange={handleChange}
              className="input-field"
              style={{ flex: 1 }}
            />
            <input
              name="price"
              type="number"
              placeholder="Price"
              value={form.price}
              onChange={handleChange}
              className="input-field"
              style={{ flex: 1 }}
            />
            <button type="submit" className="new-coupon-btn" style={{ flex: 1, minWidth: 120 }}>
              Add / Update Item
            </button>
          </div>
          {error && <div className="text-status-alert">{error}</div>}
          {success && <div className="text-status-success">{success}</div>}
        </form>
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <div className="empty-state-text">No items in inventory</div>
            <div className="empty-state-subtext">Add your first item to get started</div>
          </div>
        ) : (
          <div className="coupons-table-container">
            <table className="coupons-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>
                      {editing[item.id] ? (
                        <input
                          type="number"
                          value={editInputs[item.id]?.qty || ''}
                          onChange={e => handleEditInput(item.id, 'qty', e.target.value)}
                          style={{ width: 60, padding: '2px 6px', borderRadius: 4, border: '1px solid #ccc' }}
                        />
                      ) : (
                        item.qty
                      )}
                    </td>
                    <td>
                      {editing[item.id] ? (
                        <input
                          type="number"
                          value={editInputs[item.id]?.price || ''}
                          onChange={e => handleEditInput(item.id, 'price', e.target.value)}
                          style={{ width: 80, padding: '2px 6px', borderRadius: 4, border: '1px solid #ccc' }}
                        />
                      ) : (
                        `$${item.price.toFixed(2)}`
                      )}
                    </td>
                    <td>
                      {editing[item.id] ? (
                        <>
                          <button style={{ marginRight: 6, background: '#22c55e', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 10px', fontWeight: 600, cursor: 'pointer' }} onClick={() => handleSaveEdit(item.id)}>Save</button>
                          <button style={{ background: '#f59e42', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 10px', fontWeight: 600, cursor: 'pointer' }} onClick={() => handleCancelEdit(item.id)}>Cancel</button>
                        </>
                      ) : (
                        <button style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 10px', fontWeight: 600, cursor: 'pointer' }} onClick={() => handleEdit(item)}>Update Stock</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryPage; 