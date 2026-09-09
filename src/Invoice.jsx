import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vzhbclmnhxbinvembuah.supabase.co';
const supabaseKey = '你的Supabase_Anon_Key'; // 請換成你的 Anon Key
const supabase = createClient(supabaseUrl, supabaseKey);

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState('documents');
  const [documents, setDocuments] = useState([]);
  const [customers, setCustomers] = useState([]);
  
  const [docType, setDocType] = useState('quotation');
  const [docNumber, setDocNumber] = useState(`QT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [remark, setRemark] = useState('');
  const [items, setItems] = useState([{ item_name: '', quantity: 1, unit_price: 0 }]);

  const [newCustName, setNewCustName] = useState('');
  const [newCustContact, setNewCustContact] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: custData } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (custData) setCustomers(custData);

    const { data: docData } = await supabase.from('documents').select('*, customers(name)').order('created_at', { ascending: false });
    if (docData) setDocuments(docData);
  }

  const addItemRow = () => {
    setItems([...items, { item_name: '', quantity: 1, unit_price: 0 }]);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0);

  const handleSaveDocument = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      alert('請選擇客戶！');
      return;
    }

    const { data: docResult, error: docError } = await supabase.from('documents').insert([
      {
        type: docType,
        doc_number: docNumber,
        customer_id: selectedCustomerId,
        issue_date: issueDate,
        due_date: dueDate || null,
        subtotal: subtotal,
        total_amount: subtotal,
        remark: remark,
        status: 'draft'
      }
    ]).select().single();

    if (docError) {
      alert('儲存失敗: ' + docError.message);
      return;
    }

    const docId = docResult.id;
    const itemsToInsert = items.map(item => ({
      document_id: docId,
      item_name: item.item_name,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      amount: Number(item.quantity) * Number(item.unit_price)
    }));

    const { error: itemError } = await supabase.from('document_items').insert(itemsToInsert);
    if (itemError) {
      alert('儲存明細失敗: ' + itemError.message);
      return;
    }

    alert('單據建立成功！');
    setActiveTab('documents');
    fetchData();
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('customers').insert([
      { name: newCustName, contact_person: newCustContact, email: newCustEmail, phone: newCustPhone, address: newCustAddress }
    ]);
    if (error) {
      alert('新增客戶失敗: ' + error.message);
    } else {
      alert('客戶新增成功！');
      setNewCustName('');
      setNewCustContact('');
      setNewCustEmail('');
      setNewCustPhone('');
      setNewCustAddress('');
      fetchData();
    }
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>業務與會計管理系統 (報價單 & 發票)</h1>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        <button onClick={() => setActiveTab('documents')} style={tabStyle(activeTab === 'documents')}>單據記錄</button>
        <button onClick={() => setActiveTab('create')} style={tabStyle(activeTab === 'create')}>+ 建立報價單/發票</button>
        <button onClick={() => setActiveTab('customers')} style={tabStyle(activeTab === 'customers')}>客戶管理</button>
      </div>

      {activeTab === 'documents' && (
        <div>
          <h2>已發出的報價單與發票</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
            <thead>
              <tr style={{ background: '#f4f4f4', textAlign: 'left' }}>
                <th style={thStyle}>單號</th>
                <th style={thStyle}>類型</th>
                <th style={thStyle}>客戶名稱</th>
                <th style={thStyle}>日期</th>
                <th style={thStyle}>總金額</th>
                <th style={thStyle}>狀態</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={tdStyle}><b>{doc.doc_number}</b></td>
                  <td style={tdStyle}>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', background: doc.type === 'quotation' ? '#e3f2fd' : '#e8f5e9', color: doc.type === 'quotation' ? '#1565c0' : '#2e7d32' }}>
                      {doc.type === 'quotation' ? '報價單' : '發票'}
                    </span>
                  </td>
                  <td style={tdStyle}>{doc.customers?.name || '未知客戶'}</td>
                  <td style={tdStyle}>{doc.issue_date}</td>
                  <td style={tdStyle}><b>${doc.total_amount.toLocaleString()}</b></td>
                  <td style={tdStyle}>
                    <span style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 'bold', color: '#555' }}>
                      {doc.status}
                    </span>
                  </td>
                </tr>
              ))}
              {documents.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: '#777' }}>尚無任何單據記錄</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'create' && (
        <form onSubmit={handleSaveDocument} style={{ background: '#f9f9f9', padding: '25px', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h2>建立新單據</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label><b>單據類型：</b></label>
              <select value={docType} onChange={(e) => {
                const type = e.target.value;
                setDocType(type);
                setDocNumber(`${type === 'quotation' ? 'QT' : 'INV'}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
              }} style={inputStyle}>
                <option value="quotation">報價單 (Quotation)</option>
                <option value="invoice">發票 (Invoice)</option>
              </select>
            </div>
            <div>
              <label><b>單號：</b></label>
              <input type="text" value={docNumber} onChange={(e) => setDocNumber(e.target.value)} required style={inputStyle} />
            </div>
            <div>
              <label><b>選擇客戶：</b></label>
              <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} required style={inputStyle}>
                <option value="">-- 請選擇客戶 --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label><b>開立日期：</b></label>
              <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required style={inputStyle} />
            </div>
            <div>
              <label><b>有效期限 / 到期日：</b></label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <h3>品項明細</h3>
          {items.map((item, index) => (
            <div key={index} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr auto', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
              <input type="text" placeholder="項目與服務說明" value={item.item_name} onChange={(e) => updateItem(index, 'item_name', e.target.value)} required style={inputStyle} />
              <input type="number" placeholder="數量" value={item.quantity} min="1" onChange={(e) => updateItem(index, 'quantity', e.target.value)} required style={inputStyle} />
              <input type="number" placeholder="單價" value={item.unit_price} min="0" onChange={(e) => updateItem(index, 'unit_price', e.target.value)} required style={inputStyle} />
              <span style={{ fontWeight: 'bold' }}>${Number(item.quantity) * Number(item.unit_price)}</span>
              {items.length > 1 && (
                <button type="button" onClick={() => removeItem(index)} style={{ background: '#ff5252', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>刪除</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addItemRow} style={{ background: '#e0e0e0', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', marginBottom: '20px' }}>+ 新增一行品項</button>

          <div style={{ textAlign: 'right', fontSize: '18px', marginBottom: '20px' }}>
            <b>總金額 (Total): </b> <span style={{ color: '#2e7d32' }}>${subtotal.toLocaleString()}</span>
          </div>

          <div>
            <label><b>備註：</b></label>
            <textarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={3} style={{ ...inputStyle, width: '100%' }} placeholder="例如：付款條件、銀行帳號等..."></textarea>
          </div>

          <button type="submit" style={{ background: '#1976d2', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '6px', fontSize: '16px', cursor: 'pointer', marginTop: '15px' }}>儲存並建立單據</button>
        </form>
      )}

      {activeTab === 'customers' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
          <form onSubmit={handleCreateCustomer} style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', height: 'fit-content' }}>
            <h3>新增客戶</h3>
            <div style={{ marginBottom: '12px' }}>
              <label>公司/客戶名稱 *</label>
              <input type="text" value={newCustName} onChange={(e) => setNewCustName(e.target.value)} required style={inputStyle} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label>聯絡人</label>
              <input type="text" value={newCustContact} onChange={(e) => setNewCustContact(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label>電子郵件</label>
              <input type="email" value={newCustEmail} onChange={(e) => setNewCustEmail(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label>電話</label>
              <input type="text" value={newCustPhone} onChange={(e) => setNewCustPhone(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label>地址</label>
              <textarea value={newCustAddress} onChange={(e) => setNewCustAddress(e.target.value)} rows={2} style={inputStyle}></textarea>
            </div>
            <button type="submit" style={{ background: '#2e7d32', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', width: '100%' }}>新增客戶</button>
          </form>

          <div>
            <h3>客戶列表</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ background: '#f4f4f4', textAlign: 'left' }}>
                  <th style={thStyle}>名稱</th>
                  <th style={thStyle}>聯絡人</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>電話</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={tdStyle}><b>{c.name}</b></td>
                    <td style={tdStyle}>{c.contact_person || '-'}</td>
                    <td style={tdStyle}>{c.email || '-'}</td>
                    <td style={tdStyle}>{c.phone || '-'}</td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#777' }}>尚無客戶資料</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const tabStyle = (active) => ({
  padding: '10px 20px',
  background: active ? '#1976d2' : '#f1f1f1',
  color: active ? 'white' : '#333',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold'
});

const inputStyle = {
  width: '100%',
  padding: '8px',
  marginTop: '5px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  boxSizing: 'border-box'
};

const thStyle = { padding: '10px', borderBottom: '2px solid #ddd' };
const tdStyle = { padding: '10px' };