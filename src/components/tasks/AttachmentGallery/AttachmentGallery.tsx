'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ConsultaAnexoDTO } from '@/types/api';
import {
  DownloadIcon,
  EyeIcon,
  PlayIcon,
  XIcon,
  FileTextIcon,
  PaperclipIcon,
  SpinnerIcon,
} from '@/components/common/Icons/Icons';
import styles from './AttachmentGallery.module.css';

interface AttachmentGalleryProps {
  anexos?: ConsultaAnexoDTO[];
}

export const AttachmentGallery: React.FC<AttachmentGalleryProps> = ({ anexos }) => {
  const [activeMedia, setActiveMedia] = useState<ConsultaAnexoDTO | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const getAttachmentUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return url.startsWith('/') ? url : `/${url}`;
  };

  const isImage = (anexo: ConsultaAnexoDTO) => {
    if (anexo.mimeType?.startsWith('image/')) return true;
    const ext = anexo.nomeOriginal?.split('.').pop()?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'avif'].includes(ext);
  };

  const isVideo = (anexo: ConsultaAnexoDTO) => {
    if (anexo.mimeType?.startsWith('video/')) return true;
    const ext = anexo.nomeOriginal?.split('.').pop()?.toLowerCase() || '';
    return ['mp4', 'webm', 'ogg', 'mov', 'mkv', 'avi'].includes(ext);
  };

  const isPdf = (anexo: ConsultaAnexoDTO) => {
    if (anexo.mimeType === 'application/pdf') return true;
    const ext = anexo.nomeOriginal?.split('.').pop()?.toLowerCase() || '';
    return ext === 'pdf';
  };

  const isExpandable = (anexo: ConsultaAnexoDTO) => {
    return isImage(anexo) || isVideo(anexo) || isPdf(anexo);
  };

  const isWord = (anexo: ConsultaAnexoDTO) => {
    const ext = anexo.nomeOriginal?.split('.').pop()?.toLowerCase() || '';
    return ['doc', 'docx', 'docm', 'dot', 'dotx'].includes(ext);
  };

  const isExcel = (anexo: ConsultaAnexoDTO) => {
    const ext = anexo.nomeOriginal?.split('.').pop()?.toLowerCase() || '';
    return ['xls', 'xlsx', 'xlsm', 'csv'].includes(ext);
  };

  const isPowerPoint = (anexo: ConsultaAnexoDTO) => {
    const ext = anexo.nomeOriginal?.split('.').pop()?.toLowerCase() || '';
    return ['ppt', 'pptx', 'pptm', 'pot', 'potx'].includes(ext);
  };

  const isOfficeDocument = (anexo: ConsultaAnexoDTO) => {
    return isWord(anexo) || isExcel(anexo) || isPowerPoint(anexo);
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

  const getFileExt = (anexo: ConsultaAnexoDTO) => {
    const parts = anexo.nomeOriginal?.split('.');
    if (parts && parts.length > 1) {
      return parts[parts.length - 1].toUpperCase();
    }
    return 'ARQUIVO';
  };

  const handleDownload = async (anexo: ConsultaAnexoDTO, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const url = getAttachmentUrl(anexo.urlCaminho);
    try {
      setDownloadingId(anexo.id);
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao baixar arquivo');
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = anexo.nomeOriginal || 'anexo';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback direto via âncora
      const a = document.createElement('a');
      a.href = url;
      a.download = anexo.nomeOriginal || 'anexo';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCardClick = (anexo: ConsultaAnexoDTO) => {
    if (isExpandable(anexo)) {
      setActiveMedia(anexo);
    } else if (isOfficeDocument(anexo)) {
      window.open(getOfficeViewerUrl(anexo.urlCaminho), '_blank', 'noopener,noreferrer');
    } else {
      window.open(getAttachmentUrl(anexo.urlCaminho), '_blank', 'noopener,noreferrer');
    }
  };

  const handleCloseLightbox = useCallback(() => {
    setActiveMedia(null);
  }, []);

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

  if (!anexos || anexos.length === 0) {
    return null;
  }

  return (
    <>
      <div className={styles.galleryGrid}>
        {anexos.map((anexo) => {
          const fileUrl = getAttachmentUrl(anexo.urlCaminho);
          const image = isImage(anexo);
          const video = isVideo(anexo);
          const isOffice = isOfficeDocument(anexo);
          const ext = getFileExt(anexo);
          const isDownloading = downloadingId === anexo.id;

          return (
            <div key={anexo.id} className={styles.card}>
              <div
                className={styles.previewContainer}
                onClick={() => handleCardClick(anexo)}
                title={
                  isExpandable(anexo)
                    ? 'Clique para expandir'
                    : isOffice
                    ? 'Clique para abrir no Microsoft 365 Online'
                    : 'Clique para abrir'
                }
              >
                <span className={styles.typeBadge}>{ext}</span>

                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fileUrl}
                    alt={anexo.nomeOriginal}
                    className={styles.mediaThumb}
                    loading="lazy"
                  />
                ) : video ? (
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
                      isPdf(anexo)
                        ? styles.docPdf
                        : isWord(anexo)
                        ? styles.docWord
                        : isExcel(anexo)
                        ? styles.docExcel
                        : isPowerPoint(anexo)
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
                  ) : isPdf(anexo) ? (
                    <>
                      <EyeIcon size={18} color="#ffffff" />
                      <span>Visualizar PDF</span>
                    </>
                  ) : isOffice ? (
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
                <span className={styles.fileName} title={anexo.nomeOriginal}>
                  {anexo.nomeOriginal}
                </span>

                <div className={styles.footerActions}>
                  <span className={styles.fileSize}>
                    {image
                      ? 'Imagem'
                      : video
                      ? 'Vídeo'
                      : isPdf(anexo)
                      ? 'Documento PDF'
                      : isWord(anexo)
                      ? 'Word'
                      : isExcel(anexo)
                      ? 'Excel'
                      : isPowerPoint(anexo)
                      ? 'PowerPoint'
                      : 'Documento'}
                  </span>

                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                    {isOffice && (
                      <button
                        type="button"
                        className={styles.officeActionBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(getOfficeViewerUrl(anexo.urlCaminho), '_blank', 'noopener,noreferrer');
                        }}
                        title="Abrir diretamente no Microsoft 365 Online"
                        aria-label="Abrir no Microsoft 365"
                      >
                        <EyeIcon size={12} />
                        <span>M365</span>
                      </button>
                    )}

                    <button
                      type="button"
                      className={styles.downloadBtn}
                      disabled={isDownloading}
                      onClick={(e) => handleDownload(anexo, e)}
                      title={`Baixar ${anexo.nomeOriginal}`}
                      aria-label={`Baixar ${anexo.nomeOriginal}`}
                    >
                      {isDownloading ? (
                        <SpinnerIcon size={14} color="#d1b8ff" />
                      ) : (
                        <DownloadIcon size={14} />
                      )}
                      <span>{isDownloading ? 'Baixando...' : 'Baixar'}</span>
                    </button>
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
          onClick={handleCloseLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Visualizador de anexo"
        >
          <div
            className={styles.lightboxContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.lightboxHeader}>
              <div className={styles.lightboxTitleArea}>
                <span className={styles.typeBadge}>{getFileExt(activeMedia)}</span>
                <span className={styles.lightboxTitle} title={activeMedia.nomeOriginal}>
                  {activeMedia.nomeOriginal}
                </span>
              </div>

              <div className={styles.lightboxControls}>
                {isPdf(activeMedia) && (
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
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getAttachmentUrl(activeMedia.urlCaminho)}
                  alt={activeMedia.nomeOriginal}
                  className={styles.lightboxImage}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
