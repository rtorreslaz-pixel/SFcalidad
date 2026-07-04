// Limitador de intentos en memoria (ventana deslizante). Suficiente para una sola
// instancia (Railway). Si en el futuro se escala horizontalmente en AWS, migrar a un
// store compartido (ej. Redis) para que el conteo sea global entre instancias.

type Entry = { count: number; firstAt: number };
const fails = new Map<string, Entry>();

// ¿La clave ya superó el máximo dentro de la ventana?
export function checkLimit(key: string, max: number, windowMs: number): { limited: boolean; retryAfterSec: number } {
  const e = fails.get(key);
  if (!e) return { limited: false, retryAfterSec: 0 };
  if (Date.now() - e.firstAt > windowMs) {
    fails.delete(key);
    return { limited: false, retryAfterSec: 0 };
  }
  if (e.count >= max) {
    return { limited: true, retryAfterSec: Math.max(1, Math.ceil((e.firstAt + windowMs - Date.now()) / 1000)) };
  }
  return { limited: false, retryAfterSec: 0 };
}

// Registra un intento fallido.
export function registerFailure(key: string, windowMs: number): void {
  const e = fails.get(key);
  if (!e || Date.now() - e.firstAt > windowMs) {
    fails.set(key, { count: 1, firstAt: Date.now() });
  } else {
    e.count++;
  }
  // Limpieza ocasional para que el Map no crezca indefinidamente.
  if (fails.size > 5000) {
    const now = Date.now();
    for (const [k, v] of fails) if (now - v.firstAt > windowMs) fails.delete(k);
  }
}

// Limpia el conteo (tras un login exitoso).
export function clearFailures(...keys: string[]): void {
  for (const k of keys) fails.delete(k);
}
