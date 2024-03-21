import { CaseReducer, PayloadAction, createSlice } from "@reduxjs/toolkit"
import {
  extractNameOfEra,
  dataPointsGroupByCompanyAndCategory,
  dataPointsGroupByCountryAndCategory,
  cdpToEdp,
} from "data/domain/transformers/EmissionTransformers"
import {
  AlignedIndexes,
  EmissionRangeState,
  EmissionFilterState,
  EmissionDataPoint,
  VisibleData,
  EmissionCategory,
} from "data/domain/types/emissions/EmissionTypes"
import {
  IdTreeNode,
  IndexOf,
} from "data/domain/types/structures/StructuralTypes"
import {
  BusinessEntity,
  GeographicalArea,
} from "data/domain/types/participants/ContributorsTypes"
import { TimeWindow } from "data/domain/types/time/TimeRelatedTypes"
import {
  expandId,
  extractHierarchyOf,
} from "data/domain/transformers/StructuralTransformers"
import { EndpointTimeWindow, IndexesContainer } from "./EndpointTypes"
import { emissionRangesApi } from "./EmissionRangesClient"

const initialFilterState: EmissionFilterState = {
  selectedBusinessEntities: [],
  selectedGeographicalAreas: [],
  selectedCategories: [],
}

const initialState: EmissionRangeState = {
  alignedIndexes: {
    entities: {},
    areas: {},
    categories: {},
    areaHierarchy: [],
    entityHierarchy: [],
    categoryHierarchy: [],
  },
  allPoints: [],
  visibleData: {
    emissionPoints: [],
    emissionsByCompany: {},
    emissionsByCountry: {},
  },
  overallTimeWindow: {
    startTimestamp: 0,
    endTimestamp: 0,
    timeStepInSecondsPattern: [],
  },
  emissionFilterState: { ...initialFilterState },
}

const extractAreaHierarchy = (areas: IndexOf<GeographicalArea>): IdTreeNode[] =>
  extractHierarchyOf(
    areas,
    (area) => area.id,
    (area) => area.parent,
  )

const extractEntityHierarchy = (
  entities: IndexOf<BusinessEntity>,
): IdTreeNode[] =>
  extractHierarchyOf(
    entities,
    (entity) => entity.id,
    (entity) => entity.parent,
  )

const extractCategoryHierarchy = (
  categories: IndexOf<EmissionCategory>,
): IdTreeNode[] =>
  extractHierarchyOf(
    categories,
    (category) => category.id,
    (category) => category.parent,
  )

const alignIndexes = (originalIndexes: IndexesContainer): AlignedIndexes => {
  const alignedBusinessEntities = Object.fromEntries(
    originalIndexes.entity.map((company) => [company.id, company]),
  )
  const alignedAreas = Object.fromEntries(
    originalIndexes.area.map((area) => [area.id, area]),
  )

  const alignedCategories = Object.fromEntries(
    originalIndexes.category
      .map((origCategory) => ({
        ...origCategory,
        era: extractNameOfEra(origCategory.era),
      }))
      .map((category) => [category.id, category]),
  )

  const areasTree = extractAreaHierarchy(alignedAreas)
  const entityTree = extractEntityHierarchy(alignedBusinessEntities)
  const categoryTree = extractCategoryHierarchy(alignedCategories)

  return {
    entities: alignedBusinessEntities,
    areas: alignedAreas,
    categories: alignedCategories,
    areaHierarchy: areasTree,
    entityHierarchy: entityTree,
    categoryHierarchy: categoryTree,
  }
}

/*
const extractFilters = (indexes: AlignedIndexes): GlobalFilterState => {
  const categories = new Set<string>()
  const companies = new Set<string>()
  const countries = new Set<string>()

  Object.values(indexes.categories)
    .filter((category) => category.era)
    .forEach((category) => categories.add(category.era!!))
  Object.values(indexes.entities)
    .filter((entity) => entity.type === "Company")
    .forEach((entity) => companies.add(entity.name))
  Object.values(indexes.areas)
    .filter((area) => area.type === "Country")
    .forEach((area) => countries.add(area.name))

  return {
    availableValues: {
      categories: Array.from(categories)
        .map((era) => extractNameOfEra(era))
        .filter((category) => category !== "")
        .sort(),
      companies: Array.from(companies).sort(),
      countries: Array.from(countries).sort(),
      timeRange: { from: 0, to: 0 },
    },
    selectedValues: {
      categories: [],
      companies: [],
      countries: [],
      timeRange: { from: 0, to: 0 },
    },
  }
}
*/

function filterRoutine<T>(currentValue: T, filterSelectedValues: T[]): boolean {
  return (
    filterSelectedValues.length === 0 ||
    filterSelectedValues.includes(currentValue)
  )
}

const extractVisibleData = (
  dataPoints: EmissionDataPoint[],
  indexes: AlignedIndexes,
  filter: EmissionFilterState,
): VisibleData => {
  let filteredDataPoints = dataPoints
  if (filter.selectedCategories.length > 0) {
    filteredDataPoints = filteredDataPoints.filter((dataPoint) => {
      const era = dataPoint.categoryEraName
      return filterRoutine(
        era.toLowerCase(),
        filter.selectedCategories.map((category) => category.toLowerCase()),
      )
    })
  }
  if (filter.selectedBusinessEntities.length > 0) {
    const expandedEntityIds = expandId(
      filter.selectedBusinessEntities,
      indexes.entityHierarchy,
    )
    console.log("Expanded entity ids: ", expandedEntityIds)

    filteredDataPoints = filteredDataPoints.filter((dataPoint) =>
      filterRoutine(dataPoint.entityId, expandedEntityIds),
    )
  }

  if (filter.selectedGeographicalAreas.length > 0) {
    const expandedGeoAreaIds = expandId(
      filter.selectedGeographicalAreas,
      indexes.areaHierarchy,
    )
    console.log("Geo area ids: ", expandedGeoAreaIds)

    filteredDataPoints = filteredDataPoints.filter((dataPoint) =>
      filterRoutine(dataPoint.geoAreaId, expandedGeoAreaIds),
    )
  }

  return {
    emissionPoints: [...filteredDataPoints],
    emissionsByCompany: dataPointsGroupByCompanyAndCategory(filteredDataPoints),
    emissionsByCountry: dataPointsGroupByCountryAndCategory(filteredDataPoints),
  }
}

const extractTimeWindow = (endpointTW: EndpointTimeWindow): TimeWindow => ({
  startTimestamp: new Date(endpointTW.start).getTime(),
  endTimestamp: new Date(endpointTW.end).getTime(),
  timeStepInSecondsPattern:
    typeof endpointTW.step === "number" ? [endpointTW.step] : endpointTW.step,
})

const setSelectedBusinessEntitiesReducer: CaseReducer<
  EmissionRangeState,
  PayloadAction<number[]>
> = (state, action) => {
  state.emissionFilterState = {
    ...state.emissionFilterState,
    selectedBusinessEntities: action.payload,
  }
  const newVisibleData = extractVisibleData(
    state.allPoints,
    state.alignedIndexes,
    state.emissionFilterState,
  )
  state.visibleData = { ...newVisibleData }
}

const setSelectedGeoAreasReducer: CaseReducer<
  EmissionRangeState,
  PayloadAction<number[]>
> = (state, action) => {
  state.emissionFilterState = {
    ...state.emissionFilterState,
    selectedGeographicalAreas: action.payload,
  }
  const newVisibleData = extractVisibleData(
    state.allPoints,
    state.alignedIndexes,
    state.emissionFilterState,
  )
  state.visibleData = { ...newVisibleData }
}

const setSelectedCategoriesReducer: CaseReducer<
  EmissionRangeState,
  PayloadAction<string[]>
> = (state, action) => {
  state.emissionFilterState = {
    ...state.emissionFilterState,
    selectedCategories: action.payload,
  }
  const newVisibleData = extractVisibleData(
    state.allPoints,
    state.alignedIndexes,
    state.emissionFilterState,
  )
  state.visibleData = { ...newVisibleData }
}

const setNewFilterReducer: CaseReducer<
  EmissionRangeState,
  PayloadAction<EmissionFilterState>
> = (state, action) => {
  state.emissionFilterState = { ...action.payload }
  const newVisibleData = extractVisibleData(
    state.allPoints,
    state.alignedIndexes,
    state.emissionFilterState,
  )
  state.visibleData = { ...newVisibleData }
}

const clearFilterSelectionsReducer: CaseReducer<
  EmissionRangeState,
  PayloadAction
> = (state) => {
  state.emissionFilterState = { ...initialFilterState }
  const newVisibleData = extractVisibleData(
    state.allPoints,
    state.alignedIndexes,
    state.emissionFilterState,
  )
  state.visibleData = { ...newVisibleData }
}

export const emissionsRangeSlice = createSlice({
  name: "emissionRanges",
  initialState,
  reducers: {
    selectBusinessEntities: setSelectedBusinessEntitiesReducer,
    selectGeoAreas: setSelectedGeoAreasReducer,
    selectCategories: setSelectedCategoriesReducer,
    updateFilterSelection: setNewFilterReducer,
    clearFilterSelection: clearFilterSelectionsReducer,
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      emissionRangesApi.endpoints.getEmissionRanges.matchFulfilled,
      (state, action) => {
        const alignedIndexes = alignIndexes(action.payload.indexes)
        const timeWindow = extractTimeWindow(action.payload.time_range)
        const allPoints = action.payload.data.map((cdp) =>
          cdpToEdp(cdp, alignedIndexes, timeWindow),
        )
        // const availableFilters = extractFilters(alignedIndexes)
        const visibleData = extractVisibleData(
          allPoints,
          alignedIndexes,
          state.emissionFilterState,
        )

        state.alignedIndexes = alignedIndexes
        state.allPoints = allPoints
        state.visibleData = visibleData
        state.overallTimeWindow = timeWindow
        // state.emissionFilterState = availableFilters
      },
    )
  },
})

export const {
  selectBusinessEntities,
  selectGeoAreas,
  selectCategories,
  updateFilterSelection,
  clearFilterSelection,
} = emissionsRangeSlice.actions
export default emissionsRangeSlice.reducer
