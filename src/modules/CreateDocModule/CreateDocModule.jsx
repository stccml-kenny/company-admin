import React from 'react'

export default function CreateDocModule({
  editingDocId,
  setEditingDocId,
  docType,
  setDocType,
  docNumber,
  setDocNumber,
  documents,
  generateDocNumber,
  customers,
  selectedCustomerId,
  setSelectedCustomerId,
  issueDate,
  setIssueDate,
  dueDate,
  setDueDate,
  issuedBy,
  setIssuedBy,
  items,
  addItemRow,
  updateItem,
  removeItem,
  commonItemOptions,
  rawSubtotal,
  percentageNum,
  paymentPercentage,
  setPaymentPercentage,
  finalTotalAmount,
  paymentMethod,
  setPaymentMethod,
  paymentRemark,
  setPaymentRemark,
  docRemark,
  setDocRemark,
  handleSaveDocument,
  isLoading,
  setView
}) {
  return (
          <>
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-xl font-bold text-gray-800">{editingDocId ? '編輯單據' : '建立新單據'}</h1>
              <button onClick={() => setView('documents')} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-200">
                ← 返回單據列表
              </button>
            </div>
            <form onSubmit={handleSaveDocument} className="bg-gray-50 p-4 rounded-lg border space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">單據類型</label>
                  <select value={docType} onChange={async (e) => {
                    const t = e.target.value
                    setDocType(t)
                    const newNum = await generateDocNumber(t, issueDate, documents, editingDocId)
                    setDocNumber(newNum)
                  }} className="w-full border rounded p-2 text-xs bg-white outline-none">
                    <option value="quotation">報價單</option>
                    <option value="invoice">發票</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">單號</label>
                  <input type="text" value={docNumber} readOnly className="w-full border rounded p-2 text-xs bg-gray-100 text-gray-600 outline-none font-mono" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">選擇客戶 <span className="text-red-500">*</span></label>
                <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} required className="w-full border rounded p-2 text-xs bg-white outline-none">
                  <option value="">-- 請選擇客戶 --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">開立日期</label>
                <input 
                  type="date" 
                  value={issueDate} 
                  onChange={async (e) => {
                    const d = e.target.value
                    setIssueDate(d)
                    const newNum = await generateDocNumber(docType, d, documents, editingDocId)
                    setDocNumber(newNum)
                  }} 
                  required 
                  className="w-full max-w-[220px] box-border min-w-0 block border rounded p-2 text-xs bg-white outline-none [color-scheme:light]" 
                />
              </div>

              {docType === 'quotation' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">到期日</label>
                  <input 
                    type="date" 
                    value={dueDate} 
                    onChange={(e) => setDueDate(e.target.value)} 
                    className="w-full max-w-[220px] box-border min-w-0 block border rounded p-2 text-xs bg-white outline-none [color-scheme:light]" 
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">發出人 (Issued By)</label>
                <input type="text" value={issuedBy} onChange={(e) => setIssuedBy(e.target.value)} placeholder="例如：經理 / 財務部" className="w-full border rounded p-2 text-xs bg-white outline-none" />
              </div>

              <h3 className="text-xs font-bold text-gray-800 pt-2 border-t">項目細明</h3>
              {items.map((item, index) => (
                <div key={index} className="bg-white p-2.5 rounded border mb-2 space-y-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">項目說明（支援多行輸入）</label>
                    {item.isCustom ? (
                      <div className="flex gap-1 items-start">
                        <textarea 
                          placeholder="請手動輸入項目說明（可換行）" 
                          value={item.item_name} 
                          onChange={(e) => updateItem(index, 'item_name', e.target.value)} 
                          rows={2}
                          required 
                          className="flex-1 border rounded p-1.5 text-xs bg-white outline-none resize-y" 
                        />
                        <button 
                          type="button" 
                          onClick={() => updateItem(index, 'isCustom', false)} 
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 text-[10px] rounded font-semibold shrink-0"
                        >
                          返回下拉
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <select 
                          value={commonItemOptions.some(opt => opt.name === item.item_name) ? item.item_name : ''}
                          onChange={(e) => {
                            if (e.target.value === 'CUSTOM_INPUT') {
                              updateItem(index, 'item_name', 'CUSTOM_INPUT')
                            } else {
                              updateItem(index, 'item_name', e.target.value)
                            }
                          }}
                          required={!item.item_name}
                          className="w-full border rounded p-1.5 text-xs bg-white outline-none"
                        >
                          <option value="">-- 請選擇項目說明 --</option>
                          {commonItemOptions.map(opt => (
                            <option key={opt.id} value={opt.name}>{opt.name}</option>
                          ))}
                          <option value="CUSTOM_INPUT">✏️ 手動輸入其他項目...</option>
                        </select>
                        <textarea
                          value={item.item_name}
                          onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                          placeholder="可在此補充或換行輸入詳細項目內容..."
                          rows={2}
                          className="w-full border rounded p-1.5 text-xs bg-white outline-none resize-y"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-center">
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-0.5">數量</label>
                      <input type="number" placeholder="數量" value={item.quantity} min="1" onChange={(e) => updateItem(index, 'quantity', e.target.value)} required className="w-full border rounded p-1.5 text-xs bg-white outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-0.5">節數</label>
                      <input type="number" placeholder="節數" value={item.sessions} min="1" onChange={(e) => updateItem(index, 'sessions', e.target.value)} required className="w-full border rounded p-1.5 text-xs bg-white outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-0.5">單價</label>
                      <input type="number" placeholder="單價" value={item.unit_price} min="0" onChange={(e) => updateItem(index, 'unit_price', e.target.value)} required className="w-full border rounded p-1.5 text-xs bg-white outline-none" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t text-xs">
                    <span className="text-gray-500">小計: <strong className="text-blue-600">${((Number(item.quantity) || 1) * (Number(item.sessions) || 1) * (Number(item.unit_price) || 0)).toFixed(2)}</strong></span>
                    {items.length > 1 && <button type="button" onClick={() => removeItem(index)} className="text-red-500 font-bold px-2 py-0.5 bg-red-50 rounded">刪除此項</button>}
                  </div>
                </div>
              ))}
              <button type="button" onClick={addItemRow} className="bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded font-semibold">+ 新增項目細明</button>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">支付比例 (%)</label>
                  <input 
                    type="number" 
                    value={paymentPercentage} 
                    min="1" 
                    max="100" 
                    onChange={(e) => setPaymentPercentage(e.target.value)} 
                    className="w-full border rounded p-2 text-xs bg-white outline-none font-bold text-blue-600"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">折算後總金額</label>
                  <div className="p-2 text-sm font-bold text-emerald-600 bg-white border rounded">
                    ${finalTotalAmount.toFixed(2)} <span className="text-[10px] text-gray-400 font-normal">(原價: ${rawSubtotal.toFixed(2)})</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">支付方式 (Payment Method)</label>
                <select 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value)} 
                  className="w-full border rounded p-2 text-xs bg-white outline-none"
                >
                  <option value="銀行轉賬">銀行轉賬 (Bank Transfer)</option>
                  <option value="支票">支票 (Cheque)</option>
                  <option value="現金">現金 (Cash)</option>
                </select>
              </div>

              {(paymentMethod === '支票' || paymentMethod === '銀行轉賬') && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {paymentMethod === '支票' ? '支票備註 (如：支票號碼/銀行)' : '銀行轉賬備註 (如：轉賬帳號/戶名) - 支援多行輸入'}
                  </label>
                  <textarea 
                    value={paymentRemark} 
                    onChange={(e) => setPaymentRemark(e.target.value)} 
                    rows={2}
                    placeholder={paymentMethod === '支票' ? '請輸入支票號碼或相關資訊...' : '請輸入轉賬帳號或相關資訊（可換行）...'} 
                    className="w-full border rounded p-2 text-xs outline-none bg-white resize-y"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">備註（支援多行輸入）</label>
                <textarea 
                  value={docRemark} 
                  onChange={(e) => setDocRemark(e.target.value)} 
                  rows={3} 
                  className="w-full border rounded p-2 text-xs outline-none bg-white resize-y" 
                  placeholder="付款條件等（可換行）..."
                ></textarea>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-3 rounded-lg font-bold shadow">
                {editingDocId ? '儲存修改' : '儲存並建立單據'}
              </button>
            </form>
          </>
  )
}
