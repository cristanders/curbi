import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Avisa a todas las páginas cuando cualquier dato cambia (movimientos, tarjetas,
 * ahorros, transacciones). Así una pantalla abierta se actualiza al instante,
 * sin necesidad de recargar la página.
 */
@Injectable({ providedIn: 'root' })
export class RefreshBusService {
  private readonly emitter = new Subject<void>();
  readonly changes$ = this.emitter.asObservable();

  emit(): void {
    this.emitter.next();
  }
}