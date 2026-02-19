import React from 'react'
import { ITJobOrderByStatusChart } from './components/ITJobOrderByStatusChart'
import { ITJobOrderByCategoryChart } from './components/ITJobOrderByCategoryChart'
import { ITJobOrderTable } from './components/ITJobOrderTable'
import type { JobOrder } from '../../hooks/ITHooks/useJobOrderHooks'

export const ITJobOrderSummary = () => {
  const handleView = (record: JobOrder) => {
    // TODO: open view/detail modal
    console.log('View', record)
  }

  const handleEdit = (record: JobOrder) => {
    // TODO: open edit modal
    console.log('Edit', record)
  }

  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Two Pie Charts - side by side, 50% each */}
      <div className="grid grid-cols-2 gap-5">
        <ITJobOrderByStatusChart />
        <ITJobOrderByCategoryChart />
      </div>

      {/* Work Orders Table */}
      <ITJobOrderTable onView={handleView} onEdit={handleEdit} />
    </div>
  )
}