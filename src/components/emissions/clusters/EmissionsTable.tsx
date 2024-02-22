import { FunctionComponent, memo } from 'react';

import { TableVirtuoso, TableComponents } from 'react-virtuoso';
import { EmissionsByClusterProps } from './types';
import { DataPoint } from 'data/store/types/Types';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import React from 'react';
import { formatAmount } from 'utils/formatAmounts';

const tableLayout = {
    "CONTRIBUTOR": "company",
    "DATA SOURCE": "company",
    "EMISSIONS (t of CO2)": (amount: number) => formatAmount(amount),
    "TYPE OF EMISSIONS": "category"
}

const VirtuosoTableComponents: TableComponents<DataPoint> = {
    Scroller: React.forwardRef<HTMLDivElement>((props, ref) => (
        <TableContainer component={Paper} {...props} ref={ref} />
    )),
    Table: (props) => (
        <Table {...props} sx={{ borderCollapse: 'separate', tableLayout: 'fixed' }} />
    ),
    TableHead,
    TableRow: ({ item: _item, ...props }) => <TableRow {...props} />,
    TableBody: React.forwardRef<HTMLTableSectionElement>((props, ref) => (
        <TableBody {...props} ref={ref} />
    )),
};


const fixedHeaderContent = () => (
    <TableRow>
        {Object.keys(tableLayout).map(columnName => <TableCell>{columnName}</TableCell>)}
    </TableRow>
)

function rowContent(_index: number, row: DataPoint) {
    const columns = Object.values(tableLayout)
    return (
        <>
            <TableCell key="company">{row.company}</TableCell>
            <TableCell key="data-source">ERP</TableCell>
            <TableCell key="emission-amount">{formatAmount(row.emission_amount)}</TableCell>
            <TableCell key="category">{row.category}</TableCell>
        </>
    );
}

const EmissionsByClusterTable: FunctionComponent<EmissionsByClusterProps> = ({ cluster }) => (
    <TableVirtuoso
        data={cluster.dataPoints}
        components={VirtuosoTableComponents}
        fixedHeaderContent={fixedHeaderContent}
        itemContent={rowContent}
    />
)

export default memo(EmissionsByClusterTable)