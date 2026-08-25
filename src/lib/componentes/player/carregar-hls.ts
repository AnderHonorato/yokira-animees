// Arquivo: src/lib/componentes/player/carregar-hls.ts
// hls.js so entra por import dinamico e so quando o navegador nao toca HLS nativo.
// No Safari o suporte e nativo — carregar a biblioteca la seria ~150kB jogados fora.

export function suportaHlsNativo(video: HTMLVideoElement): boolean {
  return video.canPlayType('application/vnd.apple.mpegurl') !== '';
}

export async function anexarPlaylist(
  video: HTMLVideoElement,
  playlist: string
): Promise<() => void> {
  if (suportaHlsNativo(video)) {
    video.src = playlist;
    return () => {
      video.removeAttribute('src');
    };
  }

  const { default: Hls } = await import('hls.js');
  if (!Hls.isSupported()) {
    video.src = playlist;
    return () => video.removeAttribute('src');
  }

  const instancia = new Hls({ maxBufferLength: 30 });
  instancia.loadSource(playlist);
  instancia.attachMedia(video);
  return () => instancia.destroy();
}
