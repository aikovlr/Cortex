'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ConsultaAnexoDTO } from '@/types/api';
import {
  DownloadIcon,
  EyeIcon,
  PlayIcon,
  XIcon,
  FileTextIcon,
  PaperclipIcon,
  SpinnerIcon,
  TrashIcon,
  SearchIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from '@/components/common/Icons/Icons';
import styles from './AttachmentGallery.module.css';

export interface UnifiedAttachmentItem {
  id: string | number;
  nomeOriginal: string;
  urlCaminho: string;
  mimeType?: string;
  tamanhoBytes?: number;
  isLocal?: boolean;
  localIndex?: number;
}

interface AttachmentGalleryProps {
  anexos?: ConsultaAnexoDTO[];
  files?: File[];
  podeRemover?: boolean;
  onRemoverAnexo?: (anexoId: number) => void | Promise<void>;
  onRemoverFile?: (index: number) => void;
  removendoId?: number | null;
}

const formatFileSize = (bytes?: number) => {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const EMPTY_FILES: File[] = [];
const EMPTY_ANEXOS: ConsultaAnexoDTO[] = [];

export const AttachmentGallery: React.FC<AttachmentGalleryProps> = ({
  anexos = EMPTY_ANEXOS,
  files = EMPTY_FILES,
  podeRemover = false,
  onRemoverAnexo,
  onRemoverFile,
  removendoId = null,
}) => {
  const [activeMedia, setActiveMedia] = useState<UnifiedAttachmentItem | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | number | null>(null);
  const isMouseDownOnBackdropRef = useRef(false);

  // Mapeia files para object URLs
  const [fileUrls, setFileUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!files || files.length === 0) {
      setFileUrls((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    const urls = files.map((f) => URL.createObjectURL(f));
    setFileUrls(urls);

    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [files]);

  // Lista unificada
  const items: UnifiedAttachmentItem[] = useMemo(() => {
    const list: UnifiedAttachmentItem[] = [];

    if (anexos && anexos.length > 0) {
      anexos.forEach((a) => {
        list.push({
          id: a.id,
          nomeOriginal: a.nomeOriginal,
          urlCaminho: a.urlCaminho,
          mimeType: a.mimeType,
          isLocal: false,
        });
      });
    }

    if (files && files.length > 0) {
      files.forEach((f, idx) => {
        const generatedUrl = fileUrls[idx] || '';
        list.push({
          id: `local-file-${idx}-${f.name}`,
          nomeOriginal: f.name,
          urlCaminho: generatedUrl,
          mimeType: f.type,
          tamanhoBytes: f.size,
          isLocal: true,
          localIndex: idx,
        });
      });
    }

    return list;
  }, [anexos, files, fileUrls]);

  const getAttachmentUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://')) return url;
    return url.startsWith('/') ? url : `/${url}`;
  };

  const isImage = (item: UnifiedAttachmentItem) => {
    if (item.mimeType?.startsWith('image/')) return true;
    const ext = item.nomeOriginal?.split('.').pop()?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'avif'].includes(ext);
  };

  const isVideo = (item: UnifiedAttachmentItem) => {
    if (item.mimeType?.startsWith('video/')) return true;
    const ext = item.nomeOriginal?.split('.').pop()?.toLowerCase() || '';
    return ['mp4', 'webm', 'ogg', 'mov', 'mkv', 'avi'].includes(ext);
  };

  const isPdf = (item: UnifiedAttachmentItem) => {
    if (item.mimeType === 'application/pdf') return true;
    const ext = item.nomeOriginal?.split('.').pop()?.toLowerCase() || '';
    return ext === 'pdf';
  };

  const isExpandable = (item: UnifiedAttachmentItem) => {
    return isImage(item) || isVideo(item) || isPdf(item);
  };

  const isWord = (item: UnifiedAttachmentItem) => {
    const ext = item.nomeOriginal?.split('.').pop()?.toLowerCase() || '';
    return ['doc', 'docx', 'docm', 'dot', 'dotx'].includes(ext);
  };

  const isExcel = (item: UnifiedAttachmentItem) => {
    const ext = item.nomeOriginal?.split('.').pop()?.toLowerCase() || '';
    return ['xls', 'xlsx', 'xlsm', 'csv'].includes(ext);
  };

  const isPowerPoint = (item: UnifiedAttachmentItem) => {
    const ext = item.nomeOriginal?.split('.').pop()?.toLowerCase() || '';
    return ['ppt', 'pptx', 'pptm', 'pot', 'potx'].includes(ext);
  };

  const isOfficeDocument = (item: UnifiedAttachmentItem) => {
    return isWord(item) || isExcel(item) || isPowerPoint(item);
  };

  const getOfficeViewerUrl = (urlCaminho?: string) => {
    if (!urlCaminho) return '';
    const fileUrl = getAttachmentUrl(urlCaminho);
    const absoluteUrl = fileUrl.startsWith('http')
      ? fileUrl
      : typeof window !== 'undefined'
        ? `${window.location.origin}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5220'}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;

    return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(absoluteUrl)}`;
  };

  const getFileExt = (item: UnifiedAttachmentItem) => {
    const parts = item.nomeOriginal?.split('.');
    if (parts && parts.length > 1) {
      return parts[parts.length - 1].toUpperCase();
    }
    return 'ARQUIVO';
  };

  const handleDownload = async (item: UnifiedAttachmentItem, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const url = getAttachmentUrl(item.urlCaminho);
    if (!url) return;

    if (item.isLocal) {
      const a = document.createElement('a');
      a.href = url;
      a.download = item.nomeOriginal;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    try {
      setDownloadingId(item.id);
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao baixar arquivo');
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = item.nomeOriginal || 'anexo';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback direto via âncora
      const a = document.createElement('a');
      a.href = url;
      a.download = item.nomeOriginal || 'anexo';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCardClick = (item: UnifiedAttachmentItem) => {
    if (isExpandable(item)) {
      setActiveMedia(item);
    } else if (isOfficeDocument(item) && !item.isLocal) {
      window.open(getOfficeViewerUrl(item.urlCaminho), '_blank', 'noopener,noreferrer');
    } else if (item.urlCaminho) {
      window.open(getAttachmentUrl(item.urlCaminho), '_blank', 'noopener,noreferrer');
    }
  };

  const LENS_SIZE = 190;
  const LENS_RADIUS = LENS_SIZE / 2;

  const [isLensActive, setIsLensActive] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(2.5);
  const [isHovering, setIsHovering] = useState(false);
  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0, bgX: 0, bgY: 0 });
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  const zoomLevelRef = useRef(zoomLevel);
  useEffect(() => {
    zoomLevelRef.current = zoomLevel;
  }, [zoomLevel]);

  const isLensActiveRef = useRef(isLensActive);
  useEffect(() => {
    isLensActiveRef.current = isLensActive;
  }, [isLensActive]);

  const imageContainerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Atualiza as dimensões reais renderizadas da imagem para cálculo preciso da lente
  const updateImageDimensions = useCallback(() => {
    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setImageDimensions((prev) => {
          if (Math.round(prev.width) === Math.round(rect.width) && Math.round(prev.height) === Math.round(rect.height)) {
            return prev;
          }
          return { width: rect.width, height: rect.height };
        });
      }
    }
  }, []);

  const handleImageLoad = () => {
    updateImageDimensions();
  };

  const activeMediaId = activeMedia?.id;
  const isCurrentActiveImage = activeMedia ? isImage(activeMedia) : false;

  useEffect(() => {
    if (!activeMediaId || !isCurrentActiveImage) return;

    window.addEventListener('resize', updateImageDimensions);
    const timer = setTimeout(updateImageDimensions, 100);
    return () => {
      window.removeEventListener('resize', updateImageDimensions);
      clearTimeout(timer);
    };
  }, [activeMediaId, isCurrentActiveImage, updateImageDimensions]);

  const lastCursorRef = useRef<{ clientX: number; clientY: number; isTouch: boolean } | null>(null);

  const updateLensCoordinates = useCallback(
    (clientX: number, clientY: number, isTouch = false, overrideZoom?: number) => {
      lastCursorRef.current = { clientX, clientY, isTouch };
      const img = imageRef.current;
      if (!img) return;

      const rect = img.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const currentZoom = overrideZoom ?? zoomLevelRef.current;
      const touchOffsetY = isTouch ? -45 : 0;
      const clampedX = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const clampedY = Math.max(0, Math.min(clientY - rect.top, rect.height));

      const lensX = clampedX - LENS_RADIUS;
      const lensY = clampedY - LENS_RADIUS + touchOffsetY;

      const bgX = -(clampedX * currentZoom - LENS_RADIUS);
      const bgY = -(clampedY * currentZoom - LENS_RADIUS);

      setLensPosition({ x: lensX, y: lensY, bgX, bgY });
    },
    [LENS_RADIUS]
  );

  const applyZoomDelta = useCallback(
    (deltaY: number, clientX?: number, clientY?: number) => {
      const delta = deltaY < 0 ? 0.25 : -0.25;
      const current = zoomLevelRef.current;
      const next = Math.max(1.5, Math.min(5, Number((current + delta).toFixed(2))));
      if (next === current) return;

      zoomLevelRef.current = next;
      setZoomLevel(next);

      if (clientX !== undefined && clientY !== undefined) {
        updateLensCoordinates(clientX, clientY, false, next);
      } else if (lastCursorRef.current) {
        updateLensCoordinates(
          lastCursorRef.current.clientX,
          lastCursorRef.current.clientY,
          lastCursorRef.current.isTouch,
          next
        );
      }
    },
    [updateLensCoordinates]
  );

  const wheelHandlerRef = useRef<(e: WheelEvent) => void>(() => {});
  useEffect(() => {
    wheelHandlerRef.current = (e: WheelEvent) => {
      if (!isLensActiveRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      applyZoomDelta(e.deltaY, e.clientX, e.clientY);
    };
  }, [applyZoomDelta]);

  const handleNativeWheel = useCallback((e: WheelEvent) => {
    if (wheelHandlerRef.current) {
      wheelHandlerRef.current(e);
    }
  }, []);

  const containerCallbackRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (imageContainerRef.current) {
        imageContainerRef.current.removeEventListener('wheel', handleNativeWheel);
      }
      imageContainerRef.current = node;
      if (node) {
        node.addEventListener('wheel', handleNativeWheel, { passive: false });
      }
    },
    [handleNativeWheel]
  );

  // Fallback quando mouse está sobre a imagem: intercepta wheel no window caso o target seja ligeiramente deslocado
  useEffect(() => {
    if (!activeMediaId || !isCurrentActiveImage || !isLensActive || !isHovering) return;

    const onWindowWheel = (e: WheelEvent) => {
      const imgContainer = imageContainerRef.current;
      if (!imgContainer) return;

      const rect = imgContainer.getBoundingClientRect();
      const isInside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (isInside) {
        e.preventDefault();
        e.stopPropagation();
        applyZoomDelta(e.deltaY, e.clientX, e.clientY);
      }
    };

    window.addEventListener('wheel', onWindowWheel, { passive: false, capture: true });
    return () => {
      window.removeEventListener('wheel', onWindowWheel, { capture: true });
    };
  }, [activeMediaId, isCurrentActiveImage, isLensActive, isHovering, applyZoomDelta]);

  const handleSyntheticWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!isLensActive) return;
    applyZoomDelta(e.deltaY, e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isLensActive) return;
    if (!isHovering) setIsHovering(true);
    updateLensCoordinates(e.clientX, e.clientY, false);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isLensActive) return;
    setIsHovering(true);
    updateLensCoordinates(e.clientX, e.clientY, false);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isLensActive) return;
    setIsHovering(true);
    if (e.touches.length > 0) {
      updateLensCoordinates(e.touches[0].clientX, e.touches[0].clientY, true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isLensActive) return;
    if (e.touches.length > 0) {
      updateLensCoordinates(e.touches[0].clientX, e.touches[0].clientY, true);
    }
  };

  const handleTouchEnd = () => {
    setIsHovering(false);
  };

  const handleCloseLightbox = useCallback(() => {
    setActiveMedia(null);
    setIsHovering(false);
    setZoomLevel(2.5);
  }, []);

  const handleRemoverItem = (item: UnifiedAttachmentItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (item.isLocal && item.localIndex !== undefined && onRemoverFile) {
      onRemoverFile(item.localIndex);
    } else if (!item.isLocal && typeof item.id === 'number' && onRemoverAnexo) {
      onRemoverAnexo(item.id);
    }
  };

  // Fechar com tecla ESC e bloquear scroll de fundo
  useEffect(() => {
    if (!activeMedia) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseLightbox();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [activeMedia, handleCloseLightbox]);

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <div className={styles.galleryGrid}>
        {items.map((item) => {
          const fileUrl = getAttachmentUrl(item.urlCaminho);
          const image = isImage(item);
          const video = isVideo(item);
          const isOffice = isOfficeDocument(item);
          const ext = getFileExt(item);
          const isDownloading = downloadingId === item.id;
          const isCurrentlyRemoving = removendoId === item.id;
          const sizeStr = formatFileSize(item.tamanhoBytes);

          return (
            <div key={item.id} className={styles.card}>
              <div
                className={styles.previewContainer}
                onClick={() => handleCardClick(item)}
                title={
                  isExpandable(item)
                    ? 'Clique para expandir'
                    : isOffice && !item.isLocal
                    ? 'Clique para abrir no Microsoft 365 Online'
                    : 'Clique para abrir'
                }
              >
                <span className={styles.typeBadge}>{ext}</span>

                {fileUrl && (
                  <button
                    type="button"
                    className={styles.cornerDownloadBtn}
                    disabled={isDownloading}
                    onClick={(e) => handleDownload(item, e)}
                    title={`Baixar ${item.nomeOriginal}`}
                    aria-label={`Baixar ${item.nomeOriginal}`}
                  >
                    {isDownloading ? (
                      <SpinnerIcon size={14} color="#ffffff" />
                    ) : (
                      <DownloadIcon size={14} color="#ffffff" />
                    )}
                  </button>
                )}

                {image && fileUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fileUrl}
                    alt={item.nomeOriginal}
                    className={styles.mediaThumb}
                    loading="lazy"
                  />
                ) : video && fileUrl ? (
                  <>
                    <video
                      src={fileUrl}
                      preload="metadata"
                      className={styles.mediaThumb}
                      muted
                      playsInline
                    />
                    <div className={styles.playCenterBtn}>
                      <PlayIcon size={20} color="#ffffff" />
                    </div>
                  </>
                ) : (
                  <div
                    className={`${styles.docPreview} ${
                      isPdf(item)
                        ? styles.docPdf
                        : isWord(item)
                        ? styles.docWord
                        : isExcel(item)
                        ? styles.docExcel
                        : isPowerPoint(item)
                        ? styles.docPowerPoint
                        : ''
                    }`}
                  >
                    <FileTextIcon size={36} />
                    <span className={styles.docExtBadge}>{ext}</span>
                  </div>
                )}

                <div className={styles.hoverOverlay}>
                  {video ? (
                    <>
                      <PlayIcon size={18} color="#ffffff" />
                      <span>Reproduzir</span>
                    </>
                  ) : image ? (
                    <>
                      <EyeIcon size={18} color="#ffffff" />
                      <span>Expandir</span>
                    </>
                  ) : isPdf(item) ? (
                    <>
                      <EyeIcon size={18} color="#ffffff" />
                      <span>Visualizar PDF</span>
                    </>
                  ) : isOffice && !item.isLocal ? (
                    <>
                      <EyeIcon size={18} color="#ffffff" />
                      <span>Abrir no Microsoft 365</span>
                    </>
                  ) : (
                    <>
                      <PaperclipIcon size={18} color="#ffffff" />
                      <span>Abrir</span>
                    </>
                  )}
                </div>
              </div>

              <div className={styles.cardFooter}>
                <span className={styles.fileName} title={item.nomeOriginal}>
                  {item.nomeOriginal}
                </span>

                <div className={styles.footerActions}>
                  <span className={styles.fileSize}>
                    {sizeStr ? `${sizeStr}` : (
                      image
                        ? 'Imagem'
                        : video
                        ? 'Vídeo'
                        : isPdf(item)
                        ? 'Documento PDF'
                        : isWord(item)
                        ? 'Word'
                        : isExcel(item)
                        ? 'Excel'
                        : isPowerPoint(item)
                        ? 'PowerPoint'
                        : 'Documento'
                    )}
                  </span>

                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                    {isOffice && !item.isLocal && (
                      <button
                        type="button"
                        className={styles.officeActionBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(getOfficeViewerUrl(item.urlCaminho), '_blank', 'noopener,noreferrer');
                        }}
                        title="Abrir diretamente no Microsoft 365 Online"
                        aria-label="Abrir no Microsoft 365"
                      >
                        <EyeIcon size={12} />
                        <span>M365</span>
                      </button>
                    )}

                    {podeRemover && (
                      <button
                        type="button"
                        className={styles.removeBtn}
                        disabled={isCurrentlyRemoving}
                        onClick={(e) => handleRemoverItem(item, e)}
                        title={`Remover ${item.nomeOriginal}`}
                        aria-label={`Remover ${item.nomeOriginal}`}
                      >
                        {isCurrentlyRemoving ? (
                          <SpinnerIcon size={14} color="#fca5a5" />
                        ) : (
                          <TrashIcon size={14} />
                        )}
                        <span>{isCurrentlyRemoving ? 'Removendo...' : 'Remover'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox Modal para Imagens e Vídeos */}
      {activeMedia && (
        <div
          className={styles.lightboxBackdrop}
          onMouseDown={(e) => {
            isMouseDownOnBackdropRef.current = e.target === e.currentTarget && e.button === 0;
          }}
          onMouseUp={(e) => {
            if (isMouseDownOnBackdropRef.current && e.target === e.currentTarget && e.button === 0) {
              handleCloseLightbox();
            }
            isMouseDownOnBackdropRef.current = false;
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Visualizador de anexo"
        >
          <div className={styles.lightboxContent}>
            <div className={styles.lightboxHeader}>
              <div className={styles.lightboxTitleArea}>
                <span className={styles.typeBadge}>{getFileExt(activeMedia)}</span>
                <span className={styles.lightboxTitle} title={activeMedia.nomeOriginal}>
                  {activeMedia.nomeOriginal}
                </span>
              </div>

              <div className={styles.lightboxControls}>
                {isImage(activeMedia) && (
                  <div className={styles.lensControlsGroup}>
                    <button
                      type="button"
                      className={`${styles.lensToggleBtn} ${isLensActive ? styles.lensToggleBtnActive : ''}`}
                      onClick={() => setIsLensActive((prev) => !prev)}
                      title={isLensActive ? 'Desativar lente de aumento' : 'Ativar lente de aumento (Lupa)'}
                      aria-pressed={isLensActive}
                    >
                      <SearchIcon size={14} />
                      <span>{isLensActive ? 'Lente ativa' : 'Lente'}</span>
                    </button>

                    {isLensActive && (
                      <div className={styles.zoomControls}>
                        <button
                          type="button"
                          className={styles.zoomStepBtn}
                          onClick={() => applyZoomDelta(1)}
                          title="Diminuir zoom (ou use o scroll do mouse)"
                          disabled={zoomLevel <= 1.5}
                        >
                          <ZoomOutIcon size={14} />
                        </button>
                        <span className={styles.zoomIndicator}>{zoomLevel.toFixed(1)}x</span>
                        <button
                          type="button"
                          className={styles.zoomStepBtn}
                          onClick={() => applyZoomDelta(-1)}
                          title="Aumentar zoom (ou use o scroll do mouse)"
                          disabled={zoomLevel >= 5}
                        >
                          <ZoomInIcon size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {isPdf(activeMedia) && !activeMedia.isLocal && (
                  <button
                    type="button"
                    className={styles.lightboxNewTabBtn}
                    onClick={() => window.open(getAttachmentUrl(activeMedia.urlCaminho), '_blank', 'noopener,noreferrer')}
                    title="Abrir PDF em nova aba"
                  >
                    <EyeIcon size={14} />
                    <span>Nova aba</span>
                  </button>
                )}

                <button
                  type="button"
                  className={styles.lightboxDownloadBtn}
                  disabled={downloadingId === activeMedia.id}
                  onClick={(e) => handleDownload(activeMedia, e)}
                  title="Baixar este arquivo"
                >
                  {downloadingId === activeMedia.id ? (
                    <SpinnerIcon size={16} color="#ffffff" />
                  ) : (
                    <DownloadIcon size={16} />
                  )}
                  <span>{downloadingId === activeMedia.id ? 'Baixando...' : 'Baixar'}</span>
                </button>

                {podeRemover && (
                  <button
                    type="button"
                    className={styles.lightboxRemoveBtn}
                    disabled={removendoId === activeMedia.id}
                    onClick={(e) => {
                      handleRemoverItem(activeMedia, e);
                      handleCloseLightbox();
                    }}
                    title="Remover este arquivo"
                    aria-label="Remover este arquivo"
                  >
                    {removendoId === activeMedia.id ? (
                      <SpinnerIcon size={16} color="#ffffff" />
                    ) : (
                      <TrashIcon size={16} />
                    )}
                    <span>{removendoId === activeMedia.id ? 'Removendo...' : 'Remover'}</span>
                  </button>
                )}

                <button
                  type="button"
                  className={styles.lightboxCloseBtn}
                  onClick={handleCloseLightbox}
                  title="Fechar (ESC)"
                  aria-label="Fechar visualizador"
                >
                  <XIcon size={20} color="#ffffff" />
                </button>
              </div>
            </div>

            <div className={styles.lightboxMediaWrapper}>
              {isVideo(activeMedia) ? (
                <video
                  src={getAttachmentUrl(activeMedia.urlCaminho)}
                  controls
                  autoPlay
                  className={styles.lightboxVideo}
                />
              ) : isPdf(activeMedia) ? (
                <iframe
                  src={`${getAttachmentUrl(activeMedia.urlCaminho)}#toolbar=1`}
                  className={styles.lightboxPdf}
                  title={activeMedia.nomeOriginal}
                />
              ) : (
                <div
                  ref={containerCallbackRef}
                  className={`${styles.lensImageContainer} ${isLensActive ? styles.lensImageContainerWithLens : ''}`}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  onMouseMove={handleMouseMove}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onWheel={handleSyntheticWheel}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={imageRef}
                    src={getAttachmentUrl(activeMedia.urlCaminho)}
                    alt={activeMedia.nomeOriginal}
                    className={styles.lightboxImage}
                    onLoad={handleImageLoad}
                    draggable={false}
                  />

                  {isLensActive && isHovering && imageDimensions.width > 0 && (
                    <div
                      className={styles.magnifierLens}
                      style={{
                        width: `${LENS_SIZE}px`,
                        height: `${LENS_SIZE}px`,
                        left: `${lensPosition.x}px`,
                        top: `${lensPosition.y}px`,
                        backgroundImage: `url("${getAttachmentUrl(activeMedia.urlCaminho)}")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: `${imageDimensions.width * zoomLevel}px ${imageDimensions.height * zoomLevel}px`,
                        backgroundPosition: `${lensPosition.bgX}px ${lensPosition.bgY}px`,
                      }}
                      aria-hidden="true"
                    >
                      <div className={styles.lensCrosshair} />
                      <span className={styles.lensZoomPill}>{zoomLevel.toFixed(1)}x</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
