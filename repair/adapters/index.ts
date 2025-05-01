import { API_Fn } from '..'
import openai from './openai'

interface Adapters {
    [key: string]: API_Fn
}

const adapters: Adapters = {
    openai
}

export default adapters
export type { API_Fn }