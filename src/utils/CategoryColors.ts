export const COLOR_OPERATION = "#8474E9"
export const COLOR_UPSTREAM = "#FFA06A"
export const COLOR_DOWNSTREAM = "#80D977"
export const COLOR_CLUSTER = "#515F66"
export const COLOR_DEFAULT = "#3f50b5"

export const getColorByCategory = (category: string): string => {
  if (!category) {
    return COLOR_DEFAULT
  }
  let result: string
  switch (category.toLowerCase()) {
    case "operation":
      result = COLOR_OPERATION
      break
    case "upstream":
      result = COLOR_UPSTREAM
      break
    case "downstream":
      result = COLOR_DOWNSTREAM
      break
    case "cluster":
      result = COLOR_CLUSTER
      break
    default:
      result = COLOR_DEFAULT
      break
  }
  return result
}

export const getOpaqueColorByCategory = (category: string): string =>
  `${getColorByCategory(category)}BB`
