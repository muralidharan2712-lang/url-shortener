const QRCode = require('qrcode');
const logger = require('./logger');

/**
 * Generate a QR code as a base64 data URL
 * @param {string} url - URL to encode in QR code
 * @param {Object} options - QR code generation options
 * @returns {Promise<string>} - Base64 data URL of the QR code image
 */
const generateQRCode = async (url, options = {}) => {
  try {
    const defaultOptions = {
      type: 'image/png',
      quality: 0.92,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      width: 256,
      errorCorrectionLevel: 'M',
      ...options,
    };

    const dataUrl = await QRCode.toDataURL(url, defaultOptions);
    return dataUrl;
  } catch (error) {
    logger.error(`QR Code generation failed for URL: ${url} - ${error.message}`);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generate a QR code as an SVG string
 * @param {string} url - URL to encode
 * @returns {Promise<string>} - SVG string
 */
const generateQRCodeSVG = async (url) => {
  try {
    const svg = await QRCode.toString(url, {
      type: 'svg',
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return svg;
  } catch (error) {
    logger.error(`QR Code SVG generation failed: ${error.message}`);
    throw new Error('Failed to generate QR code SVG');
  }
};

/**
 * Generate a QR code as a Buffer (PNG)
 * @param {string} url - URL to encode
 * @returns {Promise<Buffer>} - PNG buffer
 */
const generateQRCodeBuffer = async (url) => {
  try {
    const buffer = await QRCode.toBuffer(url, {
      type: 'png',
      width: 512,
      margin: 2,
      errorCorrectionLevel: 'H',
    });
    return buffer;
  } catch (error) {
    logger.error(`QR Code buffer generation failed: ${error.message}`);
    throw new Error('Failed to generate QR code buffer');
  }
};

module.exports = {
  generateQRCode,
  generateQRCodeSVG,
  generateQRCodeBuffer,
};
