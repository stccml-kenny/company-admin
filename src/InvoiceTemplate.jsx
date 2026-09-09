import React from 'react';

export default function InvoiceTemplate({ documentData, customerData, items = [] }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto', background: 'white', color: '#333' }}>
      {/* 頂部操作按鈕（列印時會自動隱藏） */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }} className="no-print">
        <button 
          onClick={handlePrint}
          style={{ background: '#1976d2', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          列印 / 存為 PDF 📄
        </button>
      </div>

      {/* 單據標題區 */}
      <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'flex-start', borderBottom: '2px solid #333', paddingBottom: '20px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 5px 0', color: '#1976d2' }}>
            {documentData?.type === 'quotation' ? '報價單 QUOTATION' : '發票 INVOICE'}
          </h1>
          <p style={{ margin: 0, color: '#666' }}>單號：<b>{documentData?.doc_number}</b></p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: '0 0 5px 0' }}>開立日期：{documentData?.issue_date}</p>
          <p style={{ margin: 0 }}>有效/到期日：{documentData?.due_date || '-'}</p>
        </div>
      </div>

      {/* 客戶資訊區 */}
      <div style={{ marginBottom: '30px', background: '#f9f9f9', padding: '15px', borderRadius: '6px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#555' }}>客戶資訊 (Client):</h3>
        <p style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>{customerData?.name || '未指定客戶'}</p>
        <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}>聯絡人：{customerData?.contact_person || '-'}</p>
        <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}>電話：{customerData?.phone || '-'}</p>
        <p style={{ margin: 0, fontSize: '14px' }}>Email：{customerData?.email || '-'}</p>
      </div>

      {/* 品項明細表格 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
        <thead>
          <tr style={{ background: '#333', color: 'white', textAlign: 'left' }}>
            <th style={{ padding: '10px' }}>項目與服務說明</th>
            <th style={{ padding: '10px', textAlign: 'center' }}>數量</th>
            <th style={{ padding: '10px', textAlign: 'right' }}>單價</th>
            <th style={{ padding: '10px', textAlign: 'right' }}>金額</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '10px' }}>{item.item_name}</td>
              <td style={{ padding: '10px', textAlign: 'center' }}>{item.quantity}</td>
              <td style={{ padding: '10px', textAlign: 'right' }}>${Number(item.unit_price).toFixed(2)}</td>
              <td style={{ padding: '10px', textAlign: 'right' }}><b>${(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}</b></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 總金額區 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '30px' }}>
        <div style={{ width: '250px', background: '#f1f1f1', padding: '15px', borderRadius: '6px', textAlign: 'right' }}>
          <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#555' }}>總金額 (Total Amount)</p>
          <h2 style={{ margin: 0, color: '#2e7d32' }}>${Number(documentData?.total_amount || 0).toFixed(2)}</h2>
        </div>
      </div>

      {/* 備註與條件 */}
      {documentData?.remark && (
        <div style={{ borderTop: '1px dashed #ccc', paddingTop: '15px' }}>
          <h4 style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#555' }}>備註 / 付款條件：</h4>
          <p style={{ margin: 0, fontSize: '13px', color: '#666', whiteSpace: 'pre-line' }}>{documentData.remark}</p>
        </div>
      )}
    </div>
  );
}