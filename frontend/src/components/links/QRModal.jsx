import { motion, AnimatePresence } from 'framer-motion';
import { X, QrCode, Download, ExternalLink } from 'lucide-react';
import { linkService } from '../../services/services';
import toast from 'react-hot-toast';

export default function QRModal({ isOpen, link, onClose }) {
  if (!isOpen || !link) return null;

  const downloadQR = async (format) => {
    try {
      const res = format === 'png'
        ? await linkService.getQRCodePng(link._id)
        : await linkService.getQRCodeSvg(link._id);
      const blob = new Blob([res.data], { type: format === 'png' ? 'image/png' : 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-${link.shortCode}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`QR code downloaded as ${format.toUpperCase()}`);
    } catch {
      toast.error('Failed to download QR code');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="modal-overlay absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="relative glass-strong rounded-2xl p-6 z-10 w-full max-w-sm text-center"
            style={{ boxShadow: '0 0 0 1px rgba(249,115,22,0.2), 0 40px 80px rgba(0,0,0,0.6)' }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <QrCode size={18} className="text-orange-500" />
                <h2 className="text-base font-semibold text-white">QR Code</h2>
              </div>
              <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* QR image */}
            {link.qrCode ? (
              <div className="flex justify-center mb-5">
                <div className="p-3 rounded-xl bg-white shadow-lg">
                  <img src={link.qrCode} alt="QR Code" className="w-48 h-48 object-contain" />
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center h-48 mb-5">
                <p className="text-slate-500 text-sm">QR code not available</p>
              </div>
            )}

            {/* Link info */}
            <p className="text-sm text-slate-300 mb-1 font-medium truncate">{link.title || link.shortCode}</p>
            <a
              href={link.shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-orange-500 hover:text-orange-400 transition-colors flex items-center justify-center gap-1 mb-5"
            >
              {link.shortUrl} <ExternalLink size={11} />
            </a>

            {/* Download buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => downloadQR('png')}
                className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-2.5"
              >
                <Download size={14} />
                PNG
              </button>
              <button
                onClick={() => downloadQR('svg')}
                className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm py-2.5"
              >
                <Download size={14} />
                SVG
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
