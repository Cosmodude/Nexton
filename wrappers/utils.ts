import { Cell } from "@ton/ton";

export type MsgWithMode = {
    msg: Cell
    mode: number
}