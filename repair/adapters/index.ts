import { RepairFn } from '..'
import openai from './openai'

interface Adapters {
    [key: string]: RepairFn
}

const adapters: Adapters = {
    openai
}

export default adapters
export type { RepairFn }