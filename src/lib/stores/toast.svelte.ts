export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
	id: string;
	message: string;
	type: ToastType;
}

let toasts = $state<Toast[]>([]);

export function getToasts(): Toast[] {
	return toasts;
}

export function addToast(message: string, type: ToastType = 'info', duration = 5000) {
	const id = crypto.randomUUID();
	toasts = [...toasts, { id, message, type }];

	if (duration > 0) {
		setTimeout(() => removeToast(id), duration);
	}
}

export function removeToast(id: string) {
	toasts = toasts.filter((t) => t.id !== id);
}
