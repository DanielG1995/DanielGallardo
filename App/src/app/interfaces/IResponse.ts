import { Product } from "./IProduct";

export interface Response {
    message: string,
    data: Product[] | Product,
    type: 'success' | 'error'
}

export interface Error {
    error: string
}