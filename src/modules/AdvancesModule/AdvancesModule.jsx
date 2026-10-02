import React from 'react'
import { accountMethodOptions } from '../../constants'

export default function AdvancesModule({
  employees,
  activeEmployees,
  advanceDetails,
  isEmployeesExpanded,
  setIsEmployeesExpanded,
  isAdvanceHistoryExpanded,
  setIsAdvanceHistoryExpanded,
  newEmpName,
  setNewEmpName,
  newEmpRole,
  setNewEmpRole,
  handleAddEmployee,
  editingEmpId,
  editingEmpForm,
  setEditingEmpForm,
  handleStartEditEmployee,
  handleSaveEditEmployee,
  setEditingEmpId,
  handleMarkResigned,
  handleDeleteEmployee,
  handleRestoreEmployee,
  selectedEmpIdForAdvance,
  setSelectedEmpIdForAdvance,
  advanceDate,
  setAdvanceDate,
  advanceAmt,
  setAdvanceAmt,
  advanceMethod,
  setAdvanceMethod,
  advanceRemark,
  setAdvanceRemark,
  handleAddAdvanceTransaction,
  editingAdvanceTxId,
  editingAdvanceTxForm,
  setEditingAdvanceTxForm,
  handleStartEditAdvanceTx,
  handleSaveEditAdvanceTx,
  setEditingAdvanceTxId,
  handleDeleteAdvanceTransaction,
  setView
}) {
  return (
          <>
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-xl font-bold text-gray-800">人事及資金管理</h1>
              <button onClick={() => setView('home')} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-200">
                ← 返回主畫面
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="bg-gray-50 p-3 rounded-lg border mb-4 space-y-2">
              <h2 className="text-xs font-bold text-gray-800">新增員工檔案</h2>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-600 mb-0.5">員工姓名 *</label>
                  <input type="text" value={newEmpName} onChange={(e) => setNewEmpName(e.target.value)} className="w-full border rounded p-1.5 text-xs outline-none bg-white" placeholder="姓名" required />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-600 mb-0.5">崗位 / 職位</label>
                  <input type="text" value={newEmpRole} onChange={(e) => setNewEmpRole(e.target.value)} className="w-full border rounded p-1.5 text-xs outline-none bg-white" placeholder="如：攝影師、助理" />
                </div>
              </div>
              <button type="submit" className="w-full bg-gray-800 hover:bg-gray-900 text-white text-xs py-1.5 rounded font-bold shadow">新增員工</button>
            </form>

            <form onSubmit={handleAddAdvanceTransaction} className="bg-indigo-50 p-3 rounded-lg border border-indigo-200 mb-6 space-y-2.5">
              <h2 className="text-xs font-bold text-indigo-900">新增預支資金記錄</h2>
              <div className="grid grid-cols-2 gap-2 items-center">
                <div>
                  <label className="block text-[10px] text-gray-600 mb-0.5">選擇員工</label>
                  <select value={selectedEmpIdForAdvance} onChange={(e) => setSelectedEmpIdForAdvance(e.target.value)} className="w-full border rounded p-1.5 text-xs bg-white outline-none">
                    <option value="">請選擇員工</option>
                    {employees.map(emp => (<option key={emp.id} value={emp.id}>{emp.employee_name} {emp.role ? `[${emp.role}]` : ''} ({emp.status === 'active' ? '正常' : '已離職/停用'})</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-600 mb-0.5">日期</label>
                  <input 
                    type="date" 
                    value={advanceDate} 
                    onChange={(e) => setAdvanceDate(e.target.value)} 
                    className="w-full max-w-[110px] box-border min-w-0 block border rounded p-1.5 text-xs outline-none bg-white [color-scheme:light]" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-600 mb-0.5">預支金額 (HKD)</label>
                  <input type="number" value={advanceAmt} onChange={(e) => setAdvanceAmt(e.target.value)} className="w-full border rounded p-1.5 text-xs outline-none bg-white" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-600 mb-0.5">預支方式</label>
                  <select value={advanceMethod} onChange={(e) => setAdvanceMethod(e.target.value)} className="w-full border rounded p-1.5 text-xs bg-white outline-none text-gray-700">
                    {accountMethodOptions.map(m => (<option key={m} value={m}>{m}</option>))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-600 mb-0.5">備註</label>
                <input type="text" value={advanceRemark} onChange={(e) => setAdvanceRemark(e.target.value)} className="w-full border rounded p-1.5 text-xs outline-none bg-white" placeholder="備註說明（選填）" />
              </div>

              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-2 rounded font-bold shadow">記錄預支資金</button>
            </form>

            <div className="mb-4 border rounded-lg bg-white overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => setIsEmployeesExpanded(!isEmployeesExpanded)}
                className="w-full flex justify-between items-center px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left border-b font-bold text-gray-800 text-xs"
              >
                <span>👥 員工狀態與預支餘額 ({employees.length} 位)</span>
                <span className="text-gray-500 text-[11px] font-semibold">{isEmployeesExpanded ? '▲ 收起' : '▼ 展開'}</span>
              </button>

              {isEmployeesExpanded && (
                <div className="p-2.5 space-y-2">
                  {employees.length === 0 ? (
                    <p className="text-gray-500 text-center text-xs py-2">尚無員工檔案</p>
                  ) : (
                    employees.map(emp => {
                      const isEditingThisEmp = editingEmpId === emp.id

                      return (
                        <div key={emp.id} className="bg-gray-50 p-2.5 rounded border text-xs">
                          {isEditingThisEmp ? (
                            <div className="space-y-2 bg-white p-2 rounded border border-amber-300">
                              <p className="font-bold text-amber-800 text-[11px]">✏️ 編輯員工檔案</p>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] text-gray-500 mb-0.5">員工姓名</label>
                                  <input 
                                    type="text" 
                                    value={editingEmpForm.employee_name} 
                                    onChange={(e) => setEditingEmpForm({ ...editingEmpForm, employee_name: e.target.value })}
                                    className="w-full border rounded p-1 text-xs outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-gray-500 mb-0.5">崗位 / 職位</label>
                                  <input 
                                    type="text" 
                                    value={editingEmpForm.role} 
                                    onChange={(e) => setEditingEmpForm({ ...editingEmpForm, role: e.target.value })}
                                    placeholder="如：攝影師、助理"
                                    className="w-full border rounded p-1 text-xs outline-none"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-1 justify-end pt-1">
                                <button onClick={() => handleSaveEditEmployee(emp.id)} className="bg-green-600 text-white px-2.5 py-1 rounded font-bold">儲存</button>
                                <button onClick={() => setEditingEmpId(null)} className="bg-gray-200 text-gray-700 px-2.5 py-1 rounded font-semibold">取消</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-gray-800 text-sm">{emp.employee_name}</span>
                                  {emp.role && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                      {emp.role}
                                    </span>
                                  )}
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {emp.status === 'active' ? '正常' : '已離職/停用'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-600">累計預支：${emp.initial_amount.toFixed(2)}</p>
                                <p className="text-[11px] text-gray-600">剩餘餘額：<strong className="text-indigo-600">${emp.balance.toFixed(2)}</strong></p>
                              </div>

                              <div className="flex gap-1 items-center pt-0.5">
                                <button onClick={() => handleStartEditEmployee(emp)} className="bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-semibold px-2 py-1 rounded">編輯 ✏️</button>
                                {emp.status === 'active' ? (
                                  <>
                                    <button onClick={() => handleMarkResigned(emp)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-semibold px-2 py-1 rounded">設為離職</button>
                                    <button onClick={() => handleDeleteEmployee(emp)} className="bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-semibold px-2 py-1 rounded">刪除</button>
                                  </>
                                ) : (
                                  <button onClick={() => handleRestoreEmployee(emp)} className="bg-green-50 hover:bg-green-100 text-green-600 text-[11px] font-semibold px-2 py-1 rounded">恢復正常</button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>

            <div className="mb-4 border rounded-lg bg-white overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => setIsAdvanceHistoryExpanded(!isAdvanceHistoryExpanded)}
                className="w-full flex justify-between items-center px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left border-b font-bold text-gray-800 text-xs"
              >
                <span>📜 預支資金歷史明細記錄 ({advanceDetails.length} 筆)</span>
                <span className="text-gray-500 text-[11px] font-semibold">{isAdvanceHistoryExpanded ? '▲ 收起' : '▼ 展開'}</span>
              </button>

              {isAdvanceHistoryExpanded && (
                <div className="p-2.5 space-y-2">
                  {advanceDetails.length === 0 ? (
                    <p className="text-gray-500 text-center text-xs py-2">尚無預支明細</p>
                  ) : (
                    advanceDetails.map(det => {
                      const emp = employees.find(e => e.id === det.employee_id)
                      const isEditingThisTx = editingAdvanceTxId === det.id

                      return (
                        <div key={det.id} className="bg-gray-50 p-2.5 rounded border text-xs">
                          {isEditingThisTx ? (
                            <div className="space-y-2 bg-white p-2 rounded border border-indigo-300">
                              <p className="font-bold text-indigo-900 text-[11px]">✏️ 編輯預支明細記錄</p>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] text-gray-500 mb-0.5">員工</label>
                                  <select 
                                    value={editingAdvanceTxForm.employee_id} 
                                    onChange={(e) => setEditingAdvanceTxForm({ ...editingAdvanceTxForm, employee_id: e.target.value })}
                                    className="w-full border rounded p-1 text-xs bg-white outline-none"
                                  >
                                    {employees.map(e => (
                                      <option key={e.id} value={e.id}>{e.employee_name} {e.role ? `[${e.role}]` : ''}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] text-gray-500 mb-0.5">日期</label>
                                  <input 
                                    type="date" 
                                    value={editingAdvanceTxForm.date} 
                                    onChange={(e) => setEditingAdvanceTxForm({ ...editingAdvanceTxForm, date: e.target.value })}
                                    className="w-full max-w-[110px] box-border min-w-0 block border rounded p-1 text-xs outline-none bg-white [color-scheme:light]"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] text-gray-500 mb-0.5">預支金額 (HKD)</label>
                                  <input 
                                    type="number" 
                                    value={editingAdvanceTxForm.amount} 
                                    onChange={(e) => setEditingAdvanceTxForm({ ...editingAdvanceTxForm, amount: e.target.value })}
                                    className="w-full border rounded p-1 text-xs outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-gray-500 mb-0.5">方式</label>
                                  <select 
                                    value={editingAdvanceTxForm.method} 
                                    onChange={(e) => setEditingAdvanceTxForm({ ...editingAdvanceTxForm, method: e.target.value })}
                                    className="w-full border rounded p-1 text-xs bg-white outline-none"
                                  >
                                    {accountMethodOptions.map(m => (<option key={m} value={m}>{m}</option>))}
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className="block text-[10px] text-gray-500 mb-0.5">備註</label>
                                <input 
                                  type="text" 
                                  value={editingAdvanceTxForm.remark} 
                                  onChange={(e) => setEditingAdvanceTxForm({ ...editingAdvanceTxForm, remark: e.target.value })}
                                  className="w-full border rounded p-1 text-xs outline-none"
                                  placeholder="備註說明（選填）"
                                />
                              </div>

                              <div className="flex gap-1 justify-end pt-1">
                                <button onClick={() => handleSaveEditAdvanceTx(det.id)} className="bg-indigo-600 text-white px-2.5 py-1 rounded font-bold">儲存</button>
                                <button onClick={() => setEditingAdvanceTxId(null)} className="bg-gray-200 text-gray-700 px-2.5 py-1 rounded font-semibold">取消</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-semibold text-gray-800">
                                  {emp ? emp.employee_name : '未知員工'} {emp?.role ? `(${emp.role})` : ''} - <span className="text-indigo-600 font-bold">${det.amount.toFixed(2)}</span> ({det.method})
                                </p>
                                <p className="text-[10px] text-gray-500">{det.date} {det.remark ? `| 備註：${det.remark}` : ''}</p>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => handleStartEditAdvanceTx(det)} className="text-amber-700 hover:text-amber-800 text-[11px] font-semibold bg-amber-50 px-2 py-1 rounded">編輯 ✏️</button>
                                <button onClick={() => handleDeleteAdvanceTransaction(det)} className="text-red-500 hover:text-red-700 text-[11px] font-semibold bg-red-50 px-2 py-1 rounded">刪除 🗑️</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          </>
  )
}
