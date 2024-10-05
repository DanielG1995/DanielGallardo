import { computed, inject, Injectable, signal } from '@angular/core';
import { Product } from '../interfaces/IProduct';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Error, Response } from '../interfaces/IResponse';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { ValidationErrors } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  #products = signal<Product[]>([])
  #allProducts: Product[] = []
  isLoading = signal(true)
  public currentProducts = computed(() => this.#products())
  #http = inject(HttpClient)

  constructor() {
    this.#http.get<Response>(`${environment.apiUrl}bp/products`).subscribe(resp => {
      this.#products.set(resp.data as Product[])
      this.#allProducts = resp.data as Product[]
      setTimeout(() => {
        this.isLoading.set(false);
      }, 2000);
    });

  }


  validateId(id: string): Observable<ValidationErrors | null> {
    return this.#http.get<Response>(`${environment.apiUrl}bp/products/verification/${id}`).pipe(
      catchError(error => {
        return of(error.error);
      }))
  }


  filterProducts = (value: string) => {
    this.#products.set(this.#allProducts.filter(p => p.name.toLowerCase().includes(value.toLowerCase())));
  }

  getProductByid(id: string) {
    return this.#http.get<Response>(`${environment.apiUrl}bp/products/${id}`).pipe(
      map(resp => ({ data: resp, type: 'succes' })),
      catchError(error => {
        return of(this.getError(error));
      }),

    )
  }

  createProduct(product: Product) {
    return this.#http.post<Response>(`${environment.apiUrl}bp/products`, { ...product }).pipe(
      tap((resp: Response) => {
        this.#products.update(prev => ([{ ...resp.data as Product }, ...prev]))
        this.#allProducts.unshift(resp.data as Product)
      }),
      catchError(error => {
        return of(this.getError(error));
      })
    )
  }

  updateProduct(product: Product) {
    const { id, ...rest } = product
    return this.#http.put<Response>(`${environment.apiUrl}bp/products/${id}`, { ...rest }).pipe(
      tap(() => {

        this.#products.update(prev => ([...prev.map(p => p.id === product.id ? product : p)]))
        this.#allProducts = [...this.#allProducts.map(p => p.id === product.id ? product : p)]
      }
      ),
      catchError(error => {
        return of(this.getError(error));
      })
    );
  }

  deleteProduct(id: string) {
    return this.#http.delete<Response>(`${environment.apiUrl}bp/products/${id}`).pipe(
      catchError(error => {
        return of(this.getError(error));
      }),
      tap(() => {
        this.#products.update(prev => ([...prev.filter(p => p.id !== id)]))
        this.#allProducts = this.#allProducts.filter(p => p.id !== id)
      })
    )
  }

  getError(error: Error): Response {
    return { message: error.error, type: 'error', data: [] }
  }

}
