// material-ui
import { Grid, Typography } from "@mui/material"

// project import
import MainCard from "components/MainCard"

import {
  selectAlignedIndexes as indexSelector,
  selectVisiblePoints as emissionsSelector,
  selectTimeWindow,
} from "data/store/api/EmissionSelectors"
import { useSelector } from "react-redux"
import TotalEmissionByTimeSection from "sections/charts/emissions/TotalEmissionByTimeSection"
import EmissionByTimeCompareToPreviousSection from "sections/charts/emissions/EmissionByTimeCompareToPreviousSection"
import {
  getTimeOffsetForSlot,
  timestampToDay,
  timestampToHour,
  timestampToMonth,
  timestampToQuarter,
  timestampToYear,
} from "data/domain/transformers/TimeTransformers"
import _ from "lodash"
import { useState } from "react"
import EmissionByCategorySection from "../../components/natixarComponents/CO2DonutSection/EmissionByCategorySection"

// ==============================|| WIDGET - CHARTS ||============================== //

const detailUnitLayout: Record<string, (time: number) => string> = {
  Hour: timestampToHour,
  Day: timestampToDay,
  Month: timestampToMonth,
  Quarter: timestampToQuarter,
  Year: timestampToYear,
}

const NatixarChart = () => {
  // const [areaSlot, setAreaSlot] = useState("month")
  // const [acquisitionSlot, setAcquisitionSlot] = useState("month")
  // const [compare, setCompare] = useState(false)
  const [totalUnit, setTotalUnit] = useState("Month")
  const [comparisonUnit, setComparisonUnit] = useState("Month")

  const alignedIndexes = useSelector(indexSelector)
  const allPoints = useSelector(emissionsSelector)
  const timeWindow = useSelector(selectTimeWindow)

  let minTime =
    _.minBy(allPoints, (point) => point.startTimeSlot)?.startTimeSlot ?? 0
  minTime =
    timeWindow.startTimestamp + getTimeOffsetForSlot(minTime, timeWindow)
  let maxTime =
    _.maxBy(allPoints, (point) => point.endTimeSlot)?.endTimeSlot ?? 0
  maxTime =
    timeWindow.startTimestamp + getTimeOffsetForSlot(maxTime, timeWindow)

  const minDate = new Date(minTime)
  const maxDate = new Date(maxTime)

  return (
    <Grid container rowSpacing={4.5} columnSpacing={3}>
      <Grid item xs={12} md={12} xl={12}>
        <MainCard>
          <Typography variant="h5" sx={{ marginBottom: "15px" }}>
            Scope Emissions
          </Typography>
          <EmissionByCategorySection
            allDataPoints={allPoints}
            alignedIndexes={alignedIndexes}
          />
        </MainCard>
      </Grid>
      <Grid item xs={12} md={12} lg={12}>
        <TotalEmissionByTimeSection
          emissionPoints={allPoints}
          unitLayout={detailUnitLayout}
          startDate={minDate}
          endDate={maxDate}
          timeDetailUnit={totalUnit}
          setTimeDetailUnit={setTotalUnit}
        />
      </Grid>
      <Grid item xs={12} md={12} lg={12}>
        <EmissionByTimeCompareToPreviousSection
          emissionPoints={allPoints}
          unitLayout={detailUnitLayout}
          startDate={minDate}
          endDate={maxDate}
          timeDetailUnit={comparisonUnit}
          setTimeDetailUnit={setComparisonUnit}
        />
      </Grid>
    </Grid>
  )
}

export default NatixarChart
