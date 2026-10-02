import React from 'react'

export default function PrintPreviewModule({ selectedPrintDoc, setSelectedPrintDoc, setView }) {
  if (!selectedPrintDoc) return null

    const cust = selectedPrintDoc.customerData || {}
    const docData = selectedPrintDoc.documentData || {}
    const pct = docData.payment_percentage ?? 100
    const method = docData.payment_method || '銀行轉賬'
    const pRemark = docData.payment_remark || ''

    return (
      <div className="min-h-screen bg-white p-8 font-sans max-w-3xl mx-auto">
        <style>{`
          @media print {
            .no-print {
              display: none !important;
            }
          }
        `}</style>
        
        <div className="flex justify-between items-center mb-6 no-print">
          <button onClick={() => setView('documents')} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-200">
            ← 返回單據列表
          </button>
          <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow">
            🖨️ 直接列印 / 存為 PDF
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg text-gray-800 font-sans relative">
          <div className="flex justify-between items-start border-b pb-4 mb-4">
            <div>
              <h2 className="text-2xl font-bold text-blue-600">
                {docData.type === 'quotation' ? '報價單 QUOTATION' : '發票 INVOICE'}
              </h2>
              <p className="text-xs text-gray-600 mt-1">單號：<span className="font-bold text-gray-800">{docData.doc_number}</span></p>
            </div>
            <div className="text-right text-xs text-gray-700 space-y-1">
              <p>開立日期：{docData.issue_date}</p>
              {docData.type === 'quotation' && docData.due_date && (
                <p>到期日：{docData.due_date}</p>
              )}
              {docData.issued_by && (
                <p className="font-semibold text-gray-900">發出人：{docData.issued_by}</p>
              )}
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded mb-4 text-xs space-y-1">
            <p className="font-bold text-gray-700 mb-1">客戶資訊：</p>
            <p className="text-gray-900 font-semibold text-sm">{cust.name || cust.company_name || '未知客戶'}</p>
            <p className="text-gray-600">聯絡人：{cust.contact_person || cust.contact || '-'} | 電話：{cust.phone || '-'}</p>
            {cust.email && <p className="text-gray-600">Email：{cust.email}</p>}
            {cust.address && <p className="text-gray-600">Address：{cust.address}</p>}
          </div>

          <table className="w-full text-xs border-collapse mb-4">
            <thead>
              <tr className="bg-gray-800 text-white text-left">
                <th className="p-2.5">項目說明</th>
                <th className="p-2.5 text-center">數量</th>
                <th className="p-2.5 text-center">節數</th>
                <th className="p-2.5 text-right">單價</th>
                <th className="p-2.5 text-right">小計</th>
              </tr>
            </thead>
            <tbody>
              {selectedPrintDoc.items.map((item, idx) => {
                const qty = Number(item.quantity) || 1
                const sess = Number(item.sessions) || 1
                const price = Number(item.unit_price) || 0
                const rowTotal = qty * sess * price
                return (
                  <tr key={idx} className="border-b">
                    <td className="p-2.5 whitespace-pre-line">{item.item_name}</td>
                    <td className="p-2.5 text-center">{qty}</td>
                    <td className="p-2.5 text-center">{sess}</td>
                    <td className="p-2.5 text-right">${price.toFixed(2)}</td>
                    <td className="p-2.5 text-right font-bold">${rowTotal.toFixed(2)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="flex justify-end mb-4">
            <div className="bg-gray-100 p-3 rounded text-right w-64 space-y-1">
              <p className="text-[11px] text-gray-600">項目總額：${Number(docData.subtotal || docData.total_amount).toFixed(2)}</p>
              <p className="text-[11px] text-gray-600">支付比例：{pct}%</p>
              <p className="text-[10px] text-gray-500 pt-1 border-t">應付總金額 (Total Amount)</p>
              <p className="text-xl font-bold text-emerald-600">${Number(docData.total_amount).toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-blue-50/50 border border-blue-100 p-3 rounded mb-4 text-xs space-y-1">
            <p className="font-bold text-gray-700">支付方式：<span className="text-blue-600">{method}</span></p>
            {pRemark && <p className="text-gray-600 whitespace-pre-line">支付備註：{pRemark}</p>}
          </div>

          {docData.remark && (
            <div className="border-t pt-3 text-xs text-gray-600 mb-8">
              <p className="font-bold mb-1">備註：</p>
              <p className="whitespace-pre-line">{docData.remark}</p>
            </div>
          )}

          {/* 公司印章區塊 */}
          <div className="flex justify-end mt-6">
            <div className="text-center relative">
              <p className="text-[11px] text-gray-600 mb-1 font-semibold">STCCML Production</p>
              <img 
                src="/Chop.png" 
                alt="公司印章" 
                style={{ width: '130px', opacity: 0.85, mixBlendMode: 'multiply' }} 
              />
            </div>
          </div>
        </div>
      </div>
    )
}
