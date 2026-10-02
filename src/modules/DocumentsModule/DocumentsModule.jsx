import React from 'react'
import { supabase } from '../../supabase'

export default function DocumentsModule({
  documents,
  customers,
  filteredDocuments,
  filteredDocsTotalAmount,
  docFilterType,
  setDocFilterType,
  docFilterStatus,
  setDocFilterStatus,
  docFilterCustomerId,
  setDocFilterCustomerId,
  docFilterSearch,
  setDocFilterSearch,
  docFilterStartDate,
  setDocFilterStartDate,
  docFilterEndDate,
  setDocFilterEndDate,
  handleStartEditDocument,
  handleDeleteDocument,
  handleUpdateDocStatus,
  setSelectedPrintDoc,
  setView
}) {
  return (
          <>
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-xl font-bold text-gray-800">報價單與發票記錄</h1>
              <button onClick={() => setView('home')} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-200">
                ← 返回主畫面
              </button>
            </div>

            {/* 單據 Filter 控制列 */}
            <div className="mb-4 space-y-2.5 bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-medium text-gray-700">單據類型：</label>
                <select
                  value={docFilterType}
                  onChange={(e) => setDocFilterType(e.target.value)}
                  className="border rounded p-1.5 bg-white outline-none w-48 text-gray-700"
                >
                  <option value="all">全部類型</option>
                  <option value="quotation">報價單 (Quotation)</option>
                  <option value="invoice">發票 (Invoice)</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-1.5 border-t border-gray-200">
                <label className="font-medium text-gray-700">單據狀態：</label>
                <select
                  value={docFilterStatus}
                  onChange={(e) => setDocFilterStatus(e.target.value)}
                  className="border rounded p-1.5 bg-white outline-none w-48 text-gray-700"
                >
                  <option value="all">全部狀態</option>
                  <option value="draft">草稿 (Draft)</option>
                  <option value="sent">已發送 (Sent)</option>
                  <option value="paid">已付款 (Paid)</option>
                  <option value="accepted">已接受 (Accepted)</option>
                  <option value="cancelled">已取消 (Cancelled)</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-1.5 border-t border-gray-200">
                <label className="font-medium text-gray-700">指定客戶：</label>
                <select
                  value={docFilterCustomerId}
                  onChange={(e) => setDocFilterCustomerId(e.target.value)}
                  className="border rounded p-1.5 bg-white outline-none w-48 text-gray-700"
                >
                  <option value="all">全部客戶</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between pt-1.5 border-t border-gray-200">
                <label className="font-medium text-gray-700">關鍵字搜尋：</label>
                <input
                  type="text"
                  value={docFilterSearch}
                  onChange={(e) => setDocFilterSearch(e.target.value)}
                  placeholder="單號 / 發出人 / 備註..."
                  className="border rounded p-1.5 bg-white outline-none w-48 text-gray-700"
                />
              </div>

              <div className="flex items-center justify-between pt-1.5 border-t border-gray-200">
                <label className="font-medium text-gray-700">開立日期自：</label>
                <input
                  type="date"
                  value={docFilterStartDate}
                  onChange={(e) => setDocFilterStartDate(e.target.value)}
                  className="border rounded p-1.5 bg-white outline-none w-48 max-w-[55%] text-gray-700 [color-scheme:light]"
                />
              </div>

              <div className="flex items-center justify-between pt-1.5 border-t border-gray-200">
                <label className="font-medium text-gray-700">開立日期至：</label>
                <input
                  type="date"
                  value={docFilterEndDate}
                  onChange={(e) => setDocFilterEndDate(e.target.value)}
                  className="border rounded p-1.5 bg-white outline-none w-48 max-w-[55%] text-gray-700 [color-scheme:light]"
                />
              </div>

              {(docFilterType !== 'all' || docFilterStatus !== 'all' || docFilterCustomerId !== 'all' || docFilterSearch || docFilterStartDate || docFilterEndDate) && (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      setDocFilterType('all')
                      setDocFilterStatus('all')
                      setDocFilterCustomerId('all')
                      setDocFilterSearch('')
                      setDocFilterStartDate('')
                      setDocFilterEndDate('')
                    }}
                    className="text-blue-600 underline text-[11px] font-semibold"
                  >
                    重置所有篩選
                  </button>
                </div>
              )}
            </div>

            {/* 篩選結果加總資訊列 */}
            <div className="mb-4 bg-blue-50 border border-blue-200 p-2.5 rounded-lg text-xs flex justify-between items-center">
              <span className="text-blue-900 font-bold">符合篩選：{filteredDocuments.length} 張單據</span>
              <span className="text-blue-900">總金額：<strong className="text-emerald-600 text-sm font-bold">${filteredDocsTotalAmount.toFixed(2)}</strong></span>
            </div>

            <div className="space-y-3">
              {filteredDocuments.length === 0 ? (
                <p className="text-gray-500 text-center text-sm py-6">找不到符合條件的單據記錄</p>
              ) : (
                filteredDocuments.map(doc => (
                  <div key={doc.id} className="bg-gray-50 p-3 rounded-lg border flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800">{doc.doc_number}</span>
                          <span className={`text-xs px-2 py-0.5 rounded font-semibold ${doc.type === 'quotation' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                            {doc.type === 'quotation' ? '報價單' : '發票'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">客戶：{doc.customers?.name || doc.customers?.company_name || '未知客戶'} | 日期：{doc.issue_date}</p>
                        {doc.issued_by && <p className="text-[11px] text-gray-500">發出人：{doc.issued_by}</p>}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-800">${Number(doc.total_amount).toFixed(2)}</div>
                        <select 
                          value={doc.status} 
                          onChange={(e) => handleUpdateDocStatus(doc.id, e.target.value)}
                          className="mt-1 text-[11px] uppercase bg-white border rounded px-1.5 py-0.5 font-bold text-gray-700 outline-none cursor-pointer"
                        >
                          <option value="draft">草稿 (Draft)</option>
                          <option value="sent">已發送 (Sent)</option>
                          <option value="paid">已付款 (Paid)</option>
                          <option value="accepted">已接受 (Accepted)</option>
                          <option value="cancelled">已取消 (Cancelled)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                      <button 
                        onClick={() => handleStartEditDocument(doc)}
                        className="bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-bold px-3 py-1 rounded"
                      >
                        編輯 ✏️
                      </button>
                      <button 
                        onClick={async () => {
                          const { data: itemsData } = await supabase
                            .from('document_items')
                            .select('*')
                            .eq('document_id', doc.id)
                          
                          setSelectedPrintDoc({
                            documentData: doc,
                            customerData: doc.customers,
                            items: itemsData || []
                          })
                          setView('printPreview')
                        }}
                        className="bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold px-3 py-1 rounded"
                      >
                        列印 PDF 📄
                      </button>
                      <button 
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold px-3 py-1 rounded"
                      >
                        刪除 🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
  )
}
