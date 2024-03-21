import { Box, Button, Grid, Typography } from "@mui/material"
import MainCard from "components/MainCard"
import { ArrowLeftOutlined, RightOutlined } from "@ant-design/icons"

import { useLocation, useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import { selectAlignedIndexes } from "data/store/api/EmissionSelectors"
import { EmissionCategory } from "data/domain/types/emissions/EmissionTypes"
import {
  IdTreeNode,
  IndexOf,
} from "data/domain/types/structures/StructuralTypes"
import { ScopeTable } from "../../../components/natixarComponents/ScopeTable"
import Breadcrumb from "../../../components/@extended/Breadcrumbs"
import { AreaCheckbox } from "../../../components/natixarComponents/AreaCheckbox"

// table data
const createData = (title: string, value: number, emissionID: string) => ({
  title,
  value,
  emissionID,
})

const rows = [
  createData("Processing of Sold Production", 7000, "1"),
  createData("Investment", 3000, "2"),
  createData("Transportation and destribution", 11000, "3"),
  createData("Processing of Sold Production", 2000, "4"),
  createData("Investment", 9000, "5"),
  createData("Processing of Sold Production", 8000, "6"),
]

const findNodeByName = (
  name: string,
  categories: IndexOf<EmissionCategory>,
  hierarchy: IdTreeNode[],
): IdTreeNode | undefined => {
  if (hierarchy.length === 0) {
    return undefined
  }
  const onCurrentLevel = hierarchy.find(
    (node) => categories[node.value].name.toLowerCase() === name.toLowerCase(),
  )

  if (typeof onCurrentLevel !== "undefined") {
    return onCurrentLevel
  }

  let onLevelBelow: IdTreeNode | undefined
  if (!onCurrentLevel) {
    for (let i = 0; !onLevelBelow && i < hierarchy.length; i += 1) {
      onLevelBelow = findNodeByName(name, categories, hierarchy[i].children)
    }
  }

  return onLevelBelow
}

const ScopePage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const scopeID = params.get("scopeID")

  const { categories, categoryHierarchy } = useSelector(selectAlignedIndexes)
  const ghgNode = findNodeByName("GHG Protocol", categories, categoryHierarchy)

  const eraNode = scopeID
    ? findEraNode(scopeID.toLowerCase(), categories, categoryHierarchy)
    : undefined
  const eraData = eraNode ? categories[eraNode?.value] : undefined

  console.log("Scope ID is: ", scopeID)
  console.log("Found this era: ", eraData)

  const links = [
    {
      title: "Scopes",
      to: "/contributor/dashboard",
    },
    {
      title: `Scope ${scopeID} emissions`,
      to: "",
    },
  ]

  const eraText = JSON.stringify(eraData)

  return (
    <MainCard>
      <Grid container rowSpacing={4.5} columnSpacing={3}>
        <Grid item xs={12} md={12} xl={12}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            position="relative"
            width="100%"
            padding="10px 0px"
          >
            <Button
              variant="contained"
              sx={{ color: "#FFF", position: "absolute", left: 0, top: 0 }}
              startIcon={<ArrowLeftOutlined color="#FFF" />}
              onClick={() => navigate("/contributor/dashboard")}
            >
              Back to scopes
            </Button>
            <Breadcrumb
              custom
              title={false}
              links={links}
              separator={RightOutlined}
              sx={{
                mb: "0px !important",
              }}
            />
          </Box>
        </Grid>
        <Grid item xs={12} md={12} xl={12}>
          <Typography variant="h5">Scope Emissions bar</Typography>
          <Typography>{eraText}</Typography>
        </Grid>
        <Grid item xs={12} md={12} xl={12}>
          <ScopeTable data={rows} />
        </Grid>
      </Grid>
    </MainCard>
  )
}

export default ScopePage
