import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import './Inventory.css';

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
    <div className="inventory-container">
      <div className="inventory-header">
        <h1 className="inventory-title">Inventory</h1>
      </div>
      <div className="inventory-content">
        <form onSubmit={handleSubmit}>
          <div className="inventory-form-row">
            <input
              name="name"
              placeholder="Item Name"
              value={form.name}
              onChange={handleChange}
              className="inventory-input"
            />
            <input
              name="qty"
              type="number"
              placeholder="Quantity"
              value={form.qty}
              onChange={handleChange}
              className="inventory-input"
            />
            <input
              name="price"
              type="number"
              placeholder="Price"
              value={form.price}
              onChange={handleChange}
              className="inventory-input"
            />
            <button type="submit" className="inventory-btn">
              Add / Update Item
            </button>
          </div>
          {error && <div className="inventory-alert">{error}</div>}
          {success && <div className="inventory-success">{success}</div>}
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
          <div className="inventory-table-container">
            <table className="inventory-table">
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
                          className="inventory-edit-input"
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
                          className="inventory-edit-input"
                        />
                      ) : (
                        `$${item.price.toFixed(2)}`
                      )}
                    </td>
                    <td>
                      {editing[item.id] ? (
                        <>
                          <button className="inventory-save-btn" onClick={() => handleSaveEdit(item.id)}>Save</button>
                          <button className="inventory-cancel-btn" onClick={() => handleCancelEdit(item.id)}>Cancel</button>
                        </>
                      ) : (
                        <button className="inventory-btn" onClick={() => handleEdit(item)}>Update</button>
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