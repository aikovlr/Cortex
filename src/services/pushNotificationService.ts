// =========================================================================
// Cortex — Serviço de Notificações Push para Navegador
// =========================================================================

export interface ShowPushNotificationOptions {
  title: string;
  body: string;
  link?: string;
  tag?: string;
  icon?: string;
  playSound?: boolean;
}

export type PushPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export interface TestPushResult {
  success: boolean;
  status: PushPermissionStatus;
  message?: string;
}

/**
 * Emite um som suave de alerta usando a Web Audio API nativa
 */
export function playNotificationSound() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Acorde agradável em dois tons (Mi e Lá)
    osc.frequency.setValueAtTime(659.25, now); // E5
    osc.frequency.setValueAtTime(880, now + 0.1); // A5

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.38);
  } catch (err) {
    console.debug('[Cortex Push] Som de notificação indisponível:', err);
  }
}

/**
 * Verifica se a API de Notificações é suportada pelo navegador atual
 */
export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window;
}

/**
 * Retorna o status atual da permissão de notificação no navegador
 */
export function getNotificationPermission(): PushPermissionStatus {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Registra o Service Worker do Cortex (/sw.js) de forma segura
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    return registration;
  } catch (err) {
    console.warn('[Cortex Push] Registro de /sw.js:', err);
    return null;
  }
}

/**
 * Obtém a registration do Service Worker após estar ativa e pronta
 */
async function getReadyServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    await registerServiceWorker();
    const readyPromise = navigator.serviceWorker.ready;
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1200));
    return await Promise.race([readyPromise, timeoutPromise]);
  } catch {
    return null;
  }
}

/**
 * Solicita permissão ao usuário para emitir notificações push
 */
export async function requestNotificationPermission(): Promise<PushPermissionStatus> {
  if (!isPushSupported()) return 'unsupported';

  try {
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      await registerServiceWorker();
    }
    return result;
  } catch {
    return Notification.permission;
  }
}

/**
 * Dispara uma notificação nativa do navegador (API Notification / Service Worker)
 */
export async function showPushNotification(
  options: ShowPushNotificationOptions
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const title = options.title || 'Cortex';
  const body = options.body || '';
  const link = options.link || '/minhas-tarefas';
  const icon = options.icon || '/logo.png';
  const tag = options.tag || `cortex-${Date.now()}`;

  // Se a permissão não foi concedida pelo navegador, não há como emitir notificação nativa
  if (!isPushSupported() || Notification.permission !== 'granted') {
    return false;
  }

  // Toca o som suave opcional
  if (options.playSound !== false) {
    playNotificationSound();
  }

  let shown = false;

  // 4. Tenta exibir pelo Service Worker ativo
  try {
    const reg = await getReadyServiceWorker();
    if (reg && 'showNotification' in reg) {
      await reg.showNotification(title, {
        body,
        icon,
        badge: '/favicon.ico',
        tag,
        data: {
          link,
          dateOfArrival: Date.now(),
        },
      });
      shown = true;
    }
  } catch (err) {
    console.warn('[Cortex Push] SW showNotification falhou:', err);
  }

  // 5. Fallback direto usando new Notification de janela
  if (!shown) {
    try {
      const notif = new Notification(title, {
        body,
        icon,
        tag,
        data: { link },
      });

      notif.onclick = (event) => {
        event.preventDefault();
        window.focus();
        if (link && window.location.pathname !== link) {
          window.location.href = link;
        }
        notif.close();
      };

      shown = true;
    } catch (err) {
      console.warn('[Cortex Push] Window Notification falhou:', err);
    }
  }

  return shown;
}

/**
 * Dispara uma notificação de teste para validar o funcionamento do canal Push
 */
export async function testPushNotification(): Promise<TestPushResult> {
  if (!isPushSupported()) {
    return {
      success: false,
      status: 'unsupported',
      message: 'Seu navegador atual não suporta a API de Notificações Push.',
    };
  }

  let perm = getNotificationPermission();

  // Se a permissão ainda for padrão, solicita ao usuário
  if (perm === 'default') {
    perm = await requestNotificationPermission();
  }

  if (perm === 'denied') {
    return {
      success: false,
      status: 'denied',
      message:
        'As notificações estão bloqueadas no seu navegador. Clique no ícone de cadeado na barra de endereços (ao lado do link) para autorizar notificações.',
    };
  }

  if (perm !== 'granted') {
    return {
      success: false,
      status: perm,
      message: 'A permissão de notificações não foi concedida pelo navegador.',
    };
  }

  const shown = await showPushNotification({
    title: '🔔 Cortex — Notificação do Navegador',
    body: 'As notificações push estão ativas e funcionando diretamente no seu navegador!',
    link: '/configuracoes?aba=notificacoes',
    tag: 'cortex-push-test',
    playSound: false,
  });

  return {
    success: shown,
    status: 'granted',
    message: shown
      ? 'Notificação nativa enviada ao seu navegador com sucesso!'
      : 'A notificação foi emitida pelo navegador. Se não visualizou o alerta do sistema, verifique se o Chrome tem permissão de notificações no Windows.',
  };
}
