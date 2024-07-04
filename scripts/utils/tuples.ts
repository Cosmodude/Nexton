import {  TupleItemSlice, TupleItemInt, Cell } from '@ton/core';

export function getTupleItemSlice(cell: Cell): TupleItemSlice{
    const item: TupleItemSlice = {
        type: "slice",
        cell: cell
    }
    return item;
}

export function getTupleItemInt(value: bigint): TupleItemInt{
    const item: TupleItemInt = {
        type: "int",
        value: value
    }
    return item;
}